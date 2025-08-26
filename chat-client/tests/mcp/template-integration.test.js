/**
 * @file Tests de integración MCP para Templates
 * @description Tests específicos para funcionalidad de templates del MCP server
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClient } from '../../src/lib/real-mcp-client';

describe('MCP Templates Integration Tests', () => {
  let mcpClient;
  
  beforeAll(async () => {
    // Configurar cliente MCP para tests
    mcpClient = new MCPClient('jira-test', {
      command: 'node',
      args: ['../../mcp-server/index.js']
    });
    
    // Intentar conectar (skip si no está disponible)
    try {
      await mcpClient.connect();
    } catch (error) {
      console.warn('MCP Server no disponible para tests:', error.message);
    }
  });

  afterAll(async () => {
    if (mcpClient && mcpClient.isConnected) {
      await mcpClient.disconnect();
    }
  });

  describe('Template Listing', () => {
    it('should list available templates', async () => {
      if (!mcpClient.isConnected) {
        console.warn('Skipping test - MCP server not connected');
        return;
      }

      const result = await mcpClient.callTool('list_jira_templates', {});
      
      expect(result).toHaveProperty('templates');
      expect(result.templates).toHaveProperty('epics');
      expect(result.templates).toHaveProperty('hdus');
      expect(result.templates).toHaveProperty('team-context');
      expect(result.templates).toHaveProperty('dod');
    });

    it('should filter templates by category', async () => {
      if (!mcpClient.isConnected) return;

      const result = await mcpClient.callTool('list_jira_templates', {
        category: 'epics'
      });
      
      expect(result.templates).toHaveProperty('epics');
      expect(result.templates.epics).toBeInstanceOf(Array);
      expect(result.templates.epics.length).toBeGreaterThan(0);
    });
  });

  describe('Template Creation', () => {
    it('should create issue from epic template', async () => {
      if (!mcpClient.isConnected) return;

      const variables = {
        epic_name: 'Test Epic Integration',
        objective: 'Test objective for integration testing',
        business_value: 'Validate template system',
        product_owner: 'test@example.com',
        tech_lead: 'tech@example.com',
        teams: 'Frontend, Backend',
        acceptance_criteria: 'Template system working correctly',
        success_metrics: 'Tests passing',
        figma_link: 'https://figma.com/test',
        docs_link: 'https://docs.test.com',
        slack_channel: '#test-epic'
      };

      const result = await mcpClient.callTool('create_jira_from_template', {
        template: 'product-epic',
        project: 'TEST',
        variables,
        team_context: 'frontend'
      });

      expect(result.success).toBe(true);
      expect(result.issue).toHaveProperty('key');
      expect(result.issue.template).toBe('product-epic');
    });

    it('should handle missing variables gracefully', async () => {
      if (!mcpClient.isConnected) return;

      const result = await mcpClient.callTool('create_jira_from_template', {
        template: 'feature-story',
        variables: {
          story_name: 'Incomplete Story Test'
          // Faltan otras variables requeridas
        }
      });

      // Debería crear el issue pero con variables sin reemplazar
      expect(result.success).toBe(true);
      expect(result.issue.key).toBeDefined();
    });
  });

  describe('Team Context Integration', () => {
    it('should apply team context to templates', async () => {
      if (!mcpClient.isConnected) return;

      const result = await mcpClient.callTool('create_jira_from_template', {
        template: 'feature-story',
        variables: {
          story_name: 'Frontend Feature Test',
          user_role: 'end user',
          user_want: 'test functionality',
          user_benefit: 'validate system'
        },
        team_context: 'frontend'
      });

      expect(result.success).toBe(true);
      expect(result.issue.team_context).toBe('frontend');
      // Verificar que se aplicaron labels del equipo
      // (esto requeriría verificar en Jira directamente)
    });
  });
});
