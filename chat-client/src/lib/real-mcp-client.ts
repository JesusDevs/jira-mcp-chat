// Real MCP Client - Server-side communication with MCP servers

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface MCPToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

interface MCPTemplate {
  name: string;
  description: string;
  category: string;
  variables: Record<string, string>;
}

/**
 * Cliente MCP Real que se comunica via API proxy
 */
export class RealMCPClient {
  private baseUrl: string;
  private serverId: string;

  constructor(serverId: string = 'jira', baseUrl: string = '/api/mcp-proxy') {
    this.serverId = serverId;
    this.baseUrl = baseUrl;
  }

  /**
   * Listar herramientas disponibles
   */
  async listTools(): Promise<MCPTool[]> {
    try {
      console.log(`🔍 Listing tools for server: ${this.serverId}`);
      
      const response = await fetch(`${this.baseUrl}?server=${this.serverId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to list tools');
      }

      console.log(`✅ Found ${data.tools.length} tools`);
      return data.tools;

    } catch (error) {
      console.error(`❌ Error listing tools:`, error);
      throw error;
    }
  }

  /**
   * Ejecutar herramienta MCP
   */
  async executeTool(toolName: string, arguments: any): Promise<MCPToolResult> {
    try {
      console.log(`🔧 Executing tool: ${toolName}`);
      console.log(`📝 Arguments:`, arguments);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          server: this.serverId,
          toolName,
          arguments
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Tool execution failed');
      }

      console.log(`✅ Tool executed successfully: ${toolName}`);
      return {
        success: true,
        result: data.result
      };

    } catch (error) {
      console.error(`❌ Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Listar templates disponibles
   */
  async listTemplates(category?: string): Promise<MCPTemplate[]> {
    try {
      console.log(`📋 Listing templates, category: ${category || 'all'}`);
      
      const url = new URL(this.baseUrl, window.location.origin);
      url.searchParams.set('server', this.serverId);
      if (category) {
        url.searchParams.set('category', category);
      }

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to list templates');
      }

      console.log(`✅ Found templates:`, data.templates);
      return data.templates;

    } catch (error) {
      console.error(`❌ Error listing templates:`, error);
      throw error;
    }
  }

  /**
   * Crear issue desde template
   */
  async createFromTemplate(templateName: string, variables: Record<string, string>, teamContext?: string, project?: string): Promise<MCPToolResult> {
    try {
      console.log(`🎯 Creating issue from template: ${templateName}`);
      
      return await this.executeTool('create_jira_from_template', {
        template: templateName,
        variables,
        team_context: teamContext,
        project
      });

    } catch (error) {
      console.error(`❌ Error creating from template:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener información del servidor MCP
   */
  async getServerInfo(): Promise<any> {
    try {
      const tools = await this.listTools();
      return {
        serverId: this.serverId,
        toolCount: tools.length,
        tools: tools.map(t => ({
          name: t.name,
          description: t.description
        }))
      };
    } catch (error) {
      console.error(`❌ Error getting server info:`, error);
      return {
        serverId: this.serverId,
        toolCount: 0,
        tools: [],
        error: error.message
      };
    }
  }

  /**
   * Verificar conectividad con el servidor MCP
   */
  async ping(): Promise<boolean> {
    try {
      await this.listTools();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Instancia singleton del cliente MCP
 */
export const realMCPClient = new RealMCPClient('jira');

/**
 * Factory function para crear clientes MCP
 */
export function createMCPClient(serverId: string): RealMCPClient {
  return new RealMCPClient(serverId);
}