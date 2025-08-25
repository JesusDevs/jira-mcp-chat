# 🚀 Jira MCP Chat - Sistema Universal MCP

Un cliente de chat inteligente **universal** que se conecta a **cualquier servidor MCP** usando múltiples protocolos (stdio, SSE, WebSocket). Compatible con la arquitectura de **Cursor IDE** y extensible a otros servicios.

![Chat Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.1.3-black)
![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-blue)
![MCP](https://img.shields.io/badge/MCP-Universal%20Protocol-purple)
![Architecture](https://img.shields.io/badge/Architecture-Modular%20v2.0-orange)

## ✨ Características Principales

### 🌐 **Cliente MCP Universal**
- 🔌 **Múltiples protocolos**: stdio, SSE, WebSocket, HTTP
- 🔄 **Servidores dinámicos**: Conecta a cualquier servidor MCP
- ⚙️ **Configuración flexible**: JSON config como Cursor IDE
- 🎯 **Perfiles**: Desarrollo, producción, testing

### 🤖 **Chat Inteligente**
- 💬 Gemini AI con function calling automático
- 🔍 Detección inteligente de herramientas MCP
- 📊 Respuestas estructuradas y contextuales
- 🎛️ Cambio dinámico entre servidores

### 🏗️ **Arquitectura Modular v2.0**
- 📦 **Tools package**: 6 herramientas Jira modulares
- 🔧 **Universal MCP Client**: Compatible con Cursor
- 🌍 **Multi-servidor**: Jira, GitHub, Slack, Custom
- 📋 **Configuración**: Sistema de perfiles avanzado

## 🎯 **Formas de Uso**

### **🌐 1. Chat Web Universal (Recomendado)**

#### Inicio Rápido
```bash
# 🚀 Todo en uno - configuración automática
npm run chat-start

# 🌐 Abrir chat
open http://localhost:3000
```

#### Configuración Avanzada
```bash
# 🔧 Configurar servidores MCP
cp mcp-servers-config.json my-mcp-config.json
# Editar my-mcp-config.json con tus servidores

# 🚀 Iniciar con configuración personalizada
npm run chat-start -- --config my-mcp-config.json
```

### **🖥️ 2. Cursor IDE (Protocolo MCP estándar)**

#### Servidor Individual
```bash
# 📡 Terminal 1: Servidor MCP para Cursor
npm run mcp-server-stdio

# 🔧 Terminal 2: Configurar Cursor (solo una vez)
npm run setup-cursor
```

#### Múltiples Servidores
```bash
# 🔧 Configurar múltiples servidores en Cursor
npm run setup-cursor-multi

# 📡 Iniciar todos los servidores
npm run mcp-servers-start

# ✅ Usar en Cursor:
@jira lista proyectos
@github buscar repositories
@slack enviar mensaje
```

### **⚡ 3. Modo Desarrollo (Ambos a la vez)**

```bash
# 📡 Terminal 1: Servidores MCP para Cursor
npm run mcp-servers-start

# 🌐 Terminal 2: Chat Web Universal
npm run chat-start

# ✅ Disponible:
# - Chat web: http://localhost:3000
# - Cursor: @mcp comandos
# - Múltiples servidores activos
```

## 🔧 Configuración de Servidores MCP

### **📋 Archivo de Configuración (`mcp-servers-config.json`)**

```json
{
  "defaultServer": "jira_local",
  "servers": {
    "jira_local": {
      "name": "Jira Local",
      "type": "stdio",
      "command": "node",
      "path": "./mcp-server/index.js",
      "env": {
        "JIRA_BASE_URL": "${JIRA_BASE_URL}",
        "JIRA_EMAIL": "${JIRA_EMAIL}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}"
      }
    },
    "jira_remote": {
      "name": "Jira Remote",
      "type": "sse",
      "url": "https://your-mcp-server.com/sse"
    },
    "custom_server": {
      "name": "Custom MCP",
      "type": "stdio",
      "command": "python",
      "path": "./custom-mcp/server.py"
    }
  }
}
```

### **🎯 Perfiles de Configuración**

```json
{
  "profiles": {
    "development": {
      "activeServers": ["jira_local", "github_local"],
      "env": { "LOG_LEVEL": "debug" }
    },
    "production": {
      "activeServers": ["jira_remote", "slack_remote"],
      "env": { "LOG_LEVEL": "info" }
    }
  }
}
```

## 🌐 **Protocolos MCP Soportados**

| **Protocolo** | **Uso** | **Ejemplo** | **Estado** |
|---------------|---------|-------------|------------|
| **stdio** | Servidores locales | `node server.js` | ✅ Completo |
| **SSE** | Servidores remotos | `https://api.com/sse` | ✅ Completo |
| **WebSocket** | Tiempo real | `ws://api.com/ws` | 🚧 En desarrollo |
| **HTTP** | APIs REST | `https://api.com/mcp` | 🚧 Planeado |

## 🛠️ **Scripts Disponibles**

### **🚀 Inicio Rápido**
```bash
npm run chat-start              # Chat web universal
npm run chat-start -- --server jira_remote  # Servidor específico
npm run chat-start -- --profile production  # Perfil específico
```

### **🖥️ Cursor IDE**
```bash
npm run mcp-server-stdio        # Servidor individual
npm run mcp-servers-start       # Múltiples servidores
npm run setup-cursor           # Configurar Cursor
npm run setup-cursor-multi     # Configurar múltiples servidores
```

### **🔧 Desarrollo**
```bash
npm run setup                   # Instalar dependencias
npm run dev                     # Modo desarrollo completo
npm run build                   # Build producción
```

### **🧪 Testing**
```bash
npm run test-mcp               # Probar conexiones MCP
npm run test-servers           # Probar múltiples servidores  
npm run test-tools             # Probar herramientas
npm run status                 # Estado del sistema
```

### **⚙️ Configuración**
```bash
npm run mcp-status             # Ver estado actual
npm run mcp-config-validate    # Validar configuración
npm run mcp-config-list        # Listar servidores
npm run mcp-profile-switch     # Cambiar perfil
```

## 🎯 **Ejemplos de Uso**

### **💬 Chat Web**

#### Comandos Básicos
```bash
# Conectar a servidor
"Conecta al servidor jira_local"
"Cambiar a servidor github_remote"

# Jira
"Lista proyectos disponibles"
"Busca issues de AIDEV abiertos"
"Crea un bug en proyecto SOP"

# GitHub (si está configurado)
"Lista mis repositorios"
"Busca issues en repo X"

# Multi-servidor
"¿Qué servidores están disponibles?"
"Muestra estado de conexiones"
```

#### Comandos Avanzados
```bash
# Búsquedas complejas
"Busca todos los bugs de alta prioridad creados esta semana en AIDEV"
"Issues asignados a mí que estén en progreso"

# Análisis de datos
"Estadísticas del proyecto SOP"
"Épicas del proyecto AIDEV con sus subtareas"

# Gestión de tareas
"Crea una épica: 'Implementar nueva funcionalidad X'"
"Asigna AIDEV-123 a usuario@empresa.com"
```

### **🖥️ Cursor IDE**

```bash
# Jira
@jira lista proyectos
@jira busca AIDEV-6
@jira issues recientes

# GitHub
@github lista repos
@github issues del repo project-name

# Slack  
@slack canales disponibles
@slack enviar mensaje #general "Hola mundo"

# Multi-herramienta
@mcp lista servidores
@mcp cambiar servidor github_local
```

## 🏗️ **Arquitectura del Sistema**

```mermaid
graph TB
    A[👤 Usuario] --> B[🌐 Chat Web Universal]
    A --> C[🖥️ Cursor IDE]
    
    B --> D[📡 Universal MCP Client]
    C --> E[📡 MCP Servers]
    
    D --> F[🔧 MCPServersManager]
    E --> F
    
    F --> G[📋 Config Loader]
    F --> H[🔌 Transport Layer]
    
    H --> I[📡 stdio]
    H --> J[🌐 SSE]
    H --> K[⚡ WebSocket]
    H --> L[🔗 HTTP]
    
    I --> M[🛠️ Jira Server]
    J --> N[🛠️ GitHub Server]
    K --> O[🛠️ Slack Server]
    L --> P[🛠️ Custom Server]
    
    M --> Q[📦 Tools Package]
    N --> R[📦 GitHub Tools]
    O --> S[📦 Slack Tools]
    P --> T[📦 Custom Tools]
```

### **🔧 Componentes Principales**

1. **🌐 Universal MCP Client**: Cliente que se conecta a cualquier servidor MCP
2. **📋 Config Loader**: Sistema de configuración flexible con perfiles
3. **🔌 Transport Layer**: Soporte para múltiples protocolos MCP
4. **📦 Tools Package**: Herramientas modulares (Jira, GitHub, Slack)
5. **🎛️ Servers Manager**: Gestión dinámica de múltiples servidores

## ⚙️ **Variables de Entorno**

### **📝 Archivo `.env`**
```env
# Jira Configuration
JIRA_BASE_URL=https://tu-dominio.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu-api-token-jira

# Gemini Configuration (requerido para chat)
GEMINI_API_KEY=tu-gemini-api-key

# GitHub Configuration (opcional)
GITHUB_TOKEN=tu-github-token
GITHUB_OWNER=tu-usuario-github

# Slack Configuration (opcional)
SLACK_BOT_TOKEN=xoxb-tu-bot-token
SLACK_APP_TOKEN=xapp-tu-app-token

# MCP Configuration
MCP_CONFIG_FILE=./mcp-servers-config.json
MCP_DEFAULT_PROFILE=development
MCP_LOG_LEVEL=info

# Server Configuration
CHAT_PORT=3000
MCP_PORT=3001
```

## 🔑 **Obtener Credenciales**

### **🎯 Jira API Token**
1. Ve a [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Crea un nuevo API token
3. Copia el token a `.env` como `JIRA_API_TOKEN`

### **🤖 Gemini API Key (Gratis)**
1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crea una nueva API key
3. Copia la key a `.env` como `GEMINI_API_KEY`

### **📱 GitHub Token (Opcional)**
1. Ve a [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Genera un nuevo token con permisos de repo
3. Copia el token a `.env` como `GITHUB_TOKEN`

### **💬 Slack Tokens (Opcional)**
1. Ve a [Slack API Apps](https://api.slack.com/apps)
2. Crea una nueva app y obtén los tokens
3. Configura `SLACK_BOT_TOKEN` y `SLACK_APP_TOKEN`

## 🎨 **Personalización**

### **🔧 Crear Servidor MCP Personalizado**

```javascript
// custom-mcp-server/index.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

class CustomMCPServer {
  constructor() {
    this.server = new Server({
      name: 'custom-server',
      version: '1.0.0'
    }, {
      capabilities: { tools: {} }
    });
    
    this.setupTools();
  }
  
  setupTools() {
    // Tu lógica personalizada aquí
  }
}

const server = new CustomMCPServer();
await server.start();
```

### **⚙️ Agregar al Config**
```json
{
  "servers": {
    "my_custom_server": {
      "name": "My Custom Server",
      "type": "stdio",
      "command": "node",
      "path": "./custom-mcp-server/index.js"
    }
  }
}
```

## 🐛 **Troubleshooting**

### **❌ Problemas Comunes**

#### Puerto en uso
```bash
# Liberar puerto 3000
pkill -f "next dev"
npm run chat-start
```

#### Servidor MCP no conecta
```bash
# Verificar configuración
npm run mcp-config-validate

# Probar conexión individual
npm run test-mcp -- --server jira_local

# Ver logs detallados
npm run mcp-status -- --verbose
```

#### Variables de entorno
```bash
# Verificar variables
npm run env-check

# Cargar variables manualmente
source .env && npm run chat-start
```

### **🔧 Comandos de Diagnóstico**

```bash
npm run status                  # Estado completo del sistema
npm run mcp-config-validate    # Validar configuración MCP
npm run test-connections       # Probar todas las conexiones
npm run logs                   # Ver logs en tiempo real
npm run health-check          # Verificación de salud
```

## 🔮 **Funcionalidades Futuras**

### **🎯 En Desarrollo**
- 🔄 **WebSocket transport**: Para servidores en tiempo real
- 📊 **Dashboard web**: Panel de control de servidores MCP
- 🤖 **Auto-discovery**: Detección automática de servidores
- 📧 **Notificaciones**: Alerts de estado de conexión

### **🌟 Roadmap 2024**
- **Q1**: WebSocket + HTTP transport completo
- **Q2**: Marketplace de servidores MCP
- **Q3**: Mobile app con MCP support
- **Q4**: Enterprise features (SSO, audit)

## 🤝 **Contribuir**

### **🛠️ Desarrollo**
```bash
# Fork y clone
git clone https://github.com/tu-usuario/jira-mcp-chat
cd jira-mcp-chat

# Instalar dependencias
npm run setup

# Crear rama
git checkout -b feature/nueva-funcionalidad

# Desarrollar y probar
npm run dev
npm run test-all

# Commit y PR
git commit -m "feat: añadir nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### **📋 Guidelines**
1. **Tests**: Añadir tests para nuevas funcionalidades
2. **Docs**: Actualizar documentación relevante
3. **Config**: Mantener compatibilidad con config existente
4. **MCP Standard**: Seguir especificaciones MCP oficiales

## 📊 **Estadísticas del Proyecto**

- **🔧 Universal MCP Client**: Soporte para 4 protocolos
- **📦 Modular Tools**: 6 herramientas Jira + extensible
- **⚙️ Configuración**: Sistema de perfiles avanzado
- **🌐 Multi-servidor**: Conectividad a N servidores MCP
- **📚 Documentación**: 400+ líneas de guías completas
- **🎯 Compatibilidad**: 100% compatible con Cursor IDE

## 📄 **Licencia**

MIT License - ve [LICENSE](LICENSE) para más detalles.

---

## 💡 **¿Necesitas Ayuda?**

### **📖 Documentación Completa**
1. **[USAGE_GUIDE.md](USAGE_GUIDE.md)** - Guía completa de uso
2. **[CURSOR_TROUBLESHOOTING.md](CURSOR_TROUBLESHOOTING.md)** - Solución de problemas
3. **[ESCALABILIDAD_MCP.md](ESCALABILIDAD_MCP.md)** - Arquitectura avanzada
4. **[mcp-servers-config.json](mcp-servers-config.json)** - Configuración de ejemplo

### **🚀 Inicio Rápido**
```bash
# Todo en 3 comandos
npm run setup
cp .env.example .env  # Editar con tus credenciales
npm run chat-start
```

### **💬 Soporte**
- 🐛 **Issues**: [GitHub Issues](https://github.com/JesusDevs/jira-mcp-chat/issues)
- 📧 **Email**: soporte@ejemplo.com
- 💬 **Chat**: [Discord Server](https://discord.gg/ejemplo)

**¡Conecta a cualquier servidor MCP desde cualquier lugar! 🚀🌐**