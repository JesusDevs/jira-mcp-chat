#!/bin/bash

echo "🚀 Iniciando Jira MCP Chat con auto-kill..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para matar procesos en puertos específicos
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}🔪 Matando procesos en puerto $port: $pids${NC}"
        echo $pids | xargs kill -9 2>/dev/null
        sleep 1
    else
        echo -e "${GREEN}✅ Puerto $port está libre${NC}"
    fi
}

# Matar procesos en puertos comunes
echo -e "${BLUE}🔍 Verificando puertos...${NC}"
kill_port 3000
kill_port 3001

# Matar procesos de Next.js y Node que puedan estar corriendo
echo -e "${YELLOW}🔪 Matando procesos de Next.js y Node relacionados...${NC}"
pkill -f "next dev" 2>/dev/null || true
pkill -f "jira-mcp-chat" 2>/dev/null || true

sleep 2

# Verificar variables de entorno
echo -e "${BLUE}🔧 Verificando configuración...${NC}"
if [ -z "$JIRA_BASE_URL" ] || [ -z "$JIRA_EMAIL" ] || [ -z "$JIRA_API_TOKEN" ]; then
    echo -e "${RED}❌ Variables de entorno faltantes. Verificar .env${NC}"
    echo "Necesarias: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN"
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️ GEMINI_API_KEY no configurada (Ollama será el fallback)${NC}"
fi

# Iniciar el servidor
echo -e "${GREEN}🚀 Iniciando chat-client en puerto 3001...${NC}"
cd chat-client
npm run dev-safe

echo -e "${RED}🛑 Servidor detenido${NC}"
