#!/bin/bash
echo "🚀 Iniciando Ludo Universal System..."

# Verificar configuración
if grep -q "tu-empresa.atlassian.net" .env 2>/dev/null; then
    echo "⚠️  Configura tus credenciales en el archivo .env"
    echo "📝 Edita: .env"
    echo ""
fi

# Iniciar MCP Server en background
echo "🔧 Iniciando Ludo MCP Server..."
cd mcp-server && npm start &
MCP_PID=$!
cd ..

# Esperar un momento
sleep 2

# Iniciar Chat Client
echo "💬 Iniciando Ludo Chat Client..."
echo "🌐 Abre: http://localhost:3001"
cd chat-client && npm run dev

# Limpiar al salir
trap "kill $MCP_PID 2>/dev/null || true" EXIT
