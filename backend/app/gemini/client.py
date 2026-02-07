"""
Gemini API Client

Provides interface to Google Gemini for:
- Generating explanations
- Chat conversations
- What-if analysis

IMPORTANT: Gemini is used ONLY for reasoning and explanation,
NOT for forecasting or decision-making.
"""

import os
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from dataclasses import dataclass
from datetime import datetime
import json


@dataclass
class GeminiConfig:
    """Configuration for Gemini client"""
    api_key: str
    model_name: str = "gemini-2.0-flash"
    temperature: float = 0.7
    max_tokens: int = 1024
    top_p: float = 0.95


class GeminiClient:
    """
    Client for Google Gemini API

    Handles all communication with Gemini for the
    explanation and reasoning layer.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gemini-2.0-flash",
        temperature: float = 0.7
    ):
        """
        Initialize Gemini client

        Args:
            api_key: Gemini API key (or from GEMINI_API_KEY env var)
            model_name: Model to use (gemini-pro, gemini-pro-vision)
            temperature: Response creativity (0-1)
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not provided")

        self.model_name = model_name
        self.temperature = temperature

        # Configure the client
        genai.configure(api_key=self.api_key)

        # Initialize model
        self.model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=1024,
                top_p=0.95
            )
        )

        # Chat sessions (keyed by session ID)
        self.chat_sessions: Dict[str, Any] = {}

    async def generate(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate a response from Gemini

        Args:
            prompt: The user prompt
            context: Optional structured context
            system_prompt: Optional system instructions

        Returns:
            Generated text response
        """
        # Build full prompt
        full_prompt = ""

        if system_prompt:
            full_prompt += f"{system_prompt}\n\n"

        if context:
            full_prompt += f"Context:\n{json.dumps(context, indent=2, default=str)}\n\n"

        full_prompt += prompt

        try:
            response = await self.model.generate_content_async(full_prompt)
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def generate_sync(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """Synchronous version of generate"""
        full_prompt = ""

        if system_prompt:
            full_prompt += f"{system_prompt}\n\n"

        if context:
            full_prompt += f"Context:\n{json.dumps(context, indent=2, default=str)}\n\n"

        full_prompt += prompt

        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"

    async def chat(
        self,
        message: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Send a message in a chat conversation

        Maintains conversation history for the session.

        Args:
            message: User message
            session_id: Unique session identifier
            context: Optional context to include
            system_prompt: Optional system instructions

        Returns:
            Assistant response
        """
        # Get or create chat session
        if session_id not in self.chat_sessions:
            # Start new chat with system prompt
            history = []
            if system_prompt:
                history.append({
                    'role': 'user',
                    'parts': [f"[System Instructions]\n{system_prompt}"]
                })
                history.append({
                    'role': 'model',
                    'parts': ["I understand. I'll follow these instructions for our conversation about inventory management."]
                })

            self.chat_sessions[session_id] = self.model.start_chat(history=history)

        chat = self.chat_sessions[session_id]

        # Build message with context if provided
        full_message = message
        if context:
            full_message = f"[Current Context]\n{json.dumps(context, indent=2, default=str)}\n\n[User Message]\n{message}"

        try:
            response = await chat.send_message_async(full_message)
            return response.text
        except Exception as e:
            return f"Error in chat: {str(e)}"

    def chat_sync(
        self,
        message: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """Synchronous version of chat"""
        if session_id not in self.chat_sessions:
            history = []
            if system_prompt:
                history.append({
                    'role': 'user',
                    'parts': [f"[System Instructions]\n{system_prompt}"]
                })
                history.append({
                    'role': 'model',
                    'parts': ["I understand. I'll follow these instructions."]
                })

            self.chat_sessions[session_id] = self.model.start_chat(history=history)

        chat = self.chat_sessions[session_id]

        full_message = message
        if context:
            full_message = f"[Current Context]\n{json.dumps(context, indent=2, default=str)}\n\n[User Message]\n{message}"

        try:
            response = chat.send_message(full_message)
            return response.text
        except Exception as e:
            return f"Error in chat: {str(e)}"

    def clear_session(self, session_id: str):
        """Clear a chat session"""
        if session_id in self.chat_sessions:
            del self.chat_sessions[session_id]

    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get chat history for a session"""
        if session_id not in self.chat_sessions:
            return []

        chat = self.chat_sessions[session_id]
        history = []

        for msg in chat.history:
            history.append({
                'role': msg.role,
                'content': msg.parts[0].text if msg.parts else ""
            })

        return history


class MockGeminiClient:
    """
    Mock Gemini client for testing without API calls

    Returns plausible responses for testing the integration.
    """

    def __init__(self, *args, **kwargs):
        self.chat_sessions = {}

    async def generate(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        return self._generate_mock_response(prompt, context)

    def generate_sync(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        return self._generate_mock_response(prompt, context)

    async def chat(
        self,
        message: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        return self._generate_mock_response(message, context)

    def chat_sync(
        self,
        message: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        return self._generate_mock_response(message, context)

    def _generate_mock_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate a plausible mock response"""
        if context:
            ingredient = context.get('ingredient', 'this ingredient')
            risk_level = context.get('risk_level', 'moderate')
            quantity = context.get('quantity', 0)

            if 'why' in prompt.lower() or 'explain' in prompt.lower():
                return f"The {ingredient} shows {risk_level} risk because current inventory levels are lower than the expected demand over the supplier lead time. Based on the probabilistic forecast, there's a significant chance of running low before the next delivery arrives. I recommend ordering {quantity} units to maintain adequate stock levels."

            if 'what if' in prompt.lower():
                return f"If the scenario you described occurs, the stockout probability for {ingredient} would likely increase. The AI agents would recommend adjusting the safety stock levels and possibly ordering earlier than usual. Consider contacting the supplier to confirm delivery capabilities."

        return "Based on the current inventory data and forecasts, I recommend following the agent's recommendation. The decision accounts for demand variability and external risk factors."

    def clear_session(self, session_id: str):
        pass

    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        return []
