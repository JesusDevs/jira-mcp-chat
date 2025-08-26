#!/bin/bash

# 🚀 Instalador Rápido - Universal MCP Client
# Instalación sin configuración interactiva
# Uso: ./install-quick.sh

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
echo "║              🚀 INSTALADOR RÁPIDO                           ║"
echo "║                Universal MCP Client                          ║"
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

# Instalar dependencias
log "📦 Instalando dependencias del proyecto..."
npm install

log "📦 Instalando dependencias del chat client..."
cd chat-client && npm install && cd ..

# Instalar n8n-mcp globalmente
log "📦 Instalando n8n-mcp globalmente..."
npm install -g n8n-mcp

# Crear archivo .env básico
log "📝 Creando configuración básica..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# 🔧 CONFIGURACIÓN UNIVERSAL MCP CLIENT
# Edita este archivo con tus credenciales

# === JIRA CONFIGURATION (OBLIGATORIO) ===
# Obtén tu token desde: https://id.atlassian.com/manage-profile/security/api-tokens
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu_token_de_jira

# === AI PROVIDERS (OPCIONAL) ===
# Gemini (Recomendado - Gratis)
# Obtén tu API key desde: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=tu_gemini_api_key

# OpenAI (Opcional - De pago)
# OPENAI_API_KEY=tu_openai_api_key

# === CONFIGURACIÓN AVANZADA ===
# Puerto del servidor de desarrollo
PORT=3001

# Nivel de logging
LOG_LEVEL=info
EOF
    log "✅ Archivo .env creado"
else
    warn "El archivo .env ya existe, no se sobrescribió"
fi

# Configurar permisos
log "🔧 Configurando permisos..."
chmod +x setup-env.js 2>/dev/null || true
chmod +x start-dev.sh 2>/dev/null || true

# Verificar instalación
log "🔍 Verificando instalación..."

# Verificar MCP server
if [ -f "mcp-server/index.js" ]; then
    log "✅ MCP Server encontrado"
else
    error "❌ MCP Server no encontrado"
    exit 1
fi

# Verificar n8n-mcp
if command -v n8n-mcp &> /dev/null; then
    log "✅ n8n-mcp instalado globalmente"
else
    warn "⚠️  n8n-mcp no se instaló correctamente"
fi

# Crear script de inicio
cat > quick-start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Universal MCP Client..."

# Verificar configuración
if ! grep -q "tu-empresa.atlassian.net" .env; then
    echo "✅ Configuración detectada"
else
    echo "⚠️  Configura tus credenciales en el archivo .env"
    echo "📝 Edita: .env"
    echo ""
fi

# Iniciar MCP server en background
echo "🔧 Iniciando MCP Server..."
cd mcp-server && node index.js &
MCP_PID=$!
cd ..

# Esperar un momento
sleep 2

# Iniciar chat client
echo "🌐 Iniciando Chat Client..."
echo "📱 Abre: http://localhost:3001"
./start-dev.sh

# Limpiar al salir
trap "kill $MCP_PID 2>/dev/null || true" EXIT
EOF

chmod +x quick-start.sh

echo ""
echo "🎉 ¡INSTALACIÓN COMPLETADA!"
echo ""
echo "📋 SIGUIENTES PASOS:"
echo ""
echo "1️⃣  📝 Configura tus credenciales:"
echo "    nano .env"
echo ""
echo "2️⃣  🚀 Inicia el sistema:"
echo "    ./quick-start.sh"
echo ""
echo "3️⃣  🌐 Abre en tu navegador:"
echo "    http://localhost:3001"
echo ""
echo "📚 DOCUMENTACIÓN:"
echo "   • README.md - Guía completa"
echo "   • INSTALLATION_GUIDE.md - Instalación detallada"
echo ""
echo "🆘 PROBLEMAS:"
echo "   • Verifica que las credenciales en .env sean correctas"
echo "   • Asegúrate de que los puertos 3001 y 3000 estén libres"
echo "   • Revisa los logs en la consola"
echo ""

log "✅ Universal MCP Client listo para usar"
