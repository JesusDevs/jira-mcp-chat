import { JiraToolBase } from './base.js';

/**
 * Herramienta para obtener issues recientes de Jira
 */
export class RecentIssuesTool extends JiraToolBase {
  constructor(jiraConfig) {
    super(jiraConfig);
  }

  /**
   * Definición del esquema de la herramienta para MCP
   */
  static getSchema() {
    return {
      name: 'get_recent_issues',
      description: 'Get recent issues from all accessible projects, ordered by creation date',
      inputSchema: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days back to search (default: 30)',
            default: 30,
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results (default: 10)',
            default: 10,
            maximum: 50,
          },
        },
      },
    };
  }

  /**
   * Ejecuta la obtención de issues recientes
   * @param {Object} args - Argumentos de la herramienta
   * @returns {Promise<Object>} Issues recientes
   */
  async execute(args = {}) {
    try {
      const { days = 30, maxResults = 10 } = args;
      
      console.error(`📅 Getting recent issues from last ${days} days...`);

      // Construir JQL para issues recientes
      const jql = `created >= -${days}d ORDER BY created DESC`;

      const response = await this.makeJiraRequest('/search', {
        jql: jql,
        maxResults: Math.min(maxResults, 50),
        fields: [
          'summary', 'status', 'assignee', 'created', 'description', 
          'priority', 'issuetype', 'updated', 'project', 'labels',
          'components', 'reporter'
        ],
        expand: ['renderedFields'],
      }, 'POST');

      const issues = response.data.issues.map(issue => this.formatIssue(issue));

      return this.createResponse({
        query: jql,
        days: days,
        total: response.data.total,
        maxResults: response.data.maxResults,
        found: issues.length,
        issues: issues,
        success: true,
      });

    } catch (error) {
      return this.handleError(error, 'get_recent_issues');
    }
  }
}
