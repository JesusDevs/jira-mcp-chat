import { UniversalAIClient, AIClientFactory, AIMessage } from './ai-providers';

/**
 * Cliente MCP que integra el selector universal de AI
 * Permite cambiar dinámicamente entre GPT, Gemini, Ollama, etc.
 */

// Herramientas MCP implementadas directamente (mismo conjunto que direct-mcp-client)
const tools = [
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
        summary: {
          type: 'string',
          description: 'Brief summary/title of the issue',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the issue (optional)',
        },
        issueType: {
          type: 'string',
          description: 'Type of issue: Story, Task, Bug, Subtask, Epic (default: Task)',
          default: 'Task',
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
];

// Estado global del cliente AI
let currentAIClient: UniversalAIClient | null = null;
let currentProvider = process.env.AI_DEFAULT_PROVIDER || 'ollama-llama3';
let currentModel = process.env.AI_DEFAULT_MODEL || 'llama3:8b';

/**
 * Inicializar cliente MCP con AI selector
 */
export async function initMCP() {
  console.log('🚀 Initializing Universal AI MCP Client...');
  
  try {
    // Intentar detectar providers disponibles
    const availableProviders = await AIClientFactory.detectAvailableProviders();
    console.log('📡 Available AI providers:', availableProviders);
    
    if (availableProviders.length === 0) {
      console.warn('⚠️ No AI providers available');
      return false;
    }
    
    // Si el provider actual no está disponible, usar el primero disponible
    if (!availableProviders.includes(currentProvider)) {
      currentProvider = availableProviders[0];
      const providerInfo = AIClientFactory.getProviderModels(currentProvider);
      currentModel = providerInfo[0] || currentModel;
      console.log(`🔄 Switching to available provider: ${currentProvider} (${currentModel})`);
    }
    
    await initializeAIClient(currentProvider, currentModel);
    
    console.log(`✅ Universal AI MCP Client ready with ${tools.length} tools`);
    console.log(`🤖 Using: ${currentProvider} - ${currentModel}`);
    return true;
    
  } catch (error) {
    console.error('❌ MCP initialization error:', error);
    return false;
  }
}

/**
 * Cambiar provider de AI dinámicamente
 */
export async function switchAIProvider(provider: string, model: string) {
  console.log(`🔄 Switching AI provider to: ${provider} - ${model}`);
  
  try {
    await initializeAIClient(provider, model);
    currentProvider = provider;
    currentModel = model;
    
    console.log(`✅ AI provider switched successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to switch AI provider:`, error);
    return false;
  }
}

/**
 * Inicializar cliente AI específico
 */
async function initializeAIClient(provider: string, model: string) {
  const apiKey = getAPIKeyForProvider(provider);
  currentAIClient = AIClientFactory.create(provider, model, apiKey);
  
  // Verificar disponibilidad
  const isAvailable = await currentAIClient.checkAvailability();
  if (!isAvailable) {
    throw new Error(`AI provider ${provider} is not available`);
  }
}

/**
 * Obtener API key para un provider específico
 */
function getAPIKeyForProvider(provider: string): string | undefined {
  if (provider.includes('openai') || provider === 'gpt-4' || provider === 'gpt-3.5') {
    return process.env.OPENAI_API_KEY;
  }
  if (provider.includes('gemini')) {
    return process.env.GEMINI_API_KEY;
  }
  // Ollama no requiere API key
  return undefined;
}

/**
 * Procesar query con AI seleccionado
 */
export async function processQuery(messagesInput: any[]) {
  if (!currentAIClient) {
    throw new Error('AI client not initialized. Call initMCP() first.');
  }

  const messages: AIMessage[] = messagesInput.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  console.log(`🤖 Processing with ${currentProvider} - ${currentModel}`);
  
  try {
    // Intentar con el AI provider actual
    const response = await currentAIClient.generateResponse(messages, tools, {
      temperature: 0.7,
      maxTokens: 4096
    });

    let toolResponses: any[] = [];

    // Ejecutar function calls si existen
    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log(`🔧 Executing ${response.functionCalls.length} tool calls`);
      
      for (const call of response.functionCalls) {
        try {
          const toolResponse = await executeToolCall(call.name, call.args);
          toolResponses.push({
            tool: call.name,
            result: toolResponse
          });
        } catch (toolError) {
          console.error(`❌ Tool execution error:`, toolError);
          toolResponses.push({
            tool: call.name,
            error: toolError.message
          });
        }
      }
    }

    return {
      reply: response.content,
      toolCalls: response.functionCalls || [],
      toolResponses,
      usage: response.usage,
      provider: currentProvider,
      model: currentModel
    };

  } catch (error) {
    console.error(`❌ AI processing error with ${currentProvider}:`, error);
    
    // Intentar fallback automático
    if (error.message.includes('quota') || error.message.includes('429')) {
      return await attemptFallback(messages);
    }
    
    throw error;
  }
}

/**
 * Intentar fallback automático a otro provider
 */
async function attemptFallback(messages: AIMessage[]) {
  console.log('🔄 Attempting automatic fallback...');
  
  const availableProviders = await AIClientFactory.detectAvailableProviders();
  const fallbackProviders = availableProviders.filter(p => p !== currentProvider);
  
  if (fallbackProviders.length === 0) {
    throw new Error('No fallback providers available');
  }
  
  // Intentar con Ollama primero (local y gratuito)
  const ollamaProvider = fallbackProviders.find(p => p.includes('ollama'));
  const fallbackProvider = ollamaProvider || fallbackProviders[0];
  
  console.log(`🔄 Falling back to: ${fallbackProvider}`);
  
  const providerModels = AIClientFactory.getProviderModels(fallbackProvider);
  const fallbackModel = providerModels[0];
  
  await switchAIProvider(fallbackProvider, fallbackModel);
  
  // Procesar con el fallback
  const response = await currentAIClient!.generateResponse(messages, tools);
  
  return {
    reply: response.content,
    toolCalls: response.functionCalls || [],
    toolResponses: [],
    usage: response.usage,
    provider: currentProvider,
    model: currentModel,
    fallbackUsed: true
  };
}

/**
 * Ejecutar tool call específico
 */
async function executeToolCall(toolName: string, args: any) {
  console.log(`🔧 Executing tool: ${toolName}`, args);

  switch (toolName) {
    case 'search_jira_issues':
      return await searchJiraIssues(args);
    case 'get_jira_projects':
      return await getJiraProjects(args);
    case 'get_recent_issues':
      return await getRecentIssues(args);
    case 'create_jira_issue':
      return await createJiraIssue(args);
    case 'search_epics':
      return await searchEpics(args);
    case 'search_by_type':
      return await searchByType(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Obtener información del AI provider actual
 */
export function getCurrentAIInfo() {
  if (!currentAIClient) {
    return null;
  }
  
  return {
    provider: currentProvider,
    model: currentModel,
    providerInfo: currentAIClient.getProviderInfo()
  };
}

/**
 * Obtener providers disponibles
 */
export async function getAvailableProviders() {
  return await AIClientFactory.detectAvailableProviders();
}

// Implementaciones de herramientas (igual que direct-mcp-client)
async function makeJiraRequest(endpoint: string, data?: any, method = 'GET') {
  const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
  
  const config: any = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${process.env.JIRA_BASE_URL}/rest/api/3${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Implementar todas las funciones de herramientas aquí...
async function searchJiraIssues(args: any) {
  // Implementación similar a direct-mcp-client
  const { query, maxResults = 20, status } = args;
  
  let jql = query;
  if (status) {
    jql += ` AND status = "${status}"`;
  }
  
  const response = await makeJiraRequest('/search', {
    jql,
    maxResults: Math.min(maxResults, 100),
    fields: ['summary', 'status', 'assignee', 'created', 'updated', 'priority', 'issuetype', 'project'],
  }, 'POST');
  
  return {
    total: response.total,
    issues: response.issues.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name,
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      project: issue.fields.project?.key,
    }))
  };
}

async function getJiraProjects(args: any) {
  const response = await makeJiraRequest('/project');
  return {
    total: response.length,
    projects: response.map((project: any) => ({
      key: project.key,
      name: project.name,
      description: project.description || 'No description',
    }))
  };
}

async function getRecentIssues(args: any) {
  const { days = 30, maxResults = 10 } = args;
  const jql = `created >= -${days}d ORDER BY created DESC`;
  
  const response = await makeJiraRequest('/search', {
    jql,
    maxResults: Math.min(maxResults, 50),
    fields: ['summary', 'status', 'created', 'project'],
  }, 'POST');
  
  return {
    total: response.total,
    issues: response.issues.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name,
      created: issue.fields.created,
      project: issue.fields.project?.key,
    }))
  };
}

async function createJiraIssue(args: any) {
  const { project, summary, description = '', issueType = 'Task' } = args;
  
  const issueData = {
    fields: {
      project: { key: project },
      summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: description }]
          }
        ]
      },
      issuetype: { name: issueType },
    }
  };
  
  const response = await makeJiraRequest('/issue', issueData, 'POST');
  
  return {
    key: response.key,
    id: response.id,
    summary,
    project,
    created: true
  };
}

async function searchEpics(args: any) {
  const { query = '', project, status, maxResults = 20 } = args;
  
  let jql = 'type = Epic';
  
  if (project) jql += ` AND project = "${project}"`;
  if (status) jql += ` AND status = "${status}"`;
  if (query) jql += ` AND (summary ~ "${query}" OR description ~ "${query}")`;
  
  jql += ' ORDER BY created DESC';
  
  const response = await makeJiraRequest('/search', {
    jql,
    maxResults: Math.min(maxResults, 50),
    fields: ['summary', 'status', 'project'],
  }, 'POST');
  
  return {
    total: response.total,
    epics: response.issues.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name,
      project: issue.fields.project?.key,
    }))
  };
}

async function searchByType(args: any) {
  const { issueType, project, status, maxResults = 20 } = args;
  
  let jql = `type = "${issueType}"`;
  
  if (project) jql += ` AND project = "${project}"`;
  if (status) jql += ` AND status = "${status}"`;
  
  jql += ' ORDER BY created DESC';
  
  const response = await makeJiraRequest('/search', {
    jql,
    maxResults: Math.min(maxResults, 100),
    fields: ['summary', 'status', 'project', 'issuetype'],
  }, 'POST');
  
  return {
    total: response.total,
    issueType,
    issues: response.issues.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name,
      project: issue.fields.project?.key,
      type: issue.fields.issuetype?.name,
    }))
  };
}
