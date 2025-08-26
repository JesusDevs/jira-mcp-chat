import { JiraToolBase } from './base.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Gestor de Templates para crear issues usando plantillas predefinidas
 */
export class TemplateManagerTool extends JiraToolBase {
  constructor(jiraConfig) {
    super(jiraConfig);
    this.templatesDir = path.join(__dirname, '..', 'templates');
  }

  /**
   * Esquema para listar templates disponibles
   */
  static getListTemplatesSchema() {
    return {
      name: 'list_jira_templates',
      description: 'Lista todos los templates disponibles organizados por categoría (epics, hdus, team-context, dod)',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Categoría específica: epics, hdus, team-context, dod (opcional)',
            enum: ['epics', 'hdus', 'team-context', 'dod']
          }
        },
        required: []
      }
    };
  }

  /**
   * Esquema para crear issue desde template
   */
  static getCreateFromTemplateSchema() {
    return {
      name: 'create_jira_from_template',
      description: 'Crea un issue de Jira usando un template predefinido con variables personalizables',
      inputSchema: {
        type: 'object',
        properties: {
          template: {
            type: 'string',
            description: 'Nombre del template a usar (ej: product-epic, feature-story, bug-story)'
          },
          project: {
            type: 'string',
            description: 'Proyecto donde crear el issue (default: AIDEV)',
            default: 'AIDEV'
          },
          variables: {
            type: 'object',
            description: 'Variables para reemplazar en el template (ej: {epic_name: "Mi Epic", objective: "Objetivo"})',
            additionalProperties: true
          },
          team_context: {
            type: 'string',
            description: 'Contexto del equipo a aplicar (frontend, backend, devops, qa)',
            enum: ['frontend', 'backend', 'devops', 'qa']
          }
        },
        required: ['template', 'variables']
      }
    };
  }

  /**
   * Lista templates disponibles
   */
  async listTemplates(args = {}) {
    try {
      const { category } = args;
      const templates = {};
      
      const categories = category ? [category] : ['epics', 'hdus', 'team-context', 'dod'];
      
      for (const cat of categories) {
        const categoryPath = path.join(this.templatesDir, cat);
        
        if (fs.existsSync(categoryPath)) {
          const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
          templates[cat] = [];
          
          for (const file of files) {
            try {
              const templatePath = path.join(categoryPath, file);
              const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
              
              templates[cat].push({
                name: template.name,
                title: template.title || template.name,
                description: template.description || 'Sin descripción',
                fields: Object.keys(template.fields || {}),
                file: file
              });
            } catch (error) {
              console.error(`Error loading template ${file}:`, error.message);
            }
          }
        }
      }

      return {
        templates,
        total: Object.values(templates).reduce((sum, cat) => sum + cat.length, 0),
        categories: Object.keys(templates)
      };

    } catch (error) {
      return this.handleError(error, 'list_jira_templates');
    }
  }

  /**
   * Crea issue desde template
   */
  async createFromTemplate(args) {
    try {
      const { template, project = 'AIDEV', variables = {}, team_context } = args;

      // Buscar el template
      const templateData = await this.loadTemplate(template);
      if (!templateData) {
        throw new Error(`Template "${template}" no encontrado`);
      }

      // Cargar contexto del equipo si se especifica
      let teamContext = {};
      if (team_context) {
        teamContext = await this.loadTeamContext(team_context);
      }

      // Procesar el template con las variables
      const processedTemplate = this.processTemplate(templateData, variables, teamContext);

      // Crear el issue usando el template procesado
      const issueData = {
        fields: {
          project: { key: project },
          summary: processedTemplate.title,
          description: this.formatDescription(processedTemplate.description),
          issuetype: { name: processedTemplate.issueType },
          priority: { name: processedTemplate.priority },
          labels: processedTemplate.labels || []
        }
      };

      // Obtener metadatos del proyecto para validar
      const projectMeta = await this.getProjectMetadata(project);
      if (!projectMeta) {
        throw new Error(`Project "${project}" not found`);
      }

      // Validar y ajustar issue type
      const issueTypeId = this.findIssueTypeId(projectMeta, processedTemplate.issueType);
      if (issueTypeId) {
        issueData.fields.issuetype = { id: issueTypeId };
      }

      // Crear el issue
      const response = await this.makeJiraRequest('/issue', issueData, 'POST');

      const newIssue = {
        key: response.data.key,
        id: response.data.id,
        url: `${this.jiraConfig.baseURL}/browse/${response.data.key}`,
        template: template,
        team_context: team_context,
        variables_used: variables
      };

      return this.createResponse({
        issue: newIssue,
        success: true,
        message: `Issue ${response.data.key} creado desde template "${template}"`,
        template_info: {
          name: templateData.name,
          category: this.getTemplateCategory(template)
        }
      });

    } catch (error) {
      return this.handleError(error, 'create_jira_from_template');
    }
  }

  /**
   * Carga un template desde archivo
   */
  async loadTemplate(templateName) {
    const categories = ['epics', 'hdus', 'team-context', 'dod'];
    
    for (const category of categories) {
      const templatePath = path.join(this.templatesDir, category, `${templateName}.json`);
      
      if (fs.existsSync(templatePath)) {
        try {
          return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        } catch (error) {
          console.error(`Error loading template ${templateName}:`, error.message);
          throw new Error(`Template ${templateName} tiene formato inválido`);
        }
      }
    }
    
    return null;
  }

  /**
   * Carga contexto de equipo
   */
  async loadTeamContext(teamName) {
    const contextPath = path.join(this.templatesDir, 'team-context', `${teamName}-team.json`);
    
    if (fs.existsSync(contextPath)) {
      try {
        return JSON.parse(fs.readFileSync(contextPath, 'utf8'));
      } catch (error) {
        console.error(`Error loading team context ${teamName}:`, error.message);
        return {};
      }
    }
    
    return {};
  }

  /**
   * Procesa template reemplazando variables
   */
  processTemplate(template, variables, teamContext) {
    const processed = JSON.parse(JSON.stringify(template)); // Deep clone
    
    // Combinar variables con contexto de equipo
    const allVariables = {
      ...teamContext.team_members || {},
      ...teamContext.communication || {},
      ...variables
    };

    // Reemplazar variables en título y descripción
    processed.title = this.replaceVariables(processed.title, allVariables);
    processed.description = this.replaceVariables(processed.description, allVariables);

    // Agregar labels del equipo si existe contexto
    if (teamContext.team) {
      processed.labels = [...(processed.labels || []), `team-${teamContext.team}`];
    }

    return processed;
  }

  /**
   * Reemplaza variables en texto usando formato {variable}
   */
  replaceVariables(text, variables) {
    if (!text) return text;
    
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, value || `{${key}}`);
    }
    
    return result;
  }

  /**
   * Formatea descripción para Jira (Atlassian Document Format)
   */
  formatDescription(description) {
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: description
            }
          ]
        }
      ]
    };
  }

  /**
   * Obtiene la categoría de un template
   */
  getTemplateCategory(templateName) {
    const categories = ['epics', 'hdus', 'team-context', 'dod'];
    
    for (const category of categories) {
      const templatePath = path.join(this.templatesDir, category, `${templateName}.json`);
      if (fs.existsSync(templatePath)) {
        return category;
      }
    }
    
    return 'unknown';
  }

  /**
   * Métodos heredados de JiraToolBase para compatibilidad
   */
  async getProjectMetadata(projectKey) {
    const response = await this.makeJiraRequest(`/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`);
    return response.data.projects[0];
  }

  findIssueTypeId(projectMeta, issueTypeName) {
    const issueType = projectMeta.issuetypes.find(
      type => type.name.toLowerCase() === issueTypeName.toLowerCase()
    );
    return issueType ? issueType.id : null;
  }
}
