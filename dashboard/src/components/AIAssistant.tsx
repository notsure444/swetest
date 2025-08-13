'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  Bot, 
  Send, 
  Lightbulb, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Zap,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface AIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: string[];
  metadata?: {
    projectId?: string;
    category?: 'suggestion' | 'analysis' | 'recommendation' | 'warning';
  };
}

interface AISuggestion {
  id: string;
  type: 'project_optimization' | 'workflow_improvement' | 'resource_allocation' | 'performance_enhancement';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
  actionable: boolean;
  estimatedImpact: string;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI development assistant. I can help you optimize projects, suggest improvements, and provide insights based on your system performance.',
      timestamp: Date.now() - 60000,
      suggestions: ['Analyze project performance', 'Suggest workflow optimizations', 'Review system health']
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState({ remaining: 100, resetTime: Date.now() + 3600000 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get real-time data for AI analysis
  const projects = useQuery(api.projects.listProjects, {});
  const systemHealth = useQuery(api.agentIntegration.getAgentSystemHealth, {});
  const workflowMetrics = useQuery(api.workflows.getWorkflowMetrics, { timeRange: '7d' });
  const agentMetrics = useQuery(api.agents.getAgentMetrics, {});

  // Rate limiter integration (simulated - would integrate with actual Rate Limiter Component)
  const checkRateLimit = async () => {
    // This would integrate with the actual Rate Limiter Component
    // For now, simulating rate limit checks
    try {
      // In real implementation:
      // const rateLimitCheck = await components.rateLimiter.lib.check(ctx, {
      //   name: "ai_assistant_requests",
      //   key: userId,
      // });
      
      const simulatedRemaining = Math.max(0, rateLimitStatus.remaining - 1);
      setRateLimitStatus(prev => ({ ...prev, remaining: simulatedRemaining }));
      
      if (simulatedRemaining <= 0) {
        toast.error('Rate limit reached. Please wait before making more AI requests.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Generate AI suggestions based on system data
    if (projects && systemHealth && workflowMetrics) {
      generateAISuggestions();
    }
  }, [projects, systemHealth, workflowMetrics]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAISuggestions = () => {
    const suggestions: AISuggestion[] = [];

    // Analyze system performance
    if (systemHealth && systemHealth.errorRate > 0.05) {
      suggestions.push({
        id: `suggestion-${Date.now()}-1`,
        type: 'performance_enhancement',
        title: 'High Error Rate Detected',
        description: `System error rate is ${(systemHealth.errorRate * 100).toFixed(1)}%. Consider reviewing failed tasks and agent configurations.`,
        priority: 'high',
        actionable: true,
        estimatedImpact: 'Reduce errors by 60-80%'
      });
    }

    // Analyze workflow completion rates
    if (workflowMetrics && workflowMetrics.overallMetrics.overallCompletionRate < 80) {
      suggestions.push({
        id: `suggestion-${Date.now()}-2`,
        type: 'workflow_improvement',
        title: 'Low Workflow Completion Rate',
        description: `Current completion rate is ${workflowMetrics.overallMetrics.overallCompletionRate.toFixed(1)}%. Consider optimizing task assignment and agent workloads.`,
        priority: 'medium',
        actionable: true,
        estimatedImpact: 'Improve completion by 15-25%'
      });
    }

    // Analyze project distribution
    if (projects) {
      const failedProjects = projects.filter(p => p.status === 'failed').length;
      const totalProjects = projects.length;
      
      if (failedProjects / totalProjects > 0.1) {
        suggestions.push({
          id: `suggestion-${Date.now()}-3`,
          type: 'project_optimization',
          title: 'High Project Failure Rate',
          description: `${failedProjects} of ${totalProjects} projects have failed. Review project requirements and resource allocation.`,
          priority: 'high',
          actionable: true,
          estimatedImpact: 'Reduce failures by 50%'
        });
      }
    }

    // Resource optimization suggestions
    if (systemHealth && systemHealth.agentsByStatus.idle > systemHealth.totalAgents * 0.6) {
      suggestions.push({
        id: `suggestion-${Date.now()}-4`,
        type: 'resource_allocation',
        title: 'Underutilized Agent Capacity',
        description: `${systemHealth.agentsByStatus.idle} agents are currently idle. Consider creating more projects or redistributing workloads.`,
        priority: 'low',
        actionable: true,
        estimatedImpact: 'Increase efficiency by 30%'
      });
    }

    // Add suggestions to messages if there are any
    if (suggestions.length > 0) {
      const suggestionMessage: AIMessage = {
        id: `ai-suggestions-${Date.now()}`,
        type: 'assistant',
        content: `Based on your system analysis, I've identified ${suggestions.length} optimization opportunities:`,
        timestamp: Date.now(),
        suggestions: suggestions.map(s => s.title),
        metadata: { category: 'suggestion' }
      };

      setMessages(prev => {
        // Check if we already have recent suggestions
        const recentSuggestions = prev.filter(m => 
          m.metadata?.category === 'suggestion' && 
          Date.now() - m.timestamp < 300000 // 5 minutes
        );
        
        if (recentSuggestions.length === 0) {
          return [...prev, suggestionMessage];
        }
        return prev;
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Check rate limit
    const canProceed = await checkRateLimit();
    if (!canProceed) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response (in real implementation, this would call GPT/Claude API)
      const aiResponse = await generateAIResponse(inputMessage);
      
      const assistantMessage: AIMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: aiResponse.content,
        timestamp: Date.now(),
        suggestions: aiResponse.suggestions,
        metadata: aiResponse.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get AI response');
      console.error('AI response error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userInput: string): Promise<{
    content: string;
    suggestions?: string[];
    metadata?: any;
  }> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple response generation based on input (in real implementation, use GPT/Claude API)
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('project') && lowerInput.includes('performance')) {
      return {
        content: `Based on your current system metrics, here's a project performance analysis:

🔍 **Current Status:**
- ${projects?.length || 0} total projects
- ${workflowMetrics?.overallMetrics.overallCompletionRate.toFixed(1) || 0}% completion rate
- ${systemHealth?.agentsByStatus.working || 0} active agents

💡 **Recommended Actions:**
1. Focus on projects with completion rates below 70%
2. Redistribute tasks from overloaded to idle agents
3. Consider parallel execution for coding-heavy projects

Would you like me to analyze a specific project in detail?`,
        suggestions: ['Analyze specific project', 'Review agent workloads', 'Optimize workflow steps'],
        metadata: { category: 'analysis' }
      };
    }

    if (lowerInput.includes('agent') && (lowerInput.includes('status') || lowerInput.includes('performance'))) {
      return {
        content: `Agent Performance Summary:

📊 **Current Metrics:**
- Total Agents: ${systemHealth?.totalAgents || 0}
- Active: ${systemHealth?.agentsByStatus.working || 0}
- Idle: ${systemHealth?.agentsByStatus.idle || 0}
- Error State: ${systemHealth?.agentsByStatus.error || 0}

🎯 **Optimization Opportunities:**
${systemHealth?.agentsByStatus.idle > 3 ? '- High idle capacity detected - consider more projects' : '- Agents are well-utilized'}
${systemHealth?.errorRate > 0.05 ? '- Error rate above threshold - review failed tasks' : '- Error rates are within normal range'}

The system is ${systemHealth?.systemStatus === 'healthy' ? 'performing well' : 'experiencing some issues'}.`,
        suggestions: ['View detailed agent metrics', 'Check error logs', 'Redistribute workloads'],
        metadata: { category: 'analysis' }
      };
    }

    if (lowerInput.includes('optimization') || lowerInput.includes('improve')) {
      return {
        content: `System Optimization Recommendations:

🚀 **High Impact:**
- Enable parallel workflow execution for faster completion
- Implement agent specialization based on task complexity
- Set up automated error recovery mechanisms

⚡ **Medium Impact:**
- Adjust resource allocation based on project types
- Implement predictive task scheduling
- Optimize container resource limits

📈 **Long Term:**
- Add more agent types for specialized tasks
- Implement machine learning for task estimation
- Set up advanced monitoring and alerting

Which area would you like to focus on first?`,
        suggestions: ['Implement parallel workflows', 'Optimize resource allocation', 'Set up advanced monitoring'],
        metadata: { category: 'recommendation' }
      };
    }

    // Default response
    return {
      content: `I can help you with various aspects of your autonomous development platform:

🔧 **Project Management:**
- Analyze project performance and bottlenecks
- Suggest workflow optimizations
- Handle resource allocation

🤖 **Agent Operations:**
- Monitor agent performance and status
- Recommend agent configurations
- Debug workflow issues

📊 **System Analytics:**
- Provide performance insights
- Identify optimization opportunities
- Track completion rates and trends

What would you like to explore today?`,
      suggestions: ['Analyze project performance', 'Check agent status', 'System optimization tips'],
      metadata: { category: 'suggestion' }
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'suggestion': return <Lightbulb className="w-4 h-4" />;
      case 'analysis': return <TrendingUp className="w-4 h-4" />;
      case 'recommendation': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-sm text-gray-600">Intelligent suggestions and optimization</p>
            </div>
          </div>
          
          {/* Rate limit indicator */}
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-600">{rateLimitStatus.remaining}/100</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' 
                  : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
              } p-3`}>
                {message.type === 'assistant' && message.metadata?.category && (
                  <div className="flex items-center gap-2 mb-2 text-sm opacity-75">
                    {getCategoryIcon(message.metadata.category)}
                    <span className="capitalize">{message.metadata.category}</span>
                  </div>
                )}
                
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.suggestions && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm opacity-75">Quick actions:</div>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`text-xs px-2 py-1 rounded ${
                            message.type === 'user' 
                              ? 'bg-blue-500 hover:bg-blue-400' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          } transition-colors`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`text-xs mt-2 opacity-60`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-r-lg rounded-tl-lg p-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask for suggestions, analysis, or optimization tips..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading || rateLimitStatus.remaining <= 0}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim() || rateLimitStatus.remaining <= 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {rateLimitStatus.remaining <= 10 && (
          <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Rate limit warning: {rateLimitStatus.remaining} requests remaining
          </div>
        )}
        
        {rateLimitStatus.remaining <= 0 && (
          <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Rate limit reached. Resets at {new Date(rateLimitStatus.resetTime).toLocaleTimeString()}
          </div>
        )}
        
        {/* Quick suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            'Analyze project performance',
            'Check system health',
            'Optimize workflows',
            'Review agent status'
          ].map((quickSuggestion) => (
            <button
              key={quickSuggestion}
              onClick={() => handleSuggestionClick(quickSuggestion)}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              disabled={isLoading}
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              {quickSuggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
