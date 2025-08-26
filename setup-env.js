#!/usr/bin/env node

/**
 * 🔧 Configurador Universal de Variables de Entorno
 * Jira MCP Chat - Setup de .env unificado
 * 
 * Este script configura TODAS las variables de entorno necesarias:
 * - Proyecto raíz (.env)
 * - Cursor MCP config (~/.cursor/mcp.json)
 * - Chat client (.env local si es necesario)
 * 
 * Uso: node setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function log(message) {
    colorLog('green', `[${new Date().toLocaleTimeString()}] ${message}`);
}

function warn(message) {
    colorLog('yellow', `[${new Date().toLocaleTimeString()}] ⚠️  ${message}`);
}

function error(message) {
    colorLog('red', `[${new Date().toLocaleTimeString()}] ❌ ${message}`);
}

function info(message) {
    colorLog('blue', `[${new Date().toLocaleTimeString()}] ℹ️  ${message}`);
}

function title(message) {
    colorLog('magenta', `\n🔧 ${message}`);
}

// Crear interfaz de readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

// Banner
colorLog('magenta', `
╔══════════════════════════════════════════════════════════════╗
║                    🔧 SETUP DE VARIABLES DE ENTORNO         ║
║                        Jira MCP Chat                        ║
╚══════════════════════════════════════════════════════════════╝
`);

async function main() {
    try {
        title("CONFIGURACIÓN UNIVERSAL DE VARIABLES DE ENTORNO");
        
        // 1. Verificar estructura del proyecto
        log("🔍 Verificando estructura del proyecto...");
        const projectRoot = process.cwd();
        const envPath = path.join(projectRoot, '.env');
        const envExamplePath = path.join(projectRoot, 'env.example');
        
        if (!fs.existsSync(envExamplePath)) {
            error("Archivo env.example no encontrado. ¿Estás en el directorio correcto?");
            process.exit(1);
        }
        
        // 2. Recopilar información del usuario
        title("RECOPILACIÓN DE CREDENCIALES");
        
        console.log("\n📋 Necesitamos configurar las siguientes credenciales:");
        console.log("   1. ✅ Jira (OBLIGATORIO) - Para conectar con tu instancia");
        console.log("   2. 🤖 AI Providers (OPCIONAL) - Gemini, OpenAI (Ollama es gratuito)");
        console.log("   3. ⚙️ Configuración personalizada (OPCIONAL)");
        
        const config = {};
        
        // === CONFIGURACIÓN JIRA ===
        title("1. CONFIGURACIÓN DE JIRA (OBLIGATORIO)");
        
        config.JIRA_BASE_URL = await askQuestion("🏢 URL de tu Jira (ej: https://miempresa.atlassian.net): ");
        config.JIRA_EMAIL = await askQuestion("📧 Tu email de Jira: ");
        
        console.log("\n💡 Para obtener tu API Token:");
        console.log("   👉 https://id.atlassian.com/manage-profile/security/api-tokens");
        console.log("   1. Clic en 'Create API token'");
        console.log("   2. Dale un nombre (ej: 'Jira MCP Chat')");
        console.log("   3. Copia el token generado\n");
        
        config.JIRA_API_TOKEN = await askQuestion("🔑 API Token de Jira: ");
        
        // === CONFIGURACIÓN AI ===
        title("2. PROVEEDORES DE IA (OPCIONAL)");
        
        console.log("\n🤖 Proveedores disponibles:");
        console.log("   • Ollama (GRATUITO, LOCAL) - Se instala automáticamente");
        console.log("   • Gemini (Google) - Requiere API key");
        console.log("   • OpenAI - Requiere API key");
        
        const useGemini = await askQuestion("\n¿Quieres configurar Gemini? (y/n): ");
        if (useGemini.toLowerCase() === 'y') {
            console.log("💡 Obtén tu API key en: https://aistudio.google.com/");
            config.GEMINI_API_KEY = await askQuestion("🔑 Gemini API Key: ");
        }
        
        const useOpenAI = await askQuestion("¿Quieres configurar OpenAI? (y/n): ");
        if (useOpenAI.toLowerCase() === 'y') {
            console.log("💡 Obtén tu API key en: https://platform.openai.com/api-keys");
            config.OPENAI_API_KEY = await askQuestion("🔑 OpenAI API Key: ");
        }
        
        // === CONFIGURACIÓN PERSONALIZADA ===
        title("3. CONFIGURACIÓN PERSONALIZADA (OPCIONAL)");
        
        const useCustom = await askQuestion("\n¿Quieres configurar opciones personalizadas? (y/n): ");
        if (useCustom.toLowerCase() === 'y') {
            config.DEFAULT_PROJECT = await askQuestion("📁 Proyecto principal (ej: DEV): ") || 'AIDEV';
            config.TEAM_PROJECTS = await askQuestion("👥 Proyectos del equipo (separados por comas): ") || 'AIDEV,BUGS,FEATURES';
            config.ORGANIZATION_NAME = await askQuestion("🏢 Nombre de tu organización: ") || 'Mi Empresa';
        }
        
        // 3. Crear archivo .env principal
        title("CREANDO ARCHIVOS DE CONFIGURACIÓN");
        
        log("📝 Creando archivo .env principal...");
        const envContent = generateEnvContent(config);
        fs.writeFileSync(envPath, envContent);
        log(`✅ Archivo .env creado: ${envPath}`);
        
        // 4. Configurar Cursor MCP (si está disponible)
        const cursorMcpPath = path.join(os.homedir(), '.cursor', 'mcp.json');
        const configureCursor = await askQuestion("\n¿Quieres configurar Cursor MCP automáticamente? (y/n): ");
        
        if (configureCursor.toLowerCase() === 'y') {
            log("⚙️ Configurando Cursor MCP...");
            
            // Crear directorio .cursor si no existe
            const cursorDir = path.dirname(cursorMcpPath);
            if (!fs.existsSync(cursorDir)) {
                fs.mkdirSync(cursorDir, { recursive: true });
            }
            
            const cursorConfig = generateCursorMcpConfig(config, projectRoot);
            fs.writeFileSync(cursorMcpPath, JSON.stringify(cursorConfig, null, 2));
            log(`✅ Cursor MCP configurado: ${cursorMcpPath}`);
        }
        
        // 5. Verificar configuración
        title("VERIFICACIÓN DE CONFIGURACIÓN");
        
        log("🔍 Verificando credenciales de Jira...");
        const jiraValid = await verifyJiraCredentials(config);
        if (jiraValid) {
            log("✅ Credenciales de Jira válidas");
        } else {
            warn("⚠️ No se pudieron verificar las credenciales de Jira");
        }
        
        // 6. Resumen final
        title("CONFIGURACIÓN COMPLETADA");
        
        console.log("\n🎉 ¡Configuración completada exitosamente!");
        console.log("\n📁 Archivos creados:");
        console.log(`   ✅ ${envPath}`);
        if (configureCursor.toLowerCase() === 'y') {
            console.log(`   ✅ ${cursorMcpPath}`);
        }
        
        console.log("\n🚀 Próximos pasos:");
        console.log("   1. Ejecuta: ./start-dev.sh (macOS/Linux) o start-dev.bat (Windows)");
        console.log("   2. Abre: http://localhost:3001");
        console.log("   3. ¡Comienza a chatear con Jira!");
        
        console.log("\n🔧 Herramientas disponibles:");
        console.log("   • 6 herramientas de Jira");
        console.log("   • 22 herramientas de n8n");
        console.log("   • 3 proveedores de IA");
        
        const startNow = await askQuestion("\n¿Quieres iniciar el servidor ahora? (y/n): ");
        if (startNow.toLowerCase() === 'y') {
            log("🚀 Iniciando servidor...");
            
            // Determinar el comando según el SO
            const isWindows = os.platform() === 'win32';
            const startCommand = isWindows ? 'start-dev.bat' : './start-dev.sh';
            
            const { spawn } = require('child_process');
            const serverProcess = spawn(startCommand, [], { 
                stdio: 'inherit',
                shell: true 
            });
            
            console.log("\n🌐 Servidor iniciándose en http://localhost:3001");
            console.log("   Presiona Ctrl+C para detener el servidor");
        }
        
    } catch (error) {
        error(`Error durante la configuración: ${error.message}`);
        process.exit(1);
    } finally {
        rl.close();
    }
}

function generateEnvContent(config) {
    return `# ========================================
# 🔧 JIRA MCP CHAT - CONFIGURACIÓN
# ========================================
# Generado automáticamente el ${new Date().toISOString()}

# === CONFIGURACIÓN JIRA (REQUERIDO) ===
JIRA_BASE_URL=${config.JIRA_BASE_URL || ''}
JIRA_EMAIL=${config.JIRA_EMAIL || ''}
JIRA_API_TOKEN=${config.JIRA_API_TOKEN || ''}

# === CONFIGURACIÓN IA (OPCIONAL) ===
${config.GEMINI_API_KEY ? `GEMINI_API_KEY=${config.GEMINI_API_KEY}` : '# GEMINI_API_KEY=tu_api_key_aqui'}
${config.OPENAI_API_KEY ? `OPENAI_API_KEY=${config.OPENAI_API_KEY}` : '# OPENAI_API_KEY=tu_api_key_aqui'}

# Ollama (local y gratuito)
OLLAMA_API_URL=http://localhost:11434

# === CONFIGURACIÓN MCP ===
USE_STDIO_MCP=false
USE_UNIVERSAL_AI=true
DEFAULT_AI_PROVIDER=ollama
DEFAULT_AI_MODEL=llama3.1:latest

# === CONFIGURACIÓN PERSONALIZADA ===
DEFAULT_PROJECT=${config.DEFAULT_PROJECT || 'AIDEV'}
TEAM_PROJECTS=${config.TEAM_PROJECTS || 'AIDEV,BUGS,FEATURES'}
ORGANIZATION_NAME=${config.ORGANIZATION_NAME || 'Mi Empresa'}
TIMEZONE=${Intl.DateTimeFormat().resolvedOptions().timeZone}

# === CONFIGURACIÓN TÉCNICA ===
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
`;
}

function generateCursorMcpConfig(config, projectRoot) {
    return {
        mcpServers: {
            jira: {
                command: "node",
                args: [path.join(projectRoot, "mcp-server/index.js")],
                env: {
                    JIRA_BASE_URL: config.JIRA_BASE_URL,
                    JIRA_EMAIL: config.JIRA_EMAIL,
                    JIRA_API_TOKEN: config.JIRA_API_TOKEN
                }
            },
            "n8n-mcp": {
                command: "n8n-mcp",
                args: [],
                env: {
                    MCP_MODE: "stdio",
                    LOG_LEVEL: "error",
                    DISABLE_CONSOLE_OUTPUT: "true"
                }
            }
        }
    };
}

async function verifyJiraCredentials(config) {
    if (!config.JIRA_BASE_URL || !config.JIRA_EMAIL || !config.JIRA_API_TOKEN) {
        return false;
    }
    
    try {
        const https = require('https');
        const url = require('url');
        
        const auth = Buffer.from(`${config.JIRA_EMAIL}:${config.JIRA_API_TOKEN}`).toString('base64');
        const endpoint = new url.URL('/rest/api/2/myself', config.JIRA_BASE_URL);
        
        return new Promise((resolve) => {
            const req = https.request({
                hostname: endpoint.hostname,
                path: endpoint.pathname,
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            }, (res) => {
                resolve(res.statusCode === 200);
            });
            
            req.on('error', () => resolve(false));
            req.setTimeout(5000, () => {
                req.destroy();
                resolve(false);
            });
            req.end();
        });
    } catch {
        return false;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, generateEnvContent, generateCursorMcpConfig };
