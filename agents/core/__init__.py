"""
Core agent implementations and shared functionality.

This module contains the base agent implementations that coordinate with
the Convex backend agent system. All agents inherit from BaseAgent and
integrate with the Convex AI Agent Component.
"""

from .base_agent import BaseAgent
from .agent_coordinator import AgentCoordinator

__all__ = ["BaseAgent", "AgentCoordinator"]
