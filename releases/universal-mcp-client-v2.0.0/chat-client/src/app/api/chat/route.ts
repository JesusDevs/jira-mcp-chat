import { NextRequest, NextResponse } from "next/server";

// Elegir entre cliente directo o stdio MCP
const USE_STDIO_MCP = process.env.USE_STDIO_MCP === 'true';
const USE_UNIVERSAL_AI = process.env.USE_UNIVERSAL_AI === 'true';

// Importar el cliente apropiado
let mcpClient;
if (USE_UNIVERSAL_AI) {
  mcpClient = require("@/lib/universal-ai-mcp-client");  // Cliente AI universal
} else if (USE_STDIO_MCP) {
  mcpClient = require("@/lib/mcp-client");  // Cliente stdio real
} else {
  mcpClient = require("@/lib/direct-mcp-client");  // Cliente directo (DEFAULT)
}

const { initMCP, processQuery, switchAIProvider, loadSavedAIConfig } = mcpClient;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let clientType = 'Direct (Gemini)'; // Moved to function scope
  
  try {
    const { messages, aiProvider, aiModel } = await req.json();
    const userQuery = messages[messages.length - 1]?.content;

    if (!userQuery) {
      console.log('❌ No query provided');
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    // Determinar tipo de cliente
    if (USE_UNIVERSAL_AI) {
      clientType = `Universal AI (${aiProvider || 'Auto'})`;
    } else if (USE_STDIO_MCP) {
      clientType = 'STDIO (Real MCP)';
    }

    console.log('📝 Processing query:', userQuery);
    console.log('🔧 Using MCP Client:', clientType);
    console.log('⚙️ Environment:', {
      USE_STDIO_MCP,
      USE_UNIVERSAL_AI,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Present' : 'Missing',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Present' : 'Missing'
    });

    // Cambiar AI provider si se especifica
    if (aiProvider && aiModel && switchAIProvider) {
      console.log(`🔄 Switching AI to: ${aiProvider} - ${aiModel}`);
      switchAIProvider(aiProvider, aiModel);
    } else if (loadSavedAIConfig) {
      // Cargar configuración guardada si no se especifica
      const savedConfig = loadSavedAIConfig();
      console.log(`📋 Loaded saved AI config: ${savedConfig.provider} - ${savedConfig.model}`);
    }

    await initMCP();
    console.log('✅ MCP initialized successfully');

    const result = await processQuery(messages);
    const { reply, toolCalls, toolResponses, usage, provider, model } = result;

    const processingTime = Date.now() - startTime;
    
    // Log de respuesta exitosa
    console.log('✅ Query processed successfully:', {
      processingTime: `${processingTime}ms`,
      toolCalls: toolCalls?.length || 0,
      responseLength: reply?.length || 0,
      provider: provider || 'unknown',
      model: model || 'unknown',
      usage: usage || null
    });

    if (toolCalls && toolCalls.length > 0) {
      console.log('🔧 Tool calls executed:', toolCalls.map(call => call.name || 'unknown'));
      
      return NextResponse.json({
        role: "assistant",
        content: reply || "Successfully executed tool call(s) 🎉",
        toolResponses,
        metadata: {
          provider: provider || clientType,
          model: model || 'default',
          processingTime,
          toolsUsed: toolCalls.length,
          usage
        }
      });
    }

    return NextResponse.json({
      role: "assistant",
      content: reply,
      metadata: {
        provider: provider || clientType,
        model: model || 'default',
        processingTime,
        usage
      }
    });
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    // Mejorar logs de error
    console.error('❌ [Chat API Error] Detailed error information:');
    console.error('- Error type:', error.constructor.name);
    console.error('- Error message:', error.message);
    console.error('- Processing time:', `${processingTime}ms`);
    console.error('- Client type:', clientType);
    console.error('- Error stack:', error.stack);
    console.error('- Error cause:', error.cause);
    console.error('- API Keys status:', {
      gemini: process.env.GEMINI_API_KEY ? 'Present' : 'Missing',
      openai: process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
      jira: process.env.JIRA_API_TOKEN ? 'Present' : 'Missing'
    });
    console.error('- Environment variables:', {
      USE_STDIO_MCP,
      USE_UNIVERSAL_AI,
      NODE_ENV: process.env.NODE_ENV
    });
    
    // Si hay información adicional del error (como tool execution)
    if (error.cause) {
      console.error('- Enhanced error details:');
      console.error('  - Original error:', error.cause.originalError?.message);
      console.error('  - Tool name:', error.cause.toolName);
      console.error('  - Tool args:', error.cause.toolArgs);
      console.error('  - Timestamp:', error.cause.timestamp);
      console.error('  - Request details:', error.cause.request);
      console.error('  - Response details:', error.cause.response);
    }

    // Detectar tipo de error específico
    let errorType = 'Unknown';
    let userMessage = 'Something went wrong';
    let suggestion = 'Please try again';

    if (error.message.includes('429') || error.message.includes('quota')) {
      errorType = 'API Quota Exceeded';
      userMessage = '⚠️ API quota exceeded';
      suggestion = 'Try again in a few minutes or switch to Ollama (free local AI)';
    } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
      errorType = 'Authentication Error';
      userMessage = '🔑 API key issue';
      suggestion = 'Check your API keys in .env file';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = 'Network Error';
      userMessage = '🌐 Network connection issue';
      suggestion = 'Check your internet connection and try again';
    } else if (error.message.includes('Jira')) {
      errorType = 'Jira API Error';
      userMessage = '📋 Jira connection issue';
      suggestion = 'Check your Jira credentials in .env file';
    }

    return NextResponse.json(
      { 
        error: userMessage,
        details: error.message,
        suggestion,
        errorType,
        timestamp: new Date().toISOString(),
        processingTime,
        clientType,
        canRetry: !error.message.includes('429') // No retry for quota errors
      },
      { status: error.status || 500 }
    );
  }
}