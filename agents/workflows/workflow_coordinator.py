"""
Workflow coordinator for managing multiple concurrent workflows.

Coordinates between different workflow types and manages workflow
execution across multiple projects using Convex Workflow component.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import logging

from .development_workflow import DevelopmentWorkflow, WorkflowConfig, WorkflowStatus

logger = logging.getLogger(__name__)

class WorkflowType(Enum):
    """Types of workflows that can be coordinated."""
    DEVELOPMENT = "development"
    DEPLOYMENT = "deployment"
    TESTING = "testing"
    MAINTENANCE = "maintenance"

@dataclass
class WorkflowInstance:
    """Instance of a running workflow."""
    workflow_id: str
    workflow_type: WorkflowType
    project_id: str
    status: WorkflowStatus
    workflow_object: Any
    created_at: int
    started_at: Optional[int] = None
    completed_at: Optional[int] = None

class WorkflowCoordinator:
    """
    Coordinates multiple workflows across different projects.
    
    Manages workflow lifecycle, resource allocation, and ensures
    proper isolation between project workflows.
    """
    
    def __init__(self):
        self.active_workflows: Dict[str, WorkflowInstance] = {}
        self.workflow_queue: List[str] = []
        self.max_concurrent_workflows = 5
        self.logger = logging.getLogger("workflow.coordinator")
    
    async def start_development_workflow(self, project_id: str, config: WorkflowConfig) -> str:
        """
        Start a new development workflow for a project.
        
        Args:
            project_id: Project identifier
            config: Workflow configuration
            
        Returns:
            Workflow instance ID
        """
        workflow = DevelopmentWorkflow(config)
        
        instance = WorkflowInstance(
            workflow_id=config.workflow_id,
            workflow_type=WorkflowType.DEVELOPMENT,
            project_id=project_id,
            status=WorkflowStatus.PENDING,
            workflow_object=workflow,
            created_at=1234567890  # Mock timestamp
        )
        
        self.active_workflows[config.workflow_id] = instance
        self.workflow_queue.append(config.workflow_id)
        
        self.logger.info(f"Started development workflow {config.workflow_id} for project {project_id}")
        
        # Execute if capacity allows
        await self._process_workflow_queue()
        
        return config.workflow_id
    
    async def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a specific workflow.
        
        Args:
            workflow_id: Workflow identifier
            
        Returns:
            Workflow status information or None if not found
        """
        instance = self.active_workflows.get(workflow_id)
        if not instance:
            return None
        
        if isinstance(instance.workflow_object, DevelopmentWorkflow):
            progress = instance.workflow_object.get_progress()
        else:
            progress = {"status": instance.status.value}
        
        return {
            "workflow_id": workflow_id,
            "workflow_type": instance.workflow_type.value,
            "project_id": instance.project_id,
            "status": instance.status.value,
            "created_at": instance.created_at,
            "started_at": instance.started_at,
            "completed_at": instance.completed_at,
            "progress": progress
        }
    
    async def pause_workflow(self, workflow_id: str) -> bool:
        """
        Pause a running workflow.
        
        Args:
            workflow_id: Workflow to pause
            
        Returns:
            Success status
        """
        instance = self.active_workflows.get(workflow_id)
        if not instance:
            return False
        
        try:
            if hasattr(instance.workflow_object, 'pause'):
                success = await instance.workflow_object.pause()
                if success:
                    instance.status = WorkflowStatus.PENDING
                    self.logger.info(f"Paused workflow {workflow_id}")
                return success
        except Exception as e:
            self.logger.error(f"Failed to pause workflow {workflow_id}: {e}")
        
        return False
    
    async def resume_workflow(self, workflow_id: str) -> bool:
        """
        Resume a paused workflow.
        
        Args:
            workflow_id: Workflow to resume
            
        Returns:
            Success status
        """
        instance = self.active_workflows.get(workflow_id)
        if not instance:
            return False
        
        try:
            if hasattr(instance.workflow_object, 'resume'):
                success = await instance.workflow_object.resume()
                if success:
                    instance.status = WorkflowStatus.RUNNING
                    self.logger.info(f"Resumed workflow {workflow_id}")
                return success
        except Exception as e:
            self.logger.error(f"Failed to resume workflow {workflow_id}: {e}")
        
        return False
    
    async def cancel_workflow(self, workflow_id: str) -> bool:
        """
        Cancel a workflow.
        
        Args:
            workflow_id: Workflow to cancel
            
        Returns:
            Success status
        """
        instance = self.active_workflows.get(workflow_id)
        if not instance:
            return False
        
        try:
            if hasattr(instance.workflow_object, 'cancel'):
                success = await instance.workflow_object.cancel()
                if success:
                    instance.status = WorkflowStatus.CANCELLED
                    instance.completed_at = 1234567890  # Mock timestamp
                    self.logger.info(f"Cancelled workflow {workflow_id}")
                return success
        except Exception as e:
            self.logger.error(f"Failed to cancel workflow {workflow_id}: {e}")
        
        return False
    
    async def get_project_workflows(self, project_id: str) -> List[Dict[str, Any]]:
        """
        Get all workflows for a specific project.
        
        Args:
            project_id: Project identifier
            
        Returns:
            List of workflow status information
        """
        project_workflows = []
        
        for workflow_id, instance in self.active_workflows.items():
            if instance.project_id == project_id:
                status = await self.get_workflow_status(workflow_id)
                if status:
                    project_workflows.append(status)
        
        return project_workflows
    
    async def _process_workflow_queue(self) -> None:
        """Process the workflow queue and start workflows if capacity allows."""
        running_count = len([w for w in self.active_workflows.values() 
                           if w.status == WorkflowStatus.RUNNING])
        
        while (running_count < self.max_concurrent_workflows and 
               self.workflow_queue):
            
            workflow_id = self.workflow_queue.pop(0)
            instance = self.active_workflows.get(workflow_id)
            
            if instance and instance.status == WorkflowStatus.PENDING:
                try:
                    instance.status = WorkflowStatus.RUNNING
                    instance.started_at = 1234567890  # Mock timestamp
                    
                    # Start the workflow execution
                    if hasattr(instance.workflow_object, 'execute'):
                        result = await instance.workflow_object.execute()
                        instance.status = WorkflowStatus.COMPLETED
                        instance.completed_at = 1234567890  # Mock timestamp
                        
                        self.logger.info(f"Completed workflow {workflow_id}")
                    
                    running_count += 1
                    
                except Exception as e:
                    instance.status = WorkflowStatus.FAILED
                    instance.completed_at = 1234567890  # Mock timestamp
                    self.logger.error(f"Workflow {workflow_id} failed: {e}")
    
    def get_coordinator_status(self) -> Dict[str, Any]:
        """Get overall coordinator status."""
        status_counts = {}
        for status in WorkflowStatus:
            status_counts[status.value] = len([
                w for w in self.active_workflows.values() 
                if w.status == status
            ])
        
        return {
            "total_workflows": len(self.active_workflows),
            "queued_workflows": len(self.workflow_queue),
            "max_concurrent": self.max_concurrent_workflows,
            "status_counts": status_counts,
            "projects_active": len(set(w.project_id for w in self.active_workflows.values()))
        }
    
    async def cleanup_completed_workflows(self, max_age_hours: int = 24) -> int:
        """
        Clean up old completed workflows.
        
        Args:
            max_age_hours: Maximum age in hours for completed workflows
            
        Returns:
            Number of workflows cleaned up
        """
        current_time = 1234567890  # Mock current timestamp
        max_age_ms = max_age_hours * 60 * 60 * 1000
        
        workflows_to_remove = []
        
        for workflow_id, instance in self.active_workflows.items():
            if (instance.status in [WorkflowStatus.COMPLETED, WorkflowStatus.FAILED, WorkflowStatus.CANCELLED] and
                instance.completed_at and 
                (current_time - instance.completed_at) > max_age_ms):
                workflows_to_remove.append(workflow_id)
        
        for workflow_id in workflows_to_remove:
            del self.active_workflows[workflow_id]
            self.logger.info(f"Cleaned up old workflow {workflow_id}")
        
        return len(workflows_to_remove)
