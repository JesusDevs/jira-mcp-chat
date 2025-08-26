#!/bin/bash
echo "🔧 Iniciando Ludo en modo desarrollo..."

# Verificar si tmux está disponible
if command -v tmux &> /dev/null; then
    # Usar tmux para ventanas separadas
    tmux new-session -d -s ludo
    tmux send-keys -t ludo 'cd mcp-server && npm run dev' C-m
    tmux split-window -t ludo -h
    tmux send-keys -t ludo 'cd chat-client && npm run dev' C-m
    tmux attach-session -t ludo
else
    # Fallback: ejecutar en background
    echo "🔧 MCP Server en background..."
    cd mcp-server && npm run dev &
    MCP_PID=$!
    
    echo "💬 Chat Client en foreground..."
    cd chat-client && npm run dev
    
    # Limpiar al salir
    trap "kill $MCP_PID 2>/dev/null || true" EXIT
fi
