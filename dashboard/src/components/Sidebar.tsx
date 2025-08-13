'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Bot, 
  GitBranch, 
  Activity, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  Database,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string | number;
  isActive?: boolean;
  isCollapsed?: boolean;
}

function SidebarItem({ icon: Icon, label, href, badge, isActive, isCollapsed }: SidebarItemProps) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-100 text-blue-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}>
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center justify-between flex-1 min-w-0"
            >
              <span className="font-medium truncate">{label}</span>
              {badge && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isActive 
                    ? 'bg-blue-200 text-blue-800' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {badge}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Get real-time data for badges
  const projects = useQuery(api.projects.listProjects, {});
  const systemHealth = useQuery(api.agentIntegration.getAgentSystemHealth, {});
  const activeWorkflows = useQuery(api.workflows.getActiveWorkflows, { limit: 20 });

  const activeProjects = projects?.filter(p => 
    ['development', 'testing', 'planning'].includes(p.status)
  ).length || 0;
  
  const workingAgents = systemHealth?.agentsByStatus.working || 0;
  const activeWorkflowCount = activeWorkflows?.length || 0;

  const mainNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/',
      isActive: pathname === '/'
    },
    {
      icon: FolderOpen,
      label: 'Projects',
      href: '/projects',
      badge: activeProjects,
      isActive: pathname.startsWith('/projects')
    },
    {
      icon: Bot,
      label: 'Agents',
      href: '/agents',
      badge: workingAgents,
      isActive: pathname.startsWith('/agents')
    },
    {
      icon: GitBranch,
      label: 'Workflows',
      href: '/workflows',
      badge: activeWorkflowCount,
      isActive: pathname.startsWith('/workflows')
    },
    {
      icon: Activity,
      label: 'System Health',
      href: '/health',
      isActive: pathname.startsWith('/health')
    },
    {
      icon: Database,
      label: 'Analytics',
      href: '/analytics',
      isActive: pathname.startsWith('/analytics')
    }
  ];

  const secondaryNavItems = [
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
      isActive: pathname.startsWith('/settings')
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      href: '/help',
      isActive: pathname.startsWith('/help')
    }
  ];

  return (
    <motion.div
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col shadow-sm"
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-end p-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 pb-4">
        <div className="space-y-1">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-2 mb-4"
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Main Menu
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {mainNavItems.map((item) => (
            <SidebarItem
              key={item.href}
              {...item}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 space-y-1">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-2 mb-4"
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Quick Actions
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button className={`w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}>
            <Plus className="w-5 h-5 text-green-600" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium"
                >
                  New Project
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button className={`w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}>
            <Zap className="w-5 h-5 text-yellow-600" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium"
                >
                  Run Workflow
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* System Status Summary */}
        {!isCollapsed && systemHealth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900">System Status</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Agents:</span>
                <span className="font-medium">{systemHealth.totalAgents}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active:</span>
                <span className="font-medium text-green-600">{systemHealth.agentsByStatus.working}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Error Rate:</span>
                <span className={`font-medium ${
                  systemHealth.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {(systemHealth.errorRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className={`flex items-center gap-2 text-sm ${
                systemHealth.systemStatus === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  systemHealth.systemStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="capitalize font-medium">{systemHealth.systemStatus}</span>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="space-y-1">
          {secondaryNavItems.map((item) => (
            <SidebarItem
              key={item.href}
              {...item}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>

        {/* Footer */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 text-center"
            >
              <p className="text-xs text-gray-400">
                AI Agent Platform v1.0
              </p>
              <p className="text-xs text-gray-400">
                Autonomous Development
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
