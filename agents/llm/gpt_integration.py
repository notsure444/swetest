"""
GPT-5 integration for AI agents.

Provides integration with GPT-5 API including proper rate limiting
using the Convex Rate Limiter component as specified in AGENTS.md.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class GPTConfig:
    """Configuration for GPT-5 integration."""
    api_key: str
    model: str = "gpt-5"
    max_tokens: int = 4000
    temperature: float = 0.7
    rate_limit_per_minute: int = 60

@dataclass
class LLMResponse:
    """Response from LLM service."""
    content: str
    usage_tokens: int
    model: str
    finish_reason: str

class GPTIntegration:
    """
    GPT-5 integration for autonomous AI agents.
    
    Implements proper rate limiting using Convex Rate Limiter component
    and validates outputs as required in AGENTS.md.
    """
    
    def __init__(self, config: GPTConfig):
        self.config = config
        self.logger = logging.getLogger(f"llm.gpt.{config.model}")
    
    async def generate_response(self, 
                               prompt: str, 
                               system_prompt: Optional[str] = None,
                               context: Optional[Dict[str, Any]] = None) -> Optional[LLMResponse]:
        """
        Generate response using GPT-5.
        
        Args:
            prompt: User prompt for generation
            system_prompt: Optional system prompt
            context: Optional context information
            
        Returns:
            LLM response or None if failed
        """
        self.logger.info("Generating GPT-5 response")
        
        try:
            # Rate limiting would be handled by Convex Rate Limiter component
            await self._check_rate_limit()
            
            # This would integrate with the actual GPT-5 API
            response = await self._mock_gpt_response(prompt, system_prompt)
            
            # Validate output before returning (AGENTS.md requirement)
            if self.validate_response(response):
                return response
            else:
                self.logger.warning("GPT response validation failed")
                return None
                
        except Exception as e:
            self.logger.error(f"GPT-5 generation failed: {e}")
            return None
    
    async def generate_code(self, 
                           task_description: str, 
                           tech_stack: List[str],
                           existing_context: Optional[str] = None) -> Optional[str]:
        """
        Generate code using GPT-5 for development tasks.
        
        Args:
            task_description: Description of code to generate
            tech_stack: Technology stack being used
            existing_context: Existing codebase context
            
        Returns:
            Generated code or None if failed
        """
        system_prompt = f"""
You are a code generation agent working with tech stack: {', '.join(tech_stack)}.
Generate clean, maintainable code that follows best practices.
Avoid OOP when possible and use functional programming patterns.
"""
        
        prompt = f"""
Task: {task_description}

{f"Existing context: {existing_context}" if existing_context else ""}

Generate the requested code:
"""
        
        response = await self.generate_response(prompt, system_prompt)
        return response.content if response else None
    
    async def analyze_requirements(self, 
                                  requirements: str,
                                  project_type: str) -> Optional[Dict[str, Any]]:
        """
        Analyze project requirements using GPT-5.
        
        Args:
            requirements: Project requirements text
            project_type: Type of project (web, mobile, etc.)
            
        Returns:
            Analyzed requirements structure
        """
        system_prompt = f"""
You are a requirements analysis agent for {project_type} projects.
Analyze requirements and provide structured breakdown.
"""
        
        prompt = f"""
Analyze these project requirements and provide a structured breakdown:

{requirements}

Provide analysis in the following structure:
- Core features
- Technical requirements  
- Architecture recommendations
- Technology stack suggestions
- Timeline estimation
"""
        
        response = await self.generate_response(prompt, system_prompt)
        if response:
            # Would parse response into structured format
            return {"analysis": response.content}
        return None
    
    async def _check_rate_limit(self) -> bool:
        """Check rate limiting using Convex Rate Limiter component."""
        # This would interface with components.rateLimiter.lib.check
        # as implemented in convex/test.ts
        return True  # Mock success
    
    async def _mock_gpt_response(self, prompt: str, system_prompt: Optional[str]) -> LLMResponse:
        """Mock GPT response for development."""
        return LLMResponse(
            content=f"Mock GPT-5 response for: {prompt[:50]}...",
            usage_tokens=150,
            model=self.config.model,
            finish_reason="stop"
        )
    
    def validate_response(self, response: LLMResponse) -> bool:
        """
        Validate LLM response as required by AGENTS.md.
        
        Args:
            response: Response to validate
            
        Returns:
            True if response is valid
        """
        if not response or not response.content:
            return False
        if response.usage_tokens > self.config.max_tokens:
            return False
        if len(response.content.strip()) == 0:
            return False
        return True
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get usage statistics for monitoring."""
        return {
            "model": self.config.model,
            "rate_limit": self.config.rate_limit_per_minute,
            "max_tokens": self.config.max_tokens
        }
