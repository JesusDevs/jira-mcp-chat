# 🚀 Guía de Uso - Jira MCP Chat

## 📋 Arquitectura Correcta

### **🎯 Dos servicios independientes:**

```
┌─────────────────────┐    ┌─────────────────────┐
│    Chat Web         │    │   MCP Server        │
│   (modo directo)    │    │   (stdio puro)      │
│   Puerto 3000       │    │   Para Cursor       │
└─────────────────────┘    └─────────────────────┘
```

---

## 🌐 **Para tu Chat Web:**

### **Iniciar chat:**
```bash
npm run chat-start
# O manualmente:
npm run mcp-direct
cd chat-client && npm run dev
```

### **Usar chat:**
- 🌐 **URL**: http://localhost:3000
- 💬 **Ejemplos**:
  - "Lista proyectos disponibles"
  - "Busca issues recientes" 
  - "Muestra AIDEV-6"
  - "Issues abiertos en proyecto TEST"

---

## 📡 **Para Cursor (MCP stdio):**

### **1. Iniciar MCP Server:**
```bash
# En terminal separada:
npm run mcp-server-stdio
```

Verás:
```
📡 Starting MCP Server for Cursor/stdio...
✅ Jira MCP Server running on stdio
🔧 Available tools: search_jira_issues, get_jira_projects, get_recent_issues
🌐 Jira URL: https://aetherdev.atlassian.net
👤 Jira User: leon.rodriguez.ore@gmail.com
```

### **2. Configurar Cursor:**
```bash
npm run setup-cursor
```

### **3. Usar en Cursor:**
```
@jira lista proyectos
@jira busca issues abiertos
@jira muestra issues recientes
```

---

## 🔧 **Comandos de gestión:**

### **Estado y configuración:**
```bash
npm run mcp-status          # Ver modo actual
npm run mcp-direct          # Configurar modo directo (chat)
npm run mcp-stdio           # Configurar modo stdio (no necesario)
```

### **Desarrollo:**
```bash
npm run dev                 # Chat + instalar deps
npm run mcp-test           # Probar MCP server solo
npm run setup              # Instalar todo
```

---

## 🎯 **Casos de uso típicos:**

### **Desarrollo diario:**
```bash
# Terminal 1: Chat web
npm run chat-start

# Terminal 2: MCP para Cursor (opcional)
npm run mcp-server-stdio
```

### **Solo chat web:**
```bash
npm run chat-start
# Abre: http://localhost:3000
```

### **Solo Cursor:**
```bash
npm run mcp-server-stdio
# Usa: @jira en Cursor
```

---

## ✅ **Estado recomendado:**

- ✅ **Chat**: Modo directo (más confiable)
- ✅ **MCP Server**: stdio independiente (para Cursor)
- ✅ **Ambos** comparten mismas herramientas y datos

## 🐛 **Troubleshooting:**

### **Chat no funciona:**
```bash
npm run mcp-direct && npm run dev
```

### **Cursor no conecta:**
```bash
npm run setup-cursor
npm run mcp-server-stdio
```

### **Puerto ocupado:**
```bash
pkill -f "next dev"
npm run chat-start
```
