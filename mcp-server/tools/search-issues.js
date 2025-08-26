import { JiraToolBase } from './base.js';

/**
 * Herramienta para buscar issues en Jira
 * Soporta JQL, keywords y claves de issue específicas
 */
export class SearchIssuesTool extends JiraToolBase {
  constructor(jiraConfig) {
    super(jiraConfig);
  }

  /**
   * Definición del esquema de la herramienta para MCP
   */
  static getSchema() {
    return {
      name: 'search_jira_issues',
      description: 'Search Jira issues using JQL, keywords, or issue keys. Smart query detection for flexible search.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query - can be JQL (project = TEST), issue key (PROJ-123), or keywords for text search',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results to return (default: 20, max: 100)',
            default: 20,
            maximum: 100,
          },
          project: {
            type: 'string',
            description: 'Optional: Filter by specific project key (e.g., "TEST", "PROJ")',
          },
          status: {
            type: 'string',
            description: 'Optional: Filter by status (Open, In Progress, Done, etc.)',
          },
        },
        required: ['query'],
      },
    };
  }

  /**
   * Ejecuta la búsqueda de issues
   * @param {Object} args - Argumentos de la herramienta
   * @returns {Promise<Object>} Resultados de la búsqueda
   */
  async execute(args) {
    try {
      const { query, maxResults = 20, project, status } = args;
      
      // Detectar tipo de query y construir JQL apropiado
      const finalJql = this.buildJQLFromQuery(query, project, status);

      console.error(`🔍 Searching Jira with JQL: ${finalJql}`);

      const response = await this.makeJiraRequest('/search', {
        jql: finalJql,
        maxResults: Math.min(maxResults, 100),
        fields: [
          'summary', 'status', 'assignee', 'created', 'description', 
          'priority', 'issuetype', 'updated', 'project', 'labels', 
          'components', 'reporter'
        ],
        expand: ['renderedFields'],
      }, 'POST');

      const issues = response.data.issues.map(issue => this.formatIssue(issue));

      return this.createResponse({
        query: finalJql,
        total: response.data.total,
        maxResults: response.data.maxResults,
        startAt: response.data.startAt,
        found: issues.length,
        issues: issues,
        success: true,
      });

    } catch (error) {
      return this.handleError(error, 'search_jira_issues');
    }
  }
}
