/**
 * Providers de AI universales para el sistema MCP
 * Soporte para GPT, Gemini, Ollama y modelos personalizados
 */

import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai';

export interface AIProvider {
  name: string;
  displayName: string;
  type: 'openai' | 'gemini' | 'ollama' | 'custom';
  models: string[];
  apiKeyRequired: boolean;
  localModel: boolean;
  config?: Record<string, any>;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  functionCalls?: Array<{
    name: string;
    args: Record<string, any>;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Configuración de providers disponibles
 */
export const AI_PROVIDERS: Record<string, AIProvider> = {
  'gpt-4': {
    name: 'gpt-4',
    displayName: 'GPT-4 (OpenAI)',
    type: 'openai',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o'],
    apiKeyRequired: true,
    localModel: false,
    config: {
      baseURL: 'https://api.openai.com/v1',
      temperature: 0.7,
      maxTokens: 4096
    }
  },
  
  'gpt-3.5': {
    name: 'gpt-3.5',
    displayName: 'GPT-3.5 Turbo (OpenAI)',
    type: 'openai',
    models: ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
    apiKeyRequired: true,
    localModel: false,
    config: {
      baseURL: 'https://api.openai.com/v1',
      temperature: 0.7,
      maxTokens: 4096
    }
  },

  'gemini': {
    name: 'gemini',
    displayName: 'Gemini Pro (Google)',
    type: 'gemini',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
    apiKeyRequired: true,
    localModel: false,
    config: {
      temperature: 0.7,
      maxTokens: 4096
    }
  },

  'ollama-llama3': {
    name: 'ollama-llama3',
    displayName: 'Llama 3 (Ollama)',
    type: 'ollama',
    models: ['llama3:8b', 'llama3:70b', 'llama3.1:8b', 'llama3.1:70b'],
    apiKeyRequired: false,
    localModel: true,
    config: {
      baseURL: 'http://localhost:11434',
      temperature: 0.7,
      maxTokens: 4096
    }
  },

  'ollama-codellama': {
    name: 'ollama-codellama',
    displayName: 'Code Llama (Ollama)',
    type: 'ollama',
    models: ['codellama:7b', 'codellama:13b', 'codellama:34b'],
    apiKeyRequired: false,
    localModel: true,
    config: {
      baseURL: 'http://localhost:11434',
      temperature: 0.3,
      maxTokens: 4096
    }
  },

  'ollama-mistral': {
    name: 'ollama-mistral',
    displayName: 'Mistral (Ollama)',
    type: 'ollama',
    models: ['mistral:7b', 'mistral:instruct', 'mixtral:8x7b'],
    apiKeyRequired: false,
    localModel: true,
    config: {
      baseURL: 'http://localhost:11434',
      temperature: 0.7,
      maxTokens: 4096
    }
  }
};

/**
 * Cliente AI universal que funciona con múltiples providers
 */
export class UniversalAIClient {
  private provider: AIProvider;
  private model: string;
  private apiKey?: string;
  private client: any;

  constructor(providerName: string, model: string, apiKey?: string) {
    this.provider = AI_PROVIDERS[providerName];
    if (!this.provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    
    this.model = model;
    this.apiKey = apiKey;
    this.initializeClient();
  }

  private initializeClient() {
    switch (this.provider.type) {
      case 'openai':
        this.initializeOpenAI();
        break;
      case 'gemini':
        this.initializeGemini();
        break;
      case 'ollama':
        this.initializeOllama();
        break;
      default:
        throw new Error(`Provider type ${this.provider.type} not implemented`);
    }
  }

  private initializeOpenAI() {
    if (!this.apiKey) {
      throw new Error('OpenAI API key required');
    }
    
    // Usar fetch directamente para OpenAI
    this.client = {
      baseURL: this.provider.config?.baseURL || 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    };
  }

  private initializeGemini() {
    if (!this.apiKey) {
      throw new Error('Gemini API key required');
    }
    
    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  private initializeOllama() {
    this.client = {
      baseURL: this.provider.config?.baseURL || 'http://localhost:11434',
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Generar respuesta con el AI provider seleccionado
   */
  async generateResponse(
    messages: AIMessage[], 
    tools?: Array<any>,
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<AIResponse> {
    const config = {
      temperature: options.temperature || this.provider.config?.temperature || 0.7,
      maxTokens: options.maxTokens || this.provider.config?.maxTokens || 4096,
      ...options
    };

    switch (this.provider.type) {
      case 'openai':
        return await this.generateOpenAIResponse(messages, tools, config);
      case 'gemini':
        return await this.generateGeminiResponse(messages, tools, config);
      case 'ollama':
        return await this.generateOllamaResponse(messages, tools, config);
      default:
        throw new Error(`Provider type ${this.provider.type} not implemented`);
    }
  }

  private async generateOpenAIResponse(
    messages: AIMessage[], 
    tools?: Array<any>, 
    config: any = {}
  ): Promise<AIResponse> {
    const payload: any = {
      model: this.model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens
    };

    if (tools && tools.length > 0) {
      payload.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      }));
      payload.tool_choice = 'auto';
    }

    const response = await fetch(`${this.client.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.client.headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    let functionCalls: Array<{ name: string; args: Record<string, any> }> = [];
    
    if (choice.message.tool_calls) {
      functionCalls = choice.message.tool_calls.map((call: any) => ({
        name: call.function.name,
        args: JSON.parse(call.function.arguments)
      }));
    }

    return {
      content: choice.message.content || '',
      functionCalls,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    };
  }

  private async generateGeminiResponse(
    messages: AIMessage[], 
    tools?: Array<any>, 
    config: any = {}
  ): Promise<AIResponse> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens
      }
    });

    let chat;
    
    if (tools && tools.length > 0) {
      const functionDeclarations = tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }));

      chat = model.startChat({
        tools: [{ functionDeclarations }],
        toolConfig: { functionCallingMode: FunctionCallingMode.AUTO }
      });
    } else {
      chat = model.startChat();
    }

    // Enviar mensajes previos si hay contexto
    const lastMessage = messages[messages.length - 1]?.content || '';
    const result = await chat.sendMessage(lastMessage);
    const response = result.response;

    let functionCalls: Array<{ name: string; args: Record<string, any> }> = [];
    
    if (response.functionCalls && response.functionCalls().length > 0) {
      functionCalls = response.functionCalls().map((call: any) => ({
        name: call.name,
        args: call.args
      }));
    }

    return {
      content: response.text(),
      functionCalls,
      usage: {
        promptTokens: 0, // Gemini no proporciona detalles de tokens
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  private async generateOllamaResponse(
    messages: AIMessage[], 
    tools?: Array<any>, 
    config: any = {}
  ): Promise<AIResponse> {
    const payload = {
      model: this.model,
      messages: messages,
      options: {
        temperature: config.temperature,
        num_predict: config.maxTokens
      },
      stream: false
    };

    // Ollama maneja tools de manera diferente - por ahora sin soporte directo
    if (tools && tools.length > 0) {
      // Agregar información de tools al prompt del sistema
      const toolsInfo = tools.map(tool => 
        `Tool: ${tool.name} - ${tool.description}`
      ).join('\n');
      
      const systemMessage = {
        role: 'system',
        content: `You have access to these tools:\n${toolsInfo}\n\nWhen you need to use a tool, respond in this format: TOOL_CALL:tool_name:{"arg1":"value1","arg2":"value2"}`
      };
      
      payload.messages = [systemMessage, ...messages];
    }

    const response = await fetch(`${this.client.baseURL}/api/chat`, {
      method: 'POST',
      headers: this.client.headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    let content = data.message?.content || '';
    let functionCalls: Array<{ name: string; args: Record<string, any> }> = [];

    // Detectar tool calls en la respuesta de Ollama
    const toolCallMatch = content.match(/TOOL_CALL:(\w+):(\{.*?\})/);
    if (toolCallMatch) {
      try {
        const toolName = toolCallMatch[1];
        const toolArgs = JSON.parse(toolCallMatch[2]);
        functionCalls = [{ name: toolName, args: toolArgs }];
        content = content.replace(toolCallMatch[0], '').trim();
      } catch (e) {
        console.warn('Failed to parse tool call from Ollama response');
      }
    }

    return {
      content,
      functionCalls,
      usage: {
        promptTokens: 0, // Ollama no proporciona detalles de tokens por defecto
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  /**
   * Verificar si el provider está disponible
   */
  async checkAvailability(): Promise<boolean> {
    try {
      switch (this.provider.type) {
        case 'openai':
          const response = await fetch(`${this.client.baseURL}/models`, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
          });
          return response.ok;
          
        case 'gemini':
          // Intentar una llamada simple
          const model = this.client.getGenerativeModel({ model: this.model });
          await model.generateContent('test');
          return true;
          
        case 'ollama':
          const ollamaResponse = await fetch(`${this.client.baseURL}/api/tags`);
          return ollamaResponse.ok;
          
        default:
          return false;
      }
    } catch (error) {
      console.warn(`Provider ${this.provider.name} not available:`, error.message);
      return false;
    }
  }

  /**
   * Obtener información del provider
   */
  getProviderInfo() {
    return {
      ...this.provider,
      currentModel: this.model,
      hasApiKey: !!this.apiKey,
      isLocal: this.provider.localModel
    };
  }
}

/**
 * Factory para crear clientes AI
 */
export class AIClientFactory {
  static create(providerName: string, model: string, apiKey?: string): UniversalAIClient {
    return new UniversalAIClient(providerName, model, apiKey);
  }

  static getAvailableProviders(): AIProvider[] {
    return Object.values(AI_PROVIDERS);
  }

  static getProviderModels(providerName: string): string[] {
    const provider = AI_PROVIDERS[providerName];
    return provider ? provider.models : [];
  }

  static async detectAvailableProviders(): Promise<string[]> {
    const available: string[] = [];
    
    for (const [name, provider] of Object.entries(AI_PROVIDERS)) {
      try {
        // Verificación básica para providers locales
        if (provider.type === 'ollama') {
          const response = await fetch(`${provider.config?.baseURL}/api/tags`);
          if (response.ok) {
            available.push(name);
          }
        } else if (provider.apiKeyRequired) {
          // Para providers que requieren API key, solo verificar si tienen configuración
          const apiKey = process.env[`${provider.type.toUpperCase()}_API_KEY`];
          if (apiKey) {
            available.push(name);
          }
        }
      } catch (error) {
        // Provider no disponible
      }
    }
    
    return available;
  }
}

export default UniversalAIClient;
