#!/usr/bin/env node

import { UniversalMCPClient, MCPServersManager } from '../chat-client/src/lib/universal-mcp-client.js';
import { mcpConfigLoader } from '../chat-client/src/lib/mcp-config-loader.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Script para probar conexiones MCP
 */
async function testMCPConnections() {
  console.log('🧪 Testing MCP Connections...');
  console.log('='.repeat(50));
  
  try {
    // Cargar configuración
    const config = await mcpConfigLoader.loadConfig('./mcp-servers-config.json');
    const servers = mcpConfigLoader.getServersForProfile();
    
    console.log(`📋 Found ${Object.keys(servers).length} servers to test\n`);
    
    const manager = new MCPServersManager();
    const results = [];
    
    // Probar cada servidor
    for (const [name, serverConfig] of Object.entries(servers)) {
      console.log(`🔧 Testing server: ${name} (${serverConfig.type})`);
      
      try {
        // Agregar servidor al gestor
        manager.addServer(name, serverConfig);
        
        // Intentar conectar
        const connected = await manager.connectToServer(name);
        
        if (connected) {
          const activeServer = manager.getActiveServer();
          const tools = activeServer?.getTools() || [];
          
          console.log(`   ✅ Connected successfully`);
          console.log(`   🔧 Tools available: ${tools.length}`);
          
          if (tools.length > 0) {
            console.log(`   📋 Tool list:`);
            tools.forEach(tool => {
              console.log(`      - ${tool.name}: ${tool.description || 'No description'}`);
            });
          }
          
          results.push({
            name,
            status: 'success',
            tools: tools.length,
            type: serverConfig.type
          });
          
          // Probar una herramienta si está disponible
          if (tools.length > 0 && tools[0].name === 'get_jira_projects') {
            console.log(`   🧪 Testing tool: get_jira_projects`);
            try {
              const toolResult = await activeServer.callTool('get_jira_projects', {});
              console.log(`   ✅ Tool test successful`);
            } catch (toolError) {
              console.log(`   ⚠️  Tool test failed: ${toolError.message}`);
            }
          }
          
        } else {
          console.log(`   ❌ Connection failed`);
          results.push({
            name,
            status: 'failed',
            tools: 0,
            type: serverConfig.type,
            error: 'Connection failed'
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          name,
          status: 'error',
          tools: 0,
          type: serverConfig.type,
          error: error.message
        });
      }
      
      console.log(''); // Línea en blanco
    }
    
    // Desconectar todos
    await manager.disconnectAll();
    
    // Resumen
    console.log('='.repeat(50));
    console.log('📊 Test Results Summary:');
    console.log('');
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status !== 'success').length;
    const totalTools = results.reduce((sum, r) => sum + r.tools, 0);
    
    console.log(`✅ Successful connections: ${successful}`);
    console.log(`❌ Failed connections: ${failed}`);
    console.log(`🔧 Total tools available: ${totalTools}`);
    console.log('');
    
    // Detalles por servidor
    results.forEach(result => {
      const status = result.status === 'success' ? '✅' : '❌';
      console.log(`${status} ${result.name} (${result.type}): ${result.tools} tools`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });
    
    if (successful === 0) {
      console.log('\n💡 Tips:');
      console.log('   - Check your .env file for correct credentials');
      console.log('   - Ensure MCP servers are properly configured');
      console.log('   - Run: npm run mcp-config-validate');
      process.exit(1);
    } else {
      console.log('\n🎉 At least one MCP server is working!');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMCPConnections();
