import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai';
import { getMCPClient } from './real-mcp-client';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL_NAME = 'gemini-2.0-flash-exp';

// Cliente MCP real - las herramientas se cargan dinámicamente del servidor
let mcpTools: any[] = [];

export async function initMCP() {
  console.log('🚀 Initializing Real MCP Client...');
  console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  console.log('Using model:', MODEL_NAME);
  
  try {
    const mcpClient = getMCPClient();
    const connected = await mcpClient.connect();
    
    if (connected) {
      mcpTools = mcpClient.getTools();
      console.log(`✅ MCP Client connected with ${mcpTools.length} tools`);
      return true;
    } else {
      console.error('❌ Failed to connect to MCP Server');
      return false;
    }
  } catch (error) {
    console.error('❌ MCP initialization error:', error);
    return false;
  }
}

export async function executeToolCall(toolCall: any) {
  const toolName = toolCall.name;
  const toolArgs = toolCall.args || {};

  console.log(`🔧 Executing MCP tool: ${toolName}`, toolArgs);

  try {
    const mcpClient = getMCPClient();
    
    if (!mcpClient.isReady()) {
      throw new Error('MCP Client not connected. Please ensure the MCP server is running.');
    }

    // Delegar la ejecución al servidor MCP real
    const result = await mcpClient.callTool(toolName, toolArgs);
    
    console.log(`✅ MCP tool ${toolName} executed successfully`);
    return result;

  } catch (error: any) {
    console.error(`❌ Error executing MCP tool ${toolName}:`, error.message);
    
    // Manejo de errores común
    return {
      name: toolName,
      arguments: toolArgs,
      result: {
        error: 'Tool execution failed',
        message: `Failed to execute ${toolName}: ${error.message}`,
        suggestion: 'Verify MCP server is running and Jira credentials are correct',
        details: error.toString()
      },
    };
  }
}

export async function processQuery(messagesInput: any[]) {
  // Asegurar que tenemos las herramientas MCP cargadas
  if (mcpTools.length === 0) {
    const mcpClient = getMCPClient();
    if (mcpClient.isReady()) {
      mcpTools = mcpClient.getTools();
    } else {
      throw new Error('MCP Client not ready. Please initialize first.');
    }
  }

  console.log('🔧 Tools loaded:', mcpTools.length, mcpTools.map(t => t.name));

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    tools: {
      functionDeclarations: mcpTools,
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