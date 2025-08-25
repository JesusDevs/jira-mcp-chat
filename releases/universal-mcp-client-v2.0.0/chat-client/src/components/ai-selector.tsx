'use client';

import React, { useState } from 'react';

interface AISelectorProps {
  onProviderChange: (provider: string, model: string) => void;
  defaultProvider?: string;
  defaultModel?: string;
}

// Providers disponibles (simplificado)
const AVAILABLE_PROVIDERS = [
  { name: 'gemini', displayName: 'Gemini Pro', models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'], icon: '✨' },
  { name: 'gpt-4', displayName: 'GPT-4', models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o'], icon: '🤖' },
  { name: 'gpt-3.5', displayName: 'GPT-3.5', models: ['gpt-3.5-turbo'], icon: '🤖' },
  { name: 'ollama', displayName: 'Ollama Local', models: ['llama3.1:latest', 'llama3.2:latest', 'deepseek-coder:latest'], icon: '🦙' }
];

export default function AISelector({ 
  onProviderChange, 
  defaultProvider = 'gemini', 
  defaultModel = 'gemini-2.0-flash-exp' 
}: AISelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState(defaultProvider);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [pendingModel, setPendingModel] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleProviderChange = (providerName: string) => {
    const provider = AVAILABLE_PROVIDERS.find(p => p.name === providerName);
    const firstModel = provider?.models[0] || '';
    
    // Guardar como pendiente, no aplicar inmediatamente
    setPendingProvider(providerName);
    setPendingModel(firstModel);
  };

  const handleModelChange = (model: string) => {
    // Guardar como pendiente, no aplicar inmediatamente
    setPendingModel(model);
  };

  const applyChanges = async () => {
    if (!pendingProvider || !pendingModel) return;
    
    setIsApplying(true);
    
    try {
      // Aplicar los cambios
      setSelectedProvider(pendingProvider);
      setSelectedModel(pendingModel);
      
      // Llamar al callback para notificar al componente padre
      onProviderChange(pendingProvider, pendingModel);
      
      // Actualizar timestamp de guardado
      setLastSaved(new Date().toLocaleTimeString());
      
      // Limpiar pendientes
      setPendingProvider(null);
      setPendingModel(null);
      
      console.log(`✅ AI configurado: ${pendingProvider} - ${pendingModel}`);
      
    } catch (error) {
      console.error('Error aplicando cambios:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const cancelChanges = () => {
    setPendingProvider(null);
    setPendingModel(null);
  };

  // Verificar si hay cambios pendientes
  const hasPendingChanges = pendingProvider !== null || pendingModel !== null;
  const currentDisplayProvider = pendingProvider || selectedProvider;
  const currentDisplayModel = pendingModel || selectedModel;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        🤖 Selector de IA
      </h3>

      <div className="space-y-4">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider de IA:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {AVAILABLE_PROVIDERS.map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleProviderChange(provider.name)}
                className={`
                  p-3 rounded-lg border text-left transition-all relative
                  ${currentDisplayProvider === provider.name 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                  ${pendingProvider === provider.name ? 'ring-2 ring-orange-300' : ''}
                `}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{provider.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium flex items-center">
                      {provider.displayName}
                      {selectedProvider === provider.name && !hasPendingChanges && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Activo</span>
                      )}
                      {pendingProvider === provider.name && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Pendiente</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {provider.name === 'ollama' ? 'Local' : 'Cloud'} • {provider.models.length} models
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        {currentDisplayProvider && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modelo:
            </label>
            <select
              value={currentDisplayModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {AVAILABLE_PROVIDERS.find(p => p.name === currentDisplayProvider)?.models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Confirmation Buttons */}
        {hasPendingChanges && (
          <div className="flex space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium text-orange-700">
                ⚠️ Cambios pendientes
              </div>
              <div className="text-xs text-orange-600">
                {pendingProvider && AVAILABLE_PROVIDERS.find(p => p.name === pendingProvider)?.displayName} - {pendingModel}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={applyChanges}
                disabled={isApplying}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isApplying ? (
                  <>
                    <div className="animate-spin mr-1">⏳</div>
                    Aplicando...
                  </>
                ) : (
                  <>
                    ✅ Aplicar
                  </>
                )}
              </button>
              <button
                onClick={cancelChanges}
                disabled={isApplying}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Current Selection Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm">
            <div className="font-medium text-gray-700 flex items-center justify-between">
              <span>Configuración activa:</span>
              {lastSaved && (
                <span className="text-xs text-green-600 flex items-center">
                  💾 Guardado a las {lastSaved}
                </span>
              )}
            </div>
            <div className="text-gray-600 mt-1">
              <span className="font-medium">{AVAILABLE_PROVIDERS.find(p => p.name === selectedProvider)?.displayName || 'No seleccionado'}</span>
              <span className="mx-2">•</span>
              <span>{selectedModel}</span>
              <span className="mx-2">•</span>
              <span className={`
                px-2 py-1 rounded text-xs
                ${selectedProvider === 'ollama' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
                }
              `}>
                {selectedProvider === 'ollama' ? '🏠 Local (Gratis)' : '☁️ Cloud (API Key)'}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 border-t pt-2">
          <div>• Selecciona un provider y modelo, luego haz clic en "✅ Aplicar"</div>
          <div>• Los cambios se guardan automáticamente en caché</div>
          <div>• Ollama: Gratis y local • Gemini/GPT: Requieren API keys</div>
        </div>
      </div>
    </div>
  );
}