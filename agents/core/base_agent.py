"""
Base Agent implementation that interfaces with Convex AI Agent Component.

This base class provides common functionality for all agent types,
integrating with the Convex backend while maintaining functional programming patterns.
"""

from typing import Dict, List, Optional, Any, Protocol
from abc import ABC, abstractmethod
from dataclasses import dataclass
import asyncio
import logging

# Set up logging for agent actions (as specified in AGENTS.md)
logger = logging.getLogger(__name__)

@dataclass
class AgentConfig:
    """Configuration for agent instances."""
    agent_id: str
    agent_type: str
    model: str
    system_prompt: str
    tools: List[str]
    workpool_name: str
    max_concurrent_tasks: int
    context_namespace: Optional[str] = None

class BaseAgent(ABC):
    """
    Base agent class that interfaces with Convex backend agent system.
    
    Uses functional programming patterns and avoids OOP when possible.
    Integrates with Convex AI Agent Component for conversation management.
    """
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.state: Dict[str, Any] = {}
        self.logger = logging.getLogger(f"agent.{config.agent_type}.{config.agent_id}")
    
    @abstractmethod
    async def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task using the agent's specialized capabilities.
        
        Args:
            task_data: Task information including requirements, context, and parameters
            
        Returns:
            Result dictionary with task output and status
        """
        pass
    
    async def validate_output(self, output: Dict[str, Any]) -> bool:
        """
        Validate agent output before execution (as required in AGENTS.md).
        
        Args:
            output: Agent output to validate
            
        Returns:
            True if output is valid and safe to execute
        """
        # Basic validation - subclasses should override for specific validation
        required_keys = ["status", "result"]
        return all(key in output for key in required_keys)
    
    def log_action(self, action: str, details: Dict[str, Any]) -> None:
        """
        Log agent actions for debugging and audit trails (AGENTS.md requirement).
        
        Args:
            action: Action being performed
            details: Additional action details
        """
        self.logger.info(f"Agent {self.config.agent_id} performing {action}", extra=details)
    
    async def get_context_from_rag(self, query: str) -> Optional[str]:
        """
        Retrieve context using Convex RAG component for codebase knowledge.
        
        Args:
            query: Search query for context retrieval
            
        Returns:
            Relevant context from RAG system or None
        """
        # This would interface with the Convex RAG component
        # Implementation depends on integration with convex/agents.ts RAG setup
        return None
    
    def update_state(self, key: str, value: Any) -> None:
        """Update agent state in a functional manner."""
        self.state = {**self.state, key: value}
    
    def get_state(self, key: str, default: Any = None) -> Any:
        """Get agent state value."""
        return self.state.get(key, default)
