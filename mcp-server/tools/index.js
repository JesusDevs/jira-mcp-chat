/**
 * Paquete de herramientas de Jira para MCP Server
 * 
 * Este módulo centraliza todas las herramientas de Jira, proporcionando
 * una interfaz limpia y organizada para el servidor MCP principal.
 * 
 * Cada herramienta está en su propio archivo para mejor mantenibilidad.
 */

// Importar todas las herramientas
import { SearchIssuesTool } from './search-issues.js';
import { GetProjectsTool } from './get-projects.js';
import { RecentIssuesTool } from './recent-issues.js';
import { CreateIssueTool } from './create-issue.js';
import { SearchEpicsTool } from './search-epics.js';
import { SearchByTypeTool } from './search-by-type.js';

/**
 * Clase gestora de herramientas de Jira
 * Centraliza la creación y gestión de todas las herramientas
 */
export class JiraToolsManager {
  constructor(jiraConfig) {
    this.jiraConfig = jiraConfig;
    this.tools = this.initializeTools();
  }

  /**
   * Inicializa todas las herramientas con la configuración de Jira
   * @returns {Map} Map de herramientas indexadas por nombre
   */
  initializeTools() {
    const tools = new Map();
    
    // Instanciar cada herramienta
    tools.set('search_jira_issues', new SearchIssuesTool(this.jiraConfig));
    tools.set('get_jira_projects', new GetProjectsTool(this.jiraConfig));
    tools.set('get_recent_issues', new RecentIssuesTool(this.jiraConfig));
    tools.set('create_jira_issue', new CreateIssueTool(this.jiraConfig));
    tools.set('search_epics', new SearchEpicsTool(this.jiraConfig));
    tools.set('search_by_type', new SearchByTypeTool(this.jiraConfig));
    
    return tools;
  }

  /**
   * Obtiene los esquemas de todas las herramientas para MCP
   * @returns {Array} Array de esquemas de herramientas
   */
  getToolSchemas() {
    return [
      SearchIssuesTool.getSchema(),
      GetProjectsTool.getSchema(),
      RecentIssuesTool.getSchema(),
      CreateIssueTool.getSchema(),
      SearchEpicsTool.getSchema(),
      SearchByTypeTool.getSchema(),
    ];
  }

  /**
   * Ejecuta una herramienta específica
   * @param {string} toolName - Nombre de la herramienta
   * @param {Object} args - Argumentos para la herramienta
   * @returns {Promise<Object>} Resultado de la ejecución
   */
  async executeTool(toolName, args = {}) {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool ${toolName} not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`);
    }

    console.log(`🔧 Executing tool: ${toolName}`, args);
    
    try {
      const result = await tool.execute(args);
      console.log(`✅ Tool ${toolName} executed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Tool ${toolName} execution failed:`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene información de todas las herramientas disponibles
   * @returns {Array} Array con información de cada herramienta
   */
  getToolsInfo() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name: name,
      class: tool.constructor.name,
      schema: tool.constructor.getSchema(),
    }));
  }

  /**
   * Verifica si una herramienta existe
   * @param {string} toolName - Nombre de la herramienta
   * @returns {boolean} True si la herramienta existe
   */
  hasTool(toolName) {
    return this.tools.has(toolName);
  }

  /**
   * Obtiene la lista de nombres de herramientas disponibles
   * @returns {Array<string>} Array de nombres de herramientas
   */
  getAvailableTools() {
    return Array.from(this.tools.keys());
  }
}

/**
 * Exportar las clases individuales para uso directo si es necesario
 */
export {
  SearchIssuesTool,
  GetProjectsTool,
  RecentIssuesTool,
  CreateIssueTool,
  SearchEpicsTool,
  SearchByTypeTool,
};

/**
 * Función de conveniencia para crear el gestor de herramientas
 * @param {Object} jiraConfig - Configuración de Jira
 * @returns {JiraToolsManager} Instancia del gestor de herramientas
 */
export function createJiraToolsManager(jiraConfig) {
  return new JiraToolsManager(jiraConfig);
}
