#!/usr/bin/env node

/**
 * 📦 Generador de Release - Universal MCP Client
 * 
 * Este script crea un paquete descargable del cliente MCP universal
 * que incluye todo lo necesario para ejecutar el cliente con cualquier servidor MCP.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function createRelease() {
    const version = require('./package.json').version;
    const releaseName = `universal-mcp-client-v${version}`;
    const releaseDir = path.join(process.cwd(), 'releases', releaseName);
    
    log('magenta', `\n📦 Creando release: ${releaseName}\n`);
    
    // 1. Crear directorio de release
    log('blue', '1. Creando estructura de directorios...');
    if (fs.existsSync(releaseDir)) {
        fs.rmSync(releaseDir, { recursive: true });
    }
    fs.mkdirSync(releaseDir, { recursive: true });
    
    // 2. Copiar archivos principales
    log('blue', '2. Copiando archivos principales...');
    const filesToCopy = [
        'package.json',
        'README.md',
        'INSTALLATION_GUIDE.md',
        'env.example',
        'setup-env.js',
        'start-dev.sh',
        'install-universal.sh',
        'install-mac.sh',
        'install-windows.ps1'
    ];
    
    filesToCopy.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join(releaseDir, file));
            log('green', `  ✅ ${file}`);
        }
    });
    
    // 3. Copiar directorios completos
    log('blue', '3. Copiando directorios...');
    const dirsToCopy = [
        'chat-client',
        'mcp-server'
    ];
    
    dirsToCopy.forEach(dir => {
        if (fs.existsSync(dir)) {
            copyDir(dir, path.join(releaseDir, dir));
            log('green', `  ✅ ${dir}/`);
        }
    });
    
    // 4. Crear archivo de configuración de ejemplo para servidores MCP
    log('blue', '4. Creando configuración de ejemplo...');
    const exampleMcpConfig = {
        mcpServers: {
            "example-server": {
                name: "Example MCP Server",
                description: "Servidor de ejemplo - reemplaza con tu servidor MCP",
                type: "local",
                command: "node",
                args: ["path/to/your/mcp-server.js"],
                enabled: false,
                env: {
                    "EXAMPLE_API_KEY": "your-api-key-here"
                }
            },
            "jira-server": {
                name: "Jira Management",
                description: "Servidor MCP para gestión de Jira (incluido)",
                type: "local", 
                command: "node",
                args: ["mcp-server/index.js"],
                enabled: true,
                env: {
                    "JIRA_BASE_URL": "${JIRA_BASE_URL}",
                    "JIRA_EMAIL": "${JIRA_EMAIL}",
                    "JIRA_API_TOKEN": "${JIRA_API_TOKEN}"
                }
            },
            "n8n-mcp": {
                name: "n8n Workflow Management",
                description: "Servidor MCP para n8n (requiere instalación global)",
                type: "local",
                command: "n8n-mcp",
                args: [],
                enabled: true,
                env: {
                    "MCP_MODE": "stdio",
                    "LOG_LEVEL": "error"
                }
            }
        }
    };
    
    fs.writeFileSync(
        path.join(releaseDir, 'chat-client', 'mcp-config.example.json'),
        JSON.stringify(exampleMcpConfig, null, 2)
    );
    
    // 5. Crear README específico del release
    log('blue', '5. Creando documentación del release...');
    const releaseReadme = `# Universal MCP Client v${version}

## 🚀 Cliente MCP Universal

Este es un cliente de chat que se conecta a cualquier servidor MCP usando el protocolo estándar.

## 📦 Contenido del Paquete

- \`chat-client/\` - Cliente web Next.js
- \`mcp-server/\` - Servidor MCP de ejemplo (Jira)
- \`setup-env.js\` - Configurador interactivo de variables de entorno
- \`install-*.sh/.ps1\` - Instaladores para diferentes plataformas
- \`env.example\` - Archivo de ejemplo de variables de entorno

## 🚀 Instalación Rápida

### Opción 1: Instalador Automático
\`\`\`bash
# Hacer ejecutables los scripts
chmod +x install-universal.sh setup-env.js start-dev.sh

# Ejecutar instalador
./install-universal.sh
\`\`\`

### Opción 2: Manual
\`\`\`bash
# 1. Instalar dependencias
npm install
cd chat-client && npm install && cd ..

# 2. Configurar variables de entorno
node setup-env.js

# 3. Iniciar cliente
./start-dev.sh
\`\`\`

## 🔧 Conectar tu Propio Servidor MCP

1. Edita \`chat-client/mcp-config.json\`
2. Agrega tu servidor en la sección \`mcpServers\`
3. Especifica el comando y argumentos de tu servidor
4. Reinicia el cliente

Ejemplo:
\`\`\`json
{
  "mcpServers": {
    "mi-servidor": {
      "name": "Mi Servidor Custom",
      "type": "local",
      "command": "python",
      "args": ["mi-servidor.py"],
      "enabled": true,
      "env": {
        "MI_API_KEY": "mi-key"
      }
    }
  }
}
\`\`\`

## 🌐 Acceso

Una vez iniciado, abre: http://localhost:3001

## 📚 Documentación

- \`README.md\` - Documentación completa
- \`INSTALLATION_GUIDE.md\` - Guía de instalación detallada

## 🆘 Soporte

Para soporte y actualizaciones:
- GitHub: https://github.com/JesusDevs/jira-mcp-chat
- Issues: https://github.com/JesusDevs/jira-mcp-chat/issues

---

**Universal MCP Client v${version}** - Compatible con cualquier servidor MCP
`;

    fs.writeFileSync(path.join(releaseDir, 'README-RELEASE.md'), releaseReadme);
    
    // 6. Crear script de inicio para Windows
    log('blue', '6. Creando scripts de inicio...');
    const windowsStartScript = `@echo off
echo 🚀 Universal MCP Client v${version}
echo.

REM Matar procesos en puerto 3001
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do (
    echo Matando proceso %%a
    taskkill /f /pid %%a 2>nul
)

timeout /t 2 /nobreak >nul

echo 🌐 Iniciando cliente en http://localhost:3001
cd chat-client
npm run dev-safe
`;
    
    fs.writeFileSync(path.join(releaseDir, 'start-dev.bat'), windowsStartScript);
    
    // 7. Comprimir release (si zip está disponible)
    log('blue', '7. Creando archivo comprimido...');
    try {
        const zipName = `${releaseName}.zip`;
        const zipPath = path.join('releases', zipName);
        
        // Cambiar al directorio releases para crear zip relativo
        process.chdir('releases');
        execSync(`zip -r "${zipName}" "${releaseName}"`, { stdio: 'pipe' });
        process.chdir('..');
        
        log('green', `  ✅ Archivo creado: ${zipPath}`);
        
        // Estadísticas del archivo
        const stats = fs.statSync(zipPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        log('yellow', `  📊 Tamaño: ${sizeMB} MB`);
        
    } catch (error) {
        log('yellow', '  ⚠️ No se pudo crear archivo ZIP (zip no disponible)');
        log('yellow', `  📁 Release disponible en: ${releaseDir}`);
    }
    
    // 8. Resumen final
    log('magenta', `\n🎉 Release v${version} creado exitosamente!\n`);
    log('green', `📍 Ubicación: ${releaseDir}`);
    log('green', `📦 Archivos incluidos: ${countFiles(releaseDir)} archivos`);
    log('green', `💾 Tamaño total: ${getFolderSize(releaseDir)} MB`);
    
    log('blue', '\n📋 Próximos pasos:');
    log('blue', '1. Prueba el release en un entorno limpio');
    log('blue', '2. Verifica que todos los instaladores funcionen');
    log('blue', '3. Actualiza la documentación si es necesario');
    log('blue', '4. Publica en GitHub Releases');
    
    return releaseDir;
}

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        // Saltar node_modules y otros directorios innecesarios
        if (entry.name === 'node_modules' || 
            entry.name === '.next' || 
            entry.name === '.git' ||
            entry.name === 'releases' ||
            entry.name.startsWith('.')) {
            continue;
        }
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function countFiles(dir) {
    let count = 0;
    
    function countRecursive(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                countRecursive(path.join(currentDir, entry.name));
            } else {
                count++;
            }
        }
    }
    
    countRecursive(dir);
    return count;
}

function getFolderSize(dir) {
    let size = 0;
    
    function sizeRecursive(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                sizeRecursive(fullPath);
            } else {
                size += fs.statSync(fullPath).size;
            }
        }
    }
    
    sizeRecursive(dir);
    return (size / (1024 * 1024)).toFixed(2);
}

// Ejecutar si se llama directamente
if (require.main === module) {
    try {
        createRelease();
    } catch (error) {
        log('red', `❌ Error creando release: ${error.message}`);
        process.exit(1);
    }
}
