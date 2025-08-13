'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { Plus, Play, Pause, BarChart3, Users, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectCard } from './ProjectCard';
import { LoadingSpinner } from './LoadingSpinner';

export function ProjectOverview() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Real-time project data with Convex subscriptions
  const projects = useQuery(api.projects.listProjects, { 
    status: selectedStatus === 'all' ? undefined : selectedStatus 
  });
  
  const workflowMetrics = useQuery(api.workflows.getWorkflowMetrics, {
    timeRange: '7d'
  });

  const startWorkflow = useMutation(api.workflows.startDevelopmentWorkflow);
  const pauseWorkflow = useMutation(api.workflows.cancelProjectWorkflow);

  const statusFilters = [
    { key: 'all', label: 'All Projects', count: projects?.length || 0 },
    { key: 'created', label: 'Created', count: projects?.filter(p => p.status === 'created').length || 0 },
    { key: 'planning', label: 'Planning', count: projects?.filter(p => p.status === 'planning').length || 0 },
    { key: 'development', label: 'Development', count: projects?.filter(p => p.status === 'development').length || 0 },
    { key: 'testing', label: 'Testing', count: projects?.filter(p => p.status === 'testing').length || 0 },
    { key: 'completed', label: 'Completed', count: projects?.filter(p => p.status === 'completed').length || 0 },
  ];

  const handleStartWorkflow = async (projectId: string) => {
    try {
      await startWorkflow({
        projectId,
        workflowConfig: {
          parallelExecution: false,
          priorityLevel: 'medium'
        }
      });
      toast.success('Development workflow started successfully!');
    } catch (error) {
      toast.error('Failed to start workflow');
      console.error('Error starting workflow:', error);
    }
  };

  const handlePauseWorkflow = async (projectId: string) => {
    try {
      await pauseWorkflow({
        projectId,
        reason: 'Manual pause from dashboard'
      });
      toast.success('Workflow paused successfully');
    } catch (error) {
      toast.error('Failed to pause workflow');
      console.error('Error pausing workflow:', error);
    }
  };

  if (!projects) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects Overview</h2>
          <p className="text-gray-600">Manage your autonomous development projects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Metrics Cards */}
      {workflowMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{workflowMetrics.overallMetrics.totalWorkflowsStarted}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{workflowMetrics.overallMetrics.overallCompletionRate.toFixed(1)}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Failed Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.status === 'failed').length}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Status Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedStatus(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === filter.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {projects.map((project, index) => (
            <motion.div
              key={project._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProjectCard
                project={project}
                onStartWorkflow={handleStartWorkflow}
                onPauseWorkflow={handlePauseWorkflow}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-gray-400 mb-4">
            <BarChart3 className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">Create your first autonomous development project to get started.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </motion.div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
