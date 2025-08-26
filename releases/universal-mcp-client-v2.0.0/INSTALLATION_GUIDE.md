# 🚀 Guía de Instalación - Jira MCP Chat

## 📋 Requisitos Previos

### Sistema Operativo
- **macOS** (probado en macOS 10.15+)
- **Homebrew** instalado

### Software Requerido
```bash
# Node.js (versión 18 o superior)
brew install node

# Git
brew install git

# Ollama (para AI local)
brew install ollama
```

## 🔧 Instalación Paso a Paso

### 1. Clonar el Repositorio
```bash
git clone https://github.com/JesusDevs/jira-mcp-chat.git
cd jira-mcp-chat
```

### 2. Instalar Dependencias
```bash
# Dependencias del proyecto principal
npm install

# Dependencias del servidor MCP
cd mcp-server
npm install
cd ..

# Dependencias del cliente de chat
cd chat-client
npm install
cd ..
```

### 3. Configurar Variables de Entorno

Copia el archivo de ejemplo y configúralo:
```bash
cp env.example .env
```

Edita el archivo `.env` con tus credenciales:
```env
# === JIRA CONFIGURATION (OBLIGATORIO) ===
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu_api_token_de_jira

# === AI PROVIDERS (OPCIONAL) ===
GEMINI_API_KEY=tu_api_key_de_gemini
OPENAI_API_KEY=tu_api_key_de_openai

# === MCP CONFIGURATION (OPCIONAL) ===
USE_STDIO_MCP=true
USE_UNIVERSAL_AI=false
```

### 4. Obtener Credenciales de Jira

#### 4.1 JIRA_BASE_URL
- URL de tu instancia de Jira (ej: `https://miempresa.atlassian.net`)

#### 4.2 JIRA_EMAIL
- Tu email registrado en Jira

#### 4.3 JIRA_API_TOKEN
1. Ve a [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Clic en "Create API token"
3. Dale un nombre descriptivo
4. Copia el token generado

### 5. Configurar Ollama (AI Local)

```bash
# Iniciar Ollama
ollama serve

# En otra terminal, descargar modelos
ollama pull llama3.1:latest
ollama pull llama3.2:latest

# Verificar instalación
ollama list
```

### 6. Instalar n8n-mcp (Opcional)

```bash
# Instalar globalmente
npm install -g n8n-mcp

# Verificar instalación
npx n8n-mcp --help
```

### 7. Configurar Permisos

```bash
# Hacer ejecutable el script de inicio
chmod +x start-dev.sh
```

## 🚀 Ejecutar la Aplicación

### Método 1: Script Automático (Recomendado)
```bash
./start-dev.sh
```

### Método 2: Manual
```bash
cd chat-client
npm run dev
```

### Método 3: Con Auto-Kill
```bash
cd chat-client
npm run kill-dev  # Limpiar puertos
npm run dev       # Iniciar (incluye auto-kill)
```

## 🔍 Verificación de Instalación

### 1. Verificar el Servidor
```bash
curl http://localhost:3001/api/mcp-status
```

Deberías ver:
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

### 2. Verificar en el Navegador
- Abre: http://localhost:3001
- Deberías ver la interfaz de Jira MCP Chat
- El estado de servidores MCP debe mostrar: ✅ Conectados

## 🛠️ Configuración Avanzada

### Variables de Entorno Adicionales

```env
# Puerto del servidor (por defecto: 3001)
PORT=3001

# Modo de desarrollo
NODE_ENV=development

# Configuración de logs
LOG_LEVEL=info
```

### Configuración de AI Providers

#### Gemini (Google)
1. Ve a [Google AI Studio](https://aistudio.google.com/)
2. Crea un API key
3. Agrega `GEMINI_API_KEY=tu_key` al .env

#### OpenAI
1. Ve a [OpenAI API](https://platform.openai.com/api-keys)
2. Crea un API key
3. Agrega `OPENAI_API_KEY=tu_key` al .env

## 🔧 Solución de Problemas

### Error: "Puerto 3001 en uso"
```bash
# Matar procesos en el puerto
lsof -ti:3001 | xargs kill -9

# O usar el comando incluido
npm run kill-dev
```

### Error: "MCP Server not found"
```bash
# Verificar que el servidor MCP existe
ls -la mcp-server/index.js

# Reinstalar dependencias MCP
cd mcp-server && npm install
```

### Error: "Jira credentials invalid"
1. Verificar las variables en `.env`
2. Probar las credenciales manualmente:
```bash
curl -u "tu-email:tu-api-token" \
  "https://tu-empresa.atlassian.net/rest/api/2/myself"
```

### Error: "Ollama not found"
```bash
# Verificar que Ollama está corriendo
curl http://127.0.0.1:11434/api/tags

# Si no funciona, reiniciar Ollama
ollama serve
```

### Error: "n8n-mcp not found"
```bash
# Reinstalar n8n-mcp globalmente
npm uninstall -g n8n-mcp
npm install -g n8n-mcp

# Verificar instalación
which n8n-mcp
```

## 📁 Estructura del Proyecto

```
jira-mcp-chat/
├── chat-client/          # Frontend Next.js
│   ├── src/
│   │   ├── app/         # App Router
│   │   ├── components/  # Componentes React
│   │   └── lib/         # Clientes MCP y AI
│   ├── mcp-config.json  # Configuración MCP
│   └── package.json
├── mcp-server/          # Servidor MCP de Jira
│   ├── tools/           # Herramientas MCP
│   ├── index.js         # Servidor principal
│   └── package.json
├── start-dev.sh         # Script de inicio
├── .env                 # Variables de entorno
└── README.md
```

## 🎯 Funcionalidades Disponibles

### Herramientas de Jira (6 tools)
- ✅ `search_jira_issues` - Buscar issues
- ✅ `get_jira_projects` - Listar proyectos
- ✅ `get_recent_issues` - Issues recientes
- ✅ `create_jira_issue` - Crear issues/épicas
- ✅ `search_epics` - Buscar épicas
- ✅ `search_by_type` - Buscar por tipo

### Herramientas de n8n (22 tools)
- ✅ 525 nodos disponibles
- ✅ 268 herramientas de AI
- ✅ Validación de workflows
- ✅ Plantillas de automatización

### AI Providers
- ✅ **Ollama** (local, gratuito)
- ✅ **Gemini** (Google, requiere API key)
- ✅ **OpenAI** (requiere API key)

## 🚀 Uso Básico

### Ejemplos de Consultas

```
"Lista todos los proyectos de Jira"
"Busca issues abiertos en el proyecto AIDEV"
"Crea una épica llamada 'Nueva funcionalidad'"
"¿Qué issues me han asignado?"
"Muestra los bugs de alta prioridad"
```

## 🔄 Actualizaciones

Para actualizar a la última versión:
```bash
git pull origin feature/mcp-improvements-and-docs
npm install
cd mcp-server && npm install && cd ..
cd chat-client && npm install && cd ..
```

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en la terminal
2. Verifica el estado MCP: http://localhost:3001/api/mcp-status
3. Consulta la documentación en el repositorio
4. Abre un issue en GitHub

---

¡Listo para usar Jira MCP Chat! 🎉
