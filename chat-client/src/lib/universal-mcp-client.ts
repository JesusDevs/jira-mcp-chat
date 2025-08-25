import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import fs from 'fs';
import path from 'path';

export interface MCPServerConfig {
  name: string;
  description: string;
  type: 'local' | 'remote';
  enabled: boolean;
  tools: string[];
  
  // Para servidores locales
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  
  // Para servidores remotos
  url?: string;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
  defaultServer: string;
  settings: {
    autoConnect: boolean;
    timeout: number;
    retryAttempts: number;
    loadBalancing: boolean;
  };
  ui: {
    showServerStatus: boolean;
    groupToolsByServer: boolean;
    showToolDescriptions: boolean;
  };
}

export class UniversalMCPClient {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, any> = new Map();
  private config: MCPConfig | null = null;
  private tools: Map<string, any[]> = new Map();

  constructor() {
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    try {
      const configPath = path.join(process.cwd(), 'mcp-config.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf-8');
        this.config = JSON.parse(configData);
        console.log('✅ MCP Configuration loaded:', Object.keys(this.config.mcpServers));
      } else {
        console.warn('⚠️ MCP config file not found, using default Jira only');
        this.config = this.getDefaultConfig();
      }
    } catch (error) {
      console.error('❌ Error loading MCP config:', error);
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): MCPConfig {
    return {
      mcpServers: {
        jira: {
          name: "Jira Management",
          description: "Gestión de Jira",
          type: 'local',
          command: 'node',
          args: ['/Users/jesus/jira-mcp-chat/mcp-server/index.js'],
          enabled: true,
          tools: ['get_jira_projects', 'search_jira_issues', 'get_recent_issues', 'create_jira_issue', 'search_epics', 'search_by_type'],
          env: {
            JIRA_BASE_URL: process.env.JIRA_BASE_URL || 'https://aetherdev.atlassian.net',
            JIRA_EMAIL: process.env.JIRA_EMAIL || 'leon.rodriguez.ore@gmail.com',
            JIRA_API_TOKEN: process.env.JIRA_API_TOKEN || 'ATATT3xFfGF0rLuQf5K8ySjmT60YdZBz_SB3d6Qx88CUa7B2PMa35CjUOQviQLxH9g0MmSqdpGjFlflTHIp8AIL1bBP-bcdBMSSOKbuvpsKXR0sXHJX-zim_Jfja9CJSmYz4lGiJ8xm5LyjnpE8nIEGyrKtWNnUEZ24iSHlz96HRAMjxUZiTZuQ=04299DBA'
          }
        },
        "n8n-mcp": {
          name: "n8n Workflow Management",
          description: "Gestión de workflows y automatizaciones con n8n",
          type: 'local',
          command: 'npx',
          args: ['n8n-mcp'],
          enabled: true,
          tools: ['search_nodes', 'get_node_info', 'list_nodes', 'get_node_documentation', 'search_templates', 'get_template'],
          env: {
            MCP_MODE: 'stdio',
            LOG_LEVEL: 'error',
            DISABLE_CONSOLE_OUTPUT: 'true'
          }
        }
      },
      defaultServer: 'jira',
      settings: {
        autoConnect: true,
        timeout: 30000,
        retryAttempts: 3,
        loadBalancing: false
      },
      ui: {
        showServerStatus: true,
        groupToolsByServer: true,
        showToolDescriptions: true
      }
    };
  }

  private resolveEnvironmentVariables(value: string): string {
    return value.replace(/\$\{(\w+)\}/g, (match, varName) => {
      return process.env[varName] || match;
    });
  }

  private resolveServerConfig(config: MCPServerConfig): MCPServerConfig {
    const resolved = { ...config };
    
    if (resolved.env) {
      resolved.env = Object.fromEntries(
        Object.entries(resolved.env).map(([key, value]) => [
          key,
          this.resolveEnvironmentVariables(value)
        ])
      );
    }

    if (resolved.url) {
      resolved.url = this.resolveEnvironmentVariables(resolved.url);
    }

    return resolved;
  }

  async connectToServer(serverId: string): Promise<boolean> {
    if (!this.config) {
      console.error('❌ No MCP configuration available');
      return false;
    }

    const serverConfig = this.config.mcpServers[serverId];
    if (!serverConfig || !serverConfig.enabled) {
      console.log(`⏭️ Server ${serverId} not enabled or not found`);
      return false;
    }

    try {
      console.log(`🔄 Connecting to MCP server: ${serverId}`);
      
      const resolvedConfig = this.resolveServerConfig(serverConfig);
      
      const client = new Client({
        name: `universal-mcp-client-${serverId}`,
        version: '1.0.0',
      }, {
        capabilities: {
          tools: {},
        },
      });

      let transport;

      if (resolvedConfig.type === 'local') {
        // Servidor local via stdio
        if (!resolvedConfig.command || !resolvedConfig.args) {
          throw new Error(`Invalid local server config for ${serverId}`);
        }

        transport = new StdioClientTransport({
          command: resolvedConfig.command,
          args: resolvedConfig.args,
          env: {
            ...process.env,
            ...resolvedConfig.env
          }
        });
      } else if (resolvedConfig.type === 'remote') {
        // Servidor remoto via WebSocket
        if (!resolvedConfig.url) {
          throw new Error(`Invalid remote server config for ${serverId}`);
        }

        const wsOptions: any = {};
        if (resolvedConfig.auth) {
          // Agregar autenticación según el tipo
          switch (resolvedConfig.auth.type) {
            case 'bearer':
              wsOptions.headers = {
                'Authorization': `Bearer ${this.resolveEnvironmentVariables(resolvedConfig.auth.token || '')}`
              };
              break;
            case 'basic':
              const credentials = Buffer.from(
                `${resolvedConfig.auth.username}:${resolvedConfig.auth.password}`
              ).toString('base64');
              wsOptions.headers = {
                'Authorization': `Basic ${credentials}`
              };
              break;
          }
        }

        transport = new WebSocketClientTransport(new URL(resolvedConfig.url));
      } else {
        throw new Error(`Unknown server type: ${resolvedConfig.type}`);
      }

      await client.connect(transport);
      
      // Cargar herramientas del servidor
      const toolsResponse = await client.request({
        method: 'tools/list',
        params: {}
      }, {} as any) as any;

      const serverTools = toolsResponse.tools || [];
      
      this.clients.set(serverId, client);
      this.transports.set(serverId, transport);
      this.tools.set(serverId, serverTools);

      console.log(`✅ Connected to ${serverId} with ${serverTools.length} tools:`, 
        serverTools.map((t: any) => t.name));
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to connect to ${serverId}:`, error);
      return false;
    }
  }

  async connectToAllServers(): Promise<void> {
    if (!this.config) return;

    const connections = Object.keys(this.config.mcpServers)
      .filter(serverId => this.config!.mcpServers[serverId].enabled)
      .map(serverId => this.connectToServer(serverId));

    await Promise.allSettled(connections);
    
    const connectedServers = Array.from(this.clients.keys());
    console.log(`🎯 Connected to ${connectedServers.length} MCP servers:`, connectedServers);
  }

  async executeToolCall(serverId: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Server ${serverId} not connected`);
    }

    try {
      console.log(`🔧 Executing ${toolName} on ${serverId} with args:`, args);
      
      const response = await client.request({
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      }, {} as any) as any;

      return {
        server: serverId,
        tool: toolName,
        arguments: args,
        result: response.content?.[0]?.text ? JSON.parse(response.content[0].text) : response
      };
    } catch (error) {
      console.error(`❌ Error executing ${toolName} on ${serverId}:`, error);
      throw error;
    }
  }

  getAllTools(): Record<string, any[]> {
    const allTools: Record<string, any[]> = {};
    
    for (const [serverId, tools] of this.tools.entries()) {
      allTools[serverId] = tools.map(tool => ({
        ...tool,
        serverId,
        serverName: this.config?.mcpServers[serverId]?.name || serverId
      }));
    }
    
    return allTools;
  }

  getServerStatus(): Record<string, boolean> {
    if (!this.config) return {};
    
    const status: Record<string, boolean> = {};
    for (const serverId of Object.keys(this.config.mcpServers)) {
      status[serverId] = this.clients.has(serverId);
    }
    return status;
  }

  async disconnect(): Promise<void> {
    for (const [serverId, client] of this.clients.entries()) {
      try {
        await client.close();
        console.log(`✅ Disconnected from ${serverId}`);
      } catch (error) {
        console.error(`❌ Error disconnecting from ${serverId}:`, error);
      }
    }
    
    this.clients.clear();
    this.transports.clear();
    this.tools.clear();
  }

  getConfig(): MCPConfig | null {
    return this.config;
  }

  isConnected(): boolean {
    return this.clients.size > 0;
  }

  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }

  async findToolByName(toolName: string): Promise<{ serverId: string; tool: any } | null> {
    for (const [serverId, tools] of this.tools.entries()) {
      const tool = tools.find((t: any) => t.name === toolName);
      if (tool) {
        return { serverId, tool };
      }
    }
    return null;
  }

  async executeAnyTool(toolName: string, args: any): Promise<any> {
    const toolInfo = await this.findToolByName(toolName);
    if (!toolInfo) {
      throw new Error(`Tool ${toolName} not found in any connected server`);
    }
    
    return this.executeToolCall(toolInfo.serverId, toolName, args);
  }
}

// Singleton instance
let universalClient: UniversalMCPClient | null = null;

export function getUniversalMCPClient(): UniversalMCPClient {
  if (!universalClient) {
    universalClient = new UniversalMCPClient();
  }
  return universalClient;
}