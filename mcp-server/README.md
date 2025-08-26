# 🔧 Ludo MCP Server

Servidor MCP universal con integración a Jira y sistema de templates avanzado.

## ⚡ Instalación Rápida

```bash
# Instalar dependencias
npm run setup

# Iniciar servidor
npm start

# O desarrollo con auto-reload
npm run dev
```

## 🌐 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Jira Configuration (Requerido)
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu_token_de_jira

# Configuración adicional
LOG_LEVEL=info
```

### Obtener Token de Jira

1. Ve a https://id.atlassian.com/manage-profile/security/api-tokens
2. Crea un nuevo token
3. Cópialo a `JIRA_API_TOKEN`

## 🛠️ Herramientas Disponibles

### 📋 Herramientas Básicas
- `search_jira_issues` - Buscar issues con JQL/keywords
- `get_jira_projects` - Listar proyectos
- `get_recent_issues` - Issues recientes
- `create_jira_issue` - Crear issues/subtasks
- `search_epics` - Buscar épicas
- `search_by_type` - Buscar por tipo de issue

### 🎯 Sistema de Templates
- `list_jira_templates` - Listar templates disponibles
- `create_jira_from_template` - Crear issues desde templates

## 📁 Templates Disponibles

### 🎯 Épicas
- `product-epic` - Épicas de producto con roadmap
- `technical-epic` - Épicas técnicas con arquitectura

### 📋 Historias de Usuario
- `feature-story` - Features con criterios UX
- `bug-story` - Bugs con investigación técnica

### 👥 Contextos de Equipo
- `frontend-team` - Estándares frontend (React/TypeScript)
- `backend-team` - Estándares backend (Node.js/APIs)

### ✅ Definition of Done
- `epic-dod` - DoD para épicas
- `story-dod` - DoD para historias

## 🎨 Uso de Templates

```javascript
// Listar templates
await callTool('list_jira_templates', { category: 'epics' });

// Crear desde template
await callTool('create_jira_from_template', {
  template: 'product-epic',
  variables: {
    epic_name: 'Mi Epic',
    objective: 'Objetivo principal',
    business_value: 'Valor de negocio'
  },
  team_context: 'frontend'
});
```

## 📦 Scripts Disponibles

- `npm start` - Iniciar servidor MCP
- `npm run dev` - Desarrollo con auto-reload
- `npm run test` - Probar configuración
- `npm run setup` - Setup completo
- `npm run clean` - Limpiar y reinstalar

## 🏗️ Arquitectura

```
Ludo MCP Server
├── index.js (Servidor principal)
├── tools/ (Herramientas modulares)
│   ├── base.js (Clase base)
│   ├── template-manager.js (Sistema de templates)
│   └── [otras herramientas]
└── templates/ (Templates organizados)
    ├── epics/
    ├── hdus/
    ├── team-context/
    └── dod/
```

## 🔌 Uso con Clientes MCP

### Con Cursor
```json
{
  "mcpServers": {
    "ludo-server": {
      "command": "node",
      "args": ["path/to/mcp-server/index.js"]
    }
  }
}
```

### Con Ludo Chat Client
El servidor se detecta automáticamente si está configurado en `mcp-config.json`.

## 🆘 Problemas Comunes

**Error de conexión Jira:**
```bash
npm run test  # Verifica configuración
```

**Templates no encontrados:**
- Verifica que la carpeta `templates/` existe
- Asegúrate de que los archivos JSON son válidos

**Herramientas no detectadas:**
- Reinicia el servidor MCP
- Verifica que `tools/index.js` exporta correctamente
