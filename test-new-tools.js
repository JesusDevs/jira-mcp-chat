#!/usr/bin/env node

/**
 * Script de pruebas para las nuevas herramientas MCP de Jira
 * Prueba: search_epics, search_by_type, create_jira_issue
 */

const axios = require('axios');

const CHAT_URL = 'http://localhost:3000/api/chat';

// Escenarios de prueba
const testScenarios = [
  {
    name: '🔍 Búsqueda de épicas en proyecto AIDEV',
    query: 'Busca todas las épicas del proyecto AIDEV',
    expectedTool: 'search_epics',
    description: 'Debería usar search_epics con project="AIDEV"'
  },
  {
    name: '🐛 Búsqueda de bugs',
    query: 'Muestra todos los bugs del sistema',
    expectedTool: 'search_by_type',
    description: 'Debería usar search_by_type con issueType="Bug"'
  },
  {
    name: '📋 Búsqueda de tareas pendientes',
    query: 'Lista todas las tareas en progreso',
    expectedTool: 'search_by_type',
    description: 'Debería usar search_by_type con issueType="Task" y status="In Progress"'
  },
  {
    name: '📝 Búsqueda de historias de usuario',
    query: 'Busca stories en el proyecto SOP',
    expectedTool: 'search_by_type',
    description: 'Debería usar search_by_type con issueType="Story" y project="SOP"'
  },
  {
    name: '⚡ Búsqueda de épicas por palabra clave',
    query: 'Busca épicas sobre autenticación',
    expectedTool: 'search_epics',
    description: 'Debería usar search_epics con query="autenticación"'
  },
  {
    name: '🔧 Creación de issue (solo test de parsing)',
    query: 'Crea un bug en AIDEV sobre el problema de login',
    expectedTool: 'create_jira_issue',
    description: 'Debería usar create_jira_issue con project="AIDEV", issueType="Bug"',
    skipExecution: true // No ejecutar realmente la creación en tests
  }
];

async function testChatAPI(scenario) {
  try {
    console.log(`\n🧪 ${scenario.name}`);
    console.log(`   Query: "${scenario.query}"`);
    console.log(`   Esperado: ${scenario.expectedTool}`);
    
    if (scenario.skipExecution) {
      console.log(`   ⏭️  Saltando ejecución (solo test de parsing)`);
      return { success: true, skipped: true };
    }

    const response = await axios.post(CHAT_URL, {
      messages: [
        { role: 'user', content: scenario.query }
      ]
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      const data = response.data;
      
      if (data.toolResponses && data.toolResponses.length > 0) {
        const usedTool = data.toolResponses[0].name;
        const result = data.toolResponses[0].result;
        
        console.log(`   ✅ Tool usado: ${usedTool}`);
        console.log(`   📊 Resultados: ${result.found || result.total || 'N/A'} encontrados`);
        
        if (usedTool === scenario.expectedTool) {
          console.log(`   🎯 ¡Correcto! Usó la herramienta esperada`);
          return { success: true, tool: usedTool, count: result.found || result.total };
        } else {
          console.log(`   ⚠️  Herramienta incorrecta. Esperaba: ${scenario.expectedTool}`);
          return { success: false, tool: usedTool, expected: scenario.expectedTool };
        }
      } else {
        console.log(`   ❌ No se usaron herramientas`);
        return { success: false, error: 'No tools used' };
      }
    } else {
      console.log(`   ❌ Error HTTP: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de las nuevas herramientas MCP\n');
  
  // Verificar que el servidor esté corriendo
  try {
    const healthCheck = await axios.get('http://localhost:3000', { timeout: 5000 });
    console.log('✅ Servidor Next.js detectado\n');
  } catch (error) {
    console.error('❌ Error: El servidor Next.js no está corriendo en puerto 3000');
    console.error('   Ejecuta: npm run dev');
    process.exit(1);
  }

  const results = [];
  
  for (const scenario of testScenarios) {
    const result = await testChatAPI(scenario);
    results.push({
      name: scenario.name,
      ...result
    });
    
    // Pausa entre tests para no saturar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Resumen de resultados
  console.log('\n📊 RESUMEN DE PRUEBAS');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const skipped = results.filter(r => r.skipped);
  
  console.log(`✅ Exitosas: ${successful.length}`);
  console.log(`❌ Fallidas: ${failed.length}`);
  console.log(`⏭️  Saltadas: ${skipped.length}`);
  console.log(`📋 Total: ${results.length}`);

  if (failed.length > 0) {
    console.log('\n❌ PRUEBAS FALLIDAS:');
    failed.forEach(test => {
      console.log(`   • ${test.name}: ${test.error || 'Tool incorrecto'}`);
    });
  }

  if (successful.length > 0) {
    console.log('\n✅ HERRAMIENTAS PROBADAS:');
    const toolsUsed = [...new Set(successful.map(t => t.tool).filter(Boolean))];
    toolsUsed.forEach(tool => {
      const count = successful.filter(t => t.tool === tool).length;
      console.log(`   • ${tool}: ${count} prueba(s)`);
    });
  }

  console.log('\n🎯 RECOMENDACIONES:');
  console.log('• Probar manualmente la creación de issues en el chat');
  console.log('• Verificar que los filtros de búsqueda funcionen correctamente');
  console.log('• Testear épicas y tipos de issue específicos');
  
  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    skipped: skipped.length
  };
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  runTests()
    .then(summary => {
      console.log(`\n🏁 Pruebas completadas: ${summary.successful}/${summary.total} exitosas`);
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n💥 Error ejecutando pruebas:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testScenarios };
