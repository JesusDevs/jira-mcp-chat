# 🧪 Guía de Pruebas Manuales - Nuevas Herramientas MCP

## ✅ **¡3 NUEVAS HERRAMIENTAS AGREGADAS!**

### 🔧 **Herramientas implementadas:**
1. **`create_jira_issue`** - Crear issues, bugs, tasks, subtareas, épicas
2. **`search_epics`** - Búsqueda especializada de épicas  
3. **`search_by_type`** - Búsqueda por tipo específico de issue

---

## 🧪 **PRUEBAS MANUALES RECOMENDADAS**

### **1. 🔍 Búsqueda de Épicas**

#### **Comandos a probar:**
```
Busca todas las épicas del proyecto AIDEV
```
```
Muestra épicas sobre notificaciones
```
```
Épicas en estado "Por hacer"
```

#### **✅ Resultado esperado:**
- Usa herramienta: `search_epics`
- Encuentra épicas específicamente (no otros tipos)
- Filtra correctamente por proyecto/estado

---

### **2. 📋 Búsqueda por Tipo**

#### **Comandos a probar:**
```
Busca todas las tareas del proyecto AIDEV
```
```
Muestra tasks en progreso
```
```
Lista todas las subtareas
```

#### **✅ Resultado esperado:**
- Usa herramienta: `search_by_type`
- Filtra por tipo específico (Task, Subtask, etc.)
- Respeta filtros adicionales (proyecto, estado)

---

### **3. 🔧 Creación de Issues**

#### **⚠️ IMPORTANTE: Solo en modo de desarrollo/test**

#### **Comandos a probar:**
```
Crea una tarea en AIDEV sobre "Documentar API"
```
```
Crea un bug en SOP con prioridad alta sobre "Error de login"
```
```
Crea una subtarea para AIDEV-6 sobre "Revisar diseño"
```

#### **✅ Resultado esperado:**
- Usa herramienta: `create_jira_issue`
- Crea el issue correctamente
- Devuelve key y URL del nuevo issue

---

## 🎯 **TESTS ESPECÍFICOS QUE YA FUNCIONAN**

### **✅ Épicas encontradas en AIDEV:**
- ✅ AIDEV-5: Épica de Notificaciones Push
- ✅ AIDEV-4: Épica de Notificaciones Push (duplicada)
- ✅ AIDEV-2: test

### **✅ Tasks encontradas en AIDEV:**
- ✅ AIDEV-6: Diseño UX para Notificaciones Push
- ✅ AIDEV-3: gestor

---

## 🚀 **COMANDOS PARA PROBAR EN TU CHAT**

### **Abre:** `http://localhost:3000`

### **Prueba estos comandos:**

#### **1. Épicas:**
```
🔍 "Busca todas las épicas del proyecto AIDEV"
```

#### **2. Tasks:**
```
📋 "Busca todas las tareas del proyecto AIDEV"
```

#### **3. Búsqueda inteligente:**
```
🎯 "Muestra épicas sobre notificaciones"
```

#### **4. Creación (cuidado - crea real):**
```
⚠️ "Crea una tarea de prueba en AIDEV llamada 'Test MCP Tools'"
```

---

## 🔍 **VERIFICACIÓN DE HERRAMIENTAS**

### **Logs a buscar en consola:**

```
✅ Direct MCP Client ready with 6 tools: 
search_jira_issues, get_jira_projects, get_recent_issues, 
create_jira_issue, search_epics, search_by_type
```

```
🔧 Executing direct tool: search_epics
🔧 Executing direct tool: search_by_type  
🔧 Executing direct tool: create_jira_issue
```

---

## 🎉 **MEJORAS IMPLEMENTADAS**

### **🚀 Prompt mejorado:**
- Reconoce automáticamente tipo de búsqueda solicitada
- Usa la herramienta más apropiada
- Entiende comandos en español
- Maneja creación vs búsqueda

### **🔧 Herramientas robustas:**
- Validación de tipos de issue
- Manejo de errores mejorado
- Filtros múltiples (proyecto, estado, assignee)
- Creación con subtareas y assignees

### **🧪 Testing:**
- Script automatizado de pruebas
- Validación de herramientas correctas
- Casos de uso reales

---

## 🎯 **PRÓXIMOS PASOS SUGERIDOS**

1. **Probar manualmente cada herramienta**
2. **Crear algunos issues de prueba**
3. **Validar filtros avanzados**
4. **Probar en Cursor con MCP stdio**
5. **Expandir a más tipos de issue si necesario**

¡Las 6 herramientas MCP están listas y funcionando! 🚀
