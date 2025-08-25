import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL_NAME = 'gemini-2.0-flash-exp';

/**
 * Tipos de transporte MCP soportados
 */
export type MCPTransportType = 'stdio' | 'sse' | 'websocket' | 'http';

/**
 * Configuración de servidor MCP
 */
export interface MCPServerConfig {
  name: string;
  type: MCPTransportType;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  port?: number;
  path?: string;
}

/**
 * Cliente MCP Universal que soporta múltiples protocolos
 * Similar a la arquitectura de Cursor IDE
 */
export class UniversalMCPClient {
  private client: Client | null = null;
  private transport: any = null;
  private serverProcess: ChildProcess | null = null;
  private isConnected = false;
  private tools: any[] = [];
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;
    console.log(`🔧 Initializing Universal MCP Client - ${config.type.toUpperCase()}`);
  }

  async connect(): Promise<boolean> {
    try {
      if (this.isConnected) {
        console.log('✅ MCP Client already connected');
        return true;
      }

      console.log(`🚀 Connecting to MCP Server via ${this.config.type}...`);
      
      switch (this.config.type) {
        case 'stdio':
          return await this.connectStdio();
        case 'sse':
          return await this.connectSSE();
        case 'websocket':
          return await this.connectWebSocket();
        case 'http':
          return await this.connectHTTP();
        default:
          throw new Error(`Unsupported transport type: ${this.config.type}`);
      }
    } catch (error) {
      console.error(`❌ Error connecting via ${this.config.type}:`, error);
      return false;
    }
  }

  /**
   * Conexión via stdio (como servidor local)
   */
  private async connectStdio(): Promise<boolean> {
    if (!this.config.command) {
      throw new Error('Command is required for stdio transport');
    }

    console.log('📡 Starting stdio MCP server...');
    
    // Resolver ruta del servidor
    const serverPath = this.resolveServerPath();
    if (!serverPath) {
      throw new Error('MCP Server not found');
    }

    // Configurar variables de entorno
    const env = {
      ...process.env,
      ...this.config.env
    };

    // Spawn del proceso del servidor
    this.serverProcess = spawn(this.config.command, [serverPath, ...(this.config.args || [])], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (!this.serverProcess.stdout || !this.serverProcess.stdin) {
      throw new Error('Failed to get stdio streams from server process');
    }

    // Crear transporte stdio
    this.transport = new StdioClientTransport(
      this.serverProcess.stdout,
      this.serverProcess.stdin
    );

    // Crear cliente MCP
    this.client = new Client({
      name: `universal-mcp-client-${this.config.name}`,
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    // Conectar
    await this.client.connect(this.transport);
    
    // Cargar herramientas
    await this.loadTools();
    
    this.isConnected = true;
    console.log(`✅ Connected to ${this.config.name} via stdio`);
    return true;
  }

  /**
   * Conexión via SSE (Server-Sent Events)
   */
  private async connectSSE(): Promise<boolean> {
    if (!this.config.url) {
      throw new Error('URL is required for SSE transport');
    }

    console.log(`📡 Connecting to SSE endpoint: ${this.config.url}`);
    
    // Crear transporte SSE
    this.transport = new SSEClientTransport(this.config.url);

    // Crear cliente MCP
    this.client = new Client({
      name: `universal-mcp-client-${this.config.name}`,
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    // Conectar
    await this.client.connect(this.transport);
    
    // Cargar herramientas
    await this.loadTools();
    
    this.isConnected = true;
    console.log(`✅ Connected to ${this.config.name} via SSE`);
    return true;
  }

  /**
   * Conexión via WebSocket
   */
  private async connectWebSocket(): Promise<boolean> {
    // TODO: Implementar WebSocket transport cuando esté disponible en SDK
    console.log('🚧 WebSocket transport not yet implemented in MCP SDK');
    return false;
  }

  /**
   * Conexión via HTTP
   */
  private async connectHTTP(): Promise<boolean> {
    // TODO: Implementar HTTP transport cuando esté disponible en SDK
    console.log('🚧 HTTP transport not yet implemented in MCP SDK');
    return false;
  }

  /**
   * Resolver ruta del servidor MCP
   */
  private resolveServerPath(): string | null {
    if (this.config.path) {
      return path.resolve(this.config.path);
    }

    // Rutas por defecto para buscar el servidor
    const possiblePaths = [
      path.resolve(process.cwd(), '../mcp-server/index.js'),
      path.resolve(process.cwd(), './mcp-server/index.js'),
      path.resolve(__dirname, '../../mcp-server/index.js'),
      path.resolve(__dirname, '../../../mcp-server/index.js'),
    ];
    
    const fs = require('fs');
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        console.log('✅ Found MCP Server at:', testPath);
        return testPath;
      }
    }
    
    return null;
  }

  /**
   * Cargar herramientas disponibles del servidor
   */
  private async loadTools(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    try {
      const response = await this.client.request({
        method: 'tools/list',
        params: {}
      }, {});

      this.tools = response.tools || [];
      console.log(`🔧 Loaded ${this.tools.length} tools from ${this.config.name}`);
    } catch (error) {
      console.error('❌ Error loading tools:', error);
      this.tools = [];
    }
  }

  /**
   * Ejecutar herramienta
   */
  async callTool(name: string, args: any = {}): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('Client not connected');
    }

    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name,
          arguments: args
        }
      }, {});

      return response;
    } catch (error) {
      console.error(`❌ Error calling tool ${name}:`, error);
      throw error;
    }
  }

  /**
   * Desconectar cliente
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }

      if (this.transport) {
        this.transport = null;
      }

      if (this.serverProcess) {
        this.serverProcess.kill();
        this.serverProcess = null;
      }

      this.isConnected = false;
      console.log(`✅ Disconnected from ${this.config.name}`);
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
    }
  }

  /**
   * Verificar estado de conexión
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Obtener herramientas disponibles
   */
  getTools(): any[] {
    return this.tools;
  }

  /**
   * Obtener información de la configuración
   */
  getConfig(): MCPServerConfig {
    return { ...this.config };
  }
}

/**
 * Gestor de múltiples servidores MCP
 */
export class MCPServersManager {
  private servers = new Map<string, UniversalMCPClient>();
  private activeServer: string | null = null;

  /**
   * Agregar servidor MCP
   */
  addServer(name: string, config: MCPServerConfig): void {
    const client = new UniversalMCPClient({ ...config, name });
    this.servers.set(name, client);
    console.log(`➕ Added MCP server: ${name} (${config.type})`);
  }

  /**
   * Conectar a un servidor específico
   */
  async connectToServer(name: string): Promise<boolean> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`Server ${name} not found`);
    }

    const connected = await server.connect();
    if (connected) {
      this.activeServer = name;
      console.log(`🎯 Active server set to: ${name}`);
    }
    
    return connected;
  }

  /**
   * Obtener servidor activo
   */
  getActiveServer(): UniversalMCPClient | null {
    if (!this.activeServer) return null;
    return this.servers.get(this.activeServer) || null;
  }

  /**
   * Listar servidores disponibles
   */
  listServers(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * Obtener todas las herramientas de todos los servidores
   */
  getAllTools(): Array<{ server: string; tools: any[] }> {
    return Array.from(this.servers.entries()).map(([name, client]) => ({
      server: name,
      tools: client.getTools()
    }));
  }

  /**
   * Desconectar todos los servidores
   */
  async disconnectAll(): Promise<void> {
    for (const [name, client] of this.servers) {
      await client.disconnect();
    }
    this.activeServer = null;
  }
}

/**
 * Función para crear configuraciones de servidor predefinidas
 */
export function createServerConfigs(): Record<string, MCPServerConfig> {
  return {
    // Servidor Jira local
    jira_local: {
      name: 'jira_local',
      type: 'stdio',
      command: 'node',
      path: '../mcp-server/index.js',
      env: {
        JIRA_BASE_URL: process.env.JIRA_BASE_URL || '',
        JIRA_EMAIL: process.env.JIRA_EMAIL || '',
        JIRA_API_TOKEN: process.env.JIRA_API_TOKEN || ''
      }
    },
    
    // Servidor Jira remoto via SSE
    jira_remote: {
      name: 'jira_remote',
      type: 'sse',
      url: 'http://localhost:3001/sse'
    },
    
    // Servidor genérico via stdio
    generic_stdio: {
      name: 'generic_stdio',
      type: 'stdio',
      command: 'node',
      args: []
    }
  };
}

/**
 * Cliente MCP con integración Gemini para chat
 */
export class MCPChatClient {
  private mcpManager: MCPServersManager;
  private geminiModel: any;

  constructor() {
    this.mcpManager = new MCPServersManager();
    this.geminiModel = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { temperature: 0.7 }
    });
  }

  /**
   * Configurar servidores MCP disponibles
   */
  async setupServers(configs: Record<string, MCPServerConfig>): Promise<void> {
    for (const [name, config] of Object.entries(configs)) {
      this.mcpManager.addServer(name, config);
    }
  }

  /**
   * Conectar a servidor específico
   */
  async connectToServer(serverName: string): Promise<boolean> {
    return await this.mcpManager.connectToServer(serverName);
  }

  /**
   * Procesar mensaje de chat con herramientas MCP
   */
  async processMessage(message: string): Promise<string> {
    const activeServer = this.mcpManager.getActiveServer();
    if (!activeServer || !activeServer.isReady()) {
      return 'No hay servidor MCP conectado. Usa /connect <servidor> para conectar.';
    }

    try {
      const tools = activeServer.getTools();
      const functionDeclarations = this.convertToGeminiTools(tools);

      const chat = this.geminiModel.startChat({
        tools: [{ functionDeclarations }],
        toolConfig: { functionCallingMode: FunctionCallingMode.AUTO }
      });

      const result = await chat.sendMessage(message);
      const response = result.response;

      // Procesar function calls
      if (response.functionCalls()) {
        const calls = response.functionCalls();
        const toolResults = [];

        for (const call of calls) {
          const toolResult = await activeServer.callTool(call.name, call.args);
          toolResults.push({
            functionResponse: {
              name: call.name,
              response: toolResult
            }
          });
        }

        const followUp = await chat.sendMessage(toolResults);
        return followUp.response.text();
      }

      return response.text();
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return `Error: ${error.message}`;
    }
  }

  /**
   * Convertir herramientas MCP a formato Gemini
   */
  private convertToGeminiTools(mcpTools: any[]): any[] {
    return mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }));
  }

  /**
   * Obtener estado del sistema
   */
  getStatus() {
    const activeServer = this.mcpManager.getActiveServer();
    return {
      servers: this.mcpManager.listServers(),
      activeServer: activeServer?.getConfig().name || null,
      connected: activeServer?.isReady() || false,
      tools: activeServer?.getTools().length || 0
    };
  }
}

// Exportar todo
export default MCPChatClient;
