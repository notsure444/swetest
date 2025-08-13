"""
Agent coordination system that interfaces with Convex workflow orchestration.

This module coordinates between different agent types and manages
inter-agent communication through the Convex AI Agent Component.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import asyncio
import logging

from .base_agent import BaseAgent, AgentConfig

logger = logging.getLogger(__name__)

@dataclass
class CoordinationTask:
    """Task that requires coordination between multiple agents."""
    task_id: str
    project_id: str
    task_type: str
    required_agents: List[str]
    dependencies: List[str]
    priority: str
    context: Dict[str, Any]

class AgentCoordinator:
    """
    Coordinates multiple agents working on a project.
    
    Integrates with Convex workflow orchestration and manages
    agent communication through message threads.
    """
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.active_agents: Dict[str, BaseAgent] = {}
        self.task_queue: List[CoordinationTask] = []
        self.logger = logging.getLogger(f"coordinator.{project_id}")
    
    def register_agent(self, agent: BaseAgent) -> None:
        """Register an agent for coordination in this project."""
        agent_key = f"{agent.config.agent_type}_{agent.config.agent_id}"
        self.active_agents[agent_key] = agent
        self.logger.info(f"Registered agent {agent_key} for project {self.project_id}")
    
    async def assign_task(self, task: CoordinationTask) -> Dict[str, Any]:
        """
        Assign a coordination task to appropriate agents.
        
        Args:
            task: Task requiring coordination
            
        Returns:
            Task assignment result
        """
        self.logger.info(f"Assigning coordination task {task.task_id}")
        
        # Find suitable agents for the task
        suitable_agents = []
        for agent_type in task.required_agents:
            agent = self._find_agent_by_type(agent_type)
            if agent:
                suitable_agents.append(agent)
        
        if not suitable_agents:
            return {
                "status": "error",
                "message": f"No suitable agents found for task {task.task_id}",
                "task_id": task.task_id
            }
        
        # Execute task coordination
        try:
            results = await self._coordinate_agents(suitable_agents, task)
            return {
                "status": "success",
                "task_id": task.task_id,
                "results": results
            }
        except Exception as e:
            self.logger.error(f"Task coordination failed: {e}")
            return {
                "status": "error",
                "task_id": task.task_id,
                "error": str(e)
            }
    
    def _find_agent_by_type(self, agent_type: str) -> Optional[BaseAgent]:
        """Find an active agent by type."""
        for agent_key, agent in self.active_agents.items():
            if agent.config.agent_type == agent_type:
                return agent
        return None
    
    async def _coordinate_agents(self, agents: List[BaseAgent], task: CoordinationTask) -> List[Dict[str, Any]]:
        """Coordinate multiple agents working on a task."""
        results = []
        
        # Execute agents in sequence or parallel based on task dependencies
        for agent in agents:
            agent.log_action("coordination_task_start", {
                "task_id": task.task_id,
                "project_id": task.project_id
            })
            
            result = await agent.process_task({
                "task_id": task.task_id,
                "project_id": task.project_id,
                "task_type": task.task_type,
                "context": task.context
            })
            
            # Validate agent output before proceeding
            if await agent.validate_output(result):
                results.append(result)
                agent.log_action("coordination_task_complete", {
                    "task_id": task.task_id,
                    "result_status": result.get("status")
                })
            else:
                agent.log_action("coordination_task_validation_failed", {
                    "task_id": task.task_id
                })
                raise ValueError(f"Agent {agent.config.agent_id} output validation failed")
        
        return results
    
    def get_project_status(self) -> Dict[str, Any]:
        """Get status of all agents in this project."""
        return {
            "project_id": self.project_id,
            "active_agents": len(self.active_agents),
            "agent_types": [agent.config.agent_type for agent in self.active_agents.values()],
            "task_queue_size": len(self.task_queue)
        }
