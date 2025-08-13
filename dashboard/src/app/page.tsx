'use client';

import { Suspense } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ProjectOverview } from '@/components/ProjectOverview';
import { AgentStatus } from '@/components/AgentStatus';
import { WorkflowMonitor } from '@/components/WorkflowMonitor';
import { SystemHealth } from '@/components/SystemHealth';
import { AIAssistant } from '@/components/AIAssistant';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Initialize Convex client
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3210');
const queryClient = new QueryClient();

export default function Dashboard() {
  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          
          {/* Navigation */}
          <Navbar />
          
          <div className="flex">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
              <div className="max-w-7xl mx-auto">
                {/* Dashboard Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Autonomous AI Agent Platform
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Monitor and manage your autonomous development projects
                  </p>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="xl:col-span-2 space-y-8">
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProjectOverview />
                    </Suspense>
                    
                    <Suspense fallback={<LoadingSpinner />}>
                      <WorkflowMonitor />
                    </Suspense>
                    
                    <Suspense fallback={<LoadingSpinner />}>
                      <AgentStatus />
                    </Suspense>
                  </div>

                  {/* Sidebar Content */}
                  <div className="space-y-8">
                    <Suspense fallback={<LoadingSpinner />}>
                      <SystemHealth />
                    </Suspense>
                    
                    <Suspense fallback={<LoadingSpinner />}>
                      <AIAssistant />
                    </Suspense>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </QueryClientProvider>
    </ConvexProvider>
  );
}
