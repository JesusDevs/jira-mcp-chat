#!/usr/bin/env node

// import { mcpConfigLoader } from '../chat-client/src/lib/mcp-config-loader.js';
import fs from 'fs';

/**
 * Script para validar la configuración MCP
 */
async function validateMCPConfig() {
  console.log('🔍 Validating MCP Configuration...');
  console.log('='.repeat(40));
  
  try {
    const configFile = process.argv[2] || './mcp-servers-config.json';
    
    if (!fs.existsSync(configFile)) {
      throw new Error(`Configuration file not found: ${configFile}`);
    }
    
    console.log(`📄 Loading config from: ${configFile}`);
    
    // Cargar configuración directamente
    const configText = fs.readFileSync(configFile, 'utf-8');
    const config = JSON.parse(configText);
    
    console.log('✅ Configuration loaded successfully');
    
    // Validaciones adicionales
    const servers = config.servers || {};
    let errors = 0;
    let warnings = 0;
    
    console.log('\n🔍 Validating servers...');
    
    for (const [name, serverConfig] of Object.entries(servers)) {
      console.log(`\n📡 Validating server: ${name}`);
      
      // Validar tipo
      if (!['stdio', 'sse', 'websocket', 'http'].includes(serverConfig.type)) {
        console.log(`   ❌ Invalid type: ${serverConfig.type}`);
        errors++;
      } else {
        console.log(`   ✅ Type: ${serverConfig.type}`);
      }
      
      // Validar configuración específica del tipo
      if (serverConfig.type === 'stdio') {
        if (!serverConfig.command) {
          console.log(`   ❌ Missing command for stdio server`);
          errors++;
        } else {
          console.log(`   ✅ Command: ${serverConfig.command}`);
        }
        
        if (serverConfig.path && !fs.existsSync(serverConfig.path)) {
          console.log(`   ⚠️  Server file not found: ${serverConfig.path}`);
          warnings++;
        } else if (serverConfig.path) {
          console.log(`   ✅ Server file exists: ${serverConfig.path}`);
        }
      }
      
      if (['sse', 'websocket', 'http'].includes(serverConfig.type)) {
        if (!serverConfig.url) {
          console.log(`   ❌ Missing URL for ${serverConfig.type} server`);
          errors++;
        } else {
          console.log(`   ✅ URL: ${serverConfig.url}`);
        }
      }
      
      // Validar variables de entorno
      if (serverConfig.env) {
        console.log(`   🔑 Environment variables:`);
        for (const [envVar, envValue] of Object.entries(serverConfig.env)) {
          const resolved = envValue.replace(/\${([^}]+)}/g, (match, varName) => {
            return process.env[varName] || match;
          });
          
          if (resolved === envValue && envValue.includes('${')) {
            console.log(`     ⚠️  ${envVar}: ${envValue} (unresolved)`);
            warnings++;
          } else {
            console.log(`     ✅ ${envVar}: configured`);
          }
        }
      }
    }
    
    // Resumen
    console.log('\n' + '='.repeat(40));
    if (errors === 0 && warnings === 0) {
      console.log('🎉 Configuration is valid!');
    } else {
      console.log(`📊 Validation complete:`);
      console.log(`   ❌ Errors: ${errors}`);
      console.log(`   ⚠️  Warnings: ${warnings}`);
      
      if (errors > 0) {
        console.log('\n💡 Fix errors before proceeding');
        process.exit(1);
      } else {
        console.log('\n💡 Warnings can be addressed later');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    process.exit(1);
  }
}

validateMCPConfig();
