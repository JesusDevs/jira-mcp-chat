import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
let MODEL_NAME = 'gemini-2.0-flash-exp';
let CURRENT_AI_PROVIDER = 'gemini';

// Estado del AI provider actual
let currentAIConfig = {
  provider: 'gemini',
  model: 'gemini-2.0-flash-exp',
  apiKey: process.env.GEMINI_API_KEY
};

// Función helper para logs de debug
function debugLog(context: string, data: any) {
  const timestamp = new Date().toISOString();
  console.log(`🐛 [DEBUG ${timestamp}] ${context}:`, JSON.stringify(data, null, 2));
}

/**
 * Cambiar el AI provider dinámicamente
 */
export function switchAIProvider(provider: string, model: string) {
  console.log(`🔄 Switching AI to: ${provider} - ${model}`);
  
  currentAIConfig.provider = provider;
  currentAIConfig.model = model;
  CURRENT_AI_PROVIDER = provider;
  MODEL_NAME = model;
  
  // Guardar en localStorage para persistencia
  if (typeof window !== 'undefined') {
    localStorage.setItem('aiConfig', JSON.stringify({ provider, model }));
  }
  
  console.log(`✅ AI switched to: ${provider} - ${model}`);
}

/**
 * Cargar configuración guardada
 */
export function loadSavedAIConfig() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('aiConfig');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        switchAIProvider(config.provider, config.model);
        return config;
      } catch (e) {
        console.warn('Error loading saved AI config:', e);
      }
    }
  }
  return currentAIConfig;
}

/**
 * Procesar query usando Ollama
 */
async function processOllamaQuery(messagesInput: any[]) {
  const queryId = Math.random().toString(36).substr(2, 9);
  const lastMessage = messagesInput[messagesInput.length - 1]?.content;
  
  console.log(`🦙 [Ollama ${queryId}] Processing with model: ${currentAIConfig.model}`);
  debugLog(`Ollama ${queryId} - Request preparation`, {
    model: currentAIConfig.model,
    messageLength: lastMessage?.length,
    endpoint: 'http://127.0.0.1:11434/api/chat'
  });
  
  // Preparar el prompt con información de tools
  const toolsInfo = tools.map(tool => 
    `- ${tool.name}: ${tool.description}`
  ).join('\n');
  
  const systemPrompt = `Eres un asistente de Jira con las siguientes herramientas disponibles:

${toolsInfo}

Cuando necesites usar una herramienta, responde EXACTAMENTE en este formato:
TOOL_CALL:nombre_herramienta:{"arg1":"valor1","arg2":"valor2"}

Ejemplos:
- Para listar proyectos: TOOL_CALL:get_jira_projects:{}
- Para buscar issues: TOOL_CALL:search_jira_issues:{"query":"project = AIDEV"}

Responde siempre en español y sé útil con las consultas de Jira.`;

  const payload = {
    model: currentAIConfig.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: lastMessage }
    ],
    stream: false,
    options: {
      temperature: 0.7,
      num_predict: 4096
    }
  };

  try {
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    let content = data.message?.content || '';
    let toolCalls = [];
    let toolResponses = [];

    // Detectar y ejecutar tool calls
    const toolCallMatch = content.match(/TOOL_CALL:(\w+):(\{.*?\})/);
    if (toolCallMatch) {
      try {
        const toolName = toolCallMatch[1];
        const toolArgs = JSON.parse(toolCallMatch[2]);
        
        console.log(`🔧 Executing tool: ${toolName} with args:`, toolArgs);
        
        // Ejecutar la herramienta
        const toolResult = await executeToolCall({ name: toolName, args: toolArgs });
        
        toolCalls.push({ name: toolName, args: toolArgs });
        toolResponses.push(toolResult);
        
        // Remover el tool call del contenido y agregar resultado
        content = content.replace(toolCallMatch[0], '').trim();
        content += `\n\n✅ Ejecuté la herramienta ${toolName} y obtuve ${toolResult.data ? `${toolResult.data.length} resultados` : 'resultados'}.`;
        
      } catch (e) {
        console.error('❌ [Tool Execution Error] Failed to parse/execute tool call from Ollama response:');
        console.error('- Tool name:', toolName);
        console.error('- Tool args raw:', toolCallMatch[2]);
        console.error('- Parse error:', e.message);
        console.error('- Error stack:', e.stack);
        console.error('- Ollama response content:', content);
        content += '\n\n❌ Error ejecutando la herramienta solicitada. Ver logs para detalles.';
      }
    }

    return {
      reply: content,
      toolCalls,
      toolResponses,
      provider: 'ollama',
      model: currentAIConfig.model
    };

  } catch (error) {
    console.error('❌ [Ollama API Error] Detailed error information:');
    console.error('- Error type:', error.constructor.name);
    console.error('- Error message:', error.message);
    console.error('- Error stack:', error.stack);
    console.error('- Request payload:', JSON.stringify(payload, null, 2));
    console.error('- Ollama endpoint:', 'http://127.0.0.1:11434/api/chat');
    console.error('- Current AI config:', currentAIConfig);
    
    // Información adicional para debugging
    if (error.response) {
      console.error('- HTTP status:', error.response.status);
      console.error('- HTTP statusText:', error.response.statusText);
      console.error('- Response headers:', error.response.headers);
    }
    
    // Verificar si Ollama está corriendo
    try {
      const healthCheck = await fetch('http://127.0.0.1:11434/api/tags');
      console.log('🔍 Ollama health check:', healthCheck.ok ? 'Running' : 'Not responding');
    } catch (healthError) {
      console.error('🚨 Ollama health check failed:', healthError.message);
    }
    
    throw error;
  }
}

/**
 * Cliente MCP directo que implementa las herramientas de Jira
 * sin proceso separado - más simple y confiable para Next.js
 */

// Herramientas MCP implementadas directamente
const tools = [
  {
    name: 'search_jira_issues',
    description: 'Search Jira issues using JQL, keywords, or issue keys. Smart query detection for flexible search.',
    parameters: {
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
    description: 'Get recent issues from all accessible projects, ordered by creation date',
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
  {
    name: 'create_jira_issue',
    description: 'Create a new Jira issue or subtask. Can create Stories, Tasks, Bugs, Subtasks, etc.',
    parameters: {
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
    parameters: {
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
        },
      },
    },
  },
  {
    name: 'search_by_type',
    description: 'Search issues by specific issue type (Bug, Story, Task, Subtask, etc.) with advanced filtering.',
    parameters: {
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
        },
      },
      required: ['issueType'],
    },
  },
];

// Configuración de Jira
const jiraConfig = {
  baseURL: process.env.JIRA_BASE_URL,
  email: process.env.JIRA_EMAIL,
  apiToken: process.env.JIRA_API_TOKEN,
};

async function makeJiraRequest(endpoint: string, data?: any, method = 'GET') {
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

function buildJQLFromQuery(query: string, project?: string, status?: string): string {
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

export async function initMCP() {
  console.log('🚀 Initializing Direct MCP Client...');
  console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  console.log('Using model:', MODEL_NAME);
  
  // Verificar configuración de Jira
  if (!jiraConfig.baseURL || !jiraConfig.email || !jiraConfig.apiToken) {
    console.error('❌ Jira configuration missing:');
    console.error('  JIRA_BASE_URL:', jiraConfig.baseURL ? 'Set' : 'Missing');
    console.error('  JIRA_EMAIL:', jiraConfig.email ? 'Set' : 'Missing');
    console.error('  JIRA_API_TOKEN:', jiraConfig.apiToken ? 'Set' : 'Missing');
    return false;
  }
  
  console.log(`✅ Direct MCP Client ready with ${tools.length} tools:`, tools.map(t => t.name).join(', '));
  return true;
}

export async function executeToolCall(toolCall: any) {
  const toolName = toolCall.name;
  const toolArgs = toolCall.args || {};

  console.log(`🔧 Executing direct tool: ${toolName}`, toolArgs);

  try {
    if (toolName === 'search_jira_issues') {
      const { query, maxResults = 20, project, status } = toolArgs;
      
      const finalJql = buildJQLFromQuery(query, project, status);
      console.log(`Searching Jira with JQL: ${finalJql}`);

      const response = await makeJiraRequest('/search', {
        jql: finalJql,
        maxResults: Math.min(maxResults, 100),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'issuetype', 'updated', 'project'],
        expand: ['renderedFields'],
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
        url: `${jiraConfig.baseURL}/browse/${issue.key}`,
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
        url: `${jiraConfig.baseURL}/browse/${project.key}`,
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
      
      const jql = `created >= -${days}d ORDER BY created DESC`;
      console.log(`Getting recent issues: ${jql}`);

      const response = await makeJiraRequest('/search', {
        jql,
        maxResults: Math.min(maxResults, 50),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'issuetype', 'updated', 'project'],
        expand: ['renderedFields'],
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
        url: `${jiraConfig.baseURL}/browse/${issue.key}`,
      }));

      const resultData = {
        query: jql,
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

    if (toolName === 'create_jira_issue') {
      const { 
        project, 
        issueType = 'Task', 
        summary, 
        description = '', 
        priority = 'Medium',
        assignee,
        parentKey 
      } = toolArgs;

      console.log(`Creating Jira issue: ${issueType} in ${project}`);

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
        if (assignee.includes('@')) {
          try {
            const userResponse = await makeJiraRequest(`/user/search?query=${encodeURIComponent(assignee)}`);
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
        if (issueType === 'Task') {
          issueData.fields.issuetype = { name: 'Subtask' };
        }
      }

      const response = await makeJiraRequest('/issue', issueData, 'POST');
      
      const createdIssue = {
        key: response.data.key,
        id: response.data.id,
        url: `${jiraConfig.baseURL}/browse/${response.data.key}`,
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
        name: toolName,
        arguments: toolArgs,
        result: {
          success: true,
          message: `Issue created successfully: ${response.data.key}`,
          issue: createdIssue,
        }
      };
    }

    if (toolName === 'search_epics') {
      const { query, project, status, maxResults = 20 } = toolArgs;
      
      let jqlParts = ['issuetype = Epic'];
      
      if (project) {
        jqlParts.push(`project = "${project}"`);
      }
      
      if (status) {
        jqlParts.push(`status = "${status}"`);
      }
      
      if (query) {
        if (query.includes('=') || query.includes('AND') || query.includes('OR')) {
          jqlParts.push(`(${query})`);
        } else {
          jqlParts.push(`(summary ~ "${query}" OR description ~ "${query}")`);
        }
      }
      
      const finalJql = jqlParts.join(' AND ') + ' ORDER BY created DESC';
      console.log(`Searching epics with JQL: ${finalJql}`);

      const response = await makeJiraRequest('/search', {
        jql: finalJql,
        maxResults: Math.min(maxResults, 50),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'updated', 'project'],
        expand: ['renderedFields'],
      }, 'POST');

      const epics = response.data.issues.map((issue: any) => ({
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
        url: `${jiraConfig.baseURL}/browse/${issue.key}`,
      }));

      return {
        name: toolName,
        arguments: toolArgs,
        result: {
          query: finalJql,
          total: response.data.total,
          maxResults: response.data.maxResults,
          startAt: response.data.startAt,
          found: epics.length,
          epics,
        }
      };
    }

    if (toolName === 'search_by_type') {
      const { issueType, project, status, assignee, query, maxResults = 20 } = toolArgs;
      
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
      console.log(`Searching by type with JQL: ${finalJql}`);

      const response = await makeJiraRequest('/search', {
        jql: finalJql,
        maxResults: Math.min(maxResults, 100),
        fields: ['summary', 'status', 'assignee', 'created', 'description', 'priority', 'issuetype', 'updated', 'project'],
        expand: ['renderedFields'],
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
        url: `${jiraConfig.baseURL}/browse/${issue.key}`,
      }));

      return {
        name: toolName,
        arguments: toolArgs,
        result: {
          query: finalJql,
          issueType: issueType,
          total: response.data.total,
          maxResults: response.data.maxResults,
          startAt: response.data.startAt,
          found: issues.length,
          issues,
        }
      };
    }

    throw new Error(`Tool ${toolName} not found`);
  } catch (error: any) {
    console.error(`❌ [Tool Execution Error] Detailed error for tool ${toolName}:`);
    console.error('- Tool name:', toolName);
    console.error('- Tool arguments:', JSON.stringify(toolArgs, null, 2));
    console.error('- Error type:', error.constructor.name);
    console.error('- Error message:', error.message);
    console.error('- Error stack:', error.stack);
    
    // Log del request HTTP si está disponible
    if (error.config) {
      console.error('- HTTP Request details:');
      console.error('  - Method:', error.config.method?.toUpperCase());
      console.error('  - URL:', error.config.url);
      console.error('  - Headers:', JSON.stringify(error.config.headers, null, 2));
      if (error.config.data) {
        console.error('  - Request body:', JSON.stringify(error.config.data, null, 2));
      }
    }
    
    // Log de la response HTTP si está disponible
    if (error.response) {
      console.error('- HTTP Response details:');
      console.error('  - Status:', error.response.status);
      console.error('  - Status text:', error.response.statusText);
      console.error('  - Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('  - Response body:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Log del estado de configuración
    console.error('- Configuration state:');
    console.error('  - JIRA_BASE_URL:', process.env.JIRA_BASE_URL ? 'Set' : 'Missing');
    console.error('  - JIRA_EMAIL:', process.env.JIRA_EMAIL ? 'Set' : 'Missing');
    console.error('  - JIRA_API_TOKEN:', process.env.JIRA_API_TOKEN ? 'Set' : 'Missing');
    
    // Manejo especial de errores comunes
    if (error.response?.data?.errorMessages) {
      const errorMsg = error.response.data.errorMessages[0];
      console.error('- Jira error message:', errorMsg);
      
      if (errorMsg.includes('does not exist or you do not have permission')) {
        return {
          name: toolName,
          arguments: toolArgs,
          result: {
            error: 'Issue not found or no permission',
            message: `The requested issue/query was not found or you don't have permission to view it. Try: 1) List available projects first, 2) Search with broader terms, 3) Check if the issue key is correct`,
            suggestion: 'Try searching for recent issues or listing projects instead',
            debugInfo: {
              originalError: errorMsg,
              toolArgs: toolArgs,
              timestamp: new Date().toISOString()
            }
          },
        };
      }
    }
    
    // Error genérico con información de debug
    const enhancedError = new Error(`Failed to execute ${toolName}: ${error.response?.data?.errorMessages?.[0] || error.message}`);
    enhancedError.cause = {
      originalError: error,
      toolName,
      toolArgs,
      timestamp: new Date().toISOString(),
      request: error.config || null,
      response: error.response?.data || null
    };
    
    throw enhancedError;
  }
}

export async function processQuery(messagesInput: any[]) {
  const queryId = Math.random().toString(36).substr(2, 9);
  console.log(`🚀 [Query ${queryId}] Starting query processing`);
  console.log(`🤖 Using AI Provider: ${currentAIConfig.provider} - ${currentAIConfig.model}`);
  
  debugLog(`Query ${queryId} - Input`, {
    provider: currentAIConfig.provider,
    model: currentAIConfig.model,
    messagesCount: messagesInput.length,
    lastMessage: messagesInput[messagesInput.length - 1]?.content?.substring(0, 100) + '...'
  });

  // Si es Ollama, usar implementación diferente
  if (currentAIConfig.provider === 'ollama') {
    console.log(`🦙 [Query ${queryId}] Routing to Ollama processing`);
    return await processOllamaQuery(messagesInput);
  }

  // Para Gemini (comportamiento original)
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    tools: {
      functionDeclarations: tools,
    },
    toolConfig: {
      functionCallingConfig: {
        mode: "auto",
      },
    },
  });

  const systemPrompt = `You are a powerful Jira assistant with comprehensive capabilities for managing and searching Jira issues.

## 🔧 Available Tools:

### **Search & Discovery:**
1. **search_jira_issues** - General issue search using JQL, keywords, or issue keys
2. **search_epics** - Specialized epic search with filtering by project/status
3. **search_by_type** - Search by specific issue type (Bug, Story, Task, Subtask, etc.)
4. **get_jira_projects** - List all available projects
5. **get_recent_issues** - Show recent activity across projects

### **Creation & Management:**
6. **create_jira_issue** - Create new issues, stories, bugs, tasks, subtasks, or epics

## 🎯 Capabilities:

### **Search Examples:**
- Issue keys: "AIDEV-6", "PROJ-123"
- Keywords: "bug login", "payment integration"
- JQL: "status = Open", "created >= -7d"
- By type: "busca todos los bugs" → use search_by_type with issueType="Bug"
- Epics: "épicas del proyecto AIDEV" → use search_epics with project="AIDEV"

### **Creation Examples:**
- "Crea un bug en AIDEV sobre el login"
- "Crea una subtarea para AIDEV-123"
- "Crea una historia de usuario en SOP"

### **Smart Routing:**
- For general searches → search_jira_issues
- For epic-specific searches → search_epics  
- For type-specific searches (bugs, stories, tasks) → search_by_type
- For creation requests → create_jira_issue

## 📋 Response Guidelines:
1. Always show: issue key, project, summary, status, assignee, and clickable URLs
2. For creation: confirm success and provide the new issue key and URL
3. Use appropriate tool based on user intent (type-specific vs general search)
4. If searches fail, suggest alternatives or recent issues
5. Present results in a clear, organized format

## 🔍 Context Awareness:
- Detect when users want specific issue types (bug, story, task, epic)
- Recognize creation requests vs search requests
- Understand Spanish commands and technical terms
- Provide helpful suggestions when searches return no results`;

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
