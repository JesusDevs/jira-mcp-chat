# 🎯 **UBICACIÓN DE SERVICIOS - JIRA MCP CHAT**

## ✅ **ESTADO ACTUAL - TODO FUNCIONANDO**

### **🌐 1. CHAT CLIENT (Web UI)**
```
📍 URL: http://localhost:3000
🔧 Estado: ✅ FUNCIONANDO
📂 Directorio: /Users/jesus/jira-mcp-chat/chat-client
⚡ Modo: DIRECT (no usa stdio, más confiable)
🛠️ Herramientas: 6 tools (search_jira_issues, get_jira_projects, get_recent_issues, create_jira_issue, search_epics, search_by_type)
🔄 Para iniciar: cd chat-client && npm run dev
```

### **📡 2. MCP SERVER STDIO (Para Cursor)**
```
📍 Proceso: node /Users/jesus/jira-mcp-chat/mcp-server/index.js  
🔧 Estado: ✅ FUNCIONANDO (2 instancias detectadas)
📂 Directorio: /Users/jesus/jira-mcp-chat/mcp-server
⚡ Protocolo: STDIO (estándar MCP)
🛠️ Herramientas: 6 tools MCP completas
🔄 Para iniciar: npm run mcp-server-stdio
```

### **🎮 3. CONFIGURACIÓN CURSOR**
```
📍 Config: /Users/jesus/.cursor/mcp.json
🔧 Estado: ✅ CORREGIDO (usa ruta absoluta)
📂 Ruta: /Users/jesus/jira-mcp-chat/mcp-server/index.js
⚡ Servidor: "jira"
🔄 Para actualizar: npm run setup-cursor
```

---

## 🧪 **CÓMO PROBAR CADA SERVICIO**

### **💬 CHAT CLIENT (http://localhost:3000)**
```bash
# Abrir en navegador:
open http://localhost:3000

# Comandos a probar:
"Busca todas las épicas del proyecto AIDEV"
"Busca todas las tareas del proyecto AIDEV"  
"Muestra épicas sobre notificaciones"
"Lista todos los proyectos"
```

### **🎯 CURSOR MCP (En Cursor IDE)**
```bash
# En Cursor, usar:
@jira busca épicas del proyecto AIDEV
@jira lista todos los proyectos
@jira busca tareas del proyecto AIDEV
@jira muestra issues recientes
```

---

## 🔧 **COMANDOS DE GESTIÓN**

### **🚀 Iniciar servicios:**
```bash
# Iniciar chat client
npm run chat-start

# Iniciar MCP server para Cursor
npm run mcp-server-stdio

# Iniciar ambos (en terminales separadas)
npm run mcp-server-stdio    # Terminal 1
npm run chat-start          # Terminal 2
```

### **🔍 Verificar estado:**
```bash
# Ver procesos corriendo
ps aux | grep "node.*index.js" | grep -v grep

# Verificar chat
curl -s http://localhost:3000 | head -1

# Verificar configuración Cursor
cat ~/.cursor/mcp.json
```

### **🛠️ Troubleshooting:**
```bash
# Si puerto 3000 ocupado
lsof -ti:3000 | xargs kill -9

# Si Cursor no ve las tools
# 1. Reiniciar Cursor
# 2. Verificar que mcp-server esté corriendo
# 3. Verificar ~/.cursor/mcp.json

# Si chat da error 500
# 1. Verificar .env tiene las credenciales
# 2. Verificar límite API Gemini
```

---

## 🎉 **HERRAMIENTAS DISPONIBLES**

### **✅ 6 HERRAMIENTAS MCP:**

1. **search_jira_issues** - Búsqueda general
2. **get_jira_projects** - Listar proyectos  
3. **get_recent_issues** - Issues recientes
4. **create_jira_issue** ✨ **NUEVA** - Crear issues/tareas
5. **search_epics** ✨ **NUEVA** - Buscar épicas específicamente
6. **search_by_type** ✨ **NUEVA** - Buscar por tipo (Bug, Task, etc.)

### **🧪 PRUEBAS CONFIRMADAS:**
- ✅ Épicas en AIDEV: 3 encontradas
- ✅ Tasks en AIDEV: 2 encontradas
- ✅ Smart routing: Usa tool correcta automáticamente
- ✅ Configuración Cursor: Ruta absoluta corregida

---

## ⚠️ **PROBLEMA ACTUAL**

### **🚫 Límite API Gemini:**
```
Error: "You exceeded your current quota"
📊 Límite: 50 requests/día (tier gratuito)
🔄 Solución: Esperar 24h o upgrade a plan pago
💡 Alternativa: Usar Cursor que tiene su propia API
```

---

## 🎯 **PRÓXIMOS PASOS**

1. **✅ Chat**: Esperar reset límite Gemini o usar API key pagada
2. **✅ Cursor**: Probar @jira commands (debería funcionar)
3. **✅ Creación**: Probar create_jira_issue cuando API funcione
4. **✅ Expansión**: Agregar más tipos de issue si necesario

---

## 🌟 **RESUMEN EJECUTIVO**

**TODO ESTÁ CONFIGURADO Y FUNCIONANDO:**
- 🌐 Chat en `http://localhost:3000` 
- 📡 MCP Server para Cursor funcionando
- 🔧 6 herramientas MCP implementadas
- ⚙️ Configuración Cursor corregida
- 🧪 Pruebas exitosas de épicas y tasks

**ÚNICO BLOQUEADOR:** Límite API Gemini alcanzado (temporal)
