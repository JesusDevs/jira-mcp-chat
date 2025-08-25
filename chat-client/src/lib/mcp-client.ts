import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL_NAME = 'gemini-2.0-flash-exp';

// Simulamos las herramientas MCP directamente en el cliente
const tools = [
  {
    name: 'search_jira_issues',
    description: 'Search Jira issues using JQL or simple keywords. Can search by issue key, status, assignee, text content, etc.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query - can be JQL, issue key (like AIDEV-6), or simple text to search in summary/description',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20, max: 50)',
          default: 20,
        },
        status: {
          type: 'string',
          description: 'Optional: Filter by status (Open, In Progress, Done, etc.)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_jira_projects',
    description: 'Get list of all available Jira projects',
    parameters: {
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
    description: 'Get recent issues from all accessible projects',
    parameters: {
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
        },
      },
    },
  },
];

export async function initMCP() {
  console.log('MCP client initialized with direct Jira integration');
  console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  console.log('Using model:', MODEL_NAME);
  return true;
}

async function makeJiraRequest(endpoint: string, data?: any, method = 'GET') {
  const jiraConfig = {
    baseURL: process.env.JIRA_BASE_URL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN,
  };

  if (!jiraConfig.baseURL || !jiraConfig.email || !jiraConfig.apiToken) {
    throw new Error('Jira configuration missing. Please check your .env file.');
  }

  const auth = Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64');
  
  const config = {
    method,
    url: `${jiraConfig.baseURL}/rest/api/2${endpoint}`,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    ...(data && (method === 'POST' || method === 'PUT') && { data }),
  };

  return await axios(config);
}

export async function executeToolCall(toolCall: any) {
  const toolName = toolCall.name;
  const toolArgs = toolCall.args || {};

  console.log(`Executing tool: ${toolName}`, toolArgs);

  try {
    if (toolName === 'search_jira_issues') {
      const { query, maxResults = 20, status } = toolArgs;
      
      // Si no hay query o es vacía, usar una búsqueda por defecto
      let searchQuery = query;
      if (!searchQuery || searchQuery.trim().length === 0) {
        searchQuery = status ? `status = "${status.trim()}"` : 'created >= -7d';
      }
      
      let finalJql = '';
      const cleanQuery = searchQuery.trim();
      
      // Detectar si es una key de issue específica (formato: PROJ-123)
      if (/^[A-Z]+-\d+$/.test(cleanQuery)) {
        finalJql = `key = "${cleanQuery}"`;
      }
      // Si ya es JQL válido (contiene operadores JQL)
      else if (cleanQuery.includes('=') || cleanQuery.includes('AND') || cleanQuery.includes('OR')) {
        finalJql = cleanQuery;
      }
      // Búsqueda general en texto (solo summary para evitar problemas con description)
      else {
        if (cleanQuery.length > 2) {
          finalJql = `summary ~ "${cleanQuery}"`;
        } else {
          // Si la query es muy corta, buscar issues recientes
          finalJql = 'created >= -7d';
        }
      }

      console.log(`Searching Jira with JQL: ${finalJql}`);

      const response = await makeJiraRequest('/search', {
        jql: finalJql,
        maxResults: Math.min(maxResults, 50),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'issuetype', 'updated', 'project'],
      }, 'POST');

      const issues = response.data.issues.map((issue: any) => ({
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
        url: `${process.env.JIRA_BASE_URL}/browse/${issue.key}`,
      }));

      const resultData = {
        query: finalJql,
        total: response.data.total,
        maxResults: response.data.maxResults,
        startAt: response.data.startAt,
        found: issues.length,
        issues,
      };

      return {
        name: toolName,
        arguments: toolArgs,
        result: resultData,
      };
    }

    if (toolName === 'get_jira_projects') {
      const { recent = false } = toolArgs;
      
      let endpoint = '/project';
      if (recent) {
        endpoint += '/recent';
      }

      const response = await makeJiraRequest(endpoint);
      
      const projects = response.data.map((project: any) => ({
        key: project.key,
        name: project.name,
        id: project.id,
        projectTypeKey: project.projectTypeKey,
        lead: project.lead?.displayName || 'No lead',
        url: `${process.env.JIRA_BASE_URL}/browse/${project.key}`,
      }));

      const resultData = {
        total: projects.length,
        projects,
      };

      return {
        name: toolName,
        arguments: toolArgs,
        result: resultData,
      };
    }

    if (toolName === 'get_recent_issues') {
      const { days = 30, maxResults = 10 } = toolArgs;
      
      const response = await makeJiraRequest('/search', {
        jql: `created >= -${days}d ORDER BY created DESC`,
        maxResults: Math.min(maxResults, 50),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'issuetype', 'updated', 'project'],
      }, 'POST');

      const issues = response.data.issues.map((issue: any) => ({
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
        url: `${process.env.JIRA_BASE_URL}/browse/${issue.key}`,
      }));

      const resultData = {
        query: `created >= -${days}d ORDER BY created DESC`,
        total: response.data.total,
        maxResults: response.data.maxResults,
        startAt: response.data.startAt,
        found: issues.length,
        issues,
      };

      return {
        name: toolName,
        arguments: toolArgs,
        result: resultData,
      };
    }

    throw new Error(`Tool ${toolName} not found`);
  } catch (error: any) {
    console.error(`Error executing tool ${toolName}:`, error.message);
    
    // Manejo especial de errores comunes
    if (error.response?.data?.errorMessages) {
      const errorMsg = error.response.data.errorMessages[0];
      if (errorMsg.includes('does not exist or you do not have permission')) {
        return {
          name: toolName,
          arguments: toolArgs,
          result: {
            error: 'Issue not found or no permission',
            message: `The requested issue/query was not found or you don't have permission to view it. Try: 1) List available projects first, 2) Search with broader terms, 3) Check if the issue key is correct`,
            suggestion: 'Try searching for recent issues or listing projects instead',
          },
        };
      }
    }
    
    throw new Error(`Failed to execute ${toolName}: ${error.response?.data?.errorMessages?.[0] || error.message}`);
  }
}

export async function processQuery(messagesInput: any[]) {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    tools: {
      functionDeclarations: tools,
    },
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.AUTO,
      },
    },
  });

  const systemPrompt = `You are a helpful Jira assistant that can search for issues and projects.

When users ask about Jira, you should:
1. Use search_jira_issues for finding issues by keywords, issue keys, or JQL
2. Use get_jira_projects to list available projects  
3. Use get_recent_issues to show recent activity when searches fail
4. Present results clearly with key details

Search capabilities:
- Issue keys: "AIDEV-6", "PROJ-123" 
- Keywords: "bug", "login", "payment"
- JQL: "status = Open", "created >= -7d"
- Recent issues: when specific searches don't work

Always show: issue key, project, summary, status, assignee, and provide clickable URLs.

If a search fails, suggest using get_recent_issues or get_jira_projects to explore what's available.`;

  const chatHistory = messagesInput.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I\'ll help you search Jira issues using JQL queries and provide clear, formatted results.' }] },
      ...chatHistory.slice(0, -1),
    ],
  });

  const lastMessage = messagesInput[messagesInput.length - 1]?.content;
  const result = await chat.sendMessage(lastMessage);

  const response = result.response;
  const functionCalls = response.functionCalls();

  if (functionCalls && functionCalls.length > 0) {
    const toolResponses = [];

    for (const functionCall of functionCalls) {
      const toolResponse = await executeToolCall(functionCall);
      toolResponses.push(toolResponse);
    }

    const followUpResult = await chat.sendMessage([
      {
        functionResponse: {
          name: functionCalls[0].name,
          response: toolResponses[0].result,
        },
      },
    ]);

    return {
      reply: followUpResult.response.text() || '',
      toolCalls: functionCalls,
      toolResponses,
    };
  }

  return {
    reply: response.text() || '',
    toolCalls: [],
    toolResponses: [],
  };
}