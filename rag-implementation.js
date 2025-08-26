import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * RAG (Retrieval Augmented Generation) para Jira
 * Indexa y busca contenido de Jira usando embeddings semánticos
 */
class JiraRAGService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.chroma = new ChromaClient({
      path: process.env.CHROMA_DB_PATH || './chroma_db'
    });
    
    this.collectionName = 'jira_issues';
    this.collection = null;
    
    this.jiraConfig = {
      baseURL: process.env.JIRA_BASE_URL,
      email: process.env.JIRA_EMAIL,
      apiToken: process.env.JIRA_API_TOKEN,
    };
  }

  async initialize() {
    try {
      // Crear o obtener colección de ChromaDB
      this.collection = await this.chroma.createCollection({
        name: this.collectionName,
        metadata: { description: 'Jira issues for semantic search' }
      });
      console.log('✅ RAG Service initialized');
    } catch (error) {
      if (error.message.includes('already exists')) {
        this.collection = await this.chroma.getCollection({
          name: this.collectionName
        });
        console.log('✅ RAG Service connected to existing collection');
      } else {
        throw error;
      }
    }
  }

  async makeJiraRequest(endpoint, data = null, method = 'GET') {
    const auth = Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64');
    
    const config = {
      method,
      url: `${this.jiraConfig.baseURL}/rest/api/2${endpoint}`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      ...(data && (method === 'POST' || method === 'PUT') && { data }),
    };

    return await axios(config);
  }

  async getAllJiraIssues(maxResults = 1000) {
    console.log('🔍 Fetching all Jira issues for indexing...');
    
    let allIssues = [];
    let startAt = 0;
    const batchSize = 100;

    while (allIssues.length < maxResults) {
      try {
        const response = await this.makeJiraRequest('/search', {
          jql: 'ORDER BY created DESC',
          maxResults: batchSize,
          startAt,
          fields: [
            'summary', 'description', 'status', 'assignee', 
            'created', 'updated', 'priority', 'issuetype', 
            'project', 'creator', 'reporter', 'comment'
          ],
          expand: ['renderedFields']
        }, 'POST');

        const issues = response.data.issues;
        if (issues.length === 0) break;

        allIssues.push(...issues);
        startAt += batchSize;

        console.log(`📥 Fetched ${allIssues.length} issues so far...`);
        
        if (allIssues.length >= response.data.total) break;
      } catch (error) {
        console.error('Error fetching issues:', error.message);
        break;
      }
    }

    console.log(`✅ Fetched ${allIssues.length} total issues`);
    return allIssues;
  }

  async createEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error.message);
      return null;
    }
  }

  prepareDocumentText(issue) {
    const parts = [];
    
    // Información básica
    parts.push(`Issue: ${issue.key}`);
    parts.push(`Summary: ${issue.fields.summary}`);
    
    // Descripción
    if (issue.fields.description) {
      parts.push(`Description: ${issue.fields.description}`);
    }
    
    // Metadatos importantes
    parts.push(`Project: ${issue.fields.project?.name || 'Unknown'}`);
    parts.push(`Status: ${issue.fields.status?.name || 'Unknown'}`);
    parts.push(`Type: ${issue.fields.issuetype?.name || 'Unknown'}`);
    parts.push(`Priority: ${issue.fields.priority?.name || 'Unknown'}`);
    
    // Comentarios (si los hay)
    if (issue.fields.comment?.comments) {
      const comments = issue.fields.comment.comments
        .slice(-3) // Solo últimos 3 comentarios para no saturar
        .map(c => c.body)
        .join(' ');
      if (comments.trim()) {
        parts.push(`Comments: ${comments}`);
      }
    }

    return parts.join('\n');
  }

  async indexJiraData() {
    console.log('🚀 Starting Jira data indexing...');
    
    // 1. Obtener todos los issues
    const issues = await this.getAllJiraIssues();
    
    if (issues.length === 0) {
      console.log('⚠️  No issues found to index');
      return;
    }

    // 2. Procesar en lotes para evitar límites de API
    const batchSize = 10;
    let indexedCount = 0;

    for (let i = 0; i < issues.length; i += batchSize) {
      const batch = issues.slice(i, i + batchSize);
      
      const documents = [];
      const embeddings = [];
      const metadatas = [];
      const ids = [];

      for (const issue of batch) {
        try {
          // Preparar texto del documento
          const documentText = this.prepareDocumentText(issue);
          
          // Crear embedding
          const embedding = await this.createEmbedding(documentText);
          if (!embedding) continue;

          documents.push(documentText);
          embeddings.push(embedding);
          ids.push(issue.key);
          metadatas.push({
            key: issue.key,
            project: issue.fields.project?.key || 'Unknown',
            projectName: issue.fields.project?.name || 'Unknown',
            status: issue.fields.status?.name || 'Unknown',
            assignee: issue.fields.assignee?.displayName || 'Unassigned',
            created: issue.fields.created,
            updated: issue.fields.updated,
            issueType: issue.fields.issuetype?.name || 'Unknown',
            priority: issue.fields.priority?.name || 'Unknown',
            url: `${this.jiraConfig.baseURL}/browse/${issue.key}`
          });

          indexedCount++;
        } catch (error) {
          console.error(`Error processing issue ${issue.key}:`, error.message);
        }
      }

      // Almacenar lote en ChromaDB
      if (documents.length > 0) {
        try {
          await this.collection.add({
            documents,
            embeddings,
            metadatas,
            ids
          });
          
          console.log(`📚 Indexed batch: ${indexedCount}/${issues.length} issues`);
        } catch (error) {
          console.error('Error storing batch:', error.message);
        }
      }

      // Pausa entre lotes para no saturar APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Indexing complete! ${indexedCount} issues indexed`);
  }

  async semanticSearch(query, limit = 5, filter = {}) {
    console.log(`🔍 Semantic search: "${query}"`);
    
    try {
      // Crear embedding de la consulta
      const queryEmbedding = await this.createEmbedding(query);
      if (!queryEmbedding) {
        throw new Error('Failed to create query embedding');
      }

      // Buscar en ChromaDB
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: filter // Filtros opcionales como {project: "TEST"}
      });

      // Formatear resultados
      const formattedResults = [];
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          formattedResults.push({
            issue: results.ids[0][i],
            content: results.documents[0][i],
            metadata: results.metadatas[0][i],
            similarity: results.distances ? (1 - results.distances[0][i]) : null,
            url: results.metadatas[0][i]?.url
          });
        }
      }

      console.log(`✅ Found ${formattedResults.length} similar issues`);
      return formattedResults;

    } catch (error) {
      console.error('Error in semantic search:', error.message);
      throw error;
    }
  }

  async hybridSearch(query, limit = 10) {
    console.log(`🔍 Hybrid search (JQL + Semantic): "${query}"`);
    
    try {
      // 1. Búsqueda tradicional JQL
      let jqlQuery = query;
      if (!query.includes('=') && !query.includes('AND') && !query.includes('OR')) {
        jqlQuery = `summary ~ "${query}" OR description ~ "${query}"`;
      }

      const jqlResults = await this.makeJiraRequest('/search', {
        jql: jqlQuery,
        maxResults: Math.floor(limit / 2),
        fields: ['key', 'summary', 'status', 'assignee', 'project']
      }, 'POST');

      // 2. Búsqueda semántica
      const semanticResults = await this.semanticSearch(query, Math.floor(limit / 2));

      // 3. Combinar y deduplicar resultados
      const combinedResults = {
        jql: {
          query: jqlQuery,
          count: jqlResults.data.issues.length,
          issues: jqlResults.data.issues.map(issue => ({
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status?.name,
            project: issue.fields.project?.key,
            url: `${this.jiraConfig.baseURL}/browse/${issue.key}`,
            source: 'jql'
          }))
        },
        semantic: {
          query,
          count: semanticResults.length,
          issues: semanticResults.map(result => ({
            key: result.issue,
            summary: result.metadata?.summary || 'No summary',
            status: result.metadata?.status,
            project: result.metadata?.project,
            url: result.url,
            similarity: result.similarity,
            source: 'semantic'
          }))
        }
      };

      // Deduplicar por key
      const allIssues = [...combinedResults.jql.issues, ...combinedResults.semantic.issues];
      const uniqueIssues = allIssues.filter((issue, index, self) => 
        index === self.findIndex(i => i.key === issue.key)
      );

      return {
        ...combinedResults,
        combined: {
          total: uniqueIssues.length,
          issues: uniqueIssues.slice(0, limit)
        }
      };

    } catch (error) {
      console.error('Error in hybrid search:', error.message);
      throw error;
    }
  }

  async getCollectionStats() {
    try {
      const count = await this.collection.count();
      return {
        collection: this.collectionName,
        totalDocuments: count,
        lastIndexed: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting stats:', error.message);
      return null;
    }
  }
}

// Función auxiliar para testing
async function testRAG() {
  const rag = new JiraRAGService();
  
  try {
    await rag.initialize();
    
    // Indexar datos si la colección está vacía
    const stats = await rag.getCollectionStats();
    if (stats.totalDocuments === 0) {
      console.log('📚 Collection is empty, starting indexing...');
      await rag.indexJiraData();
    } else {
      console.log(`📊 Collection has ${stats.totalDocuments} documents`);
    }

    // Prueba de búsqueda
    const results = await rag.semanticSearch('authentication bug', 3);
    console.log('🔍 Search results:', JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

export { JiraRAGService, testRAG };

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testRAG();
}
