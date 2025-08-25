import { NextRequest, NextResponse } from "next/server";

// Elegir entre cliente directo o stdio MCP
const USE_STDIO_MCP = process.env.USE_STDIO_MCP === 'true';

// Importar el cliente apropiado
const mcpClient = USE_STDIO_MCP 
  ? require("@/lib/mcp-client")  // Cliente stdio real
  : require("@/lib/direct-mcp-client");  // Cliente directo

const { initMCP, processQuery } = mcpClient;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const userQuery = messages[messages.length - 1]?.content;

    if (!userQuery) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    console.log('Processing query:', userQuery);
    console.log('🔧 Using MCP Client:', USE_STDIO_MCP ? 'STDIO (Real MCP)' : 'Direct (Simplified)');

    await initMCP();
    console.log('MCP initialized successfully');

    const { reply, toolCalls, toolResponses } = await processQuery(messages);

    if (toolCalls.length > 0) {
      return NextResponse.json({
        role: "assistant",
        content: reply || "Successfully executed tool call(s) 🎉",
        toolResponses,
      });
    }

    return NextResponse.json({
      role: "assistant",
      content: reply,
    });
  } catch (error: any) {
    console.error("[Chat API Error]", error);
    return NextResponse.json(
      { 
        error: "Something went wrong", 
        details: error.message,
        suggestion: "Make sure your .env file is configured with Jira credentials and OpenAI API key"
      },
      { status: 500 }
    );
  }
}