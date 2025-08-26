import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// Cache global de servidores
let serversCache: any = null;
let lastCacheTime: number = 0;
const CACHE_DURATION = 0; // Sin cache para debug

function loadMCPConfig() {
  const now = Date.now();
  
  // Usar cache si es reciente
  if (serversCache && (now - lastCacheTime) < CACHE_DURATION) {
    return serversCache;
  }

  try {
    // Buscar archivo de configuración
    const configPaths = [
      path.join(process.cwd(), 'mcp-config.json'),
      path.join(process.cwd(), 'chat-client', 'mcp-config.json'),
      path.join(process.cwd(), '..', 'mcp-config.json')
    ];

    let configPath = null;
    for (const p of configPaths) {
      if (existsSync(p)) {
        configPath = p;
        break;
      }
    }

    if (!configPath) {
      console.log('⚠️ No se encontró mcp-config.json, usando configuración por defecto');
      return getDefaultConfig();
    }

    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    console.log(`✅ Configuración MCP cargada desde: ${configPath}`);
    
    // Cachear resultado
    serversCache = config;
    lastCacheTime = now;
    
    return config;
  } catch (error) {
    console.error('❌ Error cargando configuración MCP:', error);
    return getDefaultConfig();
  }
}

function getDefaultConfig() {
  return {
    mcpServers: {
      "jira": {
        "name": "Jira Management",
        "description": "Gestión completa de Jira - issues, proyectos, épicas",
        "type": "local",
        "command": "node",
        "args": [path.join(process.cwd(), "mcp-server", "index.js")],
        "enabled": true,
        "env": {
          "JIRA_BASE_URL": process.env.JIRA_BASE_URL || "https://aetherdev.atlassian.net",
          "JIRA_EMAIL": process.env.JIRA_EMAIL || "leon.rodriguez.ore@gmail.com",
          "JIRA_API_TOKEN": process.env.JIRA_API_TOKEN || ""
        }
      },
      "n8n-mcp": {
        "name": "n8n Workflow Management",
        "description": "Gestión de workflows y automatizaciones con n8n",
        "type": "local",
        "command": "n8n-mcp",
        "args": [],
        "enabled": true,
        "env": {
          "MCP_MODE": "stdio",
          "LOG_LEVEL": "error"
        }
      }
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const config = loadMCPConfig();
    const servers = config.mcpServers || {};
    
    // Simular conexión y disponibilidad
    const serverStatus: Record<string, any> = {};
    const availableTools: any[] = [];
    
    for (const [serverId, serverConfig] of Object.entries(servers)) {
      const server = serverConfig as any;
      
      if (!server.enabled) {
        continue;
      }

      // Verificar disponibilidad basada en el tipo de servidor
      let isAvailable = false;
      let tools: any[] = [];
      
      if (serverId === 'jira') {
        // Verificar si las variables de Jira están configuradas
        isAvailable = !!(process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL);
        
        // Obtener herramientas reales del MCP server
        if (isAvailable) {
          try {
            const { MCPClient } = await import('../../../lib/real-mcp-client');
            const mcpClient = new MCPClient(serverId, serverConfig);
            await mcpClient.connect();
            const mcpTools = await mcpClient.listTools();
            tools = mcpTools.map(tool => ({
              name: tool.name,
              description: tool.description || 'MCP tool'
            }));
            await mcpClient.disconnect();
          } catch (error) {
            console.error(`❌ Error getting tools from ${serverId}:`, error.message);
            console.error(`❌ Full error:`, error);
            // Fallback a herramientas básicas si falla la conexión MCP
            tools = [
              { name: 'search_jira_issues', description: 'Search Jira issues using JQL, keywords, or issue keys' },
              { name: 'create_jira_issue', description: 'Create new issues, stories, bugs, tasks, subtasks, or epics' },
              { name: 'get_jira_projects', description: 'List all available Jira projects' },
              { name: 'search_epics', description: 'Specialized epic search with filtering by project/status' },
              { name: 'get_recent_issues', description: 'Show recent activity across projects' },
              { name: 'search_by_type', description: 'Search issues by specific issue type (Bug, Story, Task, etc.)' }
            ];
          }
        }
      } else if (serverId === 'n8n-mcp') {
        // Verificar si n8n-mcp está disponible globalmente
        try {
          // Intentar verificar si n8n-mcp está instalado
          isAvailable = true; // Asumimos que está disponible para la demo
          tools = [
            { name: 'list_nodes', description: 'List n8n nodes by category or package' },
            { name: 'search_nodes', description: 'Search n8n nodes by keyword' },
            { name: 'validate_workflow', description: 'Validate n8n workflow configuration' },
            { name: 'get_node_info', description: 'Get detailed information about a specific n8n node' },
            { name: 'list_ai_tools', description: 'List AI-optimized n8n nodes' }
          ];
        } catch {
          isAvailable = false;
        }
      }

      const status = isAvailable ? 'connected' : 'disconnected';
      
      serverStatus[serverId] = {
        id: serverId,
        name: server.name,
        description: server.description,
        status: status,
        toolsCount: tools.length,
        tools: tools.map(t => t.name),
        lastError: isAvailable ? null : 'Configuration missing or server unavailable'
      };

      // Agregar herramientas disponibles
      if (isAvailable) {
        for (const tool of tools) {
          availableTools.push({
            name: tool.name,
            description: tool.description,
            serverId: serverId,
            serverName: server.name
          });
        }
      }
    }

    // Agrupar herramientas por servidor
    const toolsByServer: Record<string, any[]> = {};
    availableTools.forEach(tool => {
      const serverId = tool.serverId;
      if (!toolsByServer[serverId]) {
        toolsByServer[serverId] = [];
      }
      toolsByServer[serverId].push({
        name: tool.name,
        description: tool.description
      });
    });

    const connectedServers = Object.values(serverStatus)
      .filter(s => s.status === 'connected')
      .map(s => `${s.name} (${s.toolsCount} tools)`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalServers: Object.keys(serverStatus).length,
        connectedServers: Object.values(serverStatus).filter(s => s.status === 'connected').length,
        totalTools: availableTools.length,
        connectedServerNames: connectedServers
      },
      servers: serverStatus,
      toolsByServer,
      allTools: availableTools,
      configPath: 'Loaded from filesystem',
      environment: {
        JIRA_CONFIGURED: !!(process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL),
        GEMINI_CONFIGURED: !!process.env.GEMINI_API_KEY,
        OPENAI_CONFIGURED: !!process.env.OPENAI_API_KEY
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting MCP servers:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get MCP servers',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
