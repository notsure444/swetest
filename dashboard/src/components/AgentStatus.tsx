'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { 
  Bot, 
  Brain, 
  ListTodo, 
  Code, 
  TestTube2, 
  Shield, 
  Rocket,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause
} from 'lucide-react';
import { motion } from 'framer-motion';

const AGENT_ICONS = {
  'ProjectManager': Bot,
  'SystemArchitect': Brain,
  'TaskPlanner': ListTodo,
  'CodeGenerator': Code,
  'TestEngineer': TestTube2,
  'QAAnalyst': Shield,
  'DeploymentEngineer': Rocket,
};

const STATUS_COLORS = {
  idle: 'bg-gray-100 text-gray-600',
  working: 'bg-green-100 text-green-600',
  waiting: 'bg-yellow-100 text-yellow-600',
  error: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-600',
};

const STATUS_ICONS = {
  idle: Pause,
  working: Activity,
  waiting: Clock,
  error: AlertCircle,
  completed: CheckCircle,
};

export function AgentStatus() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  // Get all projects for project selection
  const projects = useQuery(api.projects.listProjects, {});
  
  // Get agent metrics for selected project or all projects
  const agentMetrics = useQuery(api.agents.getAgentMetrics, {
    projectId: selectedProject || undefined,
  });

  // Get system health for agent overview
  const systemHealth = useQuery(api.agentIntegration.getAgentSystemHealth, {
    projectId: selectedProject || undefined,
  });

  if (!agentMetrics || !systemHealth) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Agent Status</h3>
            <p className="text-sm text-gray-600">Real-time agent activity and performance</p>
          </div>
          
          {/* Project Filter */}
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Projects</option>
            {projects?.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        {/* System Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{systemHealth.totalAgents}</div>
            <div className="text-sm text-gray-600">Total Agents</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{systemHealth.agentsByStatus.working}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{systemHealth.agentsByStatus.idle}</div>
            <div className="text-sm text-gray-600">Idle</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{systemHealth.agentsByStatus.error}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agentMetrics.map((agent, index) => {
            const IconComponent = AGENT_ICONS[agent.type as keyof typeof AGENT_ICONS] || Bot;
            const StatusIcon = STATUS_ICONS[agent.status as keyof typeof STATUS_ICONS] || Activity;
            const statusColorClass = STATUS_COLORS[agent.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-600';

            return (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{agent.type}</h4>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColorClass}`}>
                        <StatusIcon className="w-3 h-3" />
                        {agent.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agent Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tasks Assigned:</span>
                    <span className="font-medium">{agent.tasksAssigned}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">{agent.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium">{(agent.successRate * 100).toFixed(1)}%</span>
                  </div>
                  {agent.avgTaskTime > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Time:</span>
                      <span className="font-medium">{agent.avgTaskTime.toFixed(1)}h</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Active:</span>
                    <span className="font-medium text-gray-500">
                      {new Date(agent.lastActivity).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {agent.tasksAssigned > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Completion Progress</span>
                      <span>{agent.tasksCompleted}/{agent.tasksAssigned}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(agent.tasksCompleted / agent.tasksAssigned) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Failed Tasks Warning */}
                {agent.tasksFailed > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {agent.tasksFailed} failed task{agent.tasksFailed > 1 ? 's' : ''}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Agent Type Distribution */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Agent Distribution</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(systemHealth.agentsByType).map(([type, count]) => {
              const IconComponent = AGENT_ICONS[type as keyof typeof AGENT_ICONS] || Bot;
              return (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <IconComponent className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{type.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Health Indicator */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth.systemStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-900">
                System Status: {systemHealth.systemStatus}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {new Date(systemHealth.timestamp).toLocaleTimeString()}
            </div>
          </div>
          
          {systemHealth.errorRate > 0.1 && (
            <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              High error rate detected: {(systemHealth.errorRate * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
