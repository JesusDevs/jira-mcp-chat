#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mode = process.argv[2];

if (!mode || !['stdio', 'direct'].includes(mode)) {
  console.log('📖 Uso: node switch-mcp-mode.js [stdio|direct]');
  console.log('');
  console.log('Modos disponibles:');
  console.log('  📡 stdio  - Usa protocolo MCP real con stdio (compatible con Cursor)');
  console.log('  ⚡ direct - Usa cliente directo (más simple, solo para chat)');
  process.exit(1);
}

const useStdio = mode === 'stdio';
const envFiles = ['.env', 'chat-client/.env'];

console.log(`🔄 Cambiando a modo: ${mode.toUpperCase()}`);
console.log(useStdio ? '📡 Protocolo MCP stdio activado' : '⚡ Cliente directo activado');

for (const envFile of envFiles) {
  const envPath = path.join(__dirname, envFile);
  
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    
    // Reemplazar o agregar la variable
    if (content.includes('USE_STDIO_MCP=')) {
      content = content.replace(/USE_STDIO_MCP=.*/g, `USE_STDIO_MCP=${useStdio}`);
    } else {
      content += `\nUSE_STDIO_MCP=${useStdio}\n`;
    }
    
    fs.writeFileSync(envPath, content);
    console.log(`✅ Actualizado: ${envFile}`);
  }
}

console.log('');
console.log('🔄 Para aplicar cambios:');
console.log('1. Reinicia el servidor: Ctrl+C → npm run dev');
console.log('2. O cambia la variable manualmente en .env');
console.log('');

if (useStdio) {
  console.log('📡 Modo STDIO activo:');
  console.log('  ✅ Compatible con Cursor (@jira)');
  console.log('  ✅ Protocolo MCP estándar');
  console.log('  ✅ Reutilizable con otros clientes');
  console.log('  ⚠️  Más complejo, puede fallar si hay problemas de stdio');
} else {
  console.log('⚡ Modo DIRECT activo:');
  console.log('  ✅ Más simple y confiable');
  console.log('  ✅ Funciona solo en tu chat');
  console.log('  ✅ Mismas herramientas MCP');
  console.log('  ❌ No compatible con Cursor');
}

console.log('');
