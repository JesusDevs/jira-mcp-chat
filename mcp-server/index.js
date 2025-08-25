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

dotenv.config({ path: '../.env' });

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
            description: 'Search Jira issues using JQL (Jira Query Language). Examples: "project = TEST", "status = Open", "assignee = currentUser()"',
            inputSchema: {
              type: 'object',
              properties: {
                jql: {
                  type: 'string',
                  description: 'JQL query to search issues. Examples: "project = TEST AND status = Open", "assignee = currentUser() AND created >= -7d"',
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
              },
              required: ['jql'],
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
      const { jql, maxResults = 20, project } = args;
      
      let finalJql = jql;
      if (project && !jql.toLowerCase().includes('project')) {
        finalJql = `project = ${project} AND (${jql})`;
      }

      console.error(`Searching Jira with JQL: ${finalJql}`);

      const response = await this.makeJiraRequest('/search', {
        jql: finalJql,
        maxResults: Math.min(maxResults, 100),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'issuetype', 'updated'],
        expand: ['renderedFields'],
      }, 'POST');

      const issues = response.data.issues.map(issue => ({
        key: issue.key,
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Jira MCP Server running on stdio');
  }
}

const server = new JiraMCPServer();
server.run().catch(console.error);