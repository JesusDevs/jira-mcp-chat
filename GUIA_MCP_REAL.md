# 🚀 Guía de MCP Real - Chat + Cursor

## ✅ ¿Qué se ha refactorizado?

### **Antes (Simulado):**
```
Chat Client → mcp-client.ts (simulado) → Axios directo → Jira API
```

### **Ahora (MCP Real):**
```
Chat Client → RealMCPClient → MCP Server → Jira API
Cursor      → MCP Server → Jira API
```

## 🔧 Archivos modificados/creados:

### 1. **`chat-client/src/lib/real-mcp-client.ts`** ✨ NUEVO
- Cliente MCP real usando protocolo stdio
- Maneja conexión/desconexión automática
- Singleton para reutilización

### 2. **`chat-client/src/lib/mcp-client.ts`** 🔄 REFACTORIZADO  
- Usa `RealMCPClient` en lugar de simulación
- Ya no hace llamadas directas a Jira
- Herramientas se cargan dinámicamente del servidor

### 3. **`mcp-server/index.js`** 🔄 MEJORADO
- Mejores mensajes de error y logs
- Nueva herramienta: `get_recent_issues`
- Query inteligente que detecta JQL, keys, o texto
- Búsqueda más flexible

### 4. **`.cursor-mcp.json`** ✨ NUEVO
- Configuración para usar el MCP server en Cursor
- Variables de entorno automáticas

## 🚀 Cómo usar:

### **Con tu Chat (Next.js):**
```bash
# Terminal 1: Desde el directorio raíz
npm run dev

# Esto ahora usa MCP real automaticamente
```

### **Con Cursor:**
```bash
# 1. Copiar configuración a tu directorio home
cp .cursor-mcp.json ~/.cursor-mcp.json

# 2. Crear .env en home si no existe
cp .env ~/.env

# 3. Restart Cursor
# 4. En cualquier proyecto, podrás usar @jira para buscar issues
```

## 🔧 Herramientas disponibles:

### 1. **`search_jira_issues`**
- **Query inteligente**: Detecta automáticamente el tipo
- **Issue key**: `PROJ-123` → busca issue específico
- **JQL**: `project = TEST AND status = Open`
- **Texto**: `bug login` → busca en summary/description
- **Filtros opcionales**: `status`, `project`

### 2. **`get_jira_projects`**
- Lista todos los proyectos disponibles
- Opcional: `recent = true` para proyectos recientes

### 3. **`get_recent_issues`** ✨ NUEVA
- Issues recientes ordenados por fecha
- Opcional: `days` (default: 30), `maxResults` (default: 10)

## 💡 Ejemplos de uso:

### En tu chat:
```
🔍 "Busca AIDEV-6"
🔍 "Issues abiertos en proyecto TEST"  
🔍 "Muestra bugs de alta prioridad"
🔍 "Issues recientes de los últimos 7 días"
🔍 "¿Qué proyectos están disponibles?"
```

### En Cursor:
```
@jira busca issues abiertos
@jira muestra PROJ-123
@jira lista proyectos disponibles
@jira issues recientes
```

## 🔄 Ventajas del MCP Real:

### ✅ **Reutilización:**
- El mismo servidor funciona en chat y Cursor
- Protocolo estándar compatible con Claude, etc.

### ✅ **Separación de responsabilidades:**
- Cliente solo maneja UI/UX
- Servidor maneja lógica de Jira
- Fácil agregar más servidores (GitHub, Slack)

### ✅ **Escalabilidad:**
- Agregar nuevos tools solo requiere modificar el servidor
- Cliente se adapta automáticamente
- Configuración centralizada

### ✅ **Debugging:**
- Logs claros del servidor MCP
- Errores más específicos
- Estado de conexión visible

## 🐛 Troubleshooting:

### **Error: "MCP Client not connected"**
```bash
# Verificar que el servidor MCP se inicia correctamente
cd mcp-server
node index.js

# Deberías ver:
# ✅ Jira MCP Server running on stdio
# 🔧 Available tools: search_jira_issues, get_jira_projects, get_recent_issues
```

### **Error en Cursor: "MCP server not found"**
1. Verificar que `.cursor-mcp.json` está en `~/.cursor-mcp.json`
2. Verificar variables de entorno en `~/.env`
3. Reiniciar Cursor completamente

### **Logs del servidor MCP:**
```bash
# Los logs del servidor aparecen en stderr
# En tu chat, abre DevTools → Console para verlos
```

## 🔮 Próximos pasos sugeridos:

1. **Agregar más MCP servers:**
   - GitHub (repos, issues, PRs)
   - Slack (mensajes, canales)
   - Notion (páginas, bases de datos)

2. **Implementar RAG:**
   - Usar `rag-implementation.js` que creé
   - Indexar issues para búsqueda semántica

3. **Configurar múltiples servidores:**
   - Usar `mcp-aggregator.js` y `mcp-config.json`
   - Load balancing y fallback

4. **Optimizaciones:**
   - Cache de resultados
   - Paginación avanzada
   - Filtros más sofisticados

## 🎯 ¡Todo listo!

Tu proyecto ahora usa **MCP real** y es compatible tanto con tu chat como con Cursor. Las herramientas son las mismas, pero ahora funcionan con el protocolo estándar MCP.
