# 🚀 Guía de Instalación - Ludo Universal MCP System

## 📋 Requisitos Previos

- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **Git** - [Descargar aquí](https://git-scm.com/)
- **Cuenta Jira** (para usar MCP Server)
- **Ollama** (opcional) - [Descargar aquí](https://ollama.ai/)

## ⚡ Instalación Rápida

### 1. **Clonar y Configurar**
```bash
# Clonar repositorio
git clone https://github.com/JesusDevs/jira-mcp-chat.git
cd jira-mcp-chat

# Instalación automática (instala todo)
./install.sh
```

### 2. **Configurar Credenciales**
```bash
# Editar archivo de configuración
nano .env
```

**Contenido mínimo del .env:**
```env
# === JIRA (Requerido para MCP Server) ===
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu_token_de_jira

# === AI (Opcional) ===
GEMINI_API_KEY=tu_gemini_api_key
```

### 3. **Obtener Token de Jira**
1. Ve a: https://id.atlassian.com/manage-profile/security/api-tokens
2. Crea un nuevo token
3. Cópialo en `JIRA_API_TOKEN`

### 4. **Iniciar Sistema**
```bash
# Opción 1: Modo desarrollo (recomendado)
./dev.sh

# Opción 2: Modo producción
./start.sh

# Opción 3: Manual (si hay problemas)
cd mcp-server && npm start &
cd ../chat-client && npm run dev
```

### 5. **Acceder al Sistema**
Abre en tu navegador: **http://localhost:3001**

## 🎯 Uso del Sistema de Templates

### **Crear Issues con Templates**

En el chat, puedes usar comandos como:

```
"Crea una épica de producto para el nuevo sistema de login"

"Lista todos los templates disponibles"

"Usa el template de bug para reportar problema de carga lenta"

"Crea una historia de usuario para el botón de compartir"
```

### **Templates Disponibles**

#### 🎯 **Épicas**
- **product-epic**: Funcionalidades de producto
- **technical-epic**: Mejoras técnicas y arquitectura

#### 📝 **Historias de Usuario**
- **feature-story**: Nuevas funcionalidades
- **bug-story**: Corrección de bugs

#### 👥 **Contextos de Equipo**
- **frontend-team**: Estándares frontend (React, TypeScript)
- **backend-team**: Estándares backend (Node.js, APIs)

#### ✅ **Definition of Done**
- **epic-dod**: Criterios para épicas
- **story-dod**: Criterios para historias

### **Ubicación de Templates**
```
mcp-server/templates/
├── epics/           # Templates de épicas
├── hdus/            # Historias de usuario
├── team-context/    # Contextos de equipos
├── dod/             # Definition of Done
└── README.md        # Guía completa de templates
```

## 🛠️ Personalización

### **Agregar Nuevo Template**

1. **Crear archivo JSON** en `mcp-server/templates/[categoria]/`
2. **Seguir estructura:**
```json
{
  "name": "Mi Template",
  "description": "Descripción",
  "issueType": "Story",
  "fields": {
    "summary": "{mi_variable}",
    "description": "Descripción con {mi_variable}"
  },
  "variables": {
    "mi_variable": "Descripción de la variable"
  }
}
```
3. **Reiniciar MCP Server**

### **Modificar Templates Existentes**
1. Editar archivo JSON correspondiente
2. Reiniciar MCP Server

## 🆘 Solución de Problemas

### **Error: Puerto 3001 ocupado**
```bash
npm run kill-dev  # Desde chat-client/
```

### **MCP Server no se conecta**
- Verifica credenciales en `.env`
- Confirma que Jira URL es correcta
- Revisa token de API válido

### **Templates no aparecen**
- Verifica sintaxis JSON
- Reinicia MCP Server
- Revisa logs en terminal

### **Dependencias faltantes**
```bash
# Reinstalar todo
npm run clean && npm run setup  # Desde cada módulo
```

## 📚 Módulos del Sistema

### **💬 Chat Client** (Puerto 3001)
- Interfaz web para interactuar con MCP
- Compatible con Gemini, OpenAI, Ollama
- Auto-detección de servidores MCP

### **🔧 MCP Server** (stdio)
- Herramientas de Jira integradas
- Sistema de templates avanzado
- Configuración flexible

### **🌐 n8n-mcp** (Global)
- Herramientas de automatización n8n
- Instalado globalmente
- Opcional pero recomendado

## 🎯 Próximos Pasos

1. **Configura tu primer proyecto** en Jira
2. **Prueba crear una épica** con template
3. **Personaliza templates** según tu equipo
4. **Integra con tu workflow** existente
5. **Explora herramientas de n8n** (opcional)

## 📖 Documentación Adicional

- `chat-client/README.md` - Guía del cliente
- `mcp-server/README.md` - Guía del servidor  
- `mcp-server/templates/README.md` - Guía completa de templates
- `README.md` - Documentación general

---

¿Problemas? Abre un issue en GitHub o consulta los logs del sistema.
