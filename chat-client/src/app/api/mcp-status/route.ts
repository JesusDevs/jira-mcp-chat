import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Usar el endpoint de servidores que lee la configuración real
    const serversUrl = new URL('/api/mcp-servers', request.url);
    const response = await fetch(serversUrl.toString());
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error getting MCP status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get MCP server status',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
