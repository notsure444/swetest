'use client';

import { useState } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Sparkles, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
  type: z.enum(['web', 'mobile', 'fullstack'], { required_error: 'Project type is required' }),
  techStack: z.array(z.string()).min(1, 'At least one technology is required'),
  requirements: z.string().min(10, 'Requirements must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  complexity: z.enum(['simple', 'moderate', 'complex', 'enterprise']).default('moderate'),
  estimatedDuration: z.string().optional(),
  targetAudience: z.string().optional(),
  businessGoals: z.array(z.string()).optional(),
  technicalConstraints: z.array(z.string()).optional(),
  deliverables: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['feature', 'component', 'documentation', 'test', 'deployment']),
    acceptanceCriteria: z.array(z.string()),
    dependencies: z.array(z.string()),
    estimatedEffort: z.number(),
    assignedAgentType: z.string().optional(),
    dueDate: z.number().optional(),
  })).min(1, 'At least one deliverable is required'),
  evaluations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['functionality', 'performance', 'security', 'usability', 'maintainability']),
    weight: z.number().min(1).max(10),
    automatedCheck: z.boolean(),
    testScript: z.string().optional(),
    criteria: z.array(z.object({
      name: z.string(),
      description: z.string(),
      metric: z.string(),
      threshold: z.union([z.string(), z.number()]),
      critical: z.boolean(),
    })),
  })).min(1, 'At least one evaluation is required'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TECH_STACK_OPTIONS = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript',
  'Node.js', 'Python', 'Django', 'FastAPI', 'Express', 'NestJS',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'GraphQL', 'REST API'
];

const AI_SUGGESTIONS = {
  web: {
    deliverables: [
      'Responsive web application',
      'Mobile-optimized interface',
      'SEO optimization',
      'Performance optimization',
      'Cross-browser compatibility'
    ],
    evaluation: [
      'Page load time < 3 seconds',
      'Lighthouse score > 90',
      'Mobile responsiveness test',
      'Cross-browser compatibility',
      'Accessibility compliance (WCAG 2.1)'
    ]
  },
  mobile: {
    deliverables: [
      'Native mobile application',
      'Push notification system',
      'Offline functionality',
      'App store deployment',
      'User authentication'
    ],
    evaluation: [
      'App store approval',
      'Performance on low-end devices',
      'Battery usage optimization',
      'App size < 50MB',
      'Crash-free rate > 99%'
    ]
  },
  fullstack: {
    deliverables: [
      'Frontend application',
      'Backend API',
      'Database design',
      'Authentication system',
      'Deployment pipeline'
    ],
    evaluation: [
      'API response time < 500ms',
      'Database query optimization',
      'Security vulnerability scan',
      'Load testing (1000+ concurrent users)',
      'Automated deployment success'
    ]
  }
};

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestionType, setAiSuggestionType] = useState<'deliverables' | 'evaluation' | null>(null);

  const createProject = useMutation(api.projectManager.createEnhancedProject);
  const getProjectSuggestions = useAction(api.projectManager.getProjectSuggestions);
  const startWorkflow = useMutation(api.workflows.startDevelopmentWorkflow);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isValid }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'web',
      techStack: [],
      requirements: '',
      deliverables: [],
      evaluationCriteria: [],
      isolationLevel: 'standard',
    },
    mode: 'onChange'
  });

  const watchedType = watch('type');
  const watchedTechStack = watch('techStack');
  const watchedDeliverables = watch('deliverables');
  const watchedEvaluationCriteria = watch('evaluationCriteria');

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    setAiSuggestionType(null);
    onClose();
  };

  const addTechStack = (tech: string) => {
    const current = getValues('techStack');
    if (!current.includes(tech)) {
      setValue('techStack', [...current, tech], { shouldValidate: true });
    }
  };

  const removeTechStack = (tech: string) => {
    const current = getValues('techStack');
    setValue('techStack', current.filter(t => t !== tech), { shouldValidate: true });
  };

  const addDeliverable = () => {
    const current = getValues('deliverables');
    setValue('deliverables', [...current, ''], { shouldValidate: true });
  };

  const updateDeliverable = (index: number, value: string) => {
    const current = getValues('deliverables');
    const updated = [...current];
    updated[index] = value;
    setValue('deliverables', updated, { shouldValidate: true });
  };

  const removeDeliverable = (index: number) => {
    const current = getValues('deliverables');
    setValue('deliverables', current.filter((_, i) => i !== index), { shouldValidate: true });
  };

  const addEvaluationCriterion = () => {
    const current = getValues('evaluationCriteria');
    setValue('evaluationCriteria', [...current, ''], { shouldValidate: true });
  };

  const updateEvaluationCriterion = (index: number, value: string) => {
    const current = getValues('evaluationCriteria');
    const updated = [...current];
    updated[index] = value;
    setValue('evaluationCriteria', updated, { shouldValidate: true });
  };

  const removeEvaluationCriterion = (index: number) => {
    const current = getValues('evaluationCriteria');
    setValue('evaluationCriteria', current.filter((_, i) => i !== index), { shouldValidate: true });
  };

  const applyAISuggestions = (type: 'deliverables' | 'evaluation') => {
    const suggestions = AI_SUGGESTIONS[watchedType];
    if (type === 'deliverables') {
      setValue('deliverables', suggestions.deliverables, { shouldValidate: true });
    } else {
      setValue('evaluationCriteria', suggestions.evaluation, { shouldValidate: true });
    }
    setAiSuggestionType(null);
    toast.success(`AI suggestions applied for ${type}`);
  };

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      // First get AI suggestions for the project
      let suggestions = [];
      try {
        suggestions = await getProjectSuggestions({
          projectType: data.type,
          techStack: data.techStack,
          requirements: data.requirements,
          complexity: data.complexity || 'moderate',
          targetAudience: data.targetAudience,
          businessGoals: data.businessGoals,
        });
        
        if (suggestions.length > 0) {
          toast.success(`Generated ${suggestions.length} AI suggestions for your project!`);
        }
      } catch (suggestionError) {
        console.warn('Failed to get AI suggestions:', suggestionError);
        // Continue without suggestions
      }

      // Create enhanced project with comprehensive management
      const projectResult = await createProject({
        config: {
          name: data.name,
          description: data.description,
          type: data.type,
          techStack: data.techStack,
          requirements: data.requirements,
          priority: data.priority || 'medium',
          complexity: data.complexity || 'moderate',
          estimatedDuration: data.estimatedDuration,
          targetAudience: data.targetAudience,
          businessGoals: data.businessGoals || [],
          technicalConstraints: data.technicalConstraints || [],
          deliverables: data.deliverables || [],
          evaluations: data.evaluations || [],
        }
      });

      if (projectResult.projectId) {
        toast.success(`Enhanced project created successfully! Namespace: ${projectResult.namespace}`);
        
        // Automatically start the development workflow with enhanced coordination
        try {
          await startWorkflow({
            projectId: projectResult.projectId,
            workflowConfig: {
              parallelExecution: true,
              priorityLevel: data.priority || 'medium',
              agentCoordination: true,
              lifecycle: {
                currentState: projectResult.status,
                nextState: 'architecture'
              }
            }
          });
          toast.success('Development workflow started with agent coordination!');
        } catch (workflowError) {
          console.error('Failed to start workflow:', workflowError);
          toast.error('Project created but failed to start workflow');
        }

        handleClose();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
            <p className="text-gray-600">Set up an autonomous development project</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <div className="ml-2 text-sm">
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Configuration'}
                  {step === 3 && 'Deliverables & Evaluation'}
                </div>
                {step < 3 && <div className={`w-16 h-1 mx-4 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[calc(90vh-140px)]">
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name
                    </label>
                    <input
                      {...register('name')}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter project name"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your project goals and vision"
                    />
                    {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Type
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'web', label: 'Web Application', emoji: '🌐' },
                        { value: 'mobile', label: 'Mobile App', emoji: '📱' },
                        { value: 'fullstack', label: 'Full Stack', emoji: '⚡' }
                      ].map((type) => (
                        <label key={type.value} className="relative">
                          <input
                            {...register('type')}
                            type="radio"
                            value={type.value}
                            className="sr-only"
                          />
                          <div className={`border-2 rounded-lg p-4 text-center cursor-pointer transition-colors ${
                            watchedType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="text-2xl mb-2">{type.emoji}</div>
                            <div className="font-medium">{type.label}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requirements
                    </label>
                    <textarea
                      {...register('requirements')}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the specific requirements and features needed"
                    />
                    {errors.requirements && <p className="text-red-600 text-sm mt-1">{errors.requirements.message}</p>}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Configuration */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technology Stack
                    </label>
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {TECH_STACK_OPTIONS.map((tech) => (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => addTechStack(tech)}
                            disabled={watchedTechStack.includes(tech)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              watchedTechStack.includes(tech)
                                ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {tech}
                          </button>
                        ))}
                      </div>
                      
                      {watchedTechStack.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Selected technologies:</p>
                          <div className="flex flex-wrap gap-2">
                            {watchedTechStack.map((tech) => (
                              <div key={tech} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                {tech}
                                <button
                                  type="button"
                                  onClick={() => removeTechStack(tech)}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.techStack && <p className="text-red-600 text-sm mt-1">{errors.techStack.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Isolation Level
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'basic', label: 'Basic', desc: 'Shared resources' },
                        { value: 'standard', label: 'Standard', desc: 'Moderate isolation' },
                        { value: 'strict', label: 'Strict', desc: 'Complete isolation' }
                      ].map((level) => (
                        <label key={level.value} className="relative">
                          <input
                            {...register('isolationLevel')}
                            type="radio"
                            value={level.value}
                            className="sr-only"
                          />
                          <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            getValues('isolationLevel') === level.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-sm text-gray-600">{level.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Deliverables & Evaluation */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Project Deliverables
                      </label>
                      <button
                        type="button"
                        onClick={() => applyAISuggestions('deliverables')}
                        className="text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Suggestions
                      </button>
                    </div>
                    <div className="space-y-2">
                      {watchedDeliverables.map((deliverable, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            value={deliverable}
                            onChange={(e) => updateDeliverable(index, e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter deliverable"
                          />
                          <button
                            type="button"
                            onClick={() => removeDeliverable(index)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addDeliverable}
                        className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-3 text-gray-600 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Deliverable
                      </button>
                    </div>
                    {errors.deliverables && <p className="text-red-600 text-sm mt-1">{errors.deliverables.message}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Evaluation Criteria
                      </label>
                      <button
                        type="button"
                        onClick={() => applyAISuggestions('evaluation')}
                        className="text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <Brain className="w-3 h-3" />
                        AI Suggestions
                      </button>
                    </div>
                    <div className="space-y-2">
                      {watchedEvaluationCriteria.map((criterion, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            value={criterion}
                            onChange={(e) => updateEvaluationCriterion(index, e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter evaluation criterion"
                          />
                          <button
                            type="button"
                            onClick={() => removeEvaluationCriterion(index)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addEvaluationCriterion}
                        className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-3 text-gray-600 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Evaluation Criterion
                      </button>
                    </div>
                    {errors.evaluationCriteria && <p className="text-red-600 text-sm mt-1">{errors.evaluationCriteria.message}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Project
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}




