#!/bin/bash
echo "🚀 Iniciando Universal MCP Client..."

# Verificar configuración
if ! grep -q "tu-empresa.atlassian.net" .env; then
    echo "✅ Configuración detectada"
else
    echo "⚠️  Configura tus credenciales en el archivo .env"
    echo "📝 Edita: .env"
    echo ""
fi

# Iniciar MCP server en background
echo "🔧 Iniciando MCP Server..."
cd mcp-server && node index.js &
MCP_PID=$!
cd ..

# Esperar un momento
sleep 2

# Iniciar chat client
echo "🌐 Iniciando Chat Client..."
echo "📱 Abre: http://localhost:3001"
./start-dev.sh

# Limpiar al salir
trap "kill $MCP_PID 2>/dev/null || true" EXIT
