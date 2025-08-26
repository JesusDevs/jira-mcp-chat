import { NextRequest, NextResponse } from 'next/server';

// Estado global del servidor (en producción esto sería una base de datos o cache)
let globalMCPState = {
  servers: {} as Record<string, any>,
  tools: [] as any[],
  lastInitialized: null as string | null
};

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing MCP connections...');
    
    // Mock servers para demo
    const mockServers = [
      {
        id: 'jira',
        name: 'Jira Management',
        description: 'Gestión completa de Jira - issues, proyectos, épicas',
        status: 'connected',
        tools: [
          { name: 'search_jira_issues', description: 'Search Jira issues using JQL, keywords, or issue keys' },
          { name: 'create_jira_issue', description: 'Create new issues, stories, bugs, tasks, subtasks, or epics' },
          { name: 'get_jira_projects', description: 'List all available Jira projects' },
          { name: 'search_epics', description: 'Specialized epic search with filtering by project/status' },
          { name: 'get_recent_issues', description: 'Show recent activity across projects' }
        ]
      },
      {
        id: 'n8n-mcp',
        name: 'n8n Workflow Management', 
        description: 'Gestión de workflows y automatizaciones con n8n',
        status: 'connected',
        tools: [
          { name: 'list_nodes', description: 'List n8n nodes by category or package' },
          { name: 'search_nodes', description: 'Search n8n nodes by keyword' },
          { name: 'validate_workflow', description: 'Validate n8n workflow configuration' },
          { name: 'get_node_info', description: 'Get detailed information about a specific n8n node' },
          { name: 'list_ai_tools', description: 'List AI-optimized n8n nodes' }
        ]
      }
    ];

    // Simular inicialización de servidores
    globalMCPState.servers = {};
    globalMCPState.tools = [];

    for (const server of mockServers) {
      globalMCPState.servers[server.id] = {
        id: server.id,
        name: server.name,
        description: server.description,
        status: server.status,
        toolsCount: server.tools.length,
        tools: server.tools.map(t => t.name),
        lastError: null
      };

      // Agregar herramientas a la lista global
      for (const tool of server.tools) {
        globalMCPState.tools.push({
          name: tool.name,
          description: tool.description,
          serverId: server.id,
          serverName: server.name
        });
      }
    }

    globalMCPState.lastInitialized = new Date().toISOString();

    console.log(`✅ Initialized ${Object.keys(globalMCPState.servers).length} MCP servers with ${globalMCPState.tools.length} tools`);

    return NextResponse.json({
      success: true,
      message: 'MCP connections initialized successfully',
      summary: {
        totalServers: Object.keys(globalMCPState.servers).length,
        connectedServers: Object.values(globalMCPState.servers).filter(s => s.status === 'connected').length,
        totalTools: globalMCPState.tools.length
      },
      timestamp: globalMCPState.lastInitialized
    });

  } catch (error: any) {
    console.error('❌ Error initializing MCP:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize MCP connections',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Devolver estado actual
  const serverStatus = globalMCPState.servers;
  const allTools = globalMCPState.tools;
  
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

  const connectedServers = Object.values(serverStatus)
    .filter(s => s.status === 'connected')
    .map(s => `${s.name} (${s.toolsCount} tools)`);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      totalServers: Object.keys(serverStatus).length,
      connectedServers: Object.values(serverStatus).filter(s => s.status === 'connected').length,
      totalTools: allTools.length,
      connectedServerNames: connectedServers
    },
    servers: serverStatus,
    toolsByServer,
    allTools: allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      serverId: tool.serverId,
      serverName: tool.serverName
    })),
    lastInitialized: globalMCPState.lastInitialized
  });
}
