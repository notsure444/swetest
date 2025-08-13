'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Pause,
  Play,
  RefreshCw,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const WORKFLOW_STEPS = [
  { key: 'architecture_design', label: 'Architecture Design', icon: '🏗️' },
  { key: 'task_creation', label: 'Task Creation', icon: '📋' },
  { key: 'work_assignment', label: 'Work Assignment', icon: '👥' },
  { key: 'coding', label: 'Coding', icon: '💻' },  
  { key: 'testing', label: 'Testing', icon: '🧪' },
  { key: 'qa', label: 'Quality Assurance', icon: '🛡️' },
  { key: 'deployment', label: 'Deployment', icon: '🚀' }
];

const STATUS_COLORS = {
  not_started: '#6B7280',
  in_progress: '#3B82F6', 
  completed: '#10B981',
  failed: '#EF4444',
  paused: '#F59E0B'
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function WorkflowMonitor() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d'>('7d');
  
  // Get active workflows
  const activeWorkflows = useQuery(api.workflows.getActiveWorkflows, { limit: 10 });
  
  // Get workflow metrics
  const workflowMetrics = useQuery(api.workflows.getWorkflowMetrics, {
    projectId: selectedProject || undefined,
    timeRange
  });
  
  // Get workflow step analysis
  const stepAnalysis = useQuery(api.workflows.getWorkflowStepAnalysis, {
    projectId: selectedProject || undefined,
  });
  
  // Get specific project workflow status if selected
  const projectWorkflowStatus = useQuery(
    selectedProject ? api.workflows.getProjectWorkflowStatus : undefined,
    selectedProject ? { projectId: selectedProject } : undefined
  );

  // Get projects for selection
  const projects = useQuery(api.projects.listProjects, {});

  if (!activeWorkflows || !workflowMetrics || !stepAnalysis) {
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

  // Prepare data for charts
  const stepCompletionData = WORKFLOW_STEPS.map(step => ({
    name: step.label,
    completed: stepAnalysis.overallAnalysis?.[step.key as keyof typeof stepAnalysis.overallAnalysis]?.completed || 0,
    successRate: stepAnalysis.overallAnalysis?.[step.key as keyof typeof stepAnalysis.overallAnalysis]?.successRate || 0
  }));

  const workflowStatusData = [
    { name: 'Completed', value: workflowMetrics.overallMetrics.totalWorkflowsCompleted, color: '#10B981' },
    { name: 'Active', value: workflowMetrics.overallMetrics.totalWorkflowsStarted - workflowMetrics.overallMetrics.totalWorkflowsCompleted, color: '#3B82F6' },
    { name: 'Failed', value: 0, color: '#EF4444' } // This would need to be calculated from logs
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Workflow Monitor</h3>
            <p className="text-sm text-gray-600">Track autonomous development workflows and progress</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '1d' | '7d' | '30d')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1d">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            
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
      </div>

      <div className="p-6">
        {/* Workflow Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 p-4 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-600">Total Workflows</p>
                <p className="text-2xl font-bold text-blue-900">{workflowMetrics.overallMetrics.totalWorkflowsStarted}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 p-4 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">{workflowMetrics.overallMetrics.totalWorkflowsCompleted}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-50 p-4 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-purple-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-900">{workflowMetrics.overallMetrics.overallCompletionRate.toFixed(1)}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-orange-50 p-4 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-600">Active Projects</p>
                <p className="text-2xl font-bold text-orange-900">{workflowMetrics.overallMetrics.activeProjects}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Workflow Progress Visualization */}
        {projectWorkflowStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-6 bg-gray-50 rounded-lg"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Project Workflow: {projectWorkflowStatus.projectName}
            </h4>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Progress</span>
                <span>{projectWorkflowStatus.workflowProgress.progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${projectWorkflowStatus.workflowProgress.progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-blue-600 h-2 rounded-full"
                />
              </div>
            </div>

            {/* Step Progress */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {WORKFLOW_STEPS.map((step, index) => {
                const stepStatus = projectWorkflowStatus.stepStatus[step.key as keyof typeof projectWorkflowStatus.stepStatus];
                const isActive = projectWorkflowStatus.workflowProgress.currentStep === step.key;
                
                let statusColor = 'bg-gray-200 text-gray-600';
                if (stepStatus?.status === 'completed') statusColor = 'bg-green-500 text-white';
                else if (stepStatus?.status === 'in_progress') statusColor = 'bg-blue-500 text-white';
                else if (stepStatus?.status === 'failed') statusColor = 'bg-red-500 text-white';

                return (
                  <div key={step.key} className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-xl ${statusColor} ${isActive ? 'ring-2 ring-blue-300 ring-offset-2' : ''}`}>
                      <span>{step.icon}</span>
                    </div>
                    <div className="text-xs text-gray-600">{step.label}</div>
                    {stepStatus && (
                      <div className="text-xs text-gray-500 mt-1">
                        {stepStatus.taskCount > 0 && `${stepStatus.completedTasks}/${stepStatus.taskCount}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Step Completion Chart */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Step Completion Rates</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stepCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workflow Status Distribution */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Workflow Status Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workflowStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {workflowStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Active Workflows */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Active Workflows</h4>
          <div className="space-y-4">
            <AnimatePresence>
              {activeWorkflows.map((workflow, index) => (
                <motion.div
                  key={workflow?.projectId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">{workflow?.projectName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          workflow?.projectStatus === 'development' ? 'bg-blue-100 text-blue-700' :
                          workflow?.projectStatus === 'testing' ? 'bg-yellow-100 text-yellow-700' :
                          workflow?.projectStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {workflow?.projectStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        {workflow?.workflowProgress.completedSteps}/{workflow?.workflowProgress.totalSteps} steps
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${workflow?.workflowProgress.progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {workflow?.workflowProgress.progressPercentage}%
                      </span>
                    </div>
                  </div>
                  
                  {workflow?.workflowProgress.currentStep && (
                    <div className="mt-3 text-sm text-gray-600">
                      Current step: <span className="font-medium">{workflow.workflowProgress.currentStep.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {activeWorkflows.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active workflows</p>
                <p className="text-sm">Start a project to see workflow activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
