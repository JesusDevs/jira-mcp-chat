# 🚀 **Jira MCP Chat - Sistema Universal de Gestión**

Un sistema completo de chat y herramientas MCP (Model Context Protocol) para gestionar Jira de forma inteligente. Compatible con múltiples proveedores de IA y servidores MCP.

![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-blue) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-blue) ![Jira](https://img.shields.io/badge/Jira-API-blue)

---

## 📋 **Características**

### **🔧 6 Herramientas MCP Disponibles:**
1. **`get_jira_projects`** - Listar proyectos
2. **`search_jira_issues`** - Búsqueda general de issues
3. **`get_recent_issues`** - Issues recientes
4. **`create_jira_issue`** ✨ - Crear issues/tareas/subtareas
5. **`search_epics`** ✨ - Búsqueda especializada de épicas  
6. **`search_by_type`** ✨ - Búsqueda por tipo (Bug, Story, Task, etc.)

### **🤖 Proveedores de IA Soportados:**
- **Gemini** (Google)
- **OpenAI** (GPT-4, GPT-3.5)
- **Ollama** (Modelos locales)
- **Anthropic** (Claude)

### **🎯 Modos de Operación:**
- **Chat Web** - Interfaz Next.js (puerto 3001)
- **MCP Server** - Compatible con Cursor y otros editores
- **Modo Híbrido** - Ambos simultáneamente

---

## 🚀 **Instalación Rápida**

### **1. Clonar y Configurar:**
```bash
git clone <tu-repo>
cd jira-mcp-chat
npm run setup
```

### **2. Configurar Variables de Entorno:**
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus credenciales
# JIRA_BASE_URL=https://tu-empresa.atlassian.net
# JIRA_EMAIL=tu-email@empresa.com
# JIRA_API_TOKEN=tu-token-jira
# GEMINI_API_KEY=tu-key-gemini (opcional)
```

### **3. Iniciar Servicios:**
```bash
# Chat + MCP Server juntos
npm run dev

# Solo chat web
npm run chat-start

# Solo MCP server para Cursor
npm run mcp-server-stdio
```

---

## 🔧 **Configuración de Credenciales**

### **📊 Jira API Token:**
1. Ve a: https://id.atlassian.com/manage-profile/security/api-tokens
2. Crea un nuevo token
3. Agregar a `.env`:
```bash
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=ATATT3xFfGF0...
```

### **🤖 API Keys de IA (Opcional):**
```bash
# Gemini (Google)
GEMINI_API_KEY=AIzaSy...

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant...

# Ollama (local)
OLLAMA_API_URL=http://localhost:11434
```

---

## 🎮 **Uso con Cursor IDE**

### **1. Configurar Cursor MCP:**
```bash
# Instalar configuración automáticamente
npm run setup-cursor
```

### **2. Configuración Manual:**
Editar `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/ruta/absoluta/a/jira-mcp-chat/mcp-server/index.js"],
      "env": {
        "JIRA_BASE_URL": "${JIRA_BASE_URL}",
        "JIRA_EMAIL": "${JIRA_EMAIL}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}"
      }
    }
  }
}
```

### **3. Comandos en Cursor:**
```bash
@jira get_jira_projects
@jira search_epics project="MI_PROYECTO"
@jira search_by_type issueType="Bug" project="MI_PROYECTO"
@jira create_jira_issue project="MI_PROYECTO" summary="Nueva tarea"
```

---

## 🌐 **Configuración Multi-MCP**

### **Agregar Múltiples Servidores MCP:**

#### **1. En Cursor (`~/.cursor/mcp.json`):**
```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/ruta/a/jira-mcp-chat/mcp-server/index.js"],
      "env": {
        "JIRA_BASE_URL": "${JIRA_BASE_URL}",
        "JIRA_EMAIL": "${JIRA_EMAIL}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}"
      }
    },
    "weather": {
      "command": "uv",
      "args": [
        "--directory", 
        "/ruta/absoluta/a/weather",
        "run", 
        "weather.py"
      ]
    },
    "database": {
      "command": "node",
      "args": ["/ruta/a/db-mcp-server/index.js"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}",
        "DB_PASSWORD": "${DB_PASSWORD}"
      }
    }
  }
}
```

#### **2. En el Chat Client:**
Crear `chat-client/mcp-config.json`:
```json
{
  "mcpServers": {
    "jira": {
      "name": "Jira Management",
      "type": "local",
      "command": "node",
      "args": ["../mcp-server/index.js"],
      "enabled": true
    },
    "weather": {
      "name": "Weather Service", 
      "type": "remote",
      "url": "ws://localhost:8080/mcp",
      "enabled": false
    }
  },
  "defaultServer": "jira"
}
```

---

## 📱 **Interfaz Web del Chat**

### **Acceso:**
- **URL**: http://localhost:3001
- **Características**:
  - Selector de IA (Gemini, OpenAI, Ollama)
  - Historial de conversaciones
  - Ejecución de herramientas MCP
  - Visualización de resultados

### **Comandos de Ejemplo:**
```
"Lista todos los proyectos de Jira"
"Busca épicas del proyecto MARKETING"
"Crea una tarea en DESARROLLO sobre optimización"
"Muestra bugs con prioridad alta"
"Busca issues asignados a maria.garcia@empresa.com"
```

---

## 🏗️ **Estructura del Proyecto**

```
jira-mcp-chat/
├── mcp-server/           # 📡 Servidor MCP (Cursor)
│   ├── index.js         # 6 herramientas Jira
│   └── package.json
├── chat-client/          # 🌐 Interfaz web
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── lib/         # MCP clients & AI providers
│   │   └── app/         # Next.js routes
│   └── package.json
├── .env                 # 🔐 Variables de entorno
├── .cursor-mcp.json     # ⚙️ Config para Cursor
└── package.json         # 📦 Scripts de gestión
```

---

## 🛠️ **Scripts Disponibles**

### **🚀 Desarrollo:**
```bash
npm run dev              # Chat + MCP server
npm run chat-start       # Solo chat (modo directo)
npm run mcp-server-stdio # Solo MCP server (para Cursor)
```

### **⚙️ Configuración:**
```bash
npm run setup           # Instalación completa
npm run setup-cursor    # Configurar Cursor MCP
npm run mcp-direct      # Cambiar a modo directo
npm run mcp-stdio       # Cambiar a modo stdio
```

### **🧪 Testing:**
```bash
npm run test-tools      # Probar herramientas MCP
npm run test-manual     # Pruebas manuales
```

---

## 🎯 **Uso en Diferentes Organizaciones**

### **Para Equipos de Desarrollo:**
```bash
@jira search_by_type issueType="Bug" status="In Progress"
@jira create_jira_issue project="DEV" summary="Optimizar base de datos"
@jira search_epics project="DEV" status="To Do"
```

### **Para Equipos de Marketing:**
```bash
@jira get_jira_projects
@jira search_jira_issues query="campaign AND content"
@jira create_jira_issue project="MKT" issueType="Story" summary="Nueva campaña Q1"
```

### **Para Gestión de Proyectos:**
```bash
@jira get_recent_issues days=7
@jira search_by_type issueType="Epic" assignee="currentUser()"
@jira search_jira_issues query="status = 'In Progress' AND priority = High"
```

---

## 🔧 **Personalización Avanzada**

### **1. Agregar Nuevas Herramientas MCP:**
Editar `mcp-server/index.js`:
```javascript
// Nueva herramienta
{
  name: 'get_user_workload',
  description: 'Get current workload for a user',
  inputSchema: {
    type: 'object',
    properties: {
      email: { type: 'string', description: 'User email' },
      days: { type: 'number', default: 7 }
    }
  }
}
```

### **2. Configurar AI Providers:**
Editar `chat-client/src/lib/ai-providers.ts`:
```javascript
// Nuevo proveedor
export const customProvider = {
  name: 'Custom AI',
  models: ['custom-model-v1'],
  apiKey: process.env.CUSTOM_API_KEY
}
```

### **3. Temas y Estilos:**
```bash
# Editar estilos
chat-client/src/app/globals.css

# Componentes UI
chat-client/src/components/ui/
```

---

## 🚨 **Troubleshooting**

### **Problemas Comunes:**

#### **❌ "MCP Server not found"**
```bash
# Verificar que el servidor esté corriendo
ps aux | grep "node.*index.js"

# Reiniciar MCP server
npm run mcp-server-stdio
```

#### **❌ "EADDRINUSE port 3001"**
```bash
# Liberar puerto
lsof -ti:3001 | xargs kill -9

# Reiniciar
npm run chat-start
```

#### **❌ "Jira API authentication failed"**
```bash
# Verificar variables de entorno
cat .env | grep JIRA

# Generar nuevo token
https://id.atlassian.com/manage-profile/security/api-tokens
```

#### **❌ Cursor no ve las herramientas**
```bash
# Verificar configuración
cat ~/.cursor/mcp.json

# Reinstalar configuración
npm run setup-cursor

# Reiniciar Cursor completamente
```

---

## 📊 **Métricas y Logging**

### **Logs del MCP Server:**
```bash
# Ver logs en tiempo real
npm run mcp-server-stdio

# Logs con debug
DEBUG=mcp:* npm run mcp-server-stdio
```

### **Logs del Chat:**
- **Consola del navegador**: F12 → Console
- **Terminal**: Donde ejecutaste `npm run dev`
- **Archivos**: `chat-client/.next/trace`

---

## 🤝 **Contribución**

### **Estructura de Commits:**
```bash
feat: nueva herramienta MCP para gestión de sprints
fix: corregir búsqueda por assignee  
docs: actualizar README con ejemplos
refactor: mejorar manejo de errores en API
```

### **Desarrollo Local:**
```bash
# Fork del repo
git clone <tu-fork>

# Crear rama de feature
git checkout -b feature/nueva-herramienta

# Desarrollar y probar
npm run test-tools

# Commit y PR
git commit -am "feat: agregar herramienta sprint_planning"
```

---

## 📚 **Recursos**

### **Documentación:**
- [MCP Protocol](https://modelcontextprotocol.io)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Next.js Docs](https://nextjs.org/docs)

### **Enlaces Útiles:**
- [Jira JQL Guide](https://www.atlassian.com/software/jira/guides/expand-jira/jql)
- [Cursor MCP Setup](https://docs.cursor.com/integrations/mcp)
- [Ollama Models](https://ollama.ai/library)

---

## 🏷️ **Licencia**

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## 🎉 **¡Listo para Usar!**

1. **Configura tus credenciales** en `.env`
2. **Ejecuta** `npm run setup`
3. **Inicia** `npm run dev`
4. **Ve a** http://localhost:3001
5. **Pregunta**: "Lista todos mis proyectos de Jira"

**¡Disfruta gestionando Jira con IA! 🚀**