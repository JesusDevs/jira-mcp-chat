import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

/**
 * Cliente MCP REAL que se conecta al servidor MCP via stdio
 * Compatible con el protocolo estándar MCP
 */
export class RealMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private serverProcess: ChildProcess | null = null;
  private isConnected = false;
  private tools: any[] = [];

  constructor() {
    console.log('🔧 Initializing Real MCP Client');
  }

  async connect(): Promise<boolean> {
    try {
      if (this.isConnected) {
        console.log('✅ MCP Client already connected');
        return true;
      }

      console.log('🚀 Starting MCP Server process...');
      
      // Buscar la ruta del servidor MCP de manera más robusta
      const possiblePaths = [
        path.resolve(process.cwd(), '../mcp-server/index.js'),
        path.resolve(process.cwd(), './mcp-server/index.js'),
        path.resolve(__dirname, '../../mcp-server/index.js'),
        path.resolve(__dirname, '../../../mcp-server/index.js'),
      ];
      
      console.log('📁 Current working directory:', process.cwd());
      console.log('📂 __dirname:', __dirname);
      
      let serverPath: string | null = null;
      const fs = require('fs');
      
      for (const testPath of possiblePaths) {
        console.log('🔍 Checking path:', testPath);
        if (fs.existsSync(testPath)) {
          serverPath = testPath;
          console.log('✅ Found MCP Server at:', serverPath);
          break;
        }
      }
      
      if (!serverPath) {
        throw new Error(`MCP Server not found. Tried paths: ${possiblePaths.join(', ')}`);
      }

      // Crear el cliente MCP
      this.client = new Client({
        name: 'jira-chat-client',
        version: '1.0.0',
      }, {
        capabilities: {
          tools: {},
        },
      });

      // Crear transport usando el comando del servidor
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
        env: {
          ...process.env,
          JIRA_BASE_URL: process.env.JIRA_BASE_URL,
          JIRA_EMAIL: process.env.JIRA_EMAIL,
          JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
        }
      });

      // Conectar el cliente al servidor
      await this.client.connect(this.transport);
      
      console.log('✅ MCP Client connected to server');
      this.isConnected = true;

      // Obtener lista de herramientas disponibles
      await this.loadTools();
      
      return true;

    } catch (error) {
      console.error('❌ Failed to connect MCP Client:', error);
      this.isConnected = false;
      return false;
    }
  }

  async loadTools(): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP Client not connected');
    }

    try {
      console.log('📡 Requesting tools from MCP server...');
      const response = await this.client.request({
        method: 'tools/list',
        params: {}
      }, {}) as any;

      console.log('📡 Raw MCP response:', JSON.stringify(response, null, 2));
      this.tools = response.tools || [];
      console.log(`🔧 Loaded ${this.tools.length} MCP tools:`, this.tools.map(t => t.name));
      
    } catch (error) {
      console.error('❌ Failed to load tools:', error);
      console.error('❌ Error details:', error.stack);
      this.tools = [];
    }
  }

  getTools(): any[] {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema || {
        type: 'object',
        properties: {},
        additionalProperties: true
      }
    }));
  }

  async callTool(toolName: string, args: any): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP Client not connected');
    }

    try {
      console.log(`🔧 Calling MCP tool: ${toolName}`, args);
      
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      }, {}) as any;

      console.log(`✅ Tool ${toolName} executed successfully`);
      return {
        name: toolName,
        arguments: args,
        result: response.content?.[0]?.text ? JSON.parse(response.content[0].text) : response
      };

    } catch (error) {
      console.error(`❌ Error calling tool ${toolName}:`, error);
      throw new Error(`Failed to execute ${toolName}: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.transport) {
        await this.client.close();
        this.transport = null;
        this.client = null;
      }

      if (this.serverProcess) {
        this.serverProcess.kill('SIGTERM');
        this.serverProcess = null;
      }

      this.isConnected = false;
      console.log('🔌 MCP Client disconnected');

    } catch (error) {
      console.error('❌ Error disconnecting MCP Client:', error);
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  getConnectionStatus(): string {
    if (!this.isConnected) return 'disconnected';
    if (!this.client) return 'connecting';
    return 'connected';
  }
}

// Singleton instance
let mcpClientInstance: RealMCPClient | null = null;

export function getMCPClient(): RealMCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new RealMCPClient();
  }
  return mcpClientInstance;
}

// Cleanup al cerrar la aplicación
process.on('exit', () => {
  if (mcpClientInstance) {
    mcpClientInstance.disconnect();
  }
});

process.on('SIGINT', () => {
  if (mcpClientInstance) {
    mcpClientInstance.disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (mcpClientInstance) {
    mcpClientInstance.disconnect();
  }
  process.exit(0);
});
