# Guía de Escalabilidad MCP para Jira Chat

## 🏗️ Arquitectura Actual vs. Recomendada

### Arquitectura Actual (Híbrida)
```
Next.js App → mcp-client.ts (simulado) → Jira API directa
     ↓
   Gemini AI (function calling)
```

### Arquitectura Recomendada (MCP Estándar)
```
Next.js App → MCP Client → MCP Aggregator → Multiple MCP Servers
     ↓                           ↓               ↓
   Gemini AI              Load Balancer    [Jira, GitHub, Slack, etc.]
```

## 📋 Opciones de Escalabilidad

### Opción 1: MCP Estándar con Múltiples Servers

#### Estructura de directorios recomendada:
```
jira-mcp-chat/
├── mcp-servers/
│   ├── jira/
│   │   ├── index.js
│   │   └── package.json
│   ├── github/
│   │   ├── index.js  
│   │   └── package.json
│   ├── slack/
│   │   ├── index.js
│   │   └── package.json
│   └── aggregator/
│       ├── index.js
│       └── config.json
├── chat-client/
└── mcp-config.json
```

#### Configuración JSON compartida (`mcp-config.json`):
```json
{
  "version": "1.0.0",
  "servers": {
    "jira": {
      "command": "node",
      "args": ["./mcp-servers/jira/index.js"],
      "env": {
        "JIRA_BASE_URL": "${JIRA_BASE_URL}",
        "JIRA_EMAIL": "${JIRA_EMAIL}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}"
      },
      "capabilities": ["tools", "resources"],
      "tools": ["search_jira_issues", "get_jira_projects", "create_jira_issue"]
    },
    "github": {
      "command": "node", 
      "args": ["./mcp-servers/github/index.js"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "capabilities": ["tools"],
      "tools": ["search_repos", "get_issues", "create_pr"]
    },
    "slack": {
      "command": "node",
      "args": ["./mcp-servers/slack/index.js"], 
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}"
      },
      "capabilities": ["tools"],
      "tools": ["send_message", "get_channels", "upload_file"]
    }
  },
  "aggregation": {
    "enabled": true,
    "load_balancing": true,
    "fallback_servers": ["jira"]
  }
}
```

### Opción 2: RAG + MCP para Contexto Avanzado

#### Implementación de RAG:
```typescript
// rag-service/index.ts
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

class RAGService {
  constructor() {
    this.chroma = new ChromaClient();
    this.embeddings = new OpenAIEmbeddings();
    this.collection = null;
  }

  async indexJiraData() {
    // 1. Obtener todos los issues de Jira
    const issues = await this.getAllJiraIssues();
    
    // 2. Crear embeddings de descripciones y comentarios
    const documents = issues.map(issue => ({
      id: issue.key,
      content: `${issue.summary} ${issue.description}`,
      metadata: {
        project: issue.project,
        status: issue.status,
        assignee: issue.assignee
      }
    }));

    // 3. Almacenar en ChromaDB
    await this.collection.add({
      documents: documents.map(d => d.content),
      metadatas: documents.map(d => d.metadata),
      ids: documents.map(d => d.id)
    });
  }

  async semanticSearch(query: string, limit = 5) {
    const results = await this.collection.query({
      queryTexts: [query],
      nResults: limit
    });
    return results;
  }
}
```

## 🔧 Configuración para Gemini + Cursor

### Para usar con Gemini (tu caso actual):
```typescript
// gemini-mcp-client.ts
export class GeminiMCPClient {
  constructor() {
    this.mcpServers = this.loadMCPConfig();
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async loadMCPConfig() {
    const config = JSON.parse(fs.readFileSync('mcp-config.json', 'utf8'));
    return config.servers;
  }

  async getAllTools() {
    const allTools = [];
    for (const [name, server] of Object.entries(this.mcpServers)) {
      const tools = await this.getServerTools(server);
      allTools.push(...tools.map(t => ({ ...t, server: name })));
    }
    return allTools;
  }
}
```

### Para usar con Cursor (configuración):
```json
// .cursor-mcp.json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["./mcp-servers/jira/index.js"]
    },
    "github": {
      "command": "node", 
      "args": ["./mcp-servers/github/index.js"]
    }
  }
}
```

## 🚀 Scripts de Escalabilidad

### package.json actualizado:
```json
{
  "scripts": {
    "dev": "npm run start-all-servers && npm run next-dev",
    "start-all-servers": "concurrently \"npm run jira-server\" \"npm run github-server\" \"npm run slack-server\"",
    "jira-server": "cd mcp-servers/jira && node index.js",
    "github-server": "cd mcp-servers/github && node index.js", 
    "slack-server": "cd mcp-servers/slack && node index.js",
    "setup-rag": "node rag-service/setup.js",
    "index-data": "node rag-service/index-data.js"
  }
}
```

## 📊 Monitoreo y Logging

### Logger centralizado:
```typescript
// utils/mcp-logger.ts
export class MCPLogger {
  static log(server: string, tool: string, data: any) {
    console.log(`[${new Date().toISOString()}] ${server}:${tool}`, data);
    // Enviar a sistema de monitoreo si es necesario
  }
  
  static error(server: string, error: Error) {
    console.error(`[${new Date().toISOString()}] ERROR ${server}:`, error);
  }
}
```

## 🔗 Ventajas de la Arquitectura Escalable

1. **Separación de responsabilidades**: Cada MCP server maneja un servicio
2. **Reutilización**: Los mismos servers funcionan con Gemini, Cursor, Claude
3. **Escalabilidad horizontal**: Agregar nuevos servicios es trivial
4. **Configuración centralizada**: Un JSON controla todo
5. **Fallback automático**: Si un server falla, otros continúan
6. **RAG opcional**: Mejora el contexto sin cambiar la arquitectura

## 🎯 Próximos Pasos Recomendados

1. **Migrar a MCP estándar**: Usar tu mcp-server real en lugar del simulado
2. **Crear configuración JSON compartida**: Para manejar múltiples servers
3. **Implementar RAG**: Para mejorar la búsqueda semántica
4. **Agregar más MCP servers**: GitHub, Slack, Notion, etc.
5. **Configurar para Cursor**: Para usar los mismos servers en IDE
