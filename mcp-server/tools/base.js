import axios from 'axios';

/**
 * Clase base para herramientas de Jira
 * Proporciona funcionalidad común para todas las herramientas
 */
export class JiraToolBase {
  constructor(jiraConfig) {
    this.jiraConfig = jiraConfig;
  }

  /**
   * Realiza una petición autenticada a la API de Jira
   * @param {string} endpoint - Endpoint de la API (ej: '/search')
   * @param {Object} data - Datos para POST/PUT requests
   * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
   * @returns {Promise<Object>} Respuesta de la API
   */
  async makeJiraRequest(endpoint, data = null, method = 'GET') {
    if (!this.jiraConfig.baseURL || !this.jiraConfig.email || !this.jiraConfig.apiToken) {
      throw new Error('Jira configuration missing. Please check your .env file.');
    }

    const auth = Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64');
    
    const config = {
      method,
      url: `${this.jiraConfig.baseURL}/rest/api/3${endpoint}`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    return await axios(config);
  }

  /**
   * Construye JQL a partir de una query en lenguaje natural
   * @param {string} query - Query del usuario
   * @param {string} project - Proyecto específico (opcional)
   * @param {string} status - Estado específico (opcional)
   * @returns {string} JQL válido
   */
  buildJQLFromQuery(query, project, status) {
    let jql = '';
    
    // Si la query ya es JQL válido, usarla directamente
    if (this.isValidJQL(query)) {
      jql = query;
    } else if (this.isIssueKey(query)) {
      // Si es una clave de issue específica
      jql = `key = "${query}"`;
    } else {
      // Búsqueda por texto en summary o description
      jql = `(summary ~ "${query}" OR description ~ "${query}")`;
    }
    
    // Añadir filtros adicionales
    const filters = [];
    
    if (project) {
      filters.push(`project = "${project}"`);
    }
    
    if (status) {
      filters.push(`status = "${status}"`);
    }
    
    if (filters.length > 0) {
      jql = filters.join(' AND ') + (jql ? ` AND (${jql})` : '');
    }
    
    return jql || 'project is not empty';
  }

  /**
   * Verifica si una query es JQL válido
   * @param {string} query - Query a verificar
   * @returns {boolean} True si es JQL válido
   */
  isValidJQL(query) {
    const jqlKeywords = [
      'project', 'status', 'assignee', 'reporter', 'created', 'updated',
      'priority', 'type', 'component', 'version', 'fixVersion', 'label',
      'AND', 'OR', 'NOT', 'IN', 'NOT IN', '=', '!=', '>', '<', '>=', '<=',
      'IS', 'IS NOT', '~', '!~', 'EMPTY', 'NULL'
    ];
    
    const upperQuery = query.toUpperCase();
    return jqlKeywords.some(keyword => upperQuery.includes(keyword));
  }

  /**
   * Verifica si una query es una clave de issue (ej: PROJ-123)
   * @param {string} query - Query a verificar
   * @returns {boolean} True si es una clave de issue
   */
  isIssueKey(query) {
    const issueKeyPattern = /^[A-Z][A-Z0-9_]*-\d+$/;
    return issueKeyPattern.test(query.trim());
  }

  /**
   * Formatea un issue de Jira para respuesta
   * @param {Object} issue - Issue de Jira desde la API
   * @returns {Object} Issue formateado
   */
  formatIssue(issue) {
    return {
      key: issue.key,
      project: issue.fields.project?.key || 'Unknown',
      projectName: issue.fields.project?.name || 'Unknown Project',
      summary: issue.fields.summary,
      status: issue.fields.status?.name || 'Unknown',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      assigneeEmail: issue.fields.assignee?.emailAddress || null,
      created: new Date(issue.fields.created).toLocaleDateString(),
      updated: new Date(issue.fields.updated).toLocaleDateString(),
      description: issue.fields.description || 'No description',
      priority: issue.fields.priority?.name || 'No priority',
      issueType: issue.fields.issuetype?.name || 'Unknown',
      url: `${this.jiraConfig.baseURL}/browse/${issue.key}`,
      labels: issue.fields.labels || [],
      components: issue.fields.components?.map(c => c.name) || [],
    };
  }

  /**
   * Crea una respuesta estándar para herramientas MCP
   * @param {Object} data - Datos a incluir en la respuesta
   * @returns {Object} Respuesta formateada para MCP
   */
  createResponse(data) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  /**
   * Maneja errores de forma consistente
   * @param {Error} error - Error capturado
   * @param {string} operation - Nombre de la operación que falló
   * @returns {Object} Respuesta de error formateada
   */
  handleError(error, operation) {
    console.error(`❌ Error in ${operation}:`, error.message);
    
    const errorMessage = error.response?.data?.errorMessages?.[0] || 
                        error.response?.data?.message || 
                        error.message || 
                        'Unknown error occurred';
    
    return this.createResponse({
      error: true,
      operation,
      message: errorMessage,
      status: error.response?.status,
    });
  }
}
