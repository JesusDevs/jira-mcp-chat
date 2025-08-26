import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError 
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * MCP Aggregator - Maneja múltiples MCP servers como uno solo
 * Permite usar varios servers (Jira, GitHub, Slack) transparentemente
 */
class MCPAggregator {
  constructor() {
    this.config = this.loadConfig();
    this.servers = new Map();
    this.tools = new Map();
    
    this.server = new Server(
      {
        name: 'mcp-aggregator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  loadConfig() {
    try {
      const configPath = path.join(process.cwd(), 'mcp-config.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error loading MCP config:', error);
      throw new Error('Failed to load mcp-config.json');
    }
  }

  async initializeServers() {
    console.error('Initializing MCP servers...');
    
    for (const [serverName, serverConfig] of Object.entries(this.config.servers)) {
      try {
        await this.startServer(serverName, serverConfig);
        console.error(`✅ ${serverName} server initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${serverName}:`, error.message);
        
        // Si fallback está habilitado y este no es un servidor primario, continuar
        if (this.config.aggregation?.fallback?.enabled && 
            !this.config.aggregation.fallback.primary_servers.includes(serverName)) {
          console.error(`⚠️  Continuing without ${serverName} (fallback enabled)`);
          continue;
        }
        throw error;
      }
    }
  }

  async startServer(serverName, serverConfig) {
    // Preparar variables de entorno
    const env = { ...process.env };
    if (serverConfig.env) {
      for (const [key, value] of Object.entries(serverConfig.env)) {
        // Reemplazar variables de entorno ${VAR_NAME}
        const resolvedValue = value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
          return process.env[varName] || match;
        });
        env[key] = resolvedValue;
      }
    }

    // Iniciar proceso del servidor MCP
    const serverProcess = spawn(serverConfig.command, serverConfig.args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Manejar errores del proceso
    serverProcess.on('error', (error) => {
      console.error(`Server ${serverName} process error:`, error);
      this.servers.delete(serverName);
    });

    serverProcess.on('exit', (code) => {
      console.error(`Server ${serverName} exited with code ${code}`);
      this.servers.delete(serverName);
    });

    // Simular comunicación MCP (en producción usarías stdio real)
    const serverMock = {
      name: serverName,
      config: serverConfig,
      process: serverProcess,
      tools: serverConfig.tools || [],
      isAlive: true
    };

    this.servers.set(serverName, serverMock);
    
    // Registrar herramientas de este servidor
    for (const tool of serverConfig.tools) {
      this.tools.set(tool.name, {
        ...tool,
        server: serverName
      });
    }
  }

  setupHandlers() {
    // Listar todas las herramientas de todos los servidores
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const allTools = [];
      
      for (const [toolName, toolInfo] of this.tools.entries()) {
        const server = this.servers.get(toolInfo.server);
        if (server && server.isAlive) {
          allTools.push({
            name: toolName,
            description: `[${toolInfo.server.toUpperCase()}] ${toolInfo.description}`,
            inputSchema: this.getToolSchema(toolName, toolInfo.server)
          });
        }
      }

      console.error(`📋 Listed ${allTools.length} tools from ${this.servers.size} servers`);
      return { tools: allTools };
    });

    // Ejecutar herramientas delegando al servidor correcto
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const toolInfo = this.tools.get(name);
      if (!toolInfo) {
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
      }

      const server = this.servers.get(toolInfo.server);
      if (!server || !server.isAlive) {
        // Intentar fallback si está configurado
        if (this.config.aggregation?.fallback?.enabled) {
          return await this.tryFallback(name, args);
        }
        throw new McpError(ErrorCode.InternalError, `Server ${toolInfo.server} not available`);
      }

      try {
        console.error(`🔧 Executing ${name} on ${toolInfo.server}`);
        return await this.executeOnServer(toolInfo.server, name, args);
      } catch (error) {
        console.error(`❌ Error executing ${name}:`, error.message);
        throw new McpError(ErrorCode.InternalError, `Failed to execute ${name}: ${error.message}`);
      }
    });
  }

  async executeOnServer(serverName, toolName, args) {
    // En una implementación real, esto haría comunicación stdio con el servidor MCP
    // Por ahora, simulamos llamadas directas basadas en el servidor
    
    if (serverName === 'jira') {
      return await this.executeJiraTool(toolName, args);
    } else if (serverName === 'github') {
      return await this.executeGitHubTool(toolName, args);
    } else if (serverName === 'slack') {
      return await this.executeSlackTool(toolName, args);
    }
    
    throw new Error(`Unknown server: ${serverName}`);
  }

  async executeJiraTool(toolName, args) {
    // Importar el servidor de Jira real y ejecutar
    const { JiraMCPServer } = await import('./mcp-server/index.js');
    const jiraServer = new JiraMCPServer();
    
    switch (toolName) {
      case 'search_jira_issues':
        return await jiraServer.searchJiraIssues(args);
      case 'get_jira_projects':
        return await jiraServer.getJiraProjects(args);
      default:
        throw new Error(`Unknown Jira tool: ${toolName}`);
    }
  }

  async executeGitHubTool(toolName, args) {
    // Placeholder para GitHub - implementar según necesidad
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          server: 'github',
          tool: toolName,
          args,
          result: 'GitHub tool executed successfully (placeholder)'
        }, null, 2)
      }]
    };
  }

  async executeSlackTool(toolName, args) {
    // Placeholder para Slack - implementar según necesidad
    return {
      content: [{
        type: 'text', 
        text: JSON.stringify({
          server: 'slack',
          tool: toolName,
          args,
          result: 'Slack tool executed successfully (placeholder)'
        }, null, 2)
      }]
    };
  }

  async tryFallback(toolName, args) {
    const fallbackServers = this.config.aggregation.fallback.primary_servers;
    
    for (const serverName of fallbackServers) {
      const server = this.servers.get(serverName);
      if (server && server.isAlive) {
        try {
          console.error(`🔄 Trying fallback: ${toolName} on ${serverName}`);
          return await this.executeOnServer(serverName, toolName, args);
        } catch (error) {
          console.error(`Fallback failed on ${serverName}:`, error.message);
          continue;
        }
      }
    }
    
    throw new McpError(ErrorCode.InternalError, `No fallback servers available for ${toolName}`);
  }

  getToolSchema(toolName, serverName) {
    // Esquemas simplificados - en producción obtener del servidor real
    const schemas = {
      search_jira_issues: {
        type: 'object',
        properties: {
          jql: { type: 'string', description: 'JQL query' },
          maxResults: { type: 'number', default: 20 }
        },
        required: ['jql']
      },
      get_jira_projects: {
        type: 'object',
        properties: {
          recent: { type: 'boolean', default: false }
        }
      },
      search_repositories: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          sort: { type: 'string', default: 'updated' }
        },
        required: ['query']
      }
    };

    return schemas[toolName] || {
      type: 'object',
      properties: {},
      additionalProperties: true
    };
  }

  async run() {
    try {
      await this.initializeServers();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.error('🚀 MCP Aggregator running with servers:', Array.from(this.servers.keys()).join(', '));
      console.error('🔧 Available tools:', Array.from(this.tools.keys()).join(', '));
    } catch (error) {
      console.error('❌ Failed to start MCP Aggregator:', error);
      process.exit(1);
    }
  }
}

// Iniciar el agregador
const aggregator = new MCPAggregator();
aggregator.run().catch(console.error);
