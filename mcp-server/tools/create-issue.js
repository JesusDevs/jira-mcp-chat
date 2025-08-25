import { JiraToolBase } from './base.js';

/**
 * Herramienta para crear issues en Jira
 */
export class CreateIssueTool extends JiraToolBase {
  constructor(jiraConfig) {
    super(jiraConfig);
  }

  /**
   * Definición del esquema de la herramienta para MCP
   */
  static getSchema() {
    return {
      name: 'create_jira_issue',
      description: 'Create a new Jira issue or subtask. Can create Stories, Tasks, Bugs, Subtasks, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: 'Project key where to create the issue (e.g., "AIDEV", "SOP")',
          },
          summary: {
            type: 'string',
            description: 'Brief summary/title of the issue',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the issue (optional)',
          },
          issueType: {
            type: 'string',
            description: 'Type of issue: Story, Task, Bug, Subtask, Epic (default: Task)',
            default: 'Task',
          },
          priority: {
            type: 'string',
            description: 'Priority: Highest, High, Medium, Low, Lowest (default: Medium)',
            default: 'Medium',
          },
          assignee: {
            type: 'string',
            description: 'Email or username of assignee (optional, leave empty for unassigned)',
          },
          parentKey: {
            type: 'string',
            description: 'Parent issue key if creating a subtask (e.g., "AIDEV-123")',
          },
        },
        required: ['project', 'summary'],
      },
    };
  }

  /**
   * Ejecuta la creación de un issue
   * @param {Object} args - Argumentos de la herramienta
   * @returns {Promise<Object>} Issue creado
   */
  async execute(args) {
    try {
      const {
        project,
        summary,
        description = '',
        issueType = 'Task',
        priority = 'Medium',
        assignee,
        parentKey
      } = args;

      console.error(`📝 Creating ${issueType} in project ${project}...`);

      // Obtener metadatos del proyecto para validar tipos de issue
      const projectMeta = await this.getProjectMetadata(project);
      
      // Encontrar el tipo de issue correcto
      const issueTypeId = this.findIssueTypeId(projectMeta, issueType);
      if (!issueTypeId) {
        throw new Error(`Issue type "${issueType}" not found in project ${project}`);
      }

      // Construir el payload del issue
      const issueData = {
        fields: {
          project: { key: project },
          summary: summary,
          description: {
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
          },
          issuetype: { id: issueTypeId },
        }
      };

      // Añadir prioridad si está disponible
      if (priority && projectMeta.priorities) {
        const priorityId = this.findPriorityId(projectMeta, priority);
        if (priorityId) {
          issueData.fields.priority = { id: priorityId };
        }
      }

      // Añadir assignee si se especifica
      if (assignee) {
        issueData.fields.assignee = { emailAddress: assignee };
      }

      // Añadir parent si es una subtask
      if (parentKey && issueType.toLowerCase() === 'subtask') {
        issueData.fields.parent = { key: parentKey };
      }

      const response = await this.makeJiraRequest('/issue', issueData, 'POST');

      const newIssue = {
        key: response.data.key,
        id: response.data.id,
        url: `${this.jiraConfig.baseURL}/browse/${response.data.key}`,
        project: project,
        summary: summary,
        description: description,
        issueType: issueType,
        priority: priority,
        assignee: assignee || 'Unassigned',
        parentKey: parentKey || null,
        created: new Date().toISOString(),
      };

      return this.createResponse({
        issue: newIssue,
        success: true,
        message: `Issue ${response.data.key} created successfully`,
      });

    } catch (error) {
      return this.handleError(error, 'create_jira_issue');
    }
  }

  /**
   * Obtiene metadatos del proyecto
   * @param {string} projectKey - Clave del proyecto
   * @returns {Promise<Object>} Metadatos del proyecto
   */
  async getProjectMetadata(projectKey) {
    const response = await this.makeJiraRequest(`/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`);
    return response.data.projects[0];
  }

  /**
   * Encuentra el ID del tipo de issue
   * @param {Object} projectMeta - Metadatos del proyecto
   * @param {string} issueTypeName - Nombre del tipo de issue
   * @returns {string|null} ID del tipo de issue
   */
  findIssueTypeId(projectMeta, issueTypeName) {
    const issueType = projectMeta.issuetypes.find(
      type => type.name.toLowerCase() === issueTypeName.toLowerCase()
    );
    return issueType ? issueType.id : null;
  }

  /**
   * Encuentra el ID de la prioridad
   * @param {Object} projectMeta - Metadatos del proyecto
   * @param {string} priorityName - Nombre de la prioridad
   * @returns {string|null} ID de la prioridad
   */
  findPriorityId(projectMeta, priorityName) {
    // Las prioridades están en los fields de los issue types
    const priorityField = projectMeta.issuetypes[0]?.fields?.priority;
    if (!priorityField) return null;

    const priority = priorityField.allowedValues.find(
      p => p.name.toLowerCase() === priorityName.toLowerCase()
    );
    return priority ? priority.id : null;
  }
}
