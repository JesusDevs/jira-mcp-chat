#!/bin/bash

# 🚀 Instalador Universal - Jira MCP Chat
# Compatible con: macOS, Linux, Windows (WSL/Git Bash)
# Uso: curl -fsSL https://raw.githubusercontent.com/JesusDevs/jira-mcp-chat/main/install-universal.sh | bash

set -e

# Detectar sistema operativo
detect_os() {
    case "$(uname -s)" in
        Darwin*)    OS="macos";;
        Linux*)     OS="linux";;
        CYGWIN*|MINGW*|MSYS*) OS="windows";;
        *)          OS="unknown";;
    esac
}

detect_os

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funciones de log
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

title() {
    echo -e "${PURPLE}[$(date +'%H:%M:%S')] 🔧 $1${NC}"
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

🚀 Instalador Universal - Jira MCP Chat
EOF
echo -e "${NC}"

info "Sistema detectado: $OS"

# Verificar requisitos básicos
title "VERIFICACIÓN DE REQUISITOS"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    warn "Node.js no está instalado."
    
    case $OS in
        macos)
            if ! command -v brew &> /dev/null; then
                info "Instalando Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            info "Instalando Node.js con Homebrew..."
            brew install node
            ;;
        linux)
            if command -v apt-get &> /dev/null; then
                info "Instalando Node.js con apt..."
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif command -v yum &> /dev/null; then
                info "Instalando Node.js con yum..."
                curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
                sudo yum install -y nodejs
            elif command -v dnf &> /dev/null; then
                info "Instalando Node.js con dnf..."
                curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
                sudo dnf install -y nodejs
            else
                error "No se pudo instalar Node.js automáticamente. Por favor, instálalo manualmente."
                exit 1
            fi
            ;;
        windows)
            error "En Windows, por favor usa el instalador de PowerShell o instala Node.js manualmente desde nodejs.org"
            exit 1
            ;;
    esac
else
    NODE_VERSION=$(node --version)
    log "✅ Node.js encontrado: $NODE_VERSION"
fi

# Verificar Git
if ! command -v git &> /dev/null; then
    warn "Git no está instalado."
    
    case $OS in
        macos)
            info "Instalando Git con Homebrew..."
            brew install git
            ;;
        linux)
            if command -v apt-get &> /dev/null; then
                sudo apt-get update && sudo apt-get install -y git
            elif command -v yum &> /dev/null; then
                sudo yum install -y git
            elif command -v dnf &> /dev/null; then
                sudo dnf install -y git
            fi
            ;;
        windows)
            warn "Git no encontrado. En Windows, asegúrate de tener Git Bash instalado."
            ;;
    esac
else
    GIT_VERSION=$(git --version)
    log "✅ Git encontrado: $GIT_VERSION"
fi

# Directorio de instalación
title "CONFIGURACIÓN DE INSTALACIÓN"

if [ "$OS" = "windows" ]; then
    DEFAULT_DIR="$HOME/jira-mcp-chat"
else
    DEFAULT_DIR="$HOME/jira-mcp-chat"
fi

echo ""
info "¿Dónde quieres instalar Jira MCP Chat?"
read -p "Ruta (presiona Enter para $DEFAULT_DIR): " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-"$DEFAULT_DIR"}

# Crear directorio si no existe
if [ ! -d "$INSTALL_DIR" ]; then
    log "📁 Creando directorio: $INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
fi

# Clonar repositorio
title "DESCARGA DEL PROYECTO"

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
title "INSTALACIÓN DE DEPENDENCIAS"

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

# Instalar Ollama según el sistema
title "INSTALACIÓN DE OLLAMA"

if ! command -v ollama &> /dev/null; then
    warn "Ollama no está instalado. Instalando..."
    
    case $OS in
        macos)
            if command -v brew &> /dev/null; then
                brew install ollama
                brew services start ollama
            else
                curl -fsSL https://ollama.com/install.sh | sh
            fi
            ;;
        linux)
            curl -fsSL https://ollama.com/install.sh | sh
            # Iniciar servicio si systemd está disponible
            if command -v systemctl &> /dev/null; then
                sudo systemctl enable ollama
                sudo systemctl start ollama
            else
                ollama serve &
            fi
            ;;
        windows)
            warn "En Windows, Ollama debe instalarse manualmente desde ollama.com"
            ;;
    esac
    
    # Descargar modelo
    if command -v ollama &> /dev/null; then
        sleep 5
        log "📥 Descargando modelo Llama 3.1..."
        ollama pull llama3.1:latest
    fi
else
    log "✅ Ollama encontrado"
fi

# Instalar n8n-mcp globalmente
title "INSTALACIÓN DE n8n-mcp"

log "📦 Instalando n8n-mcp globalmente..."
npm install -g n8n-mcp

# Configurar permisos
log "🔧 Configurando permisos..."
chmod +x setup-env.js
if [ -f "start-dev.sh" ]; then
    chmod +x start-dev.sh
fi

# Crear scripts de inicio según el sistema
title "CREACIÓN DE SCRIPTS DE INICIO"

case $OS in
    windows)
        # Crear script .bat para Windows
        cat > start-dev.bat << 'EOF'
@echo off
echo 🚀 Iniciando Jira MCP Chat...

REM Matar procesos en puerto 3001
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do (
    echo Matando proceso %%a
    taskkill /f /pid %%a 2>nul
)

timeout /t 2 /nobreak >nul
echo 🌐 Iniciando servidor en http://localhost:3001
cd chat-client
npm run dev-safe
EOF
        log "✅ Script de inicio creado: start-dev.bat"
        ;;
    *)
        # El script start-dev.sh ya existe para Unix
        if [ ! -f "start-dev.sh" ]; then
            cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Jira MCP Chat..."

# Matar procesos en puerto 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

echo "🌐 Iniciando servidor en http://localhost:3001"
cd chat-client
npm run dev-safe
EOF
            chmod +x start-dev.sh
        fi
        log "✅ Script de inicio verificado: start-dev.sh"
        ;;
esac

# Configuración interactiva
title "CONFIGURACIÓN INTERACTIVA"

echo ""
info "🔧 Configuración de variables de entorno"
echo "Puedes usar el configurador interactivo o configurar manualmente:"
echo ""
echo "1. 🤖 Configurador interactivo (recomendado)"
echo "2. ✋ Configurar manualmente"
echo ""

read -p "¿Qué opción prefieres? (1/2): " CONFIG_OPTION

if [ "$CONFIG_OPTION" = "1" ]; then
    log "🤖 Iniciando configurador interactivo..."
    node setup-env.js
else
    log "📝 Configuración manual..."
    if [ ! -f ".env" ]; then
        cp env.example .env
        info "Archivo .env creado desde env.example"
        echo ""
        echo "📝 Por favor, edita el archivo .env con tus credenciales:"
        echo "   - JIRA_BASE_URL=https://tu-empresa.atlassian.net"
        echo "   - JIRA_EMAIL=tu-email@empresa.com"
        echo "   - JIRA_API_TOKEN=tu_token_de_jira"
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
            elif [ "$OS" = "macos" ]; then
                open -t .env
            else
                echo "Abre manualmente: $INSTALL_DIR/.env"
            fi
        fi
    else
        log "✅ Archivo .env ya existe"
    fi
fi

# Resumen final
title "INSTALACIÓN COMPLETADA"

echo ""
echo -e "${GREEN}🎉 ¡Instalación completada exitosamente!${NC}"
echo ""
echo -e "${BLUE}📍 Ubicación:${NC} $INSTALL_DIR"

case $OS in
    windows)
        echo -e "${BLUE}🚀 Para iniciar:${NC} start-dev.bat"
        ;;
    *)
        echo -e "${BLUE}🚀 Para iniciar:${NC} ./start-dev.sh"
        ;;
esac

echo -e "${BLUE}🌐 URL:${NC} http://localhost:3001"
echo ""
echo -e "${CYAN}🔧 Herramientas disponibles:${NC}"
echo "   • 6 herramientas de Jira"
echo "   • 22 herramientas de n8n (525 nodos)"
echo "   • 3 proveedores de IA (Ollama gratuito incluido)"
echo ""
echo -e "${PURPLE}📚 Documentación:${NC} $INSTALL_DIR/INSTALLATION_GUIDE.md"
echo ""

# Preguntar si quiere iniciar ahora
read -p "¿Quieres iniciar Jira MCP Chat ahora? (y/n): " START_NOW
if [[ $START_NOW =~ ^[Yy]$ ]]; then
    log "🚀 Iniciando Jira MCP Chat..."
    
    case $OS in
        windows)
            cmd //c start-dev.bat
            ;;
        *)
            ./start-dev.sh
            ;;
    esac
fi
