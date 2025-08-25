import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError 
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';

// Cargar variables de entorno desde múltiples ubicaciones
dotenv.config({ path: '../.env' });
dotenv.config({ path: '.env' });
dotenv.config();

class JiraMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'jira-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.jiraConfig = {
      baseURL: process.env.JIRA_BASE_URL,
      email: process.env.JIRA_EMAIL,
      apiToken: process.env.JIRA_API_TOKEN,
    };

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
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
                status: {
                  type: 'string',
                  description: 'Optional: Filter by status (Open, In Progress, Done, etc.)',
                },
                project: {
                  type: 'string',
                  description: 'Optional: Filter by specific project key (e.g., "TEST", "PROJ")',
                },
              },
              required: ['query'],
            },
          },
          {
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
          },
          {
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
          },
          {
            name: 'create_jira_issue',
            description: 'Create a new Jira issue or subtask. Can create Stories, Tasks, Bugs, Subtasks, etc.',
            inputSchema: {
              type: 'object',
              properties: {
                project: {
                  type: 'string',
                  description: 'Project key where to create the issue (e.g., "AIDEV", "SOP")',
                },
                issueType: {
                  type: 'string',
                  description: 'Type of issue: Story, Task, Bug, Subtask, Epic (default: Task)',
                  default: 'Task',
                },
                summary: {
                  type: 'string',
                  description: 'Brief summary/title of the issue',
                },
                description: {
                  type: 'string',
                  description: 'Detailed description of the issue (optional)',
                },
                priority: {
                  type: 'string',
                  description: 'Priority: Highest, High, Medium, Low, Lowest (default: Medium)',
                  default: 'Medium',
                },
                assignee: {
                  type: 'string',
                  description: 'Email or username of assignee (optional, leave empty for unassigned)',
                },
                parentKey: {
                  type: 'string',
                  description: 'Parent issue key if creating a subtask (e.g., "AIDEV-123")',
                },
              },
              required: ['project', 'summary'],
            },
          },
          {
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
          },
          {
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
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'search_jira_issues':
          return await this.searchJiraIssues(args);
        case 'get_jira_projects':
          return await this.getJiraProjects(args);
        case 'get_recent_issues':
          return await this.getRecentIssues(args);
        case 'create_jira_issue':
          return await this.createJiraIssue(args);
        case 'search_epics':
          return await this.searchEpics(args);
        case 'search_by_type':
          return await this.searchByType(args);
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
      }
    });
  }

  async makeJiraRequest(endpoint, data = null, method = 'GET') {
    if (!this.jiraConfig.baseURL || !this.jiraConfig.email || !this.jiraConfig.apiToken) {
      throw new Error('Jira configuration missing. Please check your .env file.');
    }

    const auth = Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64');
    
    const config = {
      method,
      url: `${this.jiraConfig.baseURL}/rest/api/2${endpoint}`,
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

  async searchJiraIssues(args) {
    try {
      const { query, maxResults = 20, project, status } = args;
      
      // Detectar tipo de query y construir JQL apropiado
      let finalJql = this.buildJQLFromQuery(query, project, status);

      console.error(`Searching Jira with JQL: ${finalJql}`);

      const response = await this.makeJiraRequest('/search', {
        jql: finalJql,
        maxResults: Math.min(maxResults, 100),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'issuetype', 'updated', 'project'],
        expand: ['renderedFields'],
      }, 'POST');

      const issues = response.data.issues.map(issue => ({
        key: issue.key,
        project: issue.fields.project?.key || 'Unknown',
        projectName: issue.fields.project?.name || 'Unknown Project',
        summary: issue.fields.summary,
        status: issue.fields.status?.name || 'Unknown',
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        created: new Date(issue.fields.created).toLocaleDateString(),
        updated: new Date(issue.fields.updated).toLocaleDateString(),
        description: issue.fields.description || 'No description',
        priority: issue.fields.priority?.name || 'No priority',
        issueType: issue.fields.issuetype?.name || 'Unknown',
        url: `${this.jiraConfig.baseURL}/browse/${issue.key}`,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query: finalJql,
              total: response.data.total,
              maxResults: response.data.maxResults,
              startAt: response.data.startAt,
              found: issues.length,
              issues,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('Error searching Jira issues:', error.message);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search Jira issues: ${error.response?.data?.errorMessages?.[0] || error.message}`
      );
    }
  }

  async getJiraProjects(args) {
    try {
      const { recent = false } = args;
      
      let endpoint = '/project';
      if (recent) {
        endpoint += '/recent';
      }

      const response = await this.makeJiraRequest(endpoint);
      
      const projects = response.data.map(project => ({
        key: project.key,
        name: project.name,
        id: project.id,
        projectTypeKey: project.projectTypeKey,
        lead: project.lead?.displayName || 'No lead',
        url: `${this.jiraConfig.baseURL}/browse/${project.key}`,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              total: projects.length,
              projects,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting Jira projects:', error.message);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get Jira projects: ${error.response?.data?.errorMessages?.[0] || error.message}`
      );
    }
  }

  buildJQLFromQuery(query, project, status) {
    if (!query || query.trim().length === 0) {
      // Query vacía - usar búsqueda por defecto
      let jql = status ? `status = "${status.trim()}"` : 'created >= -7d';
      if (project) {
        jql = `project = ${project} AND (${jql})`;
      }
      return jql;
    }

    const cleanQuery = query.trim();
    let finalJql = '';

    // Detectar si es una key de issue específica (formato: PROJ-123)
    if (/^[A-Z]+-\d+$/.test(cleanQuery)) {
      finalJql = `key = "${cleanQuery}"`;
    }
    // Si ya es JQL válido (contiene operadores JQL)
    else if (cleanQuery.includes('=') || cleanQuery.includes('AND') || cleanQuery.includes('OR') || cleanQuery.includes('~')) {
      finalJql = cleanQuery;
    }
    // Búsqueda general en texto
    else {
      if (cleanQuery.length > 2) {
        finalJql = `summary ~ "${cleanQuery}" OR description ~ "${cleanQuery}"`;
      } else {
        // Si la query es muy corta, buscar issues recientes
        finalJql = 'created >= -7d';
      }
    }

    // Agregar filtros adicionales
    if (status && !finalJql.toLowerCase().includes('status')) {
      finalJql = `(${finalJql}) AND status = "${status}"`;
    }

    if (project && !finalJql.toLowerCase().includes('project')) {
      finalJql = `project = ${project} AND (${finalJql})`;
    }

    return finalJql;
  }

  async getRecentIssues(args) {
    try {
      const { days = 30, maxResults = 10 } = args;
      
      const jql = `created >= -${days}d ORDER BY created DESC`;
      console.error(`Getting recent issues: ${jql}`);

      const response = await this.makeJiraRequest('/search', {
        jql,
        maxResults: Math.min(maxResults, 50),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'issuetype', 'updated', 'project'],
        expand: ['renderedFields'],
      }, 'POST');

      const issues = response.data.issues.map(issue => ({
        key: issue.key,
        project: issue.fields.project?.key || 'Unknown',
        projectName: issue.fields.project?.name || 'Unknown Project',
        summary: issue.fields.summary,
        status: issue.fields.status?.name || 'Unknown',
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        created: new Date(issue.fields.created).toLocaleDateString(),
        updated: new Date(issue.fields.updated).toLocaleDateString(),
        description: issue.fields.description || 'No description',
        priority: issue.fields.priority?.name || 'No priority',
        issueType: issue.fields.issuetype?.name || 'Unknown',
        url: `${this.jiraConfig.baseURL}/browse/${issue.key}`,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query: jql,
              total: response.data.total,
              maxResults: response.data.maxResults,
              startAt: response.data.startAt,
              found: issues.length,
              issues,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting recent issues:', error.message);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get recent issues: ${error.response?.data?.errorMessages?.[0] || error.message}`
      );
    }
  }

  async createJiraIssue(args) {
    try {
      const { 
        project, 
        issueType = 'Task', 
        summary, 
        description = '', 
        priority = 'Medium',
        assignee,
        parentKey 
      } = args;

      console.error(`Creating Jira issue: ${issueType} in ${project}`);

      // Construir el payload del issue
      const issueData = {
        fields: {
          project: { key: project },
          summary: summary,
          description: description,
          issuetype: { name: issueType },
          priority: { name: priority }
        }
      };

      // Agregar assignee si se especifica
      if (assignee && typeof assignee === 'string') {
        // Si es email, usar accountId, si es username usar name
        if (assignee.includes('@')) {
          // Para emails, necesitamos buscar el accountId primero
          try {
            const userResponse = await this.makeJiraRequest(`/user/search?query=${encodeURIComponent(assignee)}`);
            if (userResponse.data.length > 0) {
              issueData.fields.assignee = { accountId: userResponse.data[0].accountId };
            }
          } catch (error) {
            console.error('Could not find user, leaving unassigned:', error.message);
          }
        } else {
          issueData.fields.assignee = { name: assignee };
        }
      }

      // Si es subtask, agregar parent
      if (parentKey) {
        issueData.fields.parent = { key: parentKey };
        // Para subtasks, asegurar que el issueType sea correcto
        if (issueType === 'Task') {
          issueData.fields.issuetype = { name: 'Subtask' };
        }
      }

      const response = await this.makeJiraRequest('/issue', issueData, 'POST');
      
      const createdIssue = {
        key: response.data.key,
        id: response.data.id,
        url: `${this.jiraConfig.baseURL}/browse/${response.data.key}`,
        project: project,
        issueType: issueType,
        summary: summary,
        description: description,
        priority: priority,
        assignee: assignee || 'Unassigned',
        parentKey: parentKey || null,
        created: new Date().toISOString()
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Issue created successfully: ${response.data.key}`,
              issue: createdIssue,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('Error creating Jira issue:', error.message);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create Jira issue: ${error.response?.data?.errorMessages?.[0] || error.message}`
      );
    }
  }

  async searchEpics(args) {
    try {
      const { query, project, status, maxResults = 20 } = args;
      
      // Construir JQL para buscar épicas
      let jqlParts = ['issuetype = Epic'];
      
      if (project) {
        jqlParts.push(`project = "${project}"`);
      }
      
      if (status) {
        jqlParts.push(`status = "${status}"`);
      }
      
      if (query) {
        if (query.includes('=') || query.includes('AND') || query.includes('OR')) {
          // Es JQL, agregarlo tal como está
          jqlParts.push(`(${query})`);
        } else {
          // Es texto de búsqueda
          jqlParts.push(`(summary ~ "${query}" OR description ~ "${query}")`);
        }
      }
      
      const finalJql = jqlParts.join(' AND ') + ' ORDER BY created DESC';
      console.error(`Searching epics with JQL: ${finalJql}`);

      const response = await this.makeJiraRequest('/search', {
        jql: finalJql,
        maxResults: Math.min(maxResults, 50),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'updated', 'project'],
        expand: ['renderedFields'],
      }, 'POST');

      const epics = response.data.issues.map(issue => ({
        key: issue.key,
        project: issue.fields.project?.key || 'Unknown',
        projectName: issue.fields.project?.name || 'Unknown Project',
        summary: issue.fields.summary,
        status: issue.fields.status?.name || 'Unknown',
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        created: new Date(issue.fields.created).toLocaleDateString(),
        updated: new Date(issue.fields.updated).toLocaleDateString(),
        description: issue.fields.description || 'No description',
        priority: issue.fields.priority?.name || 'No priority',
        url: `${this.jiraConfig.baseURL}/browse/${issue.key}`,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query: finalJql,
              total: response.data.total,
              maxResults: response.data.maxResults,
              startAt: response.data.startAt,
              found: epics.length,
              epics,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('Error searching epics:', error.message);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search epics: ${error.response?.data?.errorMessages?.[0] || error.message}`
      );
    }
  }

  async searchByType(args) {
    try {
      const { issueType, project, status, assignee, query, maxResults = 20 } = args;
      
      // Construir JQL para buscar por tipo
      let jqlParts = [`issuetype = "${issueType}"`];
      
      if (project) {
        jqlParts.push(`project = "${project}"`);
      }
      
      if (status) {
        jqlParts.push(`status = "${status}"`);
      }
      
      if (assignee) {
        if (assignee === 'currentUser()') {
          jqlParts.push('assignee = currentUser()');
        } else {
          jqlParts.push(`assignee = "${assignee}"`);
        }
      }
      
      if (query) {
        jqlParts.push(`(summary ~ "${query}" OR description ~ "${query}")`);
      }
      
      const finalJql = jqlParts.join(' AND ') + ' ORDER BY created DESC';
      console.error(`Searching by type with JQL: ${finalJql}`);

      const response = await this.makeJiraRequest('/search', {
        jql: finalJql,
        maxResults: Math.min(maxResults, 100),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'issuetype', 'updated', 'project'],
        expand: ['renderedFields'],
      }, 'POST');

      const issues = response.data.issues.map(issue => ({
        key: issue.key,
        project: issue.fields.project?.key || 'Unknown',
        projectName: issue.fields.project?.name || 'Unknown Project',
        summary: issue.fields.summary,
        status: issue.fields.status?.name || 'Unknown',
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        created: new Date(issue.fields.created).toLocaleDateString(),
        updated: new Date(issue.fields.updated).toLocaleDateString(),
        description: issue.fields.description || 'No description',
        priority: issue.fields.priority?.name || 'No priority',
        issueType: issue.fields.issuetype?.name || 'Unknown',
        url: `${this.jiraConfig.baseURL}/browse/${issue.key}`,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query: finalJql,
              issueType: issueType,
              total: response.data.total,
              maxResults: response.data.maxResults,
              startAt: response.data.startAt,
              found: issues.length,
              issues,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('Error searching by type:', error.message);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search by type: ${error.response?.data?.errorMessages?.[0] || error.message}`
      );
    }
  }

  async run() {
    try {
      // Verificar configuración antes de iniciar
      if (!this.jiraConfig.baseURL || !this.jiraConfig.email || !this.jiraConfig.apiToken) {
        console.error('❌ Jira configuration missing:');
        console.error('  JIRA_BASE_URL:', this.jiraConfig.baseURL ? 'Set' : 'Missing');
        console.error('  JIRA_EMAIL:', this.jiraConfig.email ? 'Set' : 'Missing');
        console.error('  JIRA_API_TOKEN:', this.jiraConfig.apiToken ? 'Set' : 'Missing');
        process.exit(1);
      }

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.error('✅ Jira MCP Server running on stdio');
      console.error('🔧 Available tools: search_jira_issues, get_jira_projects, get_recent_issues, create_jira_issue, search_epics, search_by_type');
      console.error('🌐 Jira URL:', this.jiraConfig.baseURL);
      console.error('👤 Jira User:', this.jiraConfig.email);
      
    } catch (error) {
      console.error('❌ Failed to start Jira MCP Server:', error.message);
      process.exit(1);
    }
  }
}

const server = new JiraMCPServer();
server.run().catch(console.error);