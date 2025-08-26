# 🛠️ Jira MCP Tools Package

Paquete modular de herramientas para interactuar con Jira a través del protocolo MCP (Model Context Protocol). Cada herramienta está organizada en su propio archivo para facilitar el mantenimiento y la extensibilidad.

## 🏗️ Arquitectura

```
tools/
├── base.js              # Clase base con funcionalidad común
├── index.js             # Gestor principal y exports
├── search-issues.js     # Búsqueda general de issues
├── get-projects.js      # Obtener proyectos de Jira
├── recent-issues.js     # Issues recientes
├── create-issue.js      # Crear nuevos issues
├── search-epics.js      # Búsqueda específica de épicas
├── search-by-type.js    # Búsqueda por tipo de issue
├── package.json         # Configuración del paquete
└── README.md           # Esta documentación
```

## 🔧 Herramientas Disponibles

### 1. **SearchIssuesTool** (`search-issues.js`)
- **Función**: Búsqueda general de issues
- **Capacidades**: JQL, keywords, claves específicas
- **Uso**: `search_jira_issues`

### 2. **GetProjectsTool** (`get-projects.js`)
- **Función**: Obtener lista de proyectos
- **Capacidades**: Todos los proyectos o solo recientes
- **Uso**: `get_jira_projects`

### 3. **RecentIssuesTool** (`recent-issues.js`)
- **Función**: Issues creados recientemente
- **Capacidades**: Filtrar por días, límite de resultados
- **Uso**: `get_recent_issues`

### 4. **CreateIssueTool** (`create-issue.js`)
- **Función**: Crear nuevos issues/subtasks
- **Capacidades**: Todos los tipos, asignación, prioridades
- **Uso**: `create_jira_issue`

### 5. **SearchEpicsTool** (`search-epics.js`)
- **Función**: Búsqueda específica de épicas
- **Capacidades**: Filtros por proyecto, estado, búsqueda de texto
- **Uso**: `search_epics`

### 6. **SearchByTypeTool** (`search-by-type.js`)
- **Función**: Búsqueda por tipo específico de issue
- **Capacidades**: Bug, Story, Task, Subtask, Epic, etc.
- **Uso**: `search_by_type`

## 🚀 Uso

### Importación Básica
```javascript
import { JiraToolsManager } from './tools/index.js';

// Crear gestor de herramientas
const toolsManager = new JiraToolsManager(jiraConfig);

// Ejecutar herramienta
const result = await toolsManager.executeTool('search_jira_issues', {
  query: 'project = AIDEV',
  maxResults: 10
});
```

### Importación Individual
```javascript
import { SearchIssuesTool } from './tools/search-issues.js';

// Usar herramienta específica
const searchTool = new SearchIssuesTool(jiraConfig);
const result = await searchTool.execute({ query: 'AIDEV-123' });
```

### Obtener Esquemas para MCP
```javascript
const toolsManager = new JiraToolsManager(jiraConfig);
const schemas = toolsManager.getToolSchemas();
```

## 🧩 Clase Base (JiraToolBase)

Todas las herramientas extienden `JiraToolBase` que proporciona:

- **🔐 Autenticación**: Manejo automático de credenciales de Jira
- **🌐 Requests HTTP**: Método unificado para llamadas API
- **🔍 JQL Builder**: Construcción inteligente de queries JQL
- **📊 Formateo**: Transformación consistente de respuestas
- **❌ Manejo de Errores**: Gestión uniforme de errores

### Métodos Principales

```javascript
// Hacer request a Jira API
await tool.makeJiraRequest('/search', data, 'POST');

// Construir JQL desde lenguaje natural
const jql = tool.buildJQLFromQuery('issues abiertos', 'AIDEV');

// Formatear issue para respuesta
const formatted = tool.formatIssue(rawIssue);

// Crear respuesta MCP estándar
const response = tool.createResponse(data);

// Manejar errores consistentemente
const errorResponse = tool.handleError(error, 'operation_name');
```

## 🔧 Configuración

### Variables de Entorno Requeridas
```env
JIRA_BASE_URL=https://tu-dominio.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu-api-token
```

### Configuración de Jira
```javascript
const jiraConfig = {
  baseURL: process.env.JIRA_BASE_URL,
  email: process.env.JIRA_EMAIL,
  apiToken: process.env.JIRA_API_TOKEN,
};
```

## 📖 Ejemplos de Uso

### Búsqueda de Issues
```javascript
// Búsqueda por texto
await toolsManager.executeTool('search_jira_issues', {
  query: 'login error',
  project: 'AIDEV',
  maxResults: 5
});

// Búsqueda por clave específica
await toolsManager.executeTool('search_jira_issues', {
  query: 'AIDEV-123'
});

// JQL directo
await toolsManager.executeTool('search_jira_issues', {
  query: 'project = AIDEV AND status = "In Progress"'
});
```

### Crear Issues
```javascript
// Issue básico
await toolsManager.executeTool('create_jira_issue', {
  project: 'AIDEV',
  summary: 'Nuevo bug encontrado',
  description: 'Descripción detallada del problema',
  issueType: 'Bug',
  priority: 'High'
});

// Subtask
await toolsManager.executeTool('create_jira_issue', {
  project: 'AIDEV',
  summary: 'Subtarea del epic',
  issueType: 'Subtask',
  parentKey: 'AIDEV-123',
  assignee: 'usuario@empresa.com'
});
```

### Búsqueda Especializada
```javascript
// Solo épicas
await toolsManager.executeTool('search_epics', {
  project: 'AIDEV',
  status: 'In Progress'
});

// Solo bugs
await toolsManager.executeTool('search_by_type', {
  issueType: 'Bug',
  assignee: 'currentUser()',
  status: 'Open'
});

// Issues recientes
await toolsManager.executeTool('get_recent_issues', {
  days: 7,
  maxResults: 15
});
```

## 🔍 Esquemas de Herramientas

Cada herramienta define su esquema mediante `getSchema()`:

```javascript
static getSchema() {
  return {
    name: 'tool_name',
    description: 'Descripción de la herramienta',
    inputSchema: {
      type: 'object',
      properties: {
        // Definición de parámetros
      },
      required: ['param1', 'param2']
    }
  };
}
```

## 🚀 Extender el Paquete

### Crear Nueva Herramienta

1. **Crear archivo** (ej: `custom-tool.js`):
```javascript
import { JiraToolBase } from './base.js';

export class CustomTool extends JiraToolBase {
  static getSchema() {
    return {
      name: 'custom_tool',
      description: 'Mi herramienta personalizada',
      inputSchema: { /* esquema */ }
    };
  }

  async execute(args) {
    try {
      // Lógica de la herramienta
      const result = await this.makeJiraRequest('/custom-endpoint');
      return this.createResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'custom_tool');
    }
  }
}
```

2. **Añadir al index.js**:
```javascript
import { CustomTool } from './custom-tool.js';

// En JiraToolsManager.initializeTools()
tools.set('custom_tool', new CustomTool(this.jiraConfig));

// En getToolSchemas()
CustomTool.getSchema(),
```

## 🧪 Testing

```bash
# Desde el directorio del servidor MCP
npm run test-tools

# Probar herramienta específica
node -e "
import { JiraToolsManager } from './tools/index.js';
const manager = new JiraToolsManager(jiraConfig);
const result = await manager.executeTool('get_jira_projects');
console.log(result);
"
```

## 📊 Beneficios de la Modularización

### ✅ **Ventajas**
- **🔧 Mantenibilidad**: Cada herramienta es independiente
- **🚀 Escalabilidad**: Fácil añadir nuevas herramientas
- **🧪 Testabilidad**: Testing individual por herramienta
- **📦 Reutilización**: Herramientas pueden usarse independientemente
- **🎯 Especialización**: Cada herramienta enfocada en una tarea

### 🔄 **Comparación con Versión Monolítica**
| Aspecto | Antes | Después |
|---------|-------|---------|
| **Archivo principal** | 716 líneas | ~200 líneas |
| **Organización** | Todo en uno | 6 archivos especializados |
| **Mantenimiento** | Difícil | Fácil |
| **Testing** | Global | Individual |
| **Extensibilidad** | Limitada | Alta |

## 🔮 Roadmap

### **Próximas Herramientas**
- 📊 **analytics-tool**: Métricas y estadísticas
- 🔔 **notifications-tool**: Gestión de notificaciones
- 👥 **users-tool**: Gestión de usuarios y asignaciones
- 🏷️ **labels-tool**: Gestión de etiquetas y componentes
- 📋 **workflows-tool**: Gestión de flujos de trabajo

### **Mejoras Planificadas**
- 🔄 **Caché**: Sistema de caché para mejorar performance
- 🔒 **Validación**: Validación avanzada de parámetros
- 📊 **Métricas**: Telemetría y métricas de uso
- 🧪 **Tests**: Suite completa de tests unitarios

---

¡Este paquete de herramientas está diseñado para crecer y evolucionar con las necesidades del proyecto! 🚀
