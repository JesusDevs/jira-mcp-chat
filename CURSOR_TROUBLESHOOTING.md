# 🔧 **GUÍA DE SOLUCIÓN DE PROBLEMAS - CURSOR MCP**

## ✅ **ESTADO ACTUAL VERIFICADO**

### **📡 MCP Server:**
- ✅ Corriendo: 2 procesos activos
- ✅ Puerto: stdio (correcto para Cursor)
- ✅ Herramientas: 6 disponibles (incluyendo 3 nuevas)
- ✅ Configuración: ruta absoluta correcta

### **⚙️ Configuración Cursor:**
- ✅ Archivo: `/Users/jesus/.cursor/mcp.json` corregido
- ✅ JSON: Sintaxis válida
- ✅ Ruta: `/Users/jesus/jira-mcp-chat/mcp-server/index.js`
- ✅ Variables: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN

---

## 🎯 **COMANDOS PARA PROBAR EN CURSOR**

### **🔍 Cuando escribas `@jira` deberías ver:**

```
@jira get_jira_projects
@jira search_jira_issues
@jira get_recent_issues
@jira create_jira_issue
@jira search_epics
@jira search_by_type
```

### **📋 Comandos específicos para probar:**

#### **1. Listar proyectos:**
```
@jira get_jira_projects
```

#### **2. Buscar issues:**
```
@jira search_jira_issues query="AIDEV"
```

#### **3. Ver issues recientes:**
```
@jira get_recent_issues days=7
```

#### **4. Buscar épicas (nueva herramienta):**
```
@jira search_epics project="AIDEV"
```

#### **5. Buscar por tipo (nueva herramienta):**
```
@jira search_by_type issueType="Task" project="AIDEV"
```

#### **6. Crear issue (nueva herramienta):**
```
@jira create_jira_issue project="AIDEV" summary="Test desde Cursor"
```

---

## 🚨 **SI NO VES `@jira` EN CURSOR:**

### **Paso 1: Reinicia Cursor**
```bash
# Cierra completamente Cursor (Cmd+Q)
# Vuelve a abrirlo
```

### **Paso 2: Verifica conexión MCP**
```bash
# En terminal, verificar que el servidor esté corriendo:
ps aux | grep "node.*index.js" | grep -v grep
```

### **Paso 3: Reinicia MCP Server**
```bash
cd /Users/jesus/jira-mcp-chat
pkill -f "node.*index.js"
npm run mcp-server-stdio
```

### **Paso 4: Verifica configuración**
```bash
cat ~/.cursor/mcp.json
```

---

## 🔍 **DIAGNÓSTICO AVANZADO**

### **Test directo del MCP Server:**
```bash
cd /Users/jesus/jira-mcp-chat
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node mcp-server/index.js
```

**Resultado esperado:** JSON con las 6 herramientas

### **Verificar logs de Cursor:**
- Abre Cursor Developer Tools (Help > Toggle Developer Tools)
- Busca errores relacionados con MCP en la consola

---

## 🎯 **LO QUE DEBERÍA PASAR**

### **Cuando escribas `@`:**
- Deberías ver `@jira` en la lista de sugerencias

### **Cuando escribas `@jira`:**
- Deberías ver las 6 herramientas disponibles
- Al seleccionar una, debería autocompletarse

### **Cuando ejecutes un comando:**
- Cursor debería conectar con el MCP server
- Debería ejecutar la herramienta
- Debería mostrar los resultados de Jira

---

## 🔧 **COMANDOS DE EMERGENCIA**

### **Restart completo:**
```bash
# 1. Matar todos los procesos
pkill -f "node.*index.js"

# 2. Reiniciar MCP server
cd /Users/jesus/jira-mcp-chat
npm run mcp-server-stdio

# 3. Reiniciar Cursor
# Cmd+Q y volver a abrir
```

### **Verificación rápida:**
```bash
# Estado del server
ps aux | grep "node.*index.js" | grep -v grep

# Test de conectividad
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node /Users/jesus/jira-mcp-chat/mcp-server/index.js | head -5
```

---

## 📊 **HERRAMIENTAS DISPONIBLES**

| Herramienta | Función | Estado |
|-------------|---------|--------|
| `get_jira_projects` | Listar proyectos | ✅ Original |
| `search_jira_issues` | Búsqueda general | ✅ Original |
| `get_recent_issues` | Issues recientes | ✅ Original |
| `create_jira_issue` | Crear issues/tareas | ✨ **NUEVA** |
| `search_epics` | Buscar épicas | ✨ **NUEVA** |
| `search_by_type` | Buscar por tipo | ✨ **NUEVA** |

**¡Todo está configurado correctamente! Si no ves `@jira` en Cursor, reinicia Cursor completamente.** 🚀
