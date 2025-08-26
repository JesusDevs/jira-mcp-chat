import { JiraToolBase } from './base.js';

/**
 * Herramienta para obtener proyectos de Jira
 */
export class GetProjectsTool extends JiraToolBase {
  constructor(jiraConfig) {
    super(jiraConfig);
  }

  /**
   * Definición del esquema de la herramienta para MCP
   */
  static getSchema() {
    return {
      name: 'get_jira_projects',
      description: 'Get list of all available Jira projects',
      inputSchema: {
        type: 'object',
        properties: {
          recent: {
            type: 'boolean',
            description: 'Only return recent projects (default: false)',
            default: false,
          },
        },
      },
    };
  }

  /**
   * Ejecuta la obtención de proyectos
   * @param {Object} args - Argumentos de la herramienta
   * @returns {Promise<Object>} Lista de proyectos
   */
  async execute(args = {}) {
    try {
      const { recent = false } = args;
      
      console.error('🏗️ Getting Jira projects...');

      // Endpoint para proyectos - usar v3 si está disponible
      let endpoint = '/project';
      if (recent) {
        endpoint += '/recent';
      }

      const response = await this.makeJiraRequest(endpoint);

      const projects = response.data.map(project => ({
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description || 'No description',
        projectTypeKey: project.projectTypeKey,
        lead: project.lead?.displayName || 'No lead assigned',
        leadEmail: project.lead?.emailAddress || null,
        url: project.self,
        avatar: project.avatarUrls?.['48x48'] || null,
        style: project.style || 'classic',
        isPrivate: project.isPrivate || false,
        issueTypes: project.issueTypes?.map(type => ({
          id: type.id,
          name: type.name,
          description: type.description,
          iconUrl: type.iconUrl,
        })) || [],
      }));

      return this.createResponse({
        total: projects.length,
        projects: projects,
        recent: recent,
        success: true,
      });

    } catch (error) {
      return this.handleError(error, 'get_jira_projects');
    }
  }
}
