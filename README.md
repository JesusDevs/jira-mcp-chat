# 🚀 Jira MCP Chat

Un sistema de chat inteligente que se conecta a Jira usando el protocolo MCP (Model Context Protocol), permitiendo consultas en lenguaje natural sobre issues, proyectos y épicas.

## ✨ Características

- **🤖 Chat IA con Jira**: Consultas naturales sobre issues y proyectos
- **🔗 Protocolo MCP**: Conexión directa con servidores MCP estándar
- **🎯 Multi-AI**: Gemini, OpenAI, Ollama (local y gratuito)
- **🔍 Búsquedas inteligentes**: JQL, keywords, filtros avanzados
- **📝 Creación automática**: Issues, épicas, tasks mediante comandos
- **🌐 Interfaz moderna**: Next.js 15, React 19, TailwindCSS
- **🛠️ Herramientas n8n**: 525 nodos, 268 herramientas de AI

## 🚀 Instalación Rápida (macOS)

### Opción 1: Instalador Automático
```bash
curl -fsSL https://raw.githubusercontent.com/JesusDevs/jira-mcp-chat/main/install-mac.sh | bash
```

### Opción 2: Manual
```bash
# 1. Clonar repositorio
git clone -b feature/mcp-improvements-and-docs https://github.com/JesusDevs/jira-mcp-chat.git
cd jira-mcp-chat

# 2. Ejecutar instalador
./install-mac.sh

# 3. Configurar .env con tus credenciales de Jira
cp env.example .env
# Editar .env con JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN

# 4. Iniciar aplicación
./start-dev.sh
```

## 🔧 Configuración de Credenciales

### 1. Jira (Obligatorio)
```env
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu_token_aqui
```

**Obtener API Token de Jira:**
1. Ve a [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Crea un nuevo token
3. Cópialo a tu `.env`

### 2. AI Providers (Opcional)
```env
# Google Gemini
GEMINI_API_KEY=tu_key_gemini

# OpenAI  
OPENAI_API_KEY=tu_key_openai
```

**Ollama es gratuito y se instala automáticamente** 🎉

## 🎯 Estado Actual - COMPLETAMENTE FUNCIONAL

### ✅ Servidores MCP Conectados
- **Jira Management**: 6 herramientas
- **n8n Workflow Management**: 22 herramientas  
- **Total**: 28 herramientas disponibles

### 🔧 Herramientas Disponibles

**Jira (6 tools):**
- `search_jira_issues` - Buscar issues con JQL/keywords
- `get_jira_projects` - Listar proyectos
- `get_recent_issues` - Issues recientes
- `create_jira_issue` - Crear issues/épicas/tasks
- `search_epics` - Buscar épicas específicamente  
- `search_by_type` - Buscar por tipo (Bug, Story, Task)

**n8n (22 tools):**
- 525 nodos de n8n disponibles
- 268 herramientas optimizadas para AI
- Validación de workflows
- Plantillas de automatización

## 💬 Ejemplos de Uso

```
"Lista todos los proyectos de Jira"
"Busca issues abiertos en el proyecto AIDEV"  
"Crea una épica llamada 'Nueva funcionalidad de login'"
"¿Qué bugs de alta prioridad tengo asignados?"
"Muestra las épicas del proyecto MARKETING"
"Crea un task en AIDEV sobre optimización"
```

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Node.js, MCP SDK estándar
- **IA**: Google Gemini, OpenAI, Ollama (local)
- **Integraciones**: Jira REST API, n8n MCP, MCP Protocol
- **Desarrollo**: Auto-kill scripts, TypeScript strict mode

## 🏗️ Arquitectura MCP

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat Client   │────│   MCP Servers   │────│   APIs          │
│   (Next.js)     │    │   Jira + n8n    │    │   Jira + n8n    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              IA Providers
         (Gemini/OpenAI/Ollama)
```

## 📁 Estructura del Proyecto

```
jira-mcp-chat/
├── chat-client/              # Frontend Next.js
│   ├── src/
│   │   ├── app/             # App Router + API
│   │   ├── components/      # UI Components  
│   │   └── lib/             # MCP Clients + AI
│   ├── mcp-config.json      # Configuración MCP
│   └── package.json
├── mcp-server/              # Servidor MCP Jira
│   ├── tools/               # 6 herramientas Jira
│   ├── index.js             # Servidor principal
│   └── package.json
├── start-dev.sh             # Inicio con auto-kill
├── install-mac.sh           # Instalador automático
├── INSTALLATION_GUIDE.md    # Guía completa
└── .env                     # Variables de entorno
```

## 🚀 Scripts Disponibles

```bash
# Inicio con auto-kill (recomendado)
./start-dev.sh

# Desarrollo manual
cd chat-client && npm run dev

# Limpiar puertos
npm run kill-dev

# Verificar estado MCP
curl http://localhost:3001/api/mcp-status
```

## 🔍 Verificación de Funcionamiento

### Estado de Servidores MCP
```bash
curl http://localhost:3001/api/mcp-status
```

Respuesta esperada:
```json
{
  "success": true,
  "summary": {
    "totalServers": 2,
    "connectedServers": 2, 
    "totalTools": 28
  }
}
```

### Interfaz Web
- **URL**: http://localhost:3001
- **Estado MCP**: ✅ 2 servidores conectados
- **Herramientas**: 28 tools disponibles

## 🛠️ Solución de Problemas

### Puerto en Uso
```bash
# Auto-kill incluido en npm run dev
npm run kill-dev
```

### Credenciales Jira
```bash
# Probar credenciales
curl -u "email:token" "https://empresa.atlassian.net/rest/api/2/myself"
```

### Ollama No Disponible  
```bash
brew install ollama
ollama serve
ollama pull llama3.1:latest
```

## 📚 Documentación Completa

- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Guía detallada de instalación
- **[CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)** - Configuración avanzada  
- **Estado MCP**: http://localhost:3001/api/mcp-status

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m 'Add AmazingFeature'`  
4. Push: `git push origin feature/AmazingFeature`
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/JesusDevs/jira-mcp-chat/issues)
- **Estado**: http://localhost:3001/api/mcp-status
- **Logs**: Terminal donde ejecutas `./start-dev.sh`

---

**¡Jira MCP Chat está listo para usar!** 🎉

*Sistema MCP completo con 28 herramientas, 3 proveedores de IA, y instalación automática para macOS.*