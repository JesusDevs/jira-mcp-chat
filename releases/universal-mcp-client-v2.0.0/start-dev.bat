@echo off
echo 🚀 Universal MCP Client v2.0.0
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
