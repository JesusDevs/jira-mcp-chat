import { JiraToolBase } from './base.js';

/**
 * Herramienta para buscar issues por tipo específico
 */
export class SearchByTypeTool extends JiraToolBase {
  constructor(jiraConfig) {
    super(jiraConfig);
  }

  /**
   * Definición del esquema de la herramienta para MCP
   */
  static getSchema() {
    return {
      name: 'search_by_type',
      description: 'Search issues by specific issue type (Bug, Story, Task, Subtask, etc.) with advanced filtering.',
      inputSchema: {
        type: 'object',
        properties: {
          issueType: {
            type: 'string',
            description: 'Issue type to search: Bug, Story, Task, Subtask, Epic, etc.',
          },
          project: {
            type: 'string',
            description: 'Filter by project key (optional)',
          },
          status: {
            type: 'string',
            description: 'Filter by status (optional)',
          },
          assignee: {
            type: 'string',
            description: 'Filter by assignee (optional). Use "currentUser()" for your issues',
          },
          query: {
            type: 'string',
            description: 'Additional search text in summary/description (optional)',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results (default: 20)',
            default: 20,
            maximum: 100,
          },
        },
        required: ['issueType'],
      },
    };
  }

  /**
   * Ejecuta la búsqueda por tipo de issue
   * @param {Object} args - Argumentos de la herramienta
   * @returns {Promise<Object>} Issues encontrados
   */
  async execute(args) {
    try {
      const { issueType, project, status, assignee, query, maxResults = 20 } = args;
      
      console.error(`🔍 Searching for ${issueType} issues...`);

      // Construir JQL basado en el tipo de issue
      let jql = `type = "${issueType}"`;
      
      // Añadir filtros adicionales
      const filters = [];
      
      if (project) {
        filters.push(`project = "${project}"`);
      }
      
      if (status) {
        filters.push(`status = "${status}"`);
      }
      
      if (assignee) {
        if (assignee.toLowerCase() === 'currentuser()' || assignee === 'me') {
          filters.push('assignee = currentUser()');
        } else {
          filters.push(`assignee = "${assignee}"`);
        }
      }
      
      if (query) {
        filters.push(`(summary ~ "${query}" OR description ~ "${query}")`);
      }
      
      // Combinar filtros
      if (filters.length > 0) {
        jql += ' AND ' + filters.join(' AND ');
      }
      
      jql += ' ORDER BY created DESC';

      const response = await this.makeJiraRequest('/search', {
        jql: jql,
        maxResults: Math.min(maxResults, 100),
        fields: [
          'summary', 'status', 'assignee', 'created', 'description', 
          'priority', 'issuetype', 'updated', 'project', 'labels',
          'components', 'reporter', 'resolution'
        ],
        expand: ['renderedFields'],
      }, 'POST');

      const issues = response.data.issues.map(issue => ({
        ...this.formatIssue(issue),
        // Información adicional
        resolution: issue.fields.resolution?.name || null,
        resolutionDate: issue.fields.resolutiondate ? 
          new Date(issue.fields.resolutiondate).toLocaleDateString() : null,
        reporter: issue.fields.reporter?.displayName || 'Unknown',
        reporterEmail: issue.fields.reporter?.emailAddress || null,
      }));

      return this.createResponse({
        query: jql,
        issueType: issueType,
        total: response.data.total,
        maxResults: response.data.maxResults,
        found: issues.length,
        issues: issues,
        filters: {
          project: project || null,
          status: status || null,
          assignee: assignee || null,
          textQuery: query || null,
        },
        success: true,
      });

    } catch (error) {
      return this.handleError(error, 'search_by_type');
    }
  }
}
