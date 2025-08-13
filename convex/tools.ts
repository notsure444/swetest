/**
 * Agent Tooling Infrastructure
 * 
 * This module provides essential tools for agent productivity including:
 * - Web search capabilities with external API integration
 * - Semantic code search using RAG Component
 * - Todo list management for task tracking
 * - Project notes system for knowledge management
 * - Isolated test environment orchestration
 * 
 * All tools are exposed through the AI Agent Component's tool calling system
 */

import { mutation, query, action } from './_generated/server';
import { v } from 'convex/values';
import { components } from './_generated/api';
import { internal, api } from './_generated/api';
import { Id } from './_generated/dataModel';

// ============================================================================
// WEB SEARCH CAPABILITIES
// ============================================================================

/**
 * Web Search Tool - Integrates with external search APIs for research and information gathering
 */
export const webSearch = action({
  args: {
    query: v.string(),
    projectId: v.optional(v.id('projects')),
    agentId: v.string(),
    searchType: v.optional(v.union(v.literal('general'), v.literal('technical'), v.literal('documentation'))),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, projectId, agentId, searchType = 'general', maxResults = 10 } = args;

    try {
      // Rate limit check for web search API usage
      const rateLimitCheck = await components.rateLimiter.lib.check(ctx, {
        name: "web_search_requests",
        key: agentId,
      });

      if (!rateLimitCheck.ok) {
        throw new Error(`Web search rate limit exceeded. Reset time: ${rateLimitCheck.retryAfter}`);
      }

      // Log the search request for audit and optimization
      await ctx.runMutation(internal.tools.logToolUsage, {
        toolName: 'web_search',
        agentId,
        projectId,
        parameters: { query, searchType, maxResults },
        timestamp: Date.now(),
      });

      // Simulate web search API integration (replace with actual API like SerpAPI, Bing, etc.)
      const searchResults = await performWebSearch(query, searchType, maxResults);

      // Store search results for future reference and RAG integration
      if (projectId) {
        await ctx.runMutation(internal.tools.storeSearchResults, {
          projectId,
          agentId,
          query,
          results: searchResults,
          searchType,
          timestamp: Date.now(),
        });
      }

      return {
        success: true,
        query,
        results: searchResults,
        metadata: {
          searchType,
          resultCount: searchResults.length,
          timestamp: Date.now(),
        }
      };

    } catch (error) {
      console.error('Web search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Web search failed',
        query,
      };
    }
  },
});

/**
 * Simulated web search function - In production, integrate with real search APIs
 */
async function performWebSearch(query: string, searchType: string, maxResults: number) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock search results based on query type
  const baseResults = [
    {
      title: `${query} - Documentation`,
      url: `https://docs.example.com/search?q=${encodeURIComponent(query)}`,
      snippet: `Official documentation and guides for ${query}. Comprehensive tutorials and API references.`,
      relevanceScore: 0.95,
      category: 'documentation',
    },
    {
      title: `${query} Best Practices - Stack Overflow`,
      url: `https://stackoverflow.com/questions/tagged/${query.toLowerCase().replace(' ', '-')}`,
      snippet: `Community-driven Q&A about ${query} best practices, common issues, and solutions.`,
      relevanceScore: 0.88,
      category: 'community',
    },
    {
      title: `${query} Tutorial - Modern Development`,
      url: `https://tutorial.example.com/${query.toLowerCase().replace(' ', '-')}`,
      snippet: `Step-by-step tutorial covering ${query} implementation with real-world examples.`,
      relevanceScore: 0.82,
      category: 'tutorial',
    },
    {
      title: `${query} GitHub Repository`,
      url: `https://github.com/search?q=${encodeURIComponent(query)}`,
      snippet: `Open-source projects and code examples related to ${query}.`,
      relevanceScore: 0.79,
      category: 'code',
    },
    {
      title: `${query} News and Updates`,
      url: `https://news.example.com/tag/${query.toLowerCase().replace(' ', '-')}`,
      snippet: `Latest news, updates, and announcements about ${query}.`,
      relevanceScore: 0.75,
      category: 'news',
    },
  ];

  // Filter and sort based on search type
  let filteredResults = baseResults;
  if (searchType === 'technical') {
    filteredResults = baseResults.filter(r => ['documentation', 'code', 'tutorial'].includes(r.category));
  } else if (searchType === 'documentation') {
    filteredResults = baseResults.filter(r => ['documentation', 'tutorial'].includes(r.category));
  }

  return filteredResults
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);
}

// ============================================================================
// SEMANTIC CODE SEARCH USING RAG COMPONENT
// ============================================================================

/**
 * Semantic Code Search Tool - Leverages RAG Component for intelligent code discovery
 */
export const semanticCodeSearch = action({
  args: {
    query: v.string(),
    projectId: v.id('projects'),
    agentId: v.string(),
    searchScope: v.optional(v.union(v.literal('current_project'), v.literal('all_projects'), v.literal('codebase'))),
    fileTypes: v.optional(v.array(v.string())),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, projectId, agentId, searchScope = 'current_project', fileTypes, maxResults = 20 } = args;

    try {
      // Get project namespace for scoped search
      const project = await ctx.runQuery(api.projects.getProject, { projectId });
      if (!project) {
        throw new Error('Project not found');
      }

      // Perform semantic search using RAG Component
      const searchResults = await components.rag.lib.search(ctx, {
        query,
        namespace: searchScope === 'current_project' ? project.namespace : undefined,
        numResults: maxResults,
      });

      // Enhance results with additional context
      const enhancedResults = await Promise.all(
        searchResults.map(async (result) => {
          // Get additional file context if available
          const fileContext = await getFileContext(ctx, result.id, projectId);
          
          return {
            ...result,
            fileContext,
            relevanceReason: generateRelevanceExplanation(query, result.text),
            codeType: detectCodeType(result.text, result.metadata?.fileName),
          };
        })
      );

      // Log search for analytics and learning
      await ctx.runMutation(internal.tools.logToolUsage, {
        toolName: 'semantic_code_search',
        agentId,
        projectId,
        parameters: { query, searchScope, fileTypes, maxResults },
        timestamp: Date.now(),
      });

      return {
        success: true,
        query,
        results: enhancedResults,
        metadata: {
          searchScope,
          project: project.name,
          resultCount: enhancedResults.length,
          timestamp: Date.now(),
        }
      };

    } catch (error) {
      console.error('Semantic code search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Semantic search failed',
        query,
      };
    }
  },
});

/**
 * Add Code to RAG - Index code files for semantic search
 */
export const addCodeToRAG = action({
  args: {
    projectId: v.id('projects'),
    filePath: v.string(),
    content: v.string(),
    language: v.optional(v.string()),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const { projectId, filePath, content, language, agentId } = args;

    try {
      const project = await ctx.runQuery(api.projects.getProject, { projectId });
      if (!project) {
        throw new Error('Project not found');
      }

      // Add to RAG with project namespace
      await components.rag.lib.add(ctx, {
        document: {
          id: `${project.namespace}_${filePath}`,
          text: content,
          metadata: {
            projectId,
            filePath,
            language: language || detectLanguageFromPath(filePath),
            addedBy: agentId,
            timestamp: Date.now(),
          }
        },
        namespace: project.namespace,
      });

      // Log the addition
      await ctx.runMutation(internal.tools.logToolUsage, {
        toolName: 'add_code_to_rag',
        agentId,
        projectId,
        parameters: { filePath, language, contentLength: content.length },
        timestamp: Date.now(),
      });

      return {
        success: true,
        message: `Code from ${filePath} successfully indexed for semantic search`,
      };

    } catch (error) {
      console.error('Failed to add code to RAG:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to index code',
      };
    }
  },
});

// ============================================================================
// TODO LIST MANAGEMENT
// ============================================================================

/**
 * Todo List Management Tool - Provides task tracking capabilities for agents
 */
export const createTodo = mutation({
  args: {
    projectId: v.id('projects'),
    agentId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent'))),
    category: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    dependencies: v.optional(v.array(v.id('todos'))),
    associatedTask: v.optional(v.id('tasks')),
  },
  handler: async (ctx, args) => {
    const { projectId, agentId, title, description, priority = 'medium', category, dueDate, dependencies, associatedTask } = args;

    const todoId = await ctx.db.insert('todos', {
      projectId,
      agentId,
      title,
      description,
      priority,
      category,
      status: 'pending',
      dueDate,
      dependencies: dependencies || [],
      associatedTask,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log todo creation
    await ctx.runMutation(internal.tools.logToolUsage, {
      toolName: 'create_todo',
      agentId,
      projectId,
      parameters: { title, priority, category },
      timestamp: Date.now(),
    });

    return todoId;
  },
});

export const updateTodoStatus = mutation({
  args: {
    todoId: v.id('todos'),
    status: v.union(v.literal('pending'), v.literal('in_progress'), v.literal('completed'), v.literal('cancelled')),
    agentId: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { todoId, status, agentId, notes } = args;

    const todo = await ctx.db.get(todoId);
    if (!todo) {
      throw new Error('Todo not found');
    }

    await ctx.db.patch(todoId, {
      status,
      updatedAt: Date.now(),
      completedAt: status === 'completed' ? Date.now() : undefined,
      notes,
    });

    // Check if this completion unblocks other todos
    if (status === 'completed') {
      await checkAndUnblockDependentTodos(ctx, todoId);
    }

    return todoId;
  },
});

export const getTodos = query({
  args: {
    projectId: v.id('projects'),
    agentId: v.optional(v.string()),
    status: v.optional(v.union(v.literal('pending'), v.literal('in_progress'), v.literal('completed'), v.literal('cancelled'))),
    priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent'))),
  },
  handler: async (ctx, args) => {
    const { projectId, agentId, status, priority } = args;

    let query = ctx.db
      .query('todos')
      .filter(q => q.eq(q.field('projectId'), projectId));

    if (agentId) {
      query = query.filter(q => q.eq(q.field('agentId'), agentId));
    }

    if (status) {
      query = query.filter(q => q.eq(q.field('status'), status));
    }

    if (priority) {
      query = query.filter(q => q.eq(q.field('priority'), priority));
    }

    const todos = await query.collect();

    // Sort by priority and due date
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return todos.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.dueDate && b.dueDate) {
        return a.dueDate - b.dueDate;
      }
      
      return b.createdAt - a.createdAt;
    });
  },
});

// ============================================================================
// PROJECT NOTES SYSTEM
// ============================================================================

/**
 * Project Notes System - Knowledge management for agents
 */
export const createProjectNote = mutation({
  args: {
    projectId: v.id('projects'),
    agentId: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPrivate: v.optional(v.boolean()),
    associatedTask: v.optional(v.id('tasks')),
  },
  handler: async (ctx, args) => {
    const { projectId, agentId, title, content, category, tags, isPrivate = false, associatedTask } = args;

    const noteId = await ctx.db.insert('project_notes', {
      projectId,
      agentId,
      title,
      content,
      category,
      tags: tags || [],
      isPrivate,
      associatedTask,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add to RAG for searchability if not private
    if (!isPrivate) {
      const project = await ctx.db.get(projectId);
      if (project) {
        await components.rag.lib.add(ctx, {
          document: {
            id: `note_${noteId}`,
            text: `${title}\n\n${content}`,
            metadata: {
              type: 'project_note',
              noteId: noteId,
              projectId,
              category,
              tags,
              agentId,
            }
          },
          namespace: project.namespace,
        });
      }
    }

    // Log note creation
    await ctx.runMutation(internal.tools.logToolUsage, {
      toolName: 'create_project_note',
      agentId,
      projectId,
      parameters: { title, category, tags, contentLength: content.length },
      timestamp: Date.now(),
    });

    return noteId;
  },
});

export const searchProjectNotes = action({
  args: {
    projectId: v.id('projects'),
    query: v.string(),
    agentId: v.string(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    includeContent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { projectId, query, agentId, category, tags, includeContent = true } = args;

    try {
      const project = await ctx.runQuery(api.projects.getProject, { projectId });
      if (!project) {
        throw new Error('Project not found');
      }

      // Semantic search through RAG
      const ragResults = await components.rag.lib.search(ctx, {
        query,
        namespace: project.namespace,
        numResults: 10,
      });

      // Filter for note results
      const noteResults = ragResults.filter(result => 
        result.metadata?.type === 'project_note'
      );

      // Get full note details
      const notes = await Promise.all(
        noteResults.map(async (result) => {
          if (result.metadata?.noteId) {
            const note = await ctx.runQuery(api.tools.getProjectNoteById, { 
              noteId: result.metadata.noteId as Id<'project_notes'> 
            });
            return {
              ...note,
              relevanceScore: result.score,
              matchedContent: result.text.substring(0, 200) + '...',
            };
          }
          return null;
        })
      );

      const validNotes = notes.filter(note => note !== null);

      // Additional filtering by category and tags
      let filteredNotes = validNotes;
      if (category) {
        filteredNotes = filteredNotes.filter(note => note?.category === category);
      }
      if (tags && tags.length > 0) {
        filteredNotes = filteredNotes.filter(note => 
          note?.tags?.some(tag => tags.includes(tag))
        );
      }

      return {
        success: true,
        query,
        results: filteredNotes,
        metadata: {
          resultCount: filteredNotes.length,
          searchScope: project.name,
          timestamp: Date.now(),
        }
      };

    } catch (error) {
      console.error('Project notes search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notes search failed',
        query,
      };
    }
  },
});

export const getProjectNoteById = query({
  args: { noteId: v.id('project_notes') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.noteId);
  },
});

export const getProjectNotes = query({
  args: {
    projectId: v.id('projects'),
    agentId: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { projectId, agentId, category, tags, limit = 50 } = args;

    let query = ctx.db
      .query('project_notes')
      .filter(q => q.eq(q.field('projectId'), projectId));

    if (agentId) {
      query = query.filter(q => q.eq(q.field('agentId'), agentId));
    }

    if (category) {
      query = query.filter(q => q.eq(q.field('category'), category));
    }

    const notes = await query.take(limit);

    // Filter by tags if specified
    if (tags && tags.length > 0) {
      return notes.filter(note => 
        note.tags?.some(tag => tags.includes(tag))
      );
    }

    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// ============================================================================
// ISOLATED TEST ENVIRONMENT ORCHESTRATION
// ============================================================================

/**
 * Test Environment Orchestration - Manages isolated testing environments
 */
export const createTestEnvironment = action({
  args: {
    projectId: v.id('projects'),
    agentId: v.string(),
    testType: v.union(v.literal('unit'), v.literal('integration'), v.literal('e2e'), v.literal('performance')),
    configuration: v.object({
      framework: v.optional(v.string()),
      nodeVersion: v.optional(v.string()),
      dependencies: v.optional(v.array(v.string())),
      environment: v.optional(v.record(v.string(), v.string())),
      resources: v.optional(v.object({
        cpu: v.optional(v.string()),
        memory: v.optional(v.string()),
        timeout: v.optional(v.number()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const { projectId, agentId, testType, configuration } = args;

    try {
      const project = await ctx.runQuery(api.projects.getProject, { projectId });
      if (!project) {
        throw new Error('Project not found');
      }

      // Generate unique test environment ID
      const testEnvId = `test_${projectId}_${testType}_${Date.now()}`;

      // Create test environment configuration
      const testConfig = {
        id: testEnvId,
        projectId,
        agentId,
        testType,
        status: 'creating',
        configuration: {
          framework: configuration.framework || detectTestFramework(project.configuration.techStack),
          nodeVersion: configuration.nodeVersion || '20',
          dependencies: configuration.dependencies || [],
          environment: configuration.environment || {},
          resources: {
            cpu: configuration.resources?.cpu || '0.5',
            memory: configuration.resources?.memory || '512Mi',
            timeout: configuration.resources?.timeout || 300000, // 5 minutes
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Store test environment record
      await ctx.runMutation(internal.tools.createTestEnvironmentRecord, {
        testEnvId,
        config: testConfig,
      });

      // Orchestrate container creation (this would integrate with Docker/Kubernetes)
      const containerResult = await orchestrateTestContainer(testConfig, project);

      if (containerResult.success) {
        // Update status to ready
        await ctx.runMutation(internal.tools.updateTestEnvironmentStatus, {
          testEnvId,
          status: 'ready',
          containerInfo: containerResult.containerInfo,
        });

        return {
          success: true,
          testEnvironmentId: testEnvId,
          status: 'ready',
          containerInfo: containerResult.containerInfo,
          message: `Test environment created for ${testType} testing`,
        };
      } else {
        // Update status to failed
        await ctx.runMutation(internal.tools.updateTestEnvironmentStatus, {
          testEnvId,
          status: 'failed',
          error: containerResult.error,
        });

        return {
          success: false,
          testEnvironmentId: testEnvId,
          error: containerResult.error,
        };
      }

    } catch (error) {
      console.error('Test environment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test environment creation failed',
      };
    }
  },
});

export const runTestSuite = action({
  args: {
    testEnvironmentId: v.string(),
    testCommand: v.string(),
    agentId: v.string(),
    testFiles: v.optional(v.array(v.string())),
    timeout: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { testEnvironmentId, testCommand, agentId, testFiles, timeout = 300000 } = args;

    try {
      // Get test environment details
      const testEnv = await ctx.runQuery(internal.tools.getTestEnvironment, { testEnvId: testEnvironmentId });
      if (!testEnv) {
        throw new Error('Test environment not found');
      }

      if (testEnv.status !== 'ready') {
        throw new Error(`Test environment not ready. Current status: ${testEnv.status}`);
      }

      // Execute tests in the isolated container
      const testResult = await executeTestsInContainer(
        testEnv.containerInfo,
        testCommand,
        testFiles,
        timeout
      );

      // Store test results
      const testRunId = await ctx.runMutation(internal.tools.storeTestResults, {
        testEnvironmentId,
        agentId,
        testCommand,
        results: testResult,
        timestamp: Date.now(),
      });

      return {
        success: testResult.success,
        testRunId,
        results: testResult,
        environment: testEnvironmentId,
      };

    } catch (error) {
      console.error('Test execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test execution failed',
        environment: testEnvironmentId,
      };
    }
  },
});

export const cleanupTestEnvironment = action({
  args: {
    testEnvironmentId: v.string(),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const { testEnvironmentId, agentId } = args;

    try {
      const testEnv = await ctx.runQuery(internal.tools.getTestEnvironment, { testEnvId: testEnvironmentId });
      if (!testEnv) {
        return { success: true, message: 'Test environment already cleaned up' };
      }

      // Cleanup container resources
      if (testEnv.containerInfo) {
        await cleanupTestContainer(testEnv.containerInfo);
      }

      // Update status to cleaned up
      await ctx.runMutation(internal.tools.updateTestEnvironmentStatus, {
        testEnvId: testEnvironmentId,
        status: 'cleaned_up',
        cleanedUpAt: Date.now(),
      });

      return {
        success: true,
        message: 'Test environment cleaned up successfully',
      };

    } catch (error) {
      console.error('Test environment cleanup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cleanup failed',
      };
    }
  },
});

// ============================================================================
// INTERNAL HELPER FUNCTIONS AND MUTATIONS
// ============================================================================

export const logToolUsage = mutation({
  args: {
    toolName: v.string(),
    agentId: v.string(),
    projectId: v.optional(v.id('projects')),
    parameters: v.any(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('tool_usage_logs', args);
  },
});

export const storeSearchResults = mutation({
  args: {
    projectId: v.id('projects'),
    agentId: v.string(),
    query: v.string(),
    results: v.any(),
    searchType: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('search_history', args);
  },
});

export const createTestEnvironmentRecord = mutation({
  args: {
    testEnvId: v.string(),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('test_environments', {
      testEnvId: args.testEnvId,
      ...args.config,
    });
  },
});

export const updateTestEnvironmentStatus = mutation({
  args: {
    testEnvId: v.string(),
    status: v.string(),
    containerInfo: v.optional(v.any()),
    error: v.optional(v.string()),
    cleanedUpAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { testEnvId, ...updateData } = args;
    
    const testEnv = await ctx.db
      .query('test_environments')
      .filter(q => q.eq(q.field('testEnvId'), testEnvId))
      .first();

    if (testEnv) {
      await ctx.db.patch(testEnv._id, {
        ...updateData,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getTestEnvironment = query({
  args: { testEnvId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('test_environments')
      .filter(q => q.eq(q.field('testEnvId'), args.testEnvId))
      .first();
  },
});

export const storeTestResults = mutation({
  args: {
    testEnvironmentId: v.string(),
    agentId: v.string(),
    testCommand: v.string(),
    results: v.any(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('test_results', args);
  },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function getFileContext(ctx: any, documentId: string, projectId: Id<'projects'>) {
  // This would fetch additional context about the file
  // In a real implementation, this might query file metadata, git info, etc.
  return {
    lastModified: Date.now(),
    author: 'unknown',
    lineCount: 0,
  };
}

function generateRelevanceExplanation(query: string, content: string): string {
  // Simple relevance explanation - in production, use AI to generate better explanations
  const queryWords = query.toLowerCase().split(' ');
  const contentLower = content.toLowerCase();
  const matches = queryWords.filter(word => contentLower.includes(word));
  
  if (matches.length > 0) {
    return `Contains relevant terms: ${matches.join(', ')}`;
  }
  return 'Semantically related to your query';
}

function detectCodeType(content: string, fileName?: string): string {
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext) {
      const typeMap: Record<string, string> = {
        'js': 'javascript',
        'ts': 'typescript', 
        'tsx': 'typescript-react',
        'jsx': 'javascript-react',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'css': 'css',
        'html': 'html',
      };
      return typeMap[ext] || ext;
    }
  }

  // Detect based on content patterns
  if (content.includes('function ') || content.includes('=>')) return 'javascript';
  if (content.includes('def ') && content.includes(':')) return 'python';
  if (content.includes('class ') && content.includes('{')) return 'java';
  
  return 'unknown';
}

function detectLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'jsx': 'javascript',
    'py': 'python',
    'java': 'java',
    'cpp': 'c++',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
  };
  return languageMap[ext || ''] || 'text';
}

async function checkAndUnblockDependentTodos(ctx: any, completedTodoId: Id<'todos'>) {
  // Find todos that have this as a dependency
  const dependentTodos = await ctx.db
    .query('todos')
    .filter(q => q.eq(q.field('status'), 'pending'))
    .collect();

  for (const todo of dependentTodos) {
    if (todo.dependencies?.includes(completedTodoId)) {
      // Check if all dependencies are now complete
      const dependencies = await Promise.all(
        todo.dependencies.map(depId => ctx.db.get(depId))
      );
      
      const allComplete = dependencies.every(dep => dep?.status === 'completed');
      if (allComplete) {
        // This todo can now proceed
        await ctx.db.patch(todo._id, {
          status: 'pending', // Keep as pending but now unblocked
          updatedAt: Date.now(),
        });
      }
    }
  }
}

function detectTestFramework(techStack: string[]): string {
  if (techStack.includes('React')) return 'jest';
  if (techStack.includes('Vue.js')) return 'vitest';
  if (techStack.includes('Angular')) return 'jasmine';
  if (techStack.includes('Python')) return 'pytest';
  if (techStack.includes('Java')) return 'junit';
  return 'jest'; // default
}

async function orchestrateTestContainer(config: any, project: any) {
  // Simulate container orchestration - in production, integrate with Docker/K8s
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    success: true,
    containerInfo: {
      containerId: `container_${config.id}`,
      port: 3000 + Math.floor(Math.random() * 1000),
      status: 'running',
      createdAt: Date.now(),
    }
  };
}

async function executeTestsInContainer(containerInfo: any, command: string, files?: string[], timeout = 300000) {
  // Simulate test execution - in production, execute in actual container
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const mockResults = {
    success: Math.random() > 0.3, // 70% success rate
    exitCode: Math.random() > 0.3 ? 0 : 1,
    stdout: `Running test command: ${command}\n✓ Test suite completed\n${files?.length || 0} test files executed`,
    stderr: '',
    duration: Math.floor(Math.random() * 10000) + 1000,
    testsRun: Math.floor(Math.random() * 20) + 5,
    testsPassed: Math.floor(Math.random() * 15) + 3,
    testsFailed: Math.floor(Math.random() * 3),
    coverage: Math.random() * 40 + 60, // 60-100% coverage
  };

  if (!mockResults.success) {
    mockResults.stderr = 'Test execution failed: Mock error for demonstration';
  }

  return mockResults;
}

async function cleanupTestContainer(containerInfo: any) {
  // Simulate container cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
}

// Export all tools for agent integration
export const agentTools = {
  webSearch,
  semanticCodeSearch,
  addCodeToRAG,
  createTodo,
  updateTodoStatus,
  getTodos,
  createProjectNote,
  searchProjectNotes,
  getProjectNotes,
  createTestEnvironment,
  runTestSuite,
  cleanupTestEnvironment,
};
