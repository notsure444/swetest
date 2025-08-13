"""
LLM Manager for coordinating between different LLM services.

Manages GPT-5 and Claude 4.1 integrations with proper load balancing,
rate limiting, and fallback mechanisms as specified in AGENTS.md.
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum
import logging

from .gpt_integration import GPTIntegration, GPTConfig, LLMResponse
from .claude_integration import ClaudeIntegration, ClaudeConfig, ClaudeResponse

logger = logging.getLogger(__name__)

class LLMProvider(Enum):
    """Available LLM providers."""
    GPT = "gpt"
    CLAUDE = "claude"
    AUTO = "auto"

class TaskType(Enum):
    """Different types of tasks for LLM selection."""
    CODE_GENERATION = "code_generation"
    CODE_ANALYSIS = "code_analysis" 
    ARCHITECTURE = "architecture"
    REQUIREMENTS_ANALYSIS = "requirements_analysis"
    GENERAL = "general"

@dataclass
class LLMManagerConfig:
    """Configuration for LLM Manager."""
    gpt_config: Optional[GPTConfig] = None
    claude_config: Optional[ClaudeConfig] = None
    default_provider: LLMProvider = LLMProvider.AUTO
    enable_fallback: bool = True

class LLMManager:
    """
    Manager for coordinating multiple LLM services.
    
    Provides intelligent routing between GPT-5 and Claude 4.1 based on
    task type, availability, and rate limits. Implements comprehensive
    logging as required in AGENTS.md.
    """
    
    def __init__(self, config: LLMManagerConfig):
        self.config = config
        self.gpt = GPTIntegration(config.gpt_config) if config.gpt_config else None
        self.claude = ClaudeIntegration(config.claude_config) if config.claude_config else None
        self.logger = logging.getLogger("llm.manager")
        
        # Task type preferences for each provider
        self.provider_preferences = {
            TaskType.CODE_GENERATION: LLMProvider.GPT,
            TaskType.CODE_ANALYSIS: LLMProvider.CLAUDE,
            TaskType.ARCHITECTURE: LLMProvider.CLAUDE,
            TaskType.REQUIREMENTS_ANALYSIS: LLMProvider.CLAUDE,
            TaskType.GENERAL: LLMProvider.AUTO
        }
    
    async def generate_response(self, 
                               prompt: str,
                               task_type: TaskType = TaskType.GENERAL,
                               provider: Optional[LLMProvider] = None,
                               system_prompt: Optional[str] = None,
                               context: Optional[Dict[str, Any]] = None) -> Optional[Union[LLMResponse, ClaudeResponse]]:
        """
        Generate response using appropriate LLM provider.
        
        Args:
            prompt: Prompt for generation
            task_type: Type of task for provider selection
            provider: Specific provider to use (overrides auto-selection)  
            system_prompt: Optional system prompt
            context: Optional context information
            
        Returns:
            LLM response or None if all attempts failed
        """
        selected_provider = provider or self._select_provider(task_type)
        
        self.logger.info(f"Generating response using {selected_provider.value} for {task_type.value}")
        
        # Try primary provider
        response = await self._try_provider(selected_provider, prompt, system_prompt, context)
        if response:
            return response
        
        # Try fallback if enabled
        if self.config.enable_fallback and provider is None:
            fallback_provider = self._get_fallback_provider(selected_provider)
            if fallback_provider:
                self.logger.info(f"Falling back to {fallback_provider.value}")
                response = await self._try_provider(fallback_provider, prompt, system_prompt, context)
                if response:
                    return response
        
        self.logger.error("All LLM providers failed to generate response")
        return None
    
    async def generate_code(self, 
                           task_description: str,
                           tech_stack: List[str],
                           existing_context: Optional[str] = None) -> Optional[str]:
        """
        Generate code using the best available LLM for code generation.
        
        Args:
            task_description: Description of code to generate
            tech_stack: Technology stack being used
            existing_context: Existing codebase context
            
        Returns:
            Generated code or None if failed
        """
        if self.gpt:
            return await self.gpt.generate_code(task_description, tech_stack, existing_context)
        elif self.claude:
            # Use Claude's general response for code generation
            system_prompt = f"""
You are a code generation agent working with tech stack: {', '.join(tech_stack)}.
Generate clean, maintainable code that follows best practices.
"""
            prompt = f"Generate code for: {task_description}"
            if existing_context:
                prompt += f"\n\nExisting context: {existing_context}"
            
            response = await self.claude.generate_response(prompt, system_prompt)
            return response.content if response else None
        
        return None
    
    async def analyze_code(self, 
                          code_snippet: str,
                          analysis_type: str = "quality") -> Optional[Dict[str, Any]]:
        """
        Analyze code using the best available LLM for analysis.
        
        Args:
            code_snippet: Code to analyze
            analysis_type: Type of analysis to perform
            
        Returns:
            Analysis results or None if failed
        """
        if self.claude:
            return await self.claude.analyze_codebase(code_snippet, analysis_type)
        elif self.gpt:
            # Use GPT for code analysis if Claude not available
            system_prompt = f"You are a code analysis agent specializing in {analysis_type} analysis."
            prompt = f"Analyze this code:\n\n{code_snippet}"
            
            response = await self.gpt.generate_response(prompt, system_prompt)
            return {"analysis": response.content} if response else None
        
        return None
    
    def _select_provider(self, task_type: TaskType) -> LLMProvider:
        """Select appropriate provider based on task type and availability."""
        preferred = self.provider_preferences.get(task_type, LLMProvider.AUTO)
        
        if preferred == LLMProvider.AUTO:
            # Auto-select based on availability
            if self.gpt and self.claude:
                return LLMProvider.GPT  # Default to GPT for auto
            elif self.gpt:
                return LLMProvider.GPT
            elif self.claude:
                return LLMProvider.CLAUDE
        elif preferred == LLMProvider.GPT and self.gpt:
            return LLMProvider.GPT
        elif preferred == LLMProvider.CLAUDE and self.claude:
            return LLMProvider.CLAUDE
        
        # Fallback to available provider
        if self.gpt:
            return LLMProvider.GPT
        elif self.claude:
            return LLMProvider.CLAUDE
        
        return LLMProvider.GPT  # Default
    
    def _get_fallback_provider(self, primary: LLMProvider) -> Optional[LLMProvider]:
        """Get fallback provider for the primary selection."""
        if primary == LLMProvider.GPT and self.claude:
            return LLMProvider.CLAUDE
        elif primary == LLMProvider.CLAUDE and self.gpt:
            return LLMProvider.GPT
        return None
    
    async def _try_provider(self, 
                           provider: LLMProvider, 
                           prompt: str,
                           system_prompt: Optional[str],
                           context: Optional[Dict[str, Any]]) -> Optional[Union[LLMResponse, ClaudeResponse]]:
        """Try generating response with specific provider."""
        try:
            if provider == LLMProvider.GPT and self.gpt:
                return await self.gpt.generate_response(prompt, system_prompt, context)
            elif provider == LLMProvider.CLAUDE and self.claude:
                return await self.claude.generate_response(prompt, system_prompt, context)
        except Exception as e:
            self.logger.error(f"Provider {provider.value} failed: {e}")
        
        return None
    
    def get_provider_status(self) -> Dict[str, Any]:
        """Get status of all configured providers."""
        return {
            "gpt_available": self.gpt is not None,
            "claude_available": self.claude is not None,
            "gpt_stats": self.gpt.get_usage_stats() if self.gpt else None,
            "claude_stats": self.claude.get_usage_stats() if self.claude else None
        }
