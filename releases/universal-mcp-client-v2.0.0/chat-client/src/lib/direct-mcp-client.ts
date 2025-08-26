import { GoogleGenerativeAI, FunctionCallingMode, SchemaType } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import axios from 'axios';
import path from 'path';
import { z } from 'zod';
import fs from 'fs';

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
  const activeTools = getActiveTools();
  const toolsInfo = activeTools.map(tool => 
    `- ${tool.name}: ${tool.description}`
  ).join('\n');
  
  const systemPrompt = `Eres un asistente de tools con las siguientes herramientas disponibles:

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
    const toolCallMatch = content.match(/TOOL_CALL:(\w+):(\{[^}]*\})(?:\n|$)/);
    if (toolCallMatch) {
      const toolName = toolCallMatch[1]; // Mover fuera del try para que esté disponible en catch
      try {
        // Convertir comillas simples a dobles para JSON válido
        let toolArgsStr = toolCallMatch[2].replace(/'/g, '"');
        const toolArgs = JSON.parse(toolArgsStr);
        
        console.log(`🔧 Executing tool: ${toolName} with args:`, toolArgs);
        
        // Ejecutar la herramienta
        const toolResult = await executeToolCall({ name: toolName, args: toolArgs });
        
        toolCalls.push({ name: toolName, args: toolArgs });
        toolResponses.push(toolResult);
        
        // Remover el tool call del contenido y agregar resultado
        content = content.replace(toolCallMatch[0], '').trim();
        content += `\n\n✅ Ejecuté la herramienta ${toolName} y obtuve ${(toolResult as any).data ? `${(toolResult as any).data.length} resultados` : 'resultados'}.`;
        
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

// Variables para descubrimiento dinámico de herramientas (como Cursor)
interface MCPServerConnection {
  id: string;
  name: string;
  client: Client;
  transport: StdioClientTransport;
  tools: any[];
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastError?: string;
}

let mcpServers: Map<string, MCPServerConnection> = new Map();
let discoveredTools: any[] = [];
let isConnectedToMCP = false;

// Función para cargar configuración de servidores MCP
function loadMCPServersConfig(): any[] {
  try {
    // Primero intentar cargar desde mcp-config.json
    const configPath = path.resolve(process.cwd(), 'mcp-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const servers = Object.entries(config.mcpServers || {}).map(([id, server]: [string, any]) => ({
        id,
        ...server
      }));
      console.log(`📋 Cargados ${servers.length} servidores desde mcp-config.json`);
      return servers;
    }
  } catch (error) {
    console.warn('⚠️ Error cargando mcp-config.json:', error.message);
  }

  // Fallback: servidor Jira por defecto
  return [{
    id: 'jira',
    name: 'Jira Management',
    type: 'local',
    command: 'node',
    args: ['../mcp-server/index.js'],
    enabled: true
  }];
}

// Función para conectar a un servidor MCP específico
async function connectToMCPServer(serverId: string, serverConfig: any): Promise<MCPServerConnection | null> {
  const serverName = serverConfig.name || serverId;
  
  try {
    console.log(`🔄 Conectando al servidor MCP: ${serverName} (${serverId})`);
    
    const client = new Client({
      name: `jira-chat-client-${serverId}`,
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    let transport;
    
    if (serverConfig.type === 'local') {
      const serverPath = serverConfig.args?.[0]?.startsWith('/') 
        ? serverConfig.args[0]
        : path.resolve(process.cwd(), serverConfig.args?.[0] || '../mcp-server/index.js');
      
      transport = new StdioClientTransport({
        command: serverConfig.command || 'node',
        args: [serverPath],
        env: {
          ...process.env,
          JIRA_BASE_URL: process.env.JIRA_BASE_URL,
          JIRA_EMAIL: process.env.JIRA_EMAIL,
          JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
          ...serverConfig.env
        }
      });
    } else {
      throw new Error(`Tipo de servidor ${serverConfig.type} no soportado aún`);
    }

    await client.connect(transport);
    
    // Descubrir herramientas disponibles
    const toolsResponse = await client.request({
      method: 'tools/list',
      params: {}
    }, z.any()) as any;

    const tools = toolsResponse.tools || [];
    
    const connection: MCPServerConnection = {
      id: serverId,
      name: serverName,
      client,
      transport,
      tools,
      status: 'connected'
    };

    console.log(`✅ Conectado a ${serverName} - ${tools.length} herramientas:`, 
      tools.map((t: any) => t.name));
    
    return connection;
  } catch (error) {
    console.error(`❌ Error conectando a ${serverName}:`, error.message);
    return {
      id: serverId,
      name: serverName,
      client: null as any,
      transport: null as any,
      tools: [],
      status: 'error',
      lastError: error.message
    };
  }
}

// Función para conectar a todos los servidores MCP configurados
async function connectToAllMCPServers(): Promise<boolean> {
  const serversConfig = loadMCPServersConfig();
  const enabledServers = serversConfig.filter(server => server.enabled !== false);
  
  console.log(`🔄 Conectando a ${enabledServers.length} servidores MCP configurados...`);
  
  const connectionPromises = enabledServers.map(async (serverConfig) => {
    const connection = await connectToMCPServer(serverConfig.id, serverConfig);
    if (connection) {
      mcpServers.set(serverConfig.id, connection);
    }
    return connection;
  });

  const connections = await Promise.allSettled(connectionPromises);
  const successfulConnections = connections
    .filter(result => result.status === 'fulfilled' && result.value?.status === 'connected')
    .map(result => (result as PromiseFulfilledResult<MCPServerConnection>).value);

  // Consolidar todas las herramientas de todos los servidores
  discoveredTools = [];
  for (const connection of successfulConnections) {
    discoveredTools.push(...connection.tools.map(tool => ({
      ...tool,
      serverId: connection.id,
      serverName: connection.name
    })));
  }

  isConnectedToMCP = successfulConnections.length > 0;

  if (isConnectedToMCP) {
    console.log(`✅ Conectado a ${successfulConnections.length}/${enabledServers.length} servidores MCP`);
    console.log(`🔧 Total de herramientas descubiertas: ${discoveredTools.length}`);
    
    // Mostrar resumen por servidor
    for (const connection of successfulConnections) {
      console.log(`  📡 ${connection.name}: ${connection.tools.length} tools`);
    }
    
    return true;
  } else {
    console.error('❌ No se pudo conectar a ningún servidor MCP');
    console.log('📋 Usando herramientas estáticas como fallback');
    return false;
  }
}

// Función para obtener las herramientas activas (descubiertas o estáticas)
function getActiveTools(): any[] {
  if (isConnectedToMCP && discoveredTools.length > 0) {
    // Convertir herramientas MCP al formato de Gemini
    return discoveredTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema || {
        type: SchemaType.OBJECT,
        properties: {},
        required: []
      }
    }));
  }
  
  return staticTools;
}

// Funciones de utilidad para gestión de servidores MCP
export function getMCPServerStatus(): Record<string, any> {
  const status: Record<string, any> = {};
  
  for (const [serverId, connection] of mcpServers.entries()) {
    status[serverId] = {
      id: connection.id,
      name: connection.name,
      status: connection.status,
      toolsCount: connection.tools.length,
      tools: connection.tools.map(t => t.name),
      lastError: connection.lastError
    };
  }
  
  return status;
}

export function getConnectedServersInfo(): string[] {
  const connectedServers: string[] = [];
  
  for (const [serverId, connection] of mcpServers.entries()) {
    if (connection.status === 'connected') {
      connectedServers.push(`${connection.name} (${connection.tools.length} tools)`);
    }
  }
  
  return connectedServers;
}

export function getAllDiscoveredTools(): any[] {
  return discoveredTools;
}

// Función para ejecutar herramientas en el servidor MCP real
async function executeToolOnMCPServer(toolName: string, args: any): Promise<any> {
  if (!isConnectedToMCP || mcpServers.size === 0) {
    throw new Error('No hay conexión a servidores MCP');
  }

  // Encontrar en qué servidor está la herramienta
  const toolInfo = discoveredTools.find(tool => tool.name === toolName);
  if (!toolInfo) {
    throw new Error(`Herramienta ${toolName} no encontrada en ningún servidor`);
  }

  const serverConnection = mcpServers.get(toolInfo.serverId);
  if (!serverConnection || serverConnection.status !== 'connected') {
    throw new Error(`Servidor ${toolInfo.serverId} no está conectado`);
  }

  try {
    console.log(`🎯 Ejecutando ${toolName} en servidor: ${serverConnection.name}`);
    
    const response = await serverConnection.client.request({
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    }, z.any()) as any;

    const result = response.content?.[0]?.text ? JSON.parse(response.content[0].text) : response;
    return {
      name: toolName,
      arguments: args,
      result: result,
      executedOn: {
        serverId: serverConnection.id,
        serverName: serverConnection.name
      }
    };
  } catch (error) {
    console.error(`❌ Error ejecutando ${toolName} en ${serverConnection.name}:`, error);
    throw error;
  }
}

// Herramientas estáticas (fallback si no hay conexión MCP)
const staticTools = [
  {
    name: 'search_jira_issues',
    description: 'Search Jira issues using JQL, keywords, or issue keys. Smart query detection for flexible search.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Search query - can be JQL (project = TEST), issue key (PROJ-123), or keywords for text search',
        },
        maxResults: {
          type: SchemaType.NUMBER,
          description: 'Maximum number of results to return (default: 20, max: 100)',
          default: 20,
        },
        status: {
          type: SchemaType.STRING,
          description: 'Optional: Filter by status (Open, In Progress, Done, etc.)',
        },
        project: {
          type: SchemaType.STRING,
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
      type: SchemaType.OBJECT,
      properties: {
        recent: {
          type: SchemaType.BOOLEAN,
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
      type: SchemaType.OBJECT,
      properties: {
        days: {
          type: SchemaType.NUMBER,
          description: 'Number of days back to search (default: 30)',
          default: 30,
        },
        maxResults: {
          type: SchemaType.NUMBER,
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
      type: SchemaType.OBJECT,
      properties: {
        project: {
          type: SchemaType.STRING,
          description: 'Project key where to create the issue (e.g., "AIDEV", "SOP")',
        },
        issueType: {
          type: SchemaType.STRING,
          description: 'Type of issue: Story, Task, Bug, Subtask, Epic (default: Task)',
          default: 'Task',
        },
        summary: {
          type: SchemaType.STRING,
          description: 'Brief summary/title of the issue',
        },
        description: {
          type: SchemaType.STRING,
          description: 'Detailed description of the issue (optional)',
        },
        priority: {
          type: SchemaType.STRING,
          description: 'Priority: Highest, High, Medium, Low, Lowest (default: Medium)',
          default: 'Medium',
        },
        assignee: {
          type: SchemaType.STRING,
          description: 'Email or username of assignee (optional, leave empty for unassigned)',
        },
        parentKey: {
          type: SchemaType.STRING,
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
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Search term for epic name or JQL query',
        },
        project: {
          type: SchemaType.STRING,
          description: 'Filter by specific project key (e.g., "AIDEV")',
        },
        status: {
          type: SchemaType.STRING,
          description: 'Filter by epic status (e.g., "To Do", "In Progress", "Done")',
        },
        maxResults: {
          type: SchemaType.NUMBER,
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
      type: SchemaType.OBJECT,
      properties: {
        issueType: {
          type: SchemaType.STRING,
          description: 'Issue type to search: Bug, Story, Task, Subtask, Epic, etc.',
        },
        project: {
          type: SchemaType.STRING,
          description: 'Filter by project key (optional)',
        },
        status: {
          type: SchemaType.STRING,
          description: 'Filter by status (optional)',
        },
        assignee: {
          type: SchemaType.STRING,
          description: 'Filter by assignee (optional). Use "currentUser()" for your issues',
        },
        query: {
          type: SchemaType.STRING,
          description: 'Additional search text in summary/description (optional)',
        },
        maxResults: {
          type: SchemaType.NUMBER,
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
  console.log('🚀 Initializing MCP Client with Dynamic Tool Discovery...');
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
  
  // Intentar conectar a todos los servidores MCP configurados
  const mcpConnected = await connectToAllMCPServers();
  
  if (mcpConnected && discoveredTools.length > 0) {
    const connectedServers = getConnectedServersInfo();
    console.log(`✅ MCP Client ready with ${discoveredTools.length} discovered tools from ${connectedServers.length} servers`);
    console.log(`📡 Connected servers: ${connectedServers.join(', ')}`);
    console.log(`🔧 All tools: ${discoveredTools.map(t => `${t.name}@${t.serverName}`).join(', ')}`);
    console.log('🎯 Mode: Real MCP Servers (like Cursor)');
  } else {
    console.log(`⚠️ Fallback: Using ${staticTools.length} static tools:`, 
      staticTools.map(t => t.name).join(', '));
    console.log('🎯 Mode: Static Tools (fallback)');
  }
  
  return true;
}

export async function executeToolCall(toolCall: any) {
  const toolName = toolCall.name;
  const toolArgs = toolCall.args || {};

  console.log(`🔧 Executing tool: ${toolName}`, toolArgs);

  // Si estamos conectados al servidor MCP real, usarlo (como Cursor)
  if (isConnectedToMCP && mcpServers.size > 0) {
    console.log('🎯 Executing via Real MCP Server (like Cursor)');
    try {
      return await executeToolOnMCPServer(toolName, toolArgs);
    } catch (error) {
      console.error(`❌ MCP Server failed, falling back to static implementation`);
      // Continuar con implementación estática como fallback
    }
  }

  console.log('🎯 Executing via Static Implementation (fallback)');

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
      const issueData: any = {
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
  const activeTools = getActiveTools();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    tools: [{
      functionDeclarations: activeTools,
    }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.AUTO,
      },
    },
  });

  // Generar prompt del sistema dinámicamente basado en herramientas disponibles
  const connectedServers = getConnectedServersInfo();
  const allTools = getAllDiscoveredTools();
  
  const toolsInfo = allTools.map(tool => 
    `• **${tool.name}** (${tool.serverName}): ${tool.description}`
  ).join('\n');

  const systemPrompt = `You are a universal MCP assistant with access to multiple MCP servers and their tools.

## 🔧 Connected MCP Servers:
${connectedServers.map(server => `• ${server}`).join('\n')}

## 🛠️ Available Tools:
${toolsInfo}

## 🎯 Capabilities:
You can help users interact with any of the connected MCP servers through natural language. 

### **General Guidelines:**
1. **Understand user intent**: Analyze what the user wants to accomplish
2. **Select appropriate tools**: Choose the best tool(s) from the available servers
3. **Execute efficiently**: Use tools in the most effective order
4. **Provide clear results**: Present information in a user-friendly format
5. **Suggest alternatives**: If a tool fails, recommend other approaches

### **Multi-Server Coordination:**
- You can use tools from different servers in combination
- Prioritize tools that best match the user's specific domain or need
- Explain which server/tool you're using when helpful for context

### **Response Format:**
- Always be helpful and informative
- Show relevant details from tool responses
- Provide actionable next steps when appropriate
- Handle errors gracefully with suggestions

## 🌐 Language Support:
- Respond in the user's preferred language (Spanish/English)
- Understand technical terms and domain-specific language
- Provide context-aware suggestions based on available tools

Remember: You have access to ${allTools.length} tools across ${connectedServers.length} servers. Use them wisely to help the user accomplish their goals.`;

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
