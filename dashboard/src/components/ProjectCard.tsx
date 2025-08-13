'use client';

import { useState } from 'react';
import { 
  Play, 
  Pause, 
  MoreVertical, 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Code,
  Globe,
  Smartphone,
  Layers,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface ProjectCardProps {
  project: {
    _id: string;
    name: string;
    description: string;
    type: 'web' | 'mobile' | 'fullstack';
    status: string;
    createdAt: number;
    updatedAt: number;
    configuration: {
      techStack: string[];
      requirements: string;
      deliverables: string[];
      evaluationCriteria: string[];
    };
    namespace: string;
    stats: {
      agents: number;
      totalTasks: number;
      completedTasks: number;
      activeTasks: number;
    };
  };
  onStartWorkflow: (projectId: string) => void;
  onPauseWorkflow: (projectId: string) => void;
}

const PROJECT_ICONS = {
  web: Globe,
  mobile: Smartphone,
  fullstack: Layers,
};

const STATUS_COLORS = {
  created: 'bg-gray-100 text-gray-700 border-gray-200',
  planning: 'bg-blue-100 text-blue-700 border-blue-200',
  development: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  testing: 'bg-purple-100 text-purple-700 border-purple-200',
  deployment: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  paused: 'bg-gray-100 text-gray-600 border-gray-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
};

export function ProjectCard({ project, onStartWorkflow, onPauseWorkflow }: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const IconComponent = PROJECT_ICONS[project.type];
  const statusColorClass = STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.created;
  
  // Calculate completion percentage
  const completionPercentage = project.stats.totalTasks > 0 
    ? (project.stats.completedTasks / project.stats.totalTasks) * 100 
    : 0;

  const canStart = ['created', 'paused'].includes(project.status);
  const canPause = ['planning', 'development', 'testing'].includes(project.status);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColorClass}`}>
                {project.status}
              </div>
            </div>
          </div>
          
          {/* Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </Menu.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block w-full text-left px-4 py-2 text-sm`}
                      >
                        View Details
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block w-full text-left px-4 py-2 text-sm`}
                      >
                        Edit Configuration
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-red-100 text-red-900' : 'text-red-700'
                        } block w-full text-left px-4 py-2 text-sm`}
                      >
                        Delete Project
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>

        {/* Tech Stack */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {project.configuration.techStack.slice(0, 4).map((tech, index) => (
              <span
                key={tech}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tech}
              </span>
            ))}
            {project.configuration.techStack.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                +{project.configuration.techStack.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-6 pb-4">
        {project.stats.totalTasks > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{project.stats.completedTasks}/{project.stats.totalTasks} tasks</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-blue-600 h-2 rounded-full"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {completionPercentage.toFixed(1)}% complete
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-lg font-semibold text-gray-900">{project.stats.agents}</div>
            <div className="text-xs text-gray-600">Agents</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-lg font-semibold text-gray-900">{project.stats.completedTasks}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-lg font-semibold text-gray-900">{project.stats.activeTasks}</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Created {formatDate(project.createdAt)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <span>Updated {formatTimeAgo(project.updatedAt)}</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-gray-500">
            Namespace: {project.namespace.split('_')[1]?.substring(0, 8)}...
          </div>
          
          <div className="flex gap-2">
            {canStart && (
              <button
                onClick={() => onStartWorkflow(project._id)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
              >
                <Play className="w-3 h-3" />
                Start
              </button>
            )}
            
            {canPause && (
              <button
                onClick={() => onPauseWorkflow(project._id)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
              >
                <Pause className="w-3 h-3" />
                Pause
              </button>
            )}
            
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors">
              <Code className="w-3 h-3" />
              View
            </button>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      {project.status === 'failed' && (
        <div className="px-6 py-2 bg-red-50 border-t border-red-200">
          <div className="flex items-center text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Project encountered errors. Check logs for details.
          </div>
        </div>
      )}
      
      {project.status === 'development' && project.stats.activeTasks > 0 && (
        <div className="px-6 py-2 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center text-sm text-blue-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Development in progress - {project.stats.activeTasks} active task{project.stats.activeTasks > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </motion.div>
  );
}
