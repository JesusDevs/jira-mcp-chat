# Jira MCP Chat 🤖

Un cliente de chat inteligente que te permite interactuar con Jira usando lenguaje natural. Construido con MCP (Model Context Protocol), Next.js y Gemini AI.

![Chat Demo](https://img.shields.io/badge/Status-Functional-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.1.3-black)
![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-blue)
![Jira](https://img.shields.io/badge/Jira-API%20v2-0052CC)

## ✨ Características

- 🤖 **Chat inteligente**: Habla con Jira usando lenguaje natural
- 🔍 **Búsqueda avanzada**: JQL automático + búsqueda por keywords
- 🎨 **Interfaz moderna**: UI limpia tipo Claude/n8n
- ⚡ **MCP Protocol**: Arquitectura estándar y extensible
- 🏠 **Local First**: Todo corre localmente, datos seguros
- 🚀 **Auto-setup**: Instalación automática de dependencias

## 🎯 Lo que puedes hacer

- **"Busca AIDEV-6"** - Encuentra issues específicos
- **"¿Qué proyectos están disponibles?"** - Lista todos los proyectos
- **"Muestra issues abiertos"** - Filtra por status  
- **"Issues creados esta semana"** - Búsquedas temporales
- **"Busca bugs de alta prioridad"** - Combina filtros
- **"Issues asignados a mí"** - Búsquedas personales

## 📋 Requisitos

- **Node.js 18+**
- **Cuenta de Jira** con API token
- **Gemini API key** (gratis)
- **npm** o yarn

## 🛠️ Instalación

### Método 1: Script automático (Recomendado)
```bash
# Ejecutar instalador automático
./install.sh

# Editar credenciales
nano .env

# Iniciar sistema
npm run dev
```

### Método 2: Manual
```bash
# Instalar todas las dependencias
npm run setup

# Configurar .env
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar sistema  
npm run dev
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```env
# Jira Configuration
JIRA_BASE_URL=https://tu-dominio.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu-api-token-jira

# OpenAI Configuration
OPENAI_API_KEY=tu-openai-api-key
```

### 3. Obtener credenciales de Jira

#### API Token:
1. Ve a https://id.atlassian.com/manage-profile/security/api-tokens
2. Crea un nuevo API token
3. Copia el token a tu archivo `.env`

#### Base URL:
- Formato: `https://tu-empresa.atlassian.net`
- Sin `/` al final

## 🚀 Uso

### Iniciar todo el sistema
```bash
npm run dev
```

Esto inicia:
- MCP Server (puerto 3001) 
- Chat Client (puerto 3000)

### Abrir el chat
Abre http://localhost:3000 en tu navegador

### Ejemplos de comandos

```
💬 "Muéstrame todos los issues abiertos en proyecto TEST"
💬 "¿Qué issues tengo asignados?"
💬 "Busca bugs de alta prioridad creados esta semana"  
💬 "Lista todos los proyectos disponibles"
💬 "Issues en TEST que estén en progreso"
```

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   MCP Client    │    │   MCP Server    │
│   (Chat UI)     │◄──►│   (Connector)   │◄──►│   (Jira API)    │
│   Port 3000     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes:

1. **MCP Server** (`mcp-server/`): Servidor que se conecta a Jira API
2. **Chat Client** (`chat-client/`): Interfaz web Next.js para chat  
3. **MCP Client** (`chat-client/src/lib/mcp-client.ts`): Conecta UI con servidor MCP

## 🔧 Desarrollo

### Scripts disponibles

```bash
# Desarrollo (todo junto)
npm run dev

# Solo MCP server
npm run mcp-server

# Solo cliente web  
npm run next-dev

# Build completo
npm run build
```

### Estructura del proyecto

```
jira-mcp-chat/
├── mcp-server/           # Servidor MCP para Jira
│   ├── index.js         # Lógica principal del servidor
│   └── package.json     # Dependencias del servidor
├── chat-client/         # Cliente web Next.js
│   ├── src/
│   │   ├── app/         # Páginas y API routes
│   │   ├── components/  # Componentes React
│   │   └── lib/         # Utilidades y MCP client
│   └── package.json     # Dependencias del cliente
├── package.json         # Scripts principales
├── .env.example         # Variables de entorno
└── README.md           # Este archivo
```

## 🤝 Compartir y Distribuir

### Empaquetado para distribución

1. **Build del proyecto**:
```bash
npm run build
```

2. **Crear paquete**:
```bash
tar -czf jira-mcp-chat.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next \
  .
```

3. **Compartir el archivo**: `jira-mcp-chat.tar.gz`

### Instalación por otros usuarios

```bash
# Descomprimir
tar -xzf jira-mcp-chat.tar.gz
cd jira-mcp-chat

# Instalar y configurar
npm install
npm run setup
cp .env.example .env

# Editar .env con sus credenciales
# Ejecutar
npm run dev
```

## 🐛 Troubleshooting

### Error de conexión MCP
- Verifica que el `mcp-server` esté corriendo
- Revisa los logs en consola del navegador

### Error de autenticación Jira  
- Verifica `JIRA_BASE_URL` (sin `/` al final)
- Confirma que `JIRA_EMAIL` y `JIRA_API_TOKEN` sean correctos
- Prueba el token manualmente: `curl -u email:token https://domain.atlassian.net/rest/api/2/myself`

### Error OpenAI
- Verifica que `OPENAI_API_KEY` esté configurada
- Confirma que tengas créditos disponibles en OpenAI

### Puerto en uso
```bash
# Cambiar puerto en package.json si es necesario
"next-dev": "cd chat-client && npm run dev -- --port 3001"
```

## 📚 JQL Quick Reference

- `project = TEST` - Issues del proyecto TEST
- `status = "In Progress"` - Issues en progreso
- `assignee = currentUser()` - Mis issues asignados  
- `created >= -7d` - Issues creados en últimos 7 días
- `priority = High AND type = Bug` - Bugs de alta prioridad
- `status changed to Done after -1w` - Completados esta semana

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`) 
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ve [LICENSE](LICENSE) para más detalles.