import { JiraToolBase } from './base.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Herramienta para gestionar templates de Jira
 * Permite listar y crear issues desde templates predefinidos
 */
export class TemplateManagerTool extends JiraToolBase {
  constructor(jiraConfig) {
    super(jiraConfig);
    this.templatesPath = path.resolve(process.cwd(), 'templates');
  }

  /**
   * Schema para listar templates
   */
  static getListTemplatesSchema() {
    return {
      name: 'list_jira_templates',
      description: 'List available Jira issue templates by category',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter templates by category (epics, hdus, team-context, dod)',
            enum: ['epics', 'hdus', 'team-context', 'dod']
          }
        }
      }
    };
  }

  /**
   * Schema para crear desde template
   */
  static getCreateFromTemplateSchema() {
    return {
      name: 'create_jira_from_template',
      description: 'Create Jira issue from template with variable substitution',
      inputSchema: {
        type: 'object',
        properties: {
          template: {
            type: 'string',
            description: 'Template name (e.g., product-epic, technical-epic, feature-story)'
          },
          variables: {
            type: 'object',
            description: 'Variables to substitute in template',
            additionalProperties: {
              type: 'string'
            }
          },
          team_context: {
            type: 'string',
            description: 'Team context to apply (frontend-team, backend-team)',
            enum: ['frontend-team', 'backend-team']
          },
          project: {
            type: 'string',
            description: 'Jira project key (default: AIDEV)'
          }
        },
        required: ['template', 'variables']
      }
    };
  }

  /**
   * Listar templates disponibles
   */
  async listTemplates(args) {
    try {
      console.log('📋 Listing Jira templates, args:', args);
      
      const { category } = args;
      const templates = {};

      // Obtener todas las categorías o solo la especificada
      const categories = category ? [category] : ['epics', 'hdus', 'team-context', 'dod'];
      
      for (const cat of categories) {
        const categoryPath = path.join(this.templatesPath, cat);
        
        try {
          const files = await fs.readdir(categoryPath);
          const jsonFiles = files.filter(file => file.endsWith('.json'));
          
          templates[cat] = [];
          
          for (const file of jsonFiles) {
            const filePath = path.join(categoryPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const template = JSON.parse(content);
            
            templates[cat].push({
              id: file.replace('.json', ''),
              name: template.name,
              description: template.description,
              variables: template.variables || {},
              category: cat
            });
          }
        } catch (error) {
          console.warn(`⚠️ Error reading category ${cat}:`, error.message);
          templates[cat] = [];
        }
      }

      console.log(`✅ Found templates:`, Object.keys(templates).reduce((acc, cat) => {
        acc[cat] = templates[cat].length;
        return acc;
      }, {}));

      return {
        success: true,
        templates,
        total: Object.values(templates).reduce((sum, arr) => sum + arr.length, 0)
      };

    } catch (error) {
      console.error('❌ Error listing templates:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Crear issue desde template
   */
  async createFromTemplate(args) {
    try {
      console.log('🎯 Creating issue from template:', args);
      
      const { template, variables, team_context, project = 'AIDEV' } = args;

      // Cargar template
      const templateData = await this.loadTemplate(template);
      if (!templateData) {
        throw new Error(`Template not found: ${template}`);
      }

      // Cargar contexto de equipo si se especifica
      let teamContext = null;
      if (team_context) {
        teamContext = await this.loadTeamContext(team_context);
      }

      // Reemplazar variables en el template
      const issueData = JSON.parse(JSON.stringify(templateData.fields));
      
      // Reemplazar variables en todos los campos de texto
      for (const [field, value] of Object.entries(issueData)) {
        if (typeof value === 'string') {
          issueData[field] = this.replaceVariables(value, variables, teamContext);
        }
      }

      // Reemplazar variables en labels si existen
      if (issueData.labels && Array.isArray(issueData.labels)) {
        issueData.labels = issueData.labels.map(label => 
          this.replaceVariables(label, variables, teamContext)
        );
      }

      // Crear el issue usando la herramienta base
      const createResult = await this.createIssue({
        project,
        issueType: templateData.issueType,
        summary: issueData.summary,
        description: issueData.description,
        priority: issueData.priority || 'Medium',
        labels: issueData.labels || []
      });

      return {
        success: true,
        issue: createResult,
        template: template,
        variables: variables,
        team_context: team_context
      };

    } catch (error) {
      console.error('❌ Error creating from template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cargar template desde archivo
   */
  async loadTemplate(templateName) {
    // Buscar en todas las categorías
    const categories = ['epics', 'hdus', 'team-context', 'dod'];
    
    for (const category of categories) {
      const templatePath = path.join(this.templatesPath, category, `${templateName}.json`);
      
      try {
        const content = await fs.readFile(templatePath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        // Continuar buscando en otras categorías
        continue;
      }
    }
    
    return null;
  }

  /**
   * Cargar contexto de equipo
   */
  async loadTeamContext(teamName) {
    try {
      const contextPath = path.join(this.templatesPath, 'team-context', `${teamName}.json`);
      const content = await fs.readFile(contextPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️ Team context not found: ${teamName}`);
      return null;
    }
  }

  /**
   * Reemplazar variables en texto
   */
  replaceVariables(text, variables, teamContext) {
    let result = text;
    
    // Reemplazar variables del usuario
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    
    // Reemplazar variables del contexto de equipo
    if (teamContext) {
      result = result.replace(/{team_context}/g, teamContext.name || '');
    }
    
    // Variables adicionales
    result = result.replace(/{current_date}/g, new Date().toISOString().split('T')[0]);
    
    return result;
  }

  /**
   * Crear issue (usando método de la clase base)
   */
  async createIssue(issueData) {
    // Usar el método de CreateIssueTool
    const createTool = new (await import('./create-issue.js')).CreateIssueTool(this.jiraConfig);
    return await createTool.execute(issueData);
  }
}
