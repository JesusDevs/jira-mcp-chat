# 🚀 Universal MCP Client

Un cliente de chat inteligente que se conecta a cualquier servidor MCP usando el protocolo estándar (Model Context Protocol), permitiendo interacciones en lenguaje natural con múltiples servicios y herramientas.

## ✨ Características

- **🤖 Cliente MCP Universal**: Se conecta a cualquier servidor MCP via stdio
- **🔗 Protocolo MCP Estándar**: Compatible con cualquier implementación MCP
- **🎯 Multi-AI**: Gemini, OpenAI, Ollama (local y gratuito)
- **🔍 Descubrimiento Automático**: Detecta herramientas disponibles dinámicamente
- **📝 Interacción Natural**: Chat en lenguaje natural con cualquier servicio
- **🌐 Interfaz Moderna**: Next.js 15, React 19, TailwindCSS
- **🛠️ Multi-Servidor**: Conecta múltiples servidores MCP simultáneamente

## 🚀 Instalación Multi-Plataforma

### Opción 1: Instalador Universal (Recomendado)
```bash
# macOS, Linux, Windows (Git Bash/WSL)
curl -fsSL https://raw.githubusercontent.com/JesusDevs/jira-mcp-chat/main/install-universal.sh | bash
```

### Opción 2: Por Sistema Operativo

#### 🍎 macOS
```bash
curl -fsSL https://raw.githubusercontent.com/JesusDevs/jira-mcp-chat/main/install-mac.sh | bash
```

#### 🪟 Windows (PowerShell)
```powershell
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/JesusDevs/jira-mcp-chat/main/install-windows.ps1'))
```

#### 🐧 Linux
```bash
curl -fsSL https://raw.githubusercontent.com/JesusDevs/jira-mcp-chat/main/install-universal.sh | bash
```

### Opción 3: Manual
```bash
# 1. Clonar repositorio
git clone -b feature/mcp-improvements-and-docs https://github.com/JesusDevs/jira-mcp-chat.git
cd jira-mcp-chat

# 2. Configurar variables de entorno (interactivo)
node setup-env.js

# 3. Iniciar aplicación
# macOS/Linux:
./start-dev.sh
# Windows:
start-dev.bat
```

## 🔧 Sistema de Configuración Unificado

### ⚡ Configuración Automática (Recomendado)
```bash
# Configurador interactivo para todas las plataformas
node setup-env.js
```

**Este configurador:**
- ✅ Configura **un solo archivo .env** para todo el proyecto
- ✅ Funciona para **Cursor MCP** y **Chat Client**
- ✅ Valida credenciales de Jira automáticamente
- ✅ Configura **Cursor MCP** automáticamente
- ✅ Soporte multi-plataforma (macOS, Windows, Linux)

### 📁 Estructura de Variables de Entorno

**¿Cuántos archivos .env necesitas?** 
**Respuesta: SOLO UNO** 🎯

```
jira-mcp-chat/
├── .env                    # ← ÚNICO archivo necesario
├── chat-client/            # Lee desde ../env
├── mcp-server/             # Lee desde ../env  
└── ~/.cursor/mcp.json      # Se configura automáticamente
```

### 🔑 Credenciales Necesarias

#### 1. Jira (Obligatorio)
```env
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu_token_aqui
```

**Obtener API Token:**
1. [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. "Create API token" → Dale un nombre
3. Copia el token generado

#### 2. AI Providers (Opcional)
```env
GEMINI_API_KEY=tu_key_gemini      # Google AI Studio
OPENAI_API_KEY=tu_key_openai      # OpenAI Platform
```

**Ollama es GRATUITO y se instala automáticamente** 🎉

### 🎯 Uso en Cursor vs Chat Client

| Componente | Configuración | Variables |
|------------|---------------|-----------|
| **Cursor MCP** | `~/.cursor/mcp.json` | Se configura automáticamente |
| **Chat Client** | Lee desde `.env` | Mismas credenciales |
| **MCP Server** | Lee desde `.env` | Mismas credenciales |

**¡Una sola configuración para todo!** ✨

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
"¿Qué herramientas están disponibles?"
"Muestra los servidores MCP conectados"
"¿Qué puedo hacer con los servicios conectados?"
"Ayúdame a buscar información en [nombre del servicio]"
"Lista los recursos disponibles"
"Ejecuta [nombre de herramienta] con [parámetros]"
```

**Ejemplos específicos según servidores conectados:**
- Con servidor Jira: "Lista proyectos", "Busca issues", "Crea épicas"
- Con servidor n8n: "Muestra nodos disponibles", "Valida workflow"
- Con servidor personalizado: Depende de las herramientas que implemente

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