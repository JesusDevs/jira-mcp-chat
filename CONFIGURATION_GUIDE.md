# 🔧 **Guía de Configuración - Jira MCP Chat**

Esta guía te ayudará a configurar el sistema para diferentes organizaciones y casos de uso.

---

## 🏢 **Configuración por Tipo de Organización**

### **💻 Equipos de Desarrollo de Software**

#### **Proyectos típicos:**
- `DEV` - Desarrollo principal
- `BUGS` - Gestión de errores
- `INFRA` - Infraestructura
- `QA` - Testing y calidad

#### **Comandos más usados:**
```bash
# En el chat o Cursor
"Busca bugs críticos en DEV"
"Crea una tarea en INFRA sobre monitoreo"
"Lista épicas pendientes en QA"
"Busca issues asignados a mi equipo"
```

#### **Configuración recomendada (.env):**
```bash
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=dev-team@empresa.com
JIRA_API_TOKEN=ATATT3xFfGF0...

# Proyectos principales
DEFAULT_PROJECT=DEV
TEAM_PROJECTS=DEV,BUGS,INFRA,QA
```

---

### **🎨 Equipos de Marketing**

#### **Proyectos típicos:**
- `MKT` - Campañas de marketing
- `CONTENT` - Creación de contenido
- `SOCIAL` - Redes sociales
- `EVENTS` - Eventos y webinars

#### **Comandos más usados:**
```bash
"Lista proyectos de marketing"
"Crea una campaña en MKT para Q1"
"Busca contenido pendiente de revisión"
"Épicas de eventos para este trimestre"
```

#### **Configuración recomendada:**
```bash
JIRA_BASE_URL=https://marketing-empresa.atlassian.net
JIRA_EMAIL=marketing@empresa.com
JIRA_API_TOKEN=ATATT3xFfGF0...

DEFAULT_PROJECT=MKT
TEAM_PROJECTS=MKT,CONTENT,SOCIAL,EVENTS
```

---

### **🏗️ Equipos de Construcción/Arquitectura**

#### **Proyectos típicos:**
- `CONST` - Construcción
- `PLAN` - Planificación
- `PERM` - Permisos y regulaciones
- `MAT` - Gestión de materiales

#### **Comandos más usados:**
```bash
"Busca permisos pendientes en PERM"
"Crea tarea de inspección en CONST"
"Lista materiales necesarios en MAT"
"Estado de planificación en PLAN"
```

---

### **🏥 Equipos de Salud**

#### **Proyectos típicos:**
- `PAC` - Gestión de pacientes
- `CITAS` - Sistema de citas
- `MED` - Gestión médica
- `ADM` - Administración

#### **Comandos más usados:**
```bash
"Issues críticos en PAC"
"Mejoras pendientes en CITAS"
"Tareas administrativas en ADM"
"Sistema médico en MED"
```

---

## 🛠️ **Configuración Técnica Detallada**

### **1. Variables de Entorno Avanzadas**

#### **Archivo `.env` completo:**
```bash
# === CONFIGURACIÓN JIRA ===
JIRA_BASE_URL=https://tu-organizacion.atlassian.net
JIRA_EMAIL=tu-email@organizacion.com
JIRA_API_TOKEN=ATATT3xFfGF0rLuQf5K8ySjmT60YdZBz_SB3d6Qx88CUa7B2PMa35CjUOQviQLxH9g0MmSqdpGjFlflTHIp8AIL1bBP-bcdBMSSOKbuvpsKXR0sXHJX-zim_Jfja9CJSmYz4lGiJ8xm5LyjnpE8nIEGyrKtWNnUEZ24iSHlz96HRAMjxUZiTZuQ=04299DBA

# === CONFIGURACIÓN IA ===
GEMINI_API_KEY=AIzaSyC...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant...
OLLAMA_API_URL=http://localhost:11434

# === CONFIGURACIÓN MCP ===
USE_STDIO_MCP=false
USE_UNIVERSAL_AI=true
DEFAULT_AI_PROVIDER=ollama
DEFAULT_AI_MODEL=deepseek-coder:latest

# === CONFIGURACIÓN PERSONALIZADA ===
DEFAULT_PROJECT=TU_PROYECTO_PRINCIPAL
TEAM_PROJECTS=PROJ1,PROJ2,PROJ3
ORGANIZATION_NAME=Tu Organización
TIMEZONE=America/Mexico_City
```

### **2. Configuración Multi-MCP para Cursor**

#### **Archivo `~/.cursor/mcp.json`:**
```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/ruta/absoluta/a/jira-mcp-chat/mcp-server/index.js"],
      "env": {
        "JIRA_BASE_URL": "${JIRA_BASE_URL}",
        "JIRA_EMAIL": "${JIRA_EMAIL}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}"
      }
    },
    "weather": {
      "command": "uv",
      "args": [
        "--directory",
        "/ruta/absoluta/a/weather-mcp",
        "run",
        "weather.py"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["@github/mcp-server"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_ORG": "${GITHUB_ORG}"
      }
    },
    "database": {
      "command": "node",
      "args": ["/ruta/a/database-mcp/server.js"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}",
        "DB_PASSWORD": "${DB_PASSWORD}"
      }
    }
  }
}
```

### **3. Configuración Chat Client Multi-MCP**

#### **Archivo `chat-client/mcp-config.json`:**
```json
{
  "mcpServers": {
    "jira": {
      "name": "Jira Management",
      "description": "Gestión completa de Jira",
      "type": "local",
      "command": "node",
      "args": ["../mcp-server/index.js"],
      "enabled": true,
      "tools": [
        "get_jira_projects",
        "search_jira_issues",
        "get_recent_issues", 
        "create_jira_issue",
        "search_epics",
        "search_by_type"
      ]
    },
    "weather": {
      "name": "Weather Service",
      "type": "remote",
      "url": "ws://api.weather.com/mcp",
      "enabled": false,
      "auth": {
        "type": "bearer",
        "token": "${WEATHER_API_KEY}"
      }
    }
  },
  "defaultServer": "jira",
  "settings": {
    "autoConnect": true,
    "timeout": 30000,
    "retryAttempts": 3
  }
}
```

---

## 🎯 **Casos de Uso Específicos**

### **🚀 Startup Tecnológica**

#### **Setup rápido:**
```bash
# 1. Clonar y configurar
git clone <repo>
cd jira-mcp-chat
npm run setup

# 2. Configurar para startup
cat > .env << EOF
JIRA_BASE_URL=https://startup.atlassian.net
JIRA_EMAIL=team@startup.com
JIRA_API_TOKEN=tu-token
DEFAULT_PROJECT=PROD
TEAM_PROJECTS=PROD,MVP,BUGS
ORGANIZATION_NAME=Tu Startup
EOF

# 3. Iniciar
npm run dev
```

#### **Comandos típicos:**
```bash
"Crea épica para MVP versión 2.0"
"Bugs críticos en PROD"
"Lista tareas pendientes del sprint"
"Asigna issue PROD-123 a desarrollador"
```

---

### **🏢 Empresa Grande**

#### **Setup empresarial:**
```bash
# 1. Configuración avanzada
cat > .env << EOF
JIRA_BASE_URL=https://empresa-corp.atlassian.net
JIRA_EMAIL=sistemas@empresa.com
JIRA_API_TOKEN=token-corporativo
DEFAULT_PROJECT=CORP
TEAM_PROJECTS=CORP,HR,FIN,OPS,IT
ORGANIZATION_NAME=Empresa Corporativa
USE_UNIVERSAL_AI=true
DEFAULT_AI_PROVIDER=azure-openai
EOF

# 2. Configurar múltiples MCP servers
cp mcp-config.enterprise.json chat-client/mcp-config.json

# 3. Configurar Cursor corporativo
cp cursor-config.enterprise.json ~/.cursor/mcp.json
```

#### **Comandos empresariales:**
```bash
"Issues de seguridad en IT"
"Reportes financieros pendientes en FIN"
"Onboarding tareas en HR"
"Operaciones críticas en OPS"
```

---

### **🎨 Agencia Creativa**

#### **Setup creativo:**
```bash
cat > .env << EOF
JIRA_BASE_URL=https://agencia-creativa.atlassian.net
JIRA_EMAIL=creative@agencia.com
JIRA_API_TOKEN=token-creativo
DEFAULT_PROJECT=CREATIVE
TEAM_PROJECTS=CREATIVE,CAMPAIGNS,DESIGN,VIDEO
ORGANIZATION_NAME=Agencia Creativa
EOF
```

#### **Comandos creativos:**
```bash
"Campañas activas en CAMPAIGNS"
"Diseños pendientes de aprobación"
"Videos en producción en VIDEO"
"Briefings nuevos en CREATIVE"
```

---

## 🔒 **Configuración de Seguridad**

### **1. Gestión de Tokens API:**

#### **Crear token Jira:**
1. Ve a: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Nombra: "MCP Chat Integration"
4. Copia el token y guárdalo en `.env`

#### **Rotar tokens periódicamente:**
```bash
# Script de rotación
#!/bin/bash
echo "🔄 Rotando tokens de API..."
# 1. Generar nuevo token en Jira
# 2. Actualizar .env
# 3. Reiniciar servicios
npm run restart-all
```

### **2. Variables de Entorno Seguras:**

#### **Para desarrollo:**
```bash
# .env.development
JIRA_BASE_URL=https://dev-empresa.atlassian.net
JIRA_EMAIL=dev@empresa.com
JIRA_API_TOKEN=token-desarrollo
```

#### **Para producción:**
```bash
# .env.production  
JIRA_BASE_URL=https://empresa.atlassian.net
JIRA_EMAIL=prod@empresa.com
JIRA_API_TOKEN=token-produccion
```

---

## 📊 **Optimización de Rendimiento**

### **1. Configuración para equipos grandes:**

```json
{
  "settings": {
    "timeout": 45000,
    "retryAttempts": 5,
    "loadBalancing": true,
    "cacheEnabled": true,
    "maxConcurrentRequests": 10
  }
}
```

### **2. Configuración para uso intensivo:**

```bash
# Variables de optimización
MAX_RESULTS_PER_QUERY=100
CACHE_TTL=300
RATE_LIMIT_PER_MINUTE=60
BATCH_SIZE=25
```

---

## 🚨 **Troubleshooting por Organización**

### **Problemas comunes en Startups:**
- **Token expirado**: Rotar cada 6 meses
- **Límites de API**: Usar cache y batch requests
- **Performance**: Configurar timeouts menores

### **Problemas en Empresas Grandes:**
- **Permisos complejos**: Configurar roles específicos
- **Multiple instancias**: Usar configuración por entorno
- **Seguridad**: Auditar accesos regularmente

### **Problemas en Agencias:**
- **Múltiples clientes**: Configurar proyectos separados
- **Colaboración externa**: Tokens con permisos limitados
- **Workflows personalizados**: Adaptar herramientas MCP

---

## ✅ **Checklist de Configuración**

### **Para cualquier organización:**

- [ ] **Credenciales configuradas** en `.env`
- [ ] **Proyectos identificados** y listados
- [ ] **Permisos verificados** en Jira
- [ ] **Chat funcionando** en puerto 3001
- [ ] **MCP server activo** para Cursor
- [ ] **Variables de entorno** seguras
- [ ] **Backup de configuración** realizado
- [ ] **Equipo entrenado** en comandos básicos
- [ ] **Documentación personalizada** creada
- [ ] **Monitoreo configurado** (opcional)

### **Comandos de verificación:**
```bash
# Verificar configuración
npm run test-tools

# Verificar conexiones
npm run mcp-status

# Verificar permisos
curl -u $JIRA_EMAIL:$JIRA_API_TOKEN \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

---

## 🎓 **Capacitación del Equipo**

### **Comandos básicos para entrenar:**

1. **"Lista todos los proyectos"**
2. **"Busca issues asignados a mí"**
3. **"Crea una tarea en [PROYECTO]"**
4. **"Épicas pendientes en [PROYECTO]"**
5. **"Bugs con prioridad alta"**

### **Workflow recomendado:**
1. **Morning standup**: "Issues asignados a mí"
2. **Planning**: "Épicas del sprint"
3. **Development**: "Crea subtarea para [ISSUE]"
4. **Review**: "Bugs encontrados en [PROYECTO]"
5. **Retrospective**: "Issues completados esta semana"

¡Con esta configuración, tu organización estará lista para gestionar Jira de forma inteligente! 🚀
