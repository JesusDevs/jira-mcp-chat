import { MCPServerConfig } from './universal-mcp-client';

/**
 * Configuración completa de servidores MCP
 */
export interface MCPConfiguration {
  version: string;
  description: string;
  defaultServer: string;
  servers: Record<string, MCPServerConfig & {
    description: string;
    capabilities: string[];
    categories: string[];
    headers?: Record<string, string>;
  }>;
  profiles: Record<string, {
    description: string;
    activeServers: string[];
    env: Record<string, string>;
  }>;
  transport_config: Record<string, any>;
  ui_config: any;
  security: any;
}

/**
 * Cargador de configuración MCP
 */
export class MCPConfigLoader {
  private config: MCPConfiguration | null = null;
  private currentProfile: string = 'development';

  /**
   * Cargar configuración desde archivo o URL
   */
  async loadConfig(source?: string): Promise<MCPConfiguration> {
    try {
      let configData: any;

      if (source) {
        if (source.startsWith('http')) {
          // Cargar desde URL
          const response = await fetch(source);
          configData = await response.json();
        } else {
          // Cargar desde archivo local
          const fs = await import('fs');
          const path = await import('path');
          const configPath = path.resolve(source);
          const configText = fs.readFileSync(configPath, 'utf-8');
          configData = JSON.parse(configText);
        }
      } else {
        // Cargar configuración por defecto
        configData = await this.loadDefaultConfig();
      }

      this.config = this.processConfig(configData);
      console.log(`✅ MCP Configuration loaded: ${this.config.servers ? Object.keys(this.config.servers).length : 0} servers`);
      
      return this.config;
    } catch (error) {
      console.error('❌ Error loading MCP config:', error);
      throw new Error(`Failed to load MCP configuration: ${error.message}`);
    }
  }

  /**
   * Cargar configuración por defecto
   */
  private async loadDefaultConfig(): Promise<any> {
    // Configuración mínima por defecto
    return {
      version: "1.0.0",
      description: "Default MCP Configuration",
      defaultServer: "jira_local",
      servers: {
        jira_local: {
          name: "Jira Local",
          description: "Local Jira MCP Server",
          type: "stdio",
          command: "node",
          path: "../mcp-server/index.js",
          env: {
            JIRA_BASE_URL: process.env.JIRA_BASE_URL || '',
            JIRA_EMAIL: process.env.JIRA_EMAIL || '',
            JIRA_API_TOKEN: process.env.JIRA_API_TOKEN || ''
          },
          capabilities: ["tools"],
          categories: ["productivity"]
        }
      },
      profiles: {
        development: {
          description: "Development profile",
          activeServers: ["jira_local"],
          env: {}
        }
      },
      transport_config: {},
      ui_config: {},
      security: {}
    };
  }

  /**
   * Procesar y validar configuración
   */
  private processConfig(configData: any): MCPConfiguration {
    // Expandir variables de entorno
    const processedConfig = this.expandEnvironmentVariables(configData);
    
    // Validar configuración
    this.validateConfig(processedConfig);
    
    return processedConfig;
  }

  /**
   * Expandir variables de entorno en la configuración
   */
  private expandEnvironmentVariables(obj: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/\${([^}]+)}/g, (match, varName) => {
        return process.env[varName] || match;
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.expandEnvironmentVariables(item));
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.expandEnvironmentVariables(value);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Validar configuración
   */
  private validateConfig(config: MCPConfiguration): void {
    if (!config.servers || Object.keys(config.servers).length === 0) {
      throw new Error('Configuration must have at least one server');
    }

    if (config.defaultServer && !config.servers[config.defaultServer]) {
      throw new Error(`Default server '${config.defaultServer}' not found in servers`);
    }

    for (const [serverName, serverConfig] of Object.entries(config.servers)) {
      this.validateServerConfig(serverName, serverConfig);
    }
  }

  /**
   * Validar configuración de servidor individual
   */
  private validateServerConfig(name: string, config: any): void {
    if (!config.type) {
      throw new Error(`Server '${name}' must have a type`);
    }

    if (!['stdio', 'sse', 'websocket', 'http'].includes(config.type)) {
      throw new Error(`Server '${name}' has invalid type: ${config.type}`);
    }

    if (config.type === 'stdio' && !config.command) {
      throw new Error(`Server '${name}' with stdio type must have a command`);
    }

    if (['sse', 'websocket', 'http'].includes(config.type) && !config.url) {
      throw new Error(`Server '${name}' with ${config.type} type must have a URL`);
    }
  }

  /**
   * Obtener servidores para el perfil actual
   */
  getServersForProfile(profileName?: string): Record<string, MCPServerConfig> {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const profile = profileName || this.currentProfile;
    const profileConfig = this.config.profiles[profile];
    
    if (!profileConfig) {
      console.warn(`Profile '${profile}' not found, using all servers`);
      return this.getAllServers();
    }

    const servers: Record<string, MCPServerConfig> = {};
    
    for (const serverName of profileConfig.activeServers) {
      const serverConfig = this.config.servers[serverName];
      if (serverConfig) {
        servers[serverName] = {
          name: serverConfig.name,
          type: serverConfig.type,
          command: serverConfig.command,
          args: serverConfig.args,
          env: { ...serverConfig.env, ...profileConfig.env },
          url: serverConfig.url,
          description: serverConfig.description || '',
          enabled: serverConfig.enabled !== false,
          tools: serverConfig.tools || [],
          ...(serverConfig as any).port && { port: (serverConfig as any).port },
          ...(serverConfig as any).path && { path: (serverConfig as any).path }
        } as unknown as MCPServerConfig;
      } else {
        console.warn(`Server '${serverName}' in profile '${profile}' not found`);
      }
    }

    return servers;
  }

  /**
   * Obtener todos los servidores
   */
  getAllServers(): Record<string, MCPServerConfig> {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const servers: Record<string, MCPServerConfig> = {};
    
    for (const [serverName, serverConfig] of Object.entries(this.config.servers)) {
      servers[serverName] = {
        name: serverConfig.name,
        type: serverConfig.type,
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env,
        url: serverConfig.url,
        description: serverConfig.description || '',
        enabled: serverConfig.enabled !== false,
        tools: serverConfig.tools || [],
        ...(serverConfig as any).port && { port: (serverConfig as any).port },
        ...(serverConfig as any).path && { path: (serverConfig as any).path }
      } as unknown as MCPServerConfig;
    }

    return servers;
  }

  /**
   * Obtener servidor por defecto
   */
  getDefaultServer(): string {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config.defaultServer;
  }

  /**
   * Cambiar perfil activo
   */
  setProfile(profileName: string): void {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    if (!this.config.profiles[profileName]) {
      throw new Error(`Profile '${profileName}' not found`);
    }

    this.currentProfile = profileName;
    console.log(`🔄 Switched to profile: ${profileName}`);
  }

  /**
   * Listar perfiles disponibles
   */
  getAvailableProfiles(): string[] {
    if (!this.config) {
      return [];
    }
    return Object.keys(this.config.profiles);
  }

  /**
   * Obtener información de la configuración
   */
  getConfigInfo() {
    if (!this.config) {
      return null;
    }

    return {
      version: this.config.version,
      description: this.config.description,
      serversCount: Object.keys(this.config.servers).length,
      profilesCount: Object.keys(this.config.profiles).length,
      currentProfile: this.currentProfile,
      defaultServer: this.config.defaultServer,
      servers: Object.keys(this.config.servers),
      profiles: Object.keys(this.config.profiles)
    };
  }
}

// Exportar instancia singleton
export const mcpConfigLoader = new MCPConfigLoader();
