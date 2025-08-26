"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MCPServer {
  id: string;
  name: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  toolsCount: number;
  tools: string[];
  lastError?: string;
}

interface MCPStatusData {
  success: boolean;
  timestamp: string;
  summary: {
    totalServers: number;
    connectedServers: number;
    totalTools: number;
    connectedServerNames: string[];
  };
  servers: Record<string, MCPServer>;
  toolsByServer: Record<string, any[]>;
  allTools: any[];
}

export function MCPStatus() {
  const [statusData, setStatusData] = useState<MCPStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMCPStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/mcp-status', {
        method: 'GET',
        cache: 'no-store'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatusData(data);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to fetch MCP status');
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
      console.error('Error fetching MCP status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMCPStatus();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchMCPStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Error';
      default: return 'Desconocido';
    }
  };

  if (loading && !statusData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            Cargando estado MCP...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error && !statusData) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Error MCP Status</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchMCPStatus} variant="outline" size="sm">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen General */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Estado de Servidores MCP</CardTitle>
              <CardDescription>
                {lastUpdated && (
                  <span className="text-xs">
                    Actualizado: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button 
              onClick={fetchMCPStatus} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              {loading ? '🔄' : '↻'} Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statusData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {statusData.summary.totalServers}
                </div>
                <div className="text-sm text-gray-600">Total Servidores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {statusData.summary.connectedServers}
                </div>
                <div className="text-sm text-gray-600">Conectados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {statusData.summary.totalTools}
                </div>
                <div className="text-sm text-gray-600">Total Tools</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {statusData.summary.connectedServers > 0 ? '🟢' : '🔴'}
                </div>
                <div className="text-sm text-gray-600">Estado General</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Servidores */}
      {statusData && Object.entries(statusData.servers).length > 0 && (
        <div className="grid gap-4">
          {Object.entries(statusData.servers).map(([serverId, server]) => (
            <Card key={serverId} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`}></div>
                    <div>
                      <CardTitle className="text-base">{server.name}</CardTitle>
                      <CardDescription className="text-sm">
                        ID: {server.id} • {getStatusText(server.status)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={server.status === 'connected' ? 'default' : 'secondary'}>
                    {server.toolsCount} tools
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {server.lastError && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Error:</strong> {server.lastError}
                  </div>
                )}
                
                {server.tools && server.tools.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Herramientas disponibles:</div>
                    <div className="flex flex-wrap gap-1">
                      {server.tools.map((toolName, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              {toolName}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Herramienta: {toolName}</p>
                            <p>Servidor: {server.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mensaje si no hay servidores */}
      {statusData && Object.entries(statusData.servers).length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-lg font-medium">No hay servidores MCP configurados</div>
              <div className="text-sm">Configura servidores MCP en mcp-config.json</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
