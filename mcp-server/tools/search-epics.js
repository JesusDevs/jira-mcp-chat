import { JiraToolBase } from './base.js';

/**
 * Herramienta para buscar épicas en Jira
 */
export class SearchEpicsTool extends JiraToolBase {
  constructor(jiraConfig) {
    super(jiraConfig);
  }

  /**
   * Definición del esquema de la herramienta para MCP
   */
  static getSchema() {
    return {
      name: 'search_epics',
      description: 'Search specifically for Epics in Jira projects. Find epics by name, project, or status.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search term for epic name or JQL query',
          },
          project: {
            type: 'string',
            description: 'Filter by specific project key (e.g., "AIDEV")',
          },
          status: {
            type: 'string',
            description: 'Filter by epic status (e.g., "To Do", "In Progress", "Done")',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results (default: 20)',
            default: 20,
            maximum: 50,
          },
        },
      },
    };
  }

  /**
   * Ejecuta la búsqueda de épicas
   * @param {Object} args - Argumentos de la herramienta
   * @returns {Promise<Object>} Épicas encontradas
   */
  async execute(args = {}) {
    try {
      const { query, project, status, maxResults = 20 } = args;
      
      console.error('🎯 Searching for Epics...');

      // Construir JQL específico para épicas
      let jql = 'type = Epic';
      
      // Añadir filtros
      if (project) {
        jql += ` AND project = "${project}"`;
      }
      
      if (status) {
        jql += ` AND status = "${status}"`;
      }
      
      if (query && !this.isValidJQL(query)) {
        jql += ` AND (summary ~ "${query}" OR description ~ "${query}")`;
      } else if (query && this.isValidJQL(query)) {
        jql += ` AND (${query})`;
      }
      
      jql += ' ORDER BY created DESC';

      const response = await this.makeJiraRequest('/search', {
        jql: jql,
        maxResults: Math.min(maxResults, 50),
        fields: [
          'summary', 'status', 'assignee', 'created', 'description', 
          'priority', 'issuetype', 'updated', 'project', 'labels',
          'components', 'reporter', 'progress'
        ],
        expand: ['renderedFields'],
      }, 'POST');

      const epics = response.data.issues.map(epic => ({
        ...this.formatIssue(epic),
        // Información adicional específica para épicas
        progress: epic.fields.progress || null,
        epicName: epic.fields.customfield_10011 || epic.fields.summary, // Epic Name field
      }));

      return this.createResponse({
        query: jql,
        total: response.data.total,
        maxResults: response.data.maxResults,
        found: epics.length,
        epics: epics,
        success: true,
      });

    } catch (error) {
      return this.handleError(error, 'search_epics');
    }
  }
}
