import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError 
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { JiraToolsManager } from './tools/index.js';

// Cargar variables de entorno desde múltiples ubicaciones
dotenv.config({ path: '../.env' });
dotenv.config({ path: '.env' });
dotenv.config();

/**
 * Servidor MCP para Jira con herramientas modulares
 * 
 * Este servidor utiliza un sistema de herramientas modular donde cada
 * herramienta está en su propio archivo, mejorando la mantenibilidad
 * y escalabilidad del código.
 */
class JiraMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'jira-mcp-server',
        version: '2.0.0', // Incrementamos versión por refactorización
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Configuración de Jira
    this.jiraConfig = {
      baseURL: process.env.JIRA_BASE_URL,
      email: process.env.JIRA_EMAIL,
      apiToken: process.env.JIRA_API_TOKEN,
    };

    // Inicializar gestor de herramientas
    this.toolsManager = new JiraToolsManager(this.jiraConfig);

    // Configurar manejadores
    this.setupToolHandlers();
    
    // Log de inicialización
    this.logInitialization();
  }

  /**
   * Configura los manejadores de herramientas MCP
   */
  setupToolHandlers() {
    // Manejador para listar herramientas disponibles
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const schemas = this.toolsManager.getToolSchemas();
        
        console.error(`📋 Listing ${schemas.length} available tools`);
        
        return {
          tools: schemas
        };
      } catch (error) {
        console.error('❌ Error listing tools:', error.message);
        throw new McpError(ErrorCode.InternalError, `Failed to list tools: ${error.message}`);
      }
    });

    // Manejador para ejecutar herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        
        console.error(`🔧 Executing tool: ${name}`);
        
        // Verificar que la herramienta existe
        if (!this.toolsManager.hasTool(name)) {
          const availableTools = this.toolsManager.getAvailableTools();
          throw new McpError(
            ErrorCode.MethodNotFound, 
            `Tool ${name} not found. Available tools: ${availableTools.join(', ')}`
          );
        }

        // Ejecutar la herramienta
        const result = await this.toolsManager.executeTool(name, args);
        
        console.error(`✅ Tool ${name} executed successfully`);
        return result;
        
      } catch (error) {
        console.error(`❌ Error executing tool ${request.params.name}:`, error.message);
        
        // Si es un McpError, re-lanzarlo
        if (error instanceof McpError) {
          throw error;
        }
        
        // Para otros errores, crear McpError apropiado
        throw new McpError(
          ErrorCode.InternalError, 
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  /**
   * Log de información de inicialización
   */
  logInitialization() {
    console.error('🚀 Jira MCP Server v2.0 - Modular Architecture');
    console.error('='.repeat(50));
    
    // Verificar configuración
    const configStatus = this.checkConfiguration();
    
    if (configStatus.valid) {
      console.error('✅ Jira configuration is valid');
      console.error(`🌐 Jira URL: ${this.jiraConfig.baseURL}`);
      console.error(`👤 Jira User: ${this.jiraConfig.email}`);
    } else {
      console.error('❌ Jira configuration issues:');
      configStatus.issues.forEach(issue => console.error(`   - ${issue}`));
    }
    
    // Log de herramientas disponibles
    const availableTools = this.toolsManager.getAvailableTools();
    console.error(`🔧 Available tools (${availableTools.length}):`);
    availableTools.forEach(tool => console.error(`   - ${tool}`));
    
    console.error('='.repeat(50));
    console.error('📡 MCP Server ready for connections');
  }

  /**
   * Verifica la configuración de Jira
   * @returns {Object} Estado de la configuración
   */
  checkConfiguration() {
    const issues = [];
    
    if (!this.jiraConfig.baseURL) {
      issues.push('JIRA_BASE_URL not configured');
    } else if (!this.jiraConfig.baseURL.startsWith('https://')) {
      issues.push('JIRA_BASE_URL should start with https://');
    }
    
    if (!this.jiraConfig.email) {
      issues.push('JIRA_EMAIL not configured');
    } else if (!this.jiraConfig.email.includes('@')) {
      issues.push('JIRA_EMAIL should be a valid email address');
    }
    
    if (!this.jiraConfig.apiToken) {
      issues.push('JIRA_API_TOKEN not configured');
    } else if (this.jiraConfig.apiToken.length < 20) {
      issues.push('JIRA_API_TOKEN seems too short (check if valid)');
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Inicia el servidor MCP
   */
  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.error('🚀 Jira MCP Server started successfully');
      console.error('📡 Listening for MCP connections via stdio...');
      
    } catch (error) {
      console.error('❌ Failed to start MCP server:', error.message);
      process.exit(1);
    }
  }

  /**
   * Maneja el cierre graceful del servidor
   */
  async shutdown() {
    try {
      console.error('🛑 Shutting down Jira MCP Server...');
      await this.server.close();
      console.error('✅ Server shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error.message);
      process.exit(1);
    }
  }

  /**
   * Obtiene información sobre el estado del servidor
   * @returns {Object} Información del servidor
   */
  getServerInfo() {
    const toolsInfo = this.toolsManager.getToolsInfo();
    const configStatus = this.checkConfiguration();
    
    return {
      name: 'jira-mcp-server',
      version: '2.0.0',
      architecture: 'modular',
      jiraConfig: {
        baseURL: this.jiraConfig.baseURL,
        email: this.jiraConfig.email,
        hasToken: !!this.jiraConfig.apiToken,
        configValid: configStatus.valid,
        configIssues: configStatus.issues
      },
      tools: {
        count: toolsInfo.length,
        available: toolsInfo.map(t => t.name),
        details: toolsInfo
      },
      capabilities: ['tools'],
      status: 'running'
    };
  }
}

// Crear y configurar el servidor
const server = new JiraMCPServer();

// Manejar señales del sistema para shutdown graceful
process.on('SIGINT', () => {
  console.error('\n📡 Received SIGINT, shutting down gracefully...');
  server.shutdown();
});

process.on('SIGTERM', () => {
  console.error('\n📡 Received SIGTERM, shutting down gracefully...');
  server.shutdown();
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  console.error(error.stack);
  server.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  server.shutdown();
});

// Función principal para modo CLI
async function main() {
  // Si se ejecuta directamente (no como módulo)
  if (import.meta.url === `file://${process.argv[1]}`) {
    // Verificar argumentos de línea de comandos
    const args = process.argv.slice(2);
    
    if (args.includes('--info') || args.includes('-i')) {
      // Mostrar información del servidor
      const info = server.getServerInfo();
      console.log(JSON.stringify(info, null, 2));
      process.exit(0);
    }
    
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
🚀 Jira MCP Server v2.0 - Modular Architecture

Usage:
  node index.js                 Start the MCP server
  node index.js --info          Show server information
  node index.js --help          Show this help message

Environment Variables:
  JIRA_BASE_URL                 Your Jira instance URL
  JIRA_EMAIL                    Your Jira email
  JIRA_API_TOKEN               Your Jira API token

Available Tools:
  search_jira_issues           Search issues with JQL/keywords
  get_jira_projects           Get list of projects
  get_recent_issues           Get recent issues
  create_jira_issue           Create new issues/subtasks
  search_epics                Search for epics
  search_by_type              Search by issue type

For more information, see the documentation.
      `);
      process.exit(0);
    }
    
    // Iniciar el servidor
    await server.start();
  }
}

// Exportar para uso como módulo
export { JiraMCPServer, JiraToolsManager };

// Ejecutar si es el script principal
main().catch(error => {
  console.error('💥 Fatal error during startup:', error.message);
  console.error(error.stack);
  process.exit(1);
});