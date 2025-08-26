# Universal MCP Client v2.0.0

## 🚀 Cliente MCP Universal

Este es un cliente de chat que se conecta a cualquier servidor MCP usando el protocolo estándar.

## 📦 Contenido del Paquete

- `chat-client/` - Cliente web Next.js
- `mcp-server/` - Servidor MCP de ejemplo (Jira)
- `setup-env.js` - Configurador interactivo de variables de entorno
- `install-*.sh/.ps1` - Instaladores para diferentes plataformas
- `env.example` - Archivo de ejemplo de variables de entorno

## 🚀 Instalación Rápida

### Opción 1: Instalador Automático
```bash
# Hacer ejecutables los scripts
chmod +x install-universal.sh setup-env.js start-dev.sh

# Ejecutar instalador
./install-universal.sh
```

### Opción 2: Manual
```bash
# 1. Instalar dependencias
npm install
cd chat-client && npm install && cd ..

# 2. Configurar variables de entorno
node setup-env.js

# 3. Iniciar cliente
./start-dev.sh
```

## 🔧 Conectar tu Propio Servidor MCP

1. Edita `chat-client/mcp-config.json`
2. Agrega tu servidor en la sección `mcpServers`
3. Especifica el comando y argumentos de tu servidor
4. Reinicia el cliente

Ejemplo:
```json
{
  "mcpServers": {
    "mi-servidor": {
      "name": "Mi Servidor Custom",
      "type": "local",
      "command": "python",
      "args": ["mi-servidor.py"],
      "enabled": true,
      "env": {
        "MI_API_KEY": "mi-key"
      }
    }
  }
}
```

## 🌐 Acceso

Una vez iniciado, abre: http://localhost:3001

## 📚 Documentación

- `README.md` - Documentación completa
- `INSTALLATION_GUIDE.md` - Guía de instalación detallada

## 🆘 Soporte

Para soporte y actualizaciones:
- GitHub: https://github.com/JesusDevs/jira-mcp-chat
- Issues: https://github.com/JesusDevs/jira-mcp-chat/issues

---

**Universal MCP Client v2.0.0** - Compatible con cualquier servidor MCP
