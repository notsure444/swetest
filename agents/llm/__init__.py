"""
LLM service integrations for GPT-5 and Claude 4.1 patterns.

This module provides agent integrations with external LLM services,
implementing proper rate limiting and error handling as required by AGENTS.md.
"""

from .gpt_integration import GPTIntegration
from .claude_integration import ClaudeIntegration
from .llm_manager import LLMManager

__all__ = [
    "GPTIntegration",
    "ClaudeIntegration",
    "LLMManager"
]
