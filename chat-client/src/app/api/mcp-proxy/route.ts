import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Cache de conexiones MCP activas
const mcpConnections = new Map<string, any>();

interface MCPToolCall {
  name: string;
  arguments: any;
}

interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  enabled: boolean;
}

/**
 * Cargar configuración de servidores MCP
 */
function loadMCPConfig(): MCPServerConfig[] {
  try {
    const configPath = path.resolve(process.cwd(), 'mcp-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return Object.entries(config.mcpServers || {}).map(([id, server]: [string, any]) => ({
        id,
        ...server
      }));
    }
  } catch (error) {
    console.warn('⚠️ Error loading mcp-config.json:', error);
  }
  
  // Fallback a configuración por defecto
  return [
    {
      id: 'jira',
      name: 'Jira Management',
      description: 'Jira project and issue management with templates',
      command: 'node',
      args: ['../mcp-server/index.js'],
      enabled: true
    }
  ];
}

/**
 * Crear conexión MCP via stdio
 */
async function createMCPConnection(serverConfig: MCPServerConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    const serverPath = path.resolve(process.cwd(), '..', 'mcp-server', 'index.js');
    
    console.log(`🔗 Creating MCP connection to ${serverConfig.name}`);
    console.log(`📂 Server path: ${serverPath}`);
    
    const mcpProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      cwd: path.resolve(process.cwd(), '..')
    });

    let messageId = 1;
    const pendingRequests = new Map<number, any>();

    // Buffer para mensajes JSON
    let buffer = '';

    mcpProcess.stdout.on('data', (data) => {
      buffer += data.toString();
      
      // Procesar mensajes JSON completos
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Guardar línea incompleta
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            console.log(`📥 MCP Response:`, message);
            
            if (message.id && pendingRequests.has(message.id)) {
              const { resolve: resolveRequest } = pendingRequests.get(message.id);
              pendingRequests.delete(message.id);
              resolveRequest(message);
            }
          } catch (error) {
            console.warn('⚠️ Error parsing MCP message:', line);
          }
        }
      }
    });

    mcpProcess.stderr.on('data', (data) => {
      console.error(`❌ MCP Error: ${data}`);
    });

    mcpProcess.on('error', (error) => {
      console.error(`❌ MCP Process Error:`, error);
      reject(error);
    });

    // Función para enviar mensajes al MCP server
    const sendMessage = (method: string, params: any = {}) => {
      return new Promise((resolve, reject) => {
        const id = messageId++;
        const message = {
          jsonrpc: '2.0',
          id,
          method,
          params
        };

        pendingRequests.set(id, { resolve, reject });
        
        const messageStr = JSON.stringify(message) + '\n';
        console.log(`📤 MCP Request:`, message);
        
        mcpProcess.stdin.write(messageStr);
        
        // Timeout después de 30 segundos
        setTimeout(() => {
          if (pendingRequests.has(id)) {
            pendingRequests.delete(id);
            reject(new Error(`MCP request timeout for method: ${method}`));
          }
        }, 30000);
      });
    };

    // Inicializar conexión MCP
    sendMessage('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'ludo-chat-client',
        version: '1.0.0'
      }
    }).then(() => {
      console.log(`✅ MCP connection initialized for ${serverConfig.name}`);
      resolve({
        sendMessage,
        process: mcpProcess,
        config: serverConfig
      });
    }).catch(reject);
  });
}

/**
 * Obtener conexión MCP (crear si no existe)
 */
async function getMCPConnection(serverId: string): Promise<any> {
  if (!mcpConnections.has(serverId)) {
    const servers = loadMCPConfig();
    const serverConfig = servers.find(s => s.id === serverId && s.enabled);
    
    if (!serverConfig) {
      throw new Error(`MCP server not found: ${serverId}`);
    }

    const connection = await createMCPConnection(serverConfig);
    mcpConnections.set(serverId, connection);
  }

  return mcpConnections.get(serverId);
}

/**
 * GET - Listar herramientas disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('server') || 'jira';

    console.log(`🔍 Listing tools for server: ${serverId}`);

    const connection = await getMCPConnection(serverId);
    const response = await connection.sendMessage('tools/list');

    const tools = response.result?.tools || [];
    
    console.log(`✅ Found ${tools.length} tools for ${serverId}`);

    return NextResponse.json({
      success: true,
      server: serverId,
      tools: tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    });

  } catch (error) {
    console.error('❌ Error listing MCP tools:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST - Ejecutar herramienta MCP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { server = 'jira', toolName, arguments: toolArgs } = body;

    console.log(`🔧 Executing MCP tool: ${toolName} on server: ${server}`);
    console.log(`📝 Arguments:`, toolArgs);

    const connection = await getMCPConnection(server);
    const response = await connection.sendMessage('tools/call', {
      name: toolName,
      arguments: toolArgs
    });

    if (response.error) {
      throw new Error(`MCP tool error: ${response.error.message}`);
    }

    console.log(`✅ Tool executed successfully: ${toolName}`);

    return NextResponse.json({
      success: true,
      result: response.result
    });

  } catch (error) {
    console.error(`❌ Error executing MCP tool:`, error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * PUT - Listar templates disponibles
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('server') || 'jira';
    const category = searchParams.get('category');

    console.log(`📋 Listing templates for server: ${serverId}, category: ${category}`);

    const connection = await getMCPConnection(serverId);
    const response = await connection.sendMessage('tools/call', {
      name: 'list_jira_templates',
      arguments: category ? { category } : {}
    });

    if (response.error) {
      throw new Error(`MCP template error: ${response.error.message}`);
    }

    console.log(`✅ Templates listed successfully`);

    return NextResponse.json({
      success: true,
      templates: response.result
    });

  } catch (error) {
    console.error(`❌ Error listing MCP templates:`, error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
