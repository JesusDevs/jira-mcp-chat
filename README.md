# 🚀 Ludo Universal MCP System

Sistema completo de chat universal que se conecta a **cualquier servidor MCP**. Incluye cliente web moderno y servidor MCP con templates avanzados.

## ⚡ Instalación Rápida

```bash
# Instalación completa (Recomendada)
git clone https://github.com/JesusDevs/jira-mcp-chat.git
cd jira-mcp-chat
./install.sh

# Iniciar sistema
./start.sh      # Modo producción
./dev.sh        # Modo desarrollo

# Abrir: http://localhost:3001
```

## 🏗️ Arquitectura

```
Universal MCP Client (Next.js)
├── MCP Protocol Handler (stdio/SSE/WebSocket)
├── AI Providers (Gemini/Ollama/OpenAI)
└── Dynamic Tool Discovery
    │
    ├── Tu MCP Server (Jira) ── stdio
    ├── n8n-mcp (Global) ──── stdio  
    ├── GitHub MCP ────────── stdio
    └── Cualquier MCP ────── stdio
```

## 🔌 Agregar Servidores MCP

Edita `chat-client/mcp-config.json`:

```json
{
  "mcpServers": {
    "mi-servidor": {
      "name": "Mi Servidor Custom",
      "description": "Descripción del servidor",
      "type": "local",
      "command": "node",
      "args": ["ruta/a/mi-servidor.js"],
      "enabled": true,
      "env": {"API_KEY": "${MI_API_KEY}"}
    }
  }
}
```

## 📦 Servidores MCP Soportados

```bash
# Oficiales (Protocol implementers)
npm i -g @modelcontextprotocol/server-github
npm i -g @modelcontextprotocol/server-filesystem  
npm i -g @modelcontextprotocol/server-postgres

# Comunidad
npm i -g n8n-mcp

# Custom (cualquier lenguaje + MCP SDK)
python mi-servidor-mcp.py
node mi-servidor-mcp.js
```

## 🛠️ Ejemplos de Configuración

### GitHub MCP
```json
"github": {
  "name": "GitHub Integration",
  "command": "npx",
  "args": ["@modelcontextprotocol/server-github"],
  "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"}
}
```

### Filesystem MCP  
```json
"filesystem": {
  "name": "File System Access",
  "command": "npx", 
  "args": ["@modelcontextprotocol/server-filesystem", "/allowed/path"]
}
```

### PostgreSQL MCP
```json
"postgres": {
  "name": "PostgreSQL Database",
  "command": "npx",
  "args": ["@modelcontextprotocol/server-postgres"],
  "env": {"POSTGRES_CONNECTION_STRING": "${DATABASE_URL}"}
}
```

## 🔧 Variables de Entorno

```bash
# Configurador interactivo
node setup-env.js

# O manual: cp env.example .env
```

### Jira (Requerido)
```env
JIRA_BASE_URL=https://empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com  
JIRA_API_TOKEN=tu_api_token
```

### AI Providers (Opcional)
```env
GEMINI_API_KEY=tu_gemini_key    # Google AI Studio
OPENAI_API_KEY=tu_openai_key    # OpenAI Platform
# Ollama es local y gratuito (auto-instalado)
```

## 💬 Uso

1. **Abrir**: http://localhost:3001
2. **Preguntar**: "What tools are available?"
3. **Interactuar**: Con cualquier servidor MCP conectado

### Ejemplos de Comandos
```
🔍 "What servers are connected?"
📋 "List Jira projects" (si tienes Jira MCP)
⚙️ "Show n8n nodes" (si tienes n8n-mcp)  
📁 "List files in /home" (si tienes filesystem MCP)
```

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Node.js, MCP SDK estándar
- **AI**: Gemini, OpenAI, Ollama (local)
- **Protocol**: MCP stdio/SSE/WebSocket
- **Deployment**: Docker, Vercel ready

## 📚 Documentación

- [MCP Protocol](https://modelcontextprotocol.io/)
- [Crear MCP Server](https://modelcontextprotocol.io/docs/building-servers)
- [Servidores Oficiales](https://github.com/modelcontextprotocol/servers)

## 🤝 Contribuir

1. Fork el repositorio
2. Crea tu feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📄 Licencia

MIT License - ve [LICENSE](LICENSE) para detalles.

---

**Universal MCP Client** - Compatible con cualquier servidor MCP 🌟