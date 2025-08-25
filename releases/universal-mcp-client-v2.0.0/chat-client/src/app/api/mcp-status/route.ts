import { NextRequest, NextResponse } from 'next/server';
import { getMCPServerStatus, getConnectedServersInfo, getAllDiscoveredTools } from '@/lib/direct-mcp-client';

export async function GET(request: NextRequest) {
  try {
    // Obtener estado completo de servidores MCP
    const serverStatus = getMCPServerStatus();
    const connectedServers = getConnectedServersInfo();
    const allTools = getAllDiscoveredTools();

    // Agrupar herramientas por servidor
    const toolsByServer: Record<string, any[]> = {};
    allTools.forEach(tool => {
      const serverId = tool.serverId || 'unknown';
      if (!toolsByServer[serverId]) {
        toolsByServer[serverId] = [];
      }
      toolsByServer[serverId].push({
        name: tool.name,
        description: tool.description
      });
    });

    // Contar estadísticas
    const totalServers = Object.keys(serverStatus).length;
    const connectedCount = Object.values(serverStatus).filter(s => s.status === 'connected').length;
    const totalTools = allTools.length;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalServers,
        connectedServers: connectedCount,
        totalTools,
        connectedServerNames: connectedServers
      },
      servers: serverStatus,
      toolsByServer,
      allTools: allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        serverId: tool.serverId,
        serverName: tool.serverName
      }))
    };

    return NextResponse.json(response);
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
