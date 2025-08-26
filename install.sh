#!/bin/bash

# 🚀 Ludo Universal Installer
# Instala todo el ecosistema Ludo (Chat Client + MCP Server)

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"; }

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🚀 LUDO INSTALLER                         ║"
echo "║              Universal MCP Chat System                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado"
    info "Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
if [ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "18.0.0" ]; then
    error "Node.js versión 18+ requerida. Versión actual: $NODE_VERSION"
    exit 1
fi

log "✅ Node.js $NODE_VERSION detectado"

# Instalar dependencias raíz
log "📦 Instalando dependencias del proyecto..."
npm install

# Instalar MCP Server
log "🔧 Configurando Ludo MCP Server..."
cd mcp-server && npm run setup && cd ..

# Instalar Chat Client
log "💬 Configurando Ludo Chat Client..."
cd chat-client && npm run setup && cd ..

# Instalar n8n-mcp globalmente (opcional)
log "🌐 Instalando n8n-mcp globalmente..."
npm install -g n8n-mcp || warn "n8n-mcp no se pudo instalar globalmente (opcional)"

# Crear configuración básica
log "📝 Creando configuración básica..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# 🔧 LUDO UNIVERSAL CONFIGURATION

# === JIRA CONFIGURATION (Para MCP Server) ===
# Obtén tu token desde: https://id.atlassian.com/manage-profile/security/api-tokens
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu_token_de_jira

# === AI PROVIDERS (Para Chat Client) ===
# Gemini (Recomendado - Gratis)
GEMINI_API_KEY=tu_gemini_api_key

# OpenAI (Opcional - De pago)
# OPENAI_API_KEY=tu_openai_api_key

# === CONFIGURACIÓN GENERAL ===
PORT=3001
LOG_LEVEL=info
EOF
    log "✅ Archivo .env creado"
else
    warn "El archivo .env ya existe"
fi

# Crear script de inicio
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Ludo Universal System..."

# Verificar configuración
if grep -q "tu-empresa.atlassian.net" .env 2>/dev/null; then
    echo "⚠️  Configura tus credenciales en el archivo .env"
    echo "📝 Edita: .env"
    echo ""
fi

# Iniciar MCP Server en background
echo "🔧 Iniciando Ludo MCP Server..."
cd mcp-server && npm start &
MCP_PID=$!
cd ..

# Esperar un momento
sleep 2

# Iniciar Chat Client
echo "💬 Iniciando Ludo Chat Client..."
echo "🌐 Abre: http://localhost:3001"
cd chat-client && npm run dev

# Limpiar al salir
trap "kill $MCP_PID 2>/dev/null || true" EXIT
EOF

chmod +x start.sh

# Crear script de desarrollo
cat > dev.sh << 'EOF'
#!/bin/bash
echo "🔧 Iniciando Ludo en modo desarrollo..."

# Verificar si tmux está disponible
if command -v tmux &> /dev/null; then
    # Usar tmux para ventanas separadas
    tmux new-session -d -s ludo
    tmux send-keys -t ludo 'cd mcp-server && npm run dev' C-m
    tmux split-window -t ludo -h
    tmux send-keys -t ludo 'cd chat-client && npm run dev' C-m
    tmux attach-session -t ludo
else
    # Fallback: ejecutar en background
    echo "🔧 MCP Server en background..."
    cd mcp-server && npm run dev &
    MCP_PID=$!
    
    echo "💬 Chat Client en foreground..."
    cd ../chat-client && npm run dev
    
    # Limpiar al salir
    trap "kill $MCP_PID 2>/dev/null || true" EXIT
fi
EOF

chmod +x dev.sh

echo ""
echo "🎉 ¡INSTALACIÓN COMPLETADA!"
echo ""
echo "📋 SIGUIENTES PASOS:"
echo ""
echo "1️⃣  📝 Configura tus credenciales:"
echo "    nano .env"
echo ""
echo "2️⃣  🚀 Inicia el sistema:"
echo "    ./start.sh    # Modo producción"
echo "    ./dev.sh      # Modo desarrollo"
echo ""
echo "3️⃣  🌐 Abre en tu navegador:"
echo "    http://localhost:3001"
echo ""
echo "📚 MÓDULOS INSTALADOS:"
echo "   • 💬 Ludo Chat Client (Puerto 3001)"
echo "   • 🔧 Ludo MCP Server (stdio)"
echo "   • 🌐 n8n-mcp (global, opcional)"
echo ""
echo "🆘 AYUDA:"
echo "   • chat-client/README.md - Guía del cliente"
echo "   • mcp-server/README.md - Guía del servidor"
echo "   • README.md - Guía general"
echo ""

log "✅ Ludo Universal System listo para usar"