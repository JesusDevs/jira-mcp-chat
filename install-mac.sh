#!/bin/bash

# 🚀 Instalador Automático - Jira MCP Chat para macOS
# Uso: curl -fsSL https://raw.githubusercontent.com/JesusDevs/jira-mcp-chat/main/install-mac.sh | bash

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Función de log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# Banner
echo -e "${PURPLE}"
cat << "EOF"
     _ _              __  __  _____ _____     _____ _           _   
    | (_)            |  \/  |/ ____|  __ \   / ____| |         | |  
    | |_ _ __ __ _   | \  / | |    | |__) | | |    | |__   __ _| |_ 
    | | | '__/ _` |  | |\/| | |    |  ___/  | |    | '_ \ / _` | __|
 _  | | | | | (_| |  | |  | | |____| |      | |____| | | | (_| | |_ 
(_) |_|_|_|  \__,_|  |_|  |_|\_____|_|       \_____|_| |_|\__,_|\__|

🚀 Instalador Automático para macOS
EOF
echo -e "${NC}"

# Verificar macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    error "Este script es solo para macOS"
    exit 1
fi

log "🔍 Verificando requisitos del sistema..."

# Verificar Homebrew
if ! command -v brew &> /dev/null; then
    warn "Homebrew no está instalado. Instalando..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    log "✅ Homebrew encontrado"
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    warn "Node.js no está instalado. Instalando..."
    brew install node
else
    NODE_VERSION=$(node --version)
    log "✅ Node.js encontrado: $NODE_VERSION"
fi

# Verificar Git
if ! command -v git &> /dev/null; then
    warn "Git no está instalado. Instalando..."
    brew install git
else
    log "✅ Git encontrado"
fi

# Preguntar por el directorio de instalación
echo ""
info "¿Dónde quieres instalar Jira MCP Chat?"
read -p "Ruta (presiona Enter para ~/jira-mcp-chat): " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-"$HOME/jira-mcp-chat"}

# Crear directorio si no existe
if [ ! -d "$INSTALL_DIR" ]; then
    log "📁 Creando directorio: $INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
fi

# Clonar o actualizar repositorio
if [ -d "$INSTALL_DIR/.git" ]; then
    log "📦 Actualizando repositorio existente..."
    cd "$INSTALL_DIR"
    git pull origin feature/mcp-improvements-and-docs
else
    log "📦 Clonando repositorio..."
    git clone -b feature/mcp-improvements-and-docs https://github.com/JesusDevs/jira-mcp-chat.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Instalar dependencias
log "📦 Instalando dependencias del proyecto principal..."
npm install

log "📦 Instalando dependencias del servidor MCP..."
cd mcp-server
npm install
cd ..

log "📦 Instalando dependencias del cliente de chat..."
cd chat-client
npm install
cd ..

# Instalar Ollama
if ! command -v ollama &> /dev/null; then
    warn "Ollama no está instalado. Instalando..."
    brew install ollama
    
    # Iniciar servicio de Ollama
    log "🚀 Iniciando servicio de Ollama..."
    brew services start ollama
    
    # Esperar a que Ollama esté listo
    sleep 5
    
    log "📥 Descargando modelo Llama 3.1..."
    ollama pull llama3.1:latest
else
    log "✅ Ollama encontrado"
fi

# Instalar n8n-mcp globalmente
log "📦 Instalando n8n-mcp globalmente..."
npm install -g n8n-mcp

# Configurar permisos
log "🔧 Configurando permisos..."
chmod +x start-dev.sh

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    log "⚙️ Creando archivo de configuración .env..."
    cp env.example .env
    
    echo ""
    info "🔑 Configuración de Jira requerida:"
    echo "Por favor, edita el archivo .env con tus credenciales de Jira:"
    echo ""
    echo "1. JIRA_BASE_URL=https://tu-empresa.atlassian.net"
    echo "2. JIRA_EMAIL=tu-email@empresa.com" 
    echo "3. JIRA_API_TOKEN=tu_token_de_jira"
    echo ""
    info "Para obtener tu API token de Jira:"
    echo "👉 https://id.atlassian.com/manage-profile/security/api-tokens"
    echo ""
    
    read -p "¿Quieres abrir el archivo .env ahora? (y/n): " OPEN_ENV
    if [[ $OPEN_ENV =~ ^[Yy]$ ]]; then
        if command -v code &> /dev/null; then
            code .env
        elif command -v nano &> /dev/null; then
            nano .env
        else
            open -t .env
        fi
    fi
else
    log "✅ Archivo .env ya existe"
fi

# Función para verificar la instalación
verify_installation() {
    log "🔍 Verificando instalación..."
    
    # Iniciar el servidor en background
    ./start-dev.sh &
    SERVER_PID=$!
    
    # Esperar a que el servidor esté listo
    sleep 15
    
    # Verificar que el servidor responda
    if curl -f -s http://localhost:3001/api/mcp-status > /dev/null; then
        log "✅ Servidor funcionando correctamente"
        
        # Verificar estado de MCP
        MCP_STATUS=$(curl -s http://localhost:3001/api/mcp-status | grep -o '"totalTools":[0-9]*' | cut -d':' -f2)
        if [ "$MCP_STATUS" -gt 0 ]; then
            log "✅ Servidores MCP conectados ($MCP_STATUS herramientas)"
        else
            warn "⚠️ Servidores MCP no conectados - revisa la configuración"
        fi
    else
        error "❌ El servidor no responde"
    fi
    
    # Matar el servidor de prueba
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
}

# Verificar instalación
echo ""
read -p "¿Quieres verificar la instalación ahora? (y/n): " VERIFY
if [[ $VERIFY =~ ^[Yy]$ ]]; then
    verify_installation
fi

# Resumen final
echo ""
echo -e "${GREEN}🎉 ¡Instalación completada!${NC}"
echo ""
echo -e "${BLUE}📍 Ubicación:${NC} $INSTALL_DIR"
echo -e "${BLUE}🚀 Para iniciar:${NC} cd $INSTALL_DIR && ./start-dev.sh"
echo -e "${BLUE}🌐 URL:${NC} http://localhost:3001"
echo ""
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "1. Configura tus credenciales de Jira en el archivo .env"
echo "2. Ejecuta: cd $INSTALL_DIR && ./start-dev.sh"
echo "3. Abre http://localhost:3001 en tu navegador"
echo ""
echo -e "${PURPLE}📚 Documentación:${NC} $INSTALL_DIR/INSTALLATION_GUIDE.md"
echo ""

# Preguntar si quiere iniciar ahora
read -p "¿Quieres iniciar Jira MCP Chat ahora? (y/n): " START_NOW
if [[ $START_NOW =~ ^[Yy]$ ]]; then
    log "🚀 Iniciando Jira MCP Chat..."
    ./start-dev.sh
fi
