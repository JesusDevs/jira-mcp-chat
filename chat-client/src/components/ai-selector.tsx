'use client';

import React, { useState, useEffect } from 'react';
import { AI_PROVIDERS, AIProvider, AIClientFactory } from '@/lib/ai-providers';

interface AISelectorProps {
  onProviderChange: (provider: string, model: string) => void;
  defaultProvider?: string;
  defaultModel?: string;
}

export default function AISelector({ 
  onProviderChange, 
  defaultProvider = 'gemini', 
  defaultModel = 'gemini-1.5-flash' 
}: AISelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState(defaultProvider);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    detectProviders();
  }, []);

  const detectProviders = async () => {
    setIsLoading(true);
    try {
      const available = await AIClientFactory.detectAvailableProviders();
      setAvailableProviders(available);
      
      // Verificar estado de cada provider
      const status: Record<string, boolean> = {};
      for (const providerName of Object.keys(AI_PROVIDERS)) {
        status[providerName] = available.includes(providerName);
      }
      setProviderStatus(status);
      
      // Si el provider seleccionado no está disponible, cambiar al primero disponible
      if (!available.includes(selectedProvider) && available.length > 0) {
        const firstAvailable = available[0];
        const firstModel = AI_PROVIDERS[firstAvailable].models[0];
        setSelectedProvider(firstAvailable);
        setSelectedModel(firstModel);
        onProviderChange(firstAvailable, firstModel);
      }
      
    } catch (error) {
      console.error('Error detecting AI providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (providerName: string) => {
    setSelectedProvider(providerName);
    const provider = AI_PROVIDERS[providerName];
    const firstModel = provider.models[0];
    setSelectedModel(firstModel);
    onProviderChange(providerName, firstModel);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    onProviderChange(selectedProvider, model);
  };

  const getProviderIcon = (provider: AIProvider) => {
    switch (provider.type) {
      case 'openai': return '🤖';
      case 'gemini': return '✨';
      case 'ollama': return '🦙';
      default: return '🔧';
    }
  };

  const getStatusIcon = (providerName: string) => {
    if (isLoading) return '⏳';
    return providerStatus[providerName] ? '✅' : '❌';
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
        <div className="animate-spin text-blue-500">⏳</div>
        <span className="text-sm text-gray-600">Detectando AI providers...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        🤖 Selector de IA
        <button 
          onClick={detectProviders}
          className="ml-2 text-blue-500 hover:text-blue-700 text-sm"
          title="Redetectar providers"
        >
          🔄
        </button>
      </h3>
      
      {/* Provider Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Provider de IA:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(AI_PROVIDERS).map(([key, provider]) => {
            const isAvailable = providerStatus[key];
            const isSelected = selectedProvider === key;
            
            return (
              <button
                key={key}
                onClick={() => isAvailable && handleProviderChange(key)}
                disabled={!isAvailable}
                className={`
                  p-3 border rounded-lg text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 text-blue-900' 
                    : isAvailable 
                      ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50' 
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="mr-2">{getProviderIcon(provider)}</span>
                      <span className="font-medium text-sm">{provider.displayName}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {provider.localModel ? '🏠 Local' : '☁️ Cloud'}
                      {provider.apiKeyRequired && ' • API Key requerida'}
                    </div>
                  </div>
                  <span className="text-sm">{getStatusIcon(key)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Selection */}
      {selectedProvider && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modelo:
          </label>
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {AI_PROVIDERS[selectedProvider].models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Current Selection Info */}
      {selectedProvider && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {getProviderIcon(AI_PROVIDERS[selectedProvider])} {AI_PROVIDERS[selectedProvider].displayName}
            </div>
            <div className="text-gray-600 mt-1">
              Modelo: <span className="font-mono text-sm">{selectedModel}</span>
            </div>
            <div className="text-gray-500 text-xs mt-1">
              {AI_PROVIDERS[selectedProvider].localModel 
                ? '🏠 Ejecutándose localmente' 
                : '☁️ Servicio en la nube'
              }
            </div>
          </div>
        </div>
      )}

      {/* No providers available */}
      {availableProviders.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start">
            <span className="text-yellow-500 mr-2">⚠️</span>
            <div>
              <div className="text-sm font-medium text-yellow-800">
                No hay providers de IA disponibles
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                Configura al menos uno:
                <ul className="list-disc list-inside mt-1">
                  <li>Gemini: Configura GEMINI_API_KEY</li>
                  <li>OpenAI: Configura OPENAI_API_KEY</li>
                  <li>Ollama: Instala y ejecuta Ollama localmente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ollama Instructions */}
      {!providerStatus['ollama-llama3'] && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm">
            <div className="font-medium text-blue-800 mb-1">
              💡 Usar Ollama (Gratuito y Local)
            </div>
            <div className="text-blue-700 text-xs">
              1. Instalar: <code className="bg-blue-100 px-1 rounded">curl https://ollama.ai/install.sh | sh</code><br/>
              2. Ejecutar: <code className="bg-blue-100 px-1 rounded">ollama run llama3</code><br/>
              3. Refrescar para detectar 🔄
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
