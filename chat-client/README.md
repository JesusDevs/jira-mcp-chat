# 🎯 Ludo Chat Client

Universal MCP Chat Client que se conecta a cualquier servidor MCP usando el protocolo estándar.

## ⚡ Instalación Rápida

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# O usar el setup completo
npm run setup
```

## 🌐 Uso

1. **Inicia el cliente:** `npm run dev`
2. **Abre:** http://localhost:3001
3. **Configura MCP servers** en `mcp-config.json`

## 📁 Configuración MCP

Edita `mcp-config.json` para agregar tus servidores MCP:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/your/mcp-server.js"],
      "name": "Mi Servidor MCP",
      "description": "Descripción del servidor"
    }
  }
}
```

## 🔧 Variables de Entorno

Crea un archivo `.env.local`:

```env
# AI Providers (opcional)
GEMINI_API_KEY=tu_api_key
OPENAI_API_KEY=tu_api_key

# Configuración
PORT=3001
```

## 🏗️ Arquitectura

- **Next.js 15** - Framework React
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos
- **MCP SDK** - Protocolo de comunicación

## 📦 Scripts Disponibles

- `npm run dev` - Desarrollo con auto-restart
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run lint` - Verificar código
- `npm run clean` - Limpiar y reinstalar

## 🔌 Compatibilidad MCP

Compatible con cualquier servidor MCP que implemente el protocolo estándar:
- **stdio** - Comunicación por stdin/stdout
- **SSE** - Server-Sent Events (próximamente)
- **WebSocket** - Comunicación bidireccional (próximamente)

## 🆘 Problemas Comunes

**Puerto ocupado:**
```bash
npm run kill-dev  # Mata procesos en puerto 3001
```

**Problemas de dependencias:**
```bash
npm run clean  # Limpia e instala todo de nuevo
```

**MCP servers no detectados:**
- Verifica que `mcp-config.json` esté configurado
- Asegúrate de que los servidores MCP estén ejecutándose
- Revisa los logs en la consola del navegador
