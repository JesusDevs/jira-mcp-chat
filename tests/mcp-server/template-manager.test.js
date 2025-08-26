/**
 * @file Tests para Template Manager del MCP Server
 * @description Tests para el sistema de templates de Jira
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateManagerTool } from '../../mcp-server/tools/template-manager.js';
import fs from 'fs';
import path from 'path';

// Mock fs module
vi.mock('fs');

describe('TemplateManagerTool', () => {
  let templateManager;
  let mockJiraConfig;

  beforeEach(() => {
    mockJiraConfig = {
      baseURL: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token'
    };
    
    templateManager = new TemplateManagerTool(mockJiraConfig);
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Template Loading', () => {
    it('should load template from correct path', async () => {
      const mockTemplate = {
        name: 'test-template',
        title: 'Test Template',
        description: 'Test description',
        fields: { test_field: 'test value' }
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockTemplate));

      const result = await templateManager.loadTemplate('test-template');
      
      expect(result).toEqual(mockTemplate);
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should return null for non-existent template', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await templateManager.loadTemplate('non-existent');
      
      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');

      await expect(
        templateManager.loadTemplate('invalid-template')
      ).rejects.toThrow('Template invalid-template tiene formato inválido');
    });
  });

  describe('Variable Replacement', () => {
    it('should replace variables in text', () => {
      const text = 'Hello {name}, welcome to {project}';
      const variables = {
        name: 'John',
        project: 'Test Project'
      };

      const result = templateManager.replaceVariables(text, variables);
      
      expect(result).toBe('Hello John, welcome to Test Project');
    });

    it('should handle missing variables', () => {
      const text = 'Hello {name}, welcome to {project}';
      const variables = {
        name: 'John'
        // project missing
      };

      const result = templateManager.replaceVariables(text, variables);
      
      expect(result).toBe('Hello John, welcome to {project}');
    });

    it('should handle empty variables object', () => {
      const text = 'Hello {name}';
      const variables = {};

      const result = templateManager.replaceVariables(text, variables);
      
      expect(result).toBe('Hello {name}');
    });
  });

  describe('Template Processing', () => {
    it('should process template with variables and team context', () => {
      const template = {
        name: 'test-template',
        title: '{epic_name} for {team}',
        description: 'Led by {tech_lead}',
        labels: ['template']
      };

      const variables = {
        epic_name: 'Test Epic',
        team: 'Frontend'
      };

      const teamContext = {
        team: 'frontend',
        team_members: {
          tech_lead: 'John Doe'
        }
      };

      const result = templateManager.processTemplate(template, variables, teamContext);

      expect(result.title).toBe('Test Epic for Frontend');
      expect(result.description).toBe('Led by John Doe');
      expect(result.labels).toContain('team-frontend');
    });
  });

  describe('List Templates', () => {
    it('should list all templates by category', async () => {
      const mockFiles = {
        epics: ['product-epic.json', 'technical-epic.json'],
        hdus: ['feature-story.json', 'bug-story.json']
      };

      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockImplementation((dir) => {
        if (dir.includes('epics')) return mockFiles.epics;
        if (dir.includes('hdus')) return mockFiles.hdus;
        return [];
      });

      const mockTemplate = {
        name: 'test',
        title: 'Test Template',
        description: 'Test',
        fields: {}
      };
      fs.readFileSync.mockReturnValue(JSON.stringify(mockTemplate));

      const result = await templateManager.listTemplates();

      expect(result.templates).toHaveProperty('epics');
      expect(result.templates).toHaveProperty('hdus');
      expect(result.total).toBeGreaterThan(0);
    });

    it('should filter templates by category', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['product-epic.json']);
      
      const mockTemplate = {
        name: 'product-epic',
        title: 'Product Epic',
        fields: {}
      };
      fs.readFileSync.mockReturnValue(JSON.stringify(mockTemplate));

      const result = await templateManager.listTemplates({ category: 'epics' });

      expect(result.templates).toHaveProperty('epics');
      expect(result.templates).not.toHaveProperty('hdus');
    });
  });

  describe('Description Formatting', () => {
    it('should format description for Atlassian Document Format', () => {
      const description = 'Test description';
      
      const result = templateManager.formatDescription(description);

      expect(result).toEqual({
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: description
          }]
        }]
      });
    });
  });
});
