# 🚀 Instalador Automático - Jira MCP Chat para Windows
# Uso: iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/JesusDevs/jira-mcp-chat/main/install-windows.ps1'))

$ErrorActionPreference = "Stop"

# Función de log con colores
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Log($message) {
    Write-ColorOutput Green "[$(Get-Date -Format 'HH:mm:ss')] $message"
}

function Warn($message) {
    Write-ColorOutput Yellow "[$(Get-Date -Format 'HH:mm:ss')] ⚠️ $message"
}

function Error($message) {
    Write-ColorOutput Red "[$(Get-Date -Format 'HH:mm:ss')] ❌ $message"
}

function Info($message) {
    Write-ColorOutput Blue "[$(Get-Date -Format 'HH:mm:ss')] ℹ️ $message"
}

# Banner
Write-ColorOutput Magenta @"
     _ _              __  __  _____ _____     _____ _           _   
    | (_)            |  \/  |/ ____|  __ \   / ____| |         | |  
    | |_ _ __ __ _   | \  / | |    | |__) | | |    | |__   __ _| |_ 
    | | | '__/ _` |  | |\/| | |    |  ___/  | |    | '_ \ / _` | __|
 _  | | | | | (_| |  | |  | | |____| |      | |____| | | | (_| | |_ 
(_) |_|_|_|  \__,_|  |_|  |_|\_____|_|       \_____|_| |_|\__,_|\__|

🚀 Instalador Automático para Windows
"@

Log "🔍 Verificando requisitos del sistema..."

# Verificar si estamos en Windows
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Error "PowerShell 5.0 o superior requerido"
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = & node --version 2>$null
    Log "✅ Node.js encontrado: $nodeVersion"
} catch {
    Warn "Node.js no está instalado. Instalando..."
    
    # Verificar si Chocolatey está instalado
    try {
        & choco --version 2>$null | Out-Null
        Log "✅ Chocolatey encontrado"
    } catch {
        Info "Instalando Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    # Instalar Node.js con Chocolatey
    Log "📦 Instalando Node.js..."
    & choco install nodejs -y
    
    # Actualizar PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    
    # Verificar instalación
    try {
        $nodeVersion = & node --version
        Log "✅ Node.js instalado: $nodeVersion"
    } catch {
        Error "Fallo en la instalación de Node.js"
        exit 1
    }
}

# Verificar Git
try {
    $gitVersion = & git --version 2>$null
    Log "✅ Git encontrado: $gitVersion"
} catch {
    Warn "Git no está instalado. Instalando..."
    & choco install git -y
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
}

# Preguntar por el directorio de instalación
$defaultPath = "$env:USERPROFILE\jira-mcp-chat"
$installDir = Read-Host "¿Dónde quieres instalar Jira MCP Chat? (Enter para $defaultPath)"
if ([string]::IsNullOrWhiteSpace($installDir)) {
    $installDir = $defaultPath
}

# Crear directorio si no existe
if (!(Test-Path $installDir)) {
    Log "📁 Creando directorio: $installDir"
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# Clonar o actualizar repositorio
if (Test-Path "$installDir\.git") {
    Log "📦 Actualizando repositorio existente..."
    Set-Location $installDir
    & git pull origin feature/mcp-improvements-and-docs
} else {
    Log "📦 Clonando repositorio..."
    & git clone -b feature/mcp-improvements-and-docs https://github.com/JesusDevs/jira-mcp-chat.git $installDir
    Set-Location $installDir
}

# Instalar dependencias
Log "📦 Instalando dependencias del proyecto principal..."
& npm install
if ($LASTEXITCODE -ne 0) {
    Error "Fallo en la instalación de dependencias principales"
    exit 1
}

Log "📦 Instalando dependencias del servidor MCP..."
Set-Location mcp-server
& npm install
if ($LASTEXITCODE -ne 0) {
    Error "Fallo en la instalación de dependencias del servidor MCP"
    exit 1
}
Set-Location ..

Log "📦 Instalando dependencias del cliente de chat..."
Set-Location chat-client
& npm install
if ($LASTEXITCODE -ne 0) {
    Error "Fallo en la instalación de dependencias del cliente"
    exit 1
}
Set-Location ..

# Instalar Ollama para Windows
try {
    & ollama --version 2>$null | Out-Null
    Log "✅ Ollama encontrado"
} catch {
    Warn "Ollama no está instalado. Instalando..."
    
    # Descargar e instalar Ollama
    $ollamaInstaller = "$env:TEMP\OllamaSetup.exe"
    Log "📥 Descargando Ollama..."
    Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile $ollamaInstaller
    
    Log "🚀 Instalando Ollama..."
    Start-Process -FilePath $ollamaInstaller -Wait -ArgumentList "/S"
    
    # Actualizar PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    
    # Iniciar servicio de Ollama
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep 5
    
    Log "📥 Descargando modelo Llama 3.1..."
    & ollama pull llama3.1:latest
}

# Instalar n8n-mcp globalmente
Log "📦 Instalando n8n-mcp globalmente..."
& npm install -g n8n-mcp

# Crear archivo .env si no existe
if (!(Test-Path ".env")) {
    Log "⚙️ Creando archivo de configuración .env..."
    Copy-Item "env.example" ".env"
    
    Write-Host ""
    Info "🔑 Configuración de Jira requerida:"
    Write-Host "Por favor, edita el archivo .env con tus credenciales de Jira:"
    Write-Host ""
    Write-Host "1. JIRA_BASE_URL=https://tu-empresa.atlassian.net"
    Write-Host "2. JIRA_EMAIL=tu-email@empresa.com"
    Write-Host "3. JIRA_API_TOKEN=tu_token_de_jira"
    Write-Host ""
    Info "Para obtener tu API token de Jira:"
    Write-Host "👉 https://id.atlassian.com/manage-profile/security/api-tokens"
    Write-Host ""
    
    $openEnv = Read-Host "¿Quieres abrir el archivo .env ahora? (y/n)"
    if ($openEnv -match "^[Yy]$") {
        if (Get-Command "code" -ErrorAction SilentlyContinue) {
            & code .env
        } else {
            & notepad .env
        }
    }
} else {
    Log "✅ Archivo .env ya existe"
}

# Crear script de inicio para Windows
$startScript = @'
@echo off
echo 🚀 Iniciando Jira MCP Chat...

REM Matar procesos en puerto 3001
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do (
    echo Matando proceso %%a
    taskkill /f /pid %%a 2>nul
)

REM Esperar un momento
timeout /t 2 /nobreak >nul

echo 🌐 Iniciando servidor en http://localhost:3001
cd chat-client
npm run dev-safe
'@

$startScript | Out-File -FilePath "start-dev.bat" -Encoding ASCII

# Función para verificar la instalación
function Verify-Installation {
    Log "🔍 Verificando instalación..."
    
    # Iniciar el servidor en background
    $serverProcess = Start-Process -FilePath "start-dev.bat" -PassThru -WindowStyle Hidden
    
    # Esperar a que el servidor esté listo
    Start-Sleep 15
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/mcp-status" -UseBasicParsing
        Log "✅ Servidor funcionando correctamente"
        
        # Verificar estado de MCP
        $mcpData = $response.Content | ConvertFrom-Json
        if ($mcpData.summary.totalTools -gt 0) {
            Log "✅ Servidores MCP conectados ($($mcpData.summary.totalTools) herramientas)"
        } else {
            Warn "⚠️ Servidores MCP no conectados - revisa la configuración"
        }
    } catch {
        Error "❌ El servidor no responde"
    }
    
    # Matar el servidor de prueba
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

# Verificar instalación
Write-Host ""
$verify = Read-Host "¿Quieres verificar la instalación ahora? (y/n)"
if ($verify -match "^[Yy]$") {
    Verify-Installation
}

# Resumen final
Write-Host ""
Write-ColorOutput Green "🎉 ¡Instalación completada!"
Write-Host ""
Write-ColorOutput Blue "📍 Ubicación: $installDir"
Write-ColorOutput Blue "🚀 Para iniciar: start-dev.bat"
Write-ColorOutput Blue "🌐 URL: http://localhost:3001"
Write-Host ""
Write-ColorOutput Yellow "📝 Próximos pasos:"
Write-Host "1. Configura tus credenciales de Jira en el archivo .env"
Write-Host "2. Ejecuta: start-dev.bat"
Write-Host "3. Abre http://localhost:3001 en tu navegador"
Write-Host ""
Write-ColorOutput Magenta "📚 Documentación: $installDir\INSTALLATION_GUIDE.md"
Write-Host ""

# Preguntar si quiere iniciar ahora
$startNow = Read-Host "¿Quieres iniciar Jira MCP Chat ahora? (y/n)"
if ($startNow -match "^[Yy]$") {
    Log "🚀 Iniciando Jira MCP Chat..."
    & .\start-dev.bat
}
