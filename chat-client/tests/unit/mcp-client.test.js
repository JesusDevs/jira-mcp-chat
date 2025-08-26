/**
 * @file Tests unitarios para MCP Client
 * @description Tests para funciones de cliente MCP sin dependencias externas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPClient } from '../../src/lib/real-mcp-client';

describe('MCPClient - Unit Tests', () => {
  let mcpClient;
  
  beforeEach(() => {
    mcpClient = new MCPClient('test-server', {
      command: 'node',
      args: ['test-server.js']
    });
  });

  describe('Constructor', () => {
    it('should initialize with correct server name and config', () => {
      expect(mcpClient.serverName).toBe('test-server');
      expect(mcpClient.config.command).toBe('node');
      expect(mcpClient.config.args).toEqual(['test-server.js']);
    });

    it('should initialize with default state', () => {
      expect(mcpClient.isConnected).toBe(false);
      expect(mcpClient.client).toBeNull();
      expect(mcpClient.transport).toBeNull();
    });
  });

  describe('Connection Management', () => {
    it('should handle connection errors gracefully', async () => {
      // Mock failed connection
      const mockConnect = vi.fn().mockRejectedValue(new Error('Connection failed'));
      mcpClient.client = { connect: mockConnect };

      await expect(mcpClient.connect()).rejects.toThrow('Connection failed');
      expect(mcpClient.isConnected).toBe(false);
    });
  });

  describe('Tool Management', () => {
    it('should return empty array when no tools available', async () => {
      mcpClient.isConnected = false;
      
      const tools = await mcpClient.listTools();
      expect(tools).toEqual([]);
    });

    it('should format tools correctly when connected', async () => {
      // Mock successful tool listing
      const mockTools = [
        {
          name: 'test_tool',
          description: 'Test tool',
          inputSchema: {
            type: 'object',
            properties: {
              param1: { type: 'string' }
            }
          }
        }
      ];

      mcpClient.isConnected = true;
      mcpClient.client = {
        request: vi.fn().mockResolvedValue({
          tools: mockTools
        })
      };

      const tools = await mcpClient.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test_tool');
    });
  });
});
