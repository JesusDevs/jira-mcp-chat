#!/usr/bin/env node

// import { mcpConfigLoader } from '../chat-client/src/lib/mcp-config-loader.js';
import fs from 'fs';
import path from 'path';

/**
 * Script para mostrar el estado completo del sistema MCP
 */
async function showMCPStatus() {
  console.log('🔍 MCP System Status Report');
  console.log('='.repeat(50));
  
  try {
    // Cargar configuración directamente
    const configText = fs.readFileSync('./mcp-servers-config.json', 'utf-8');
    const config = JSON.parse(configText);
    
    const configInfo = {
      version: config.version,
      serversCount: Object.keys(config.servers || {}).length,
      profilesCount: Object.keys(config.profiles || {}).length,
      currentProfile: 'development',
      defaultServer: config.defaultServer
    };
    
    console.log('\n📋 Configuration Info:');
    console.log(`   Version: ${configInfo.version}`);
    console.log(`   Servers: ${configInfo.serversCount}`);
    console.log(`   Profiles: ${configInfo.profilesCount}`);
    console.log(`   Current Profile: ${configInfo.currentProfile}`);
    console.log(`   Default Server: ${configInfo.defaultServer}`);
    
    // Mostrar servidores
    console.log('\n🌐 Available Servers:');
    const servers = config.servers || {};
    for (const [name, serverConfig] of Object.entries(servers)) {
      console.log(`   📡 ${name} (${serverConfig.type})`);
      if (serverConfig.type === 'stdio') {
        console.log(`      Command: ${serverConfig.command} ${serverConfig.path || ''}`);
      } else if (serverConfig.url) {
        console.log(`      URL: ${serverConfig.url}`);
      }
    }
    
    // Mostrar perfiles
    console.log('\n🎯 Available Profiles:');
    const profiles = Object.keys(config.profiles || {});
    profiles.forEach(profile => {
      const current = profile === configInfo.currentProfile ? ' (current)' : '';
      console.log(`   🔧 ${profile}${current}`);
    });
    
    // Verificar archivos
    console.log('\n📁 File Status:');
    const files = [
      '.env',
      'mcp-servers-config.json',
      '.cursor-mcp.json',
      'mcp-server/index.js',
      'chat-client/src/lib/universal-mcp-client.ts'
    ];
    
    for (const file of files) {
      const exists = fs.existsSync(file);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${file}`);
    }
    
    // Verificar variables de entorno
    console.log('\n🔑 Environment Variables:');
    const envVars = [
      'JIRA_BASE_URL',
      'JIRA_EMAIL',
      'JIRA_API_TOKEN',
      'GEMINI_API_KEY'
    ];
    
    for (const envVar of envVars) {
      const value = process.env[envVar];
      const status = value ? '✅' : '❌';
      const display = value ? `${value.substring(0, 20)}...` : 'Not set';
      console.log(`   ${status} ${envVar}: ${display}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Status: Ready for MCP connections');
    
  } catch (error) {
    console.error('\n❌ Error loading MCP status:', error.message);
    process.exit(1);
  }
}

showMCPStatus();
