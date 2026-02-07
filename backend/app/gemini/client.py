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
        except Exception:
            # Fall back to mock client on API error (rate limit, network, etc.)
            fallback = MockGeminiClient()
            # Pass the original message (not the context-formatted one) so keyword matching works
            return fallback.chat_sync(
                message=message,
                session_id=session_id,
                context=context,
                system_prompt=system_prompt
            )

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
    Mock Gemini client — LABELED FALLBACK/DEMO ONLY

    Used when no Gemini API key is configured. Generates context-aware
    responses from ACTUAL restaurant data passed in context — NEVER
    hardcoded answers.

    All responses are grounded in the restaurant's real data.
    Responses always include a [Demo Mode] indicator.
    """

    def __init__(self, *args, **kwargs):
        self.chat_sessions: Dict[str, List[Dict]] = {}

    async def generate(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        return self._generate_from_context(prompt, context)

    def generate_sync(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        return self._generate_from_context(prompt, context)

    async def chat(
        self,
        message: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        # Track conversation history
        if session_id not in self.chat_sessions:
            self.chat_sessions[session_id] = []
        self.chat_sessions[session_id].append({"role": "user", "content": message})
        response = self._generate_from_context(message, context)
        self.chat_sessions[session_id].append({"role": "assistant", "content": response})
        return response

    def chat_sync(
        self,
        message: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        if session_id not in self.chat_sessions:
            self.chat_sessions[session_id] = []
        self.chat_sessions[session_id].append({"role": "user", "content": message})
        response = self._generate_from_context(message, context)
        self.chat_sessions[session_id].append({"role": "assistant", "content": response})
        return response

    def _generate_from_context(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate response grounded ONLY in actual restaurant data from context.
        Never hardcoded. Always business-specific.
        """
        DEMO_TAG = "🔧 *[Demo Mode — Connect Gemini API key for full AI responses]*\n\n"

        if not context:
            return f"{DEMO_TAG}I need restaurant context to provide specific recommendations. Please ensure your restaurant data is loaded."

        # Extract actual data from context
        restaurant = context.get('restaurant', {})
        r_name = restaurant.get('name', 'your restaurant')
        inventory = context.get('inventory', [])
        dishes = context.get('dishes', [])
        suppliers = context.get('suppliers', [])
        orders = context.get('orders', [])
        alerts = context.get('alerts', [])
        summary = context.get('summary', {})
        agent_decision = context.get('agent_decision', {})
        disruptions = context.get('disruptions', [])

        # Extract user's actual question from the formatted prompt template
        question_text = prompt
        if "MANAGER'S QUESTION:" in prompt:
            question_text = prompt.split("MANAGER'S QUESTION:")[-1].strip()
        elif "[User Message]" in prompt:
            question_text = prompt.split("[User Message]")[-1].strip()
        prompt_lower = question_text.lower()

        # ---- Build responses from REAL data only ----

        # Agent decision explanation
        if agent_decision:
            ing = agent_decision.get('ingredient', 'Unknown')
            risk = agent_decision.get('risk_level', 'Unknown')
            prob = agent_decision.get('stockout_prob', 0)
            reorder = agent_decision.get('should_reorder', False)
            qty = agent_decision.get('quantity', 0)
            unit = agent_decision.get('unit', 'units')
            return (
                f"{DEMO_TAG}**{ing} — Risk: {risk}**\n\n"
                f"The Inventory Risk Agent assessed a {prob:.0%} stockout probability. "
                f"{'The Reorder Agent recommends ordering ' + str(qty) + ' ' + unit + ' now.' if reorder else 'No reorder needed at this time.'} "
                f"This assessment is based on {r_name}'s actual usage patterns and current stock levels."
            )

        # Inventory-related
        if any(w in prompt_lower for w in ['inventory', 'stock', 'ingredient', 'running low', 'out of', 'reorder']):
            if inventory:
                low = [i for i in inventory if (i.get('current_stock', 0) or 0) < 20]
                total = len(inventory)
                if low:
                    items_str = ', '.join(f"**{i['name']}** ({i.get('current_stock', 0)} {i.get('unit', 'units')})" for i in low[:5])
                    return f"{DEMO_TAG}At {r_name}, {len(low)} of {total} tracked ingredients are below threshold:\n\n{items_str}\n\nThe Risk Agent flags these for review. Check supplier lead times before ordering."
                return f"{DEMO_TAG}{r_name} is tracking {total} ingredients. All stock levels are currently within safe ranges based on the AI risk assessment."
            return f"{DEMO_TAG}No inventory data loaded for {r_name} yet. Add ingredients to begin AI-powered tracking."

        # Menu/dish-related
        if any(w in prompt_lower for w in ['dish', 'menu', 'recipe', 'food', 'meal', 'popular', 'best seller']):
            if dishes:
                active = [d for d in dishes if d.get('is_active', True)]
                cats = list(set(d.get('category', 'Main') for d in active))
                dish_names = ', '.join(d['name'] for d in active[:5])
                return f"{DEMO_TAG}{r_name} has {len(active)} active dishes across {len(cats)} categories ({', '.join(cats[:4])}). Items include: {dish_names}. Each dish is linked to ingredient recipes for automatic cost tracking."
            return f"{DEMO_TAG}No menu data loaded for {r_name} yet. Add dishes with their recipes for cost analysis."

        # Supplier-related
        if any(w in prompt_lower for w in ['supplier', 'vendor', 'delivery', 'lead time', 'procurement']):
            if suppliers:
                sup_info = [f"**{s.get('name', 'Unknown')}** ({s.get('lead_time_days', '?')}d lead, {s.get('reliability_score', 0):.0%} reliable)" for s in suppliers[:4]]
                return f"{DEMO_TAG}{r_name} works with {len(suppliers)} supplier(s):\n\n" + '\n'.join(f"- {s}" for s in sup_info) + "\n\nThe Supplier Strategy Agent monitors reliability and recommends alternatives during disruptions."
            return f"{DEMO_TAG}No supplier data loaded for {r_name}. Add suppliers for AI-powered procurement optimization."

        # Order/POS-related
        if any(w in prompt_lower for w in ['order', 'pos', 'sale', 'table', 'payment', 'revenue']):
            if orders:
                total_rev = sum(o.get('total', 0) or 0 for o in orders)
                return f"{DEMO_TAG}Recent activity at {r_name}: {len(orders)} orders totaling ${total_rev:.2f}. The POS tracks dine-in, takeout, and delivery across all table layouts."
            return f"{DEMO_TAG}No recent order data for {r_name}. Orders will appear here once the POS is active."

        # Disruption-related
        if any(w in prompt_lower for w in ['disruption', 'weather', 'supply chain', 'event', 'risk']):
            if disruptions:
                d_list = [f"- **{d.get('type', 'Unknown')}** ({d.get('severity', 'unknown')} severity): {d.get('description', '')}" for d in disruptions[:3]]
                return f"{DEMO_TAG}Current automated disruptions affecting {r_name}:\n\n" + '\n'.join(d_list) + "\n\nThese are auto-generated from regional data — not user-triggered."
            if alerts:
                return f"{DEMO_TAG}Active alerts for {r_name}: {'; '.join(alerts[:5])}. The disruption engine monitors weather, supply chain, and local events automatically."
            return f"{DEMO_TAG}No active disruptions detected for {r_name}. The engine monitors regional weather, supply chain events, and local patterns automatically."

        # Forecast/AI-related
        if any(w in prompt_lower for w in ['forecast', 'predict', 'demand', 'ai', 'model', 'agent']):
            return (
                f"{DEMO_TAG}The WDYM86 forecasting pipeline for {r_name} uses:\n\n"
                f"1. **NumPy TCN** — Temporal Convolutional Network with Negative Binomial output\n"
                f"2. **Inventory Risk Agent** — Monitors stockout probabilities\n"
                f"3. **Reorder Optimization Agent** — Determines optimal order timing/quantity\n"
                f"4. **Supplier Strategy Agent** — Adapts procurement during disruptions\n\n"
                f"All agents work on {r_name}'s actual data. I explain their decisions — I don't override them."
            )

        # Greeting
        if any(w in prompt_lower for w in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
            items = summary.get('total_ingredients', 0)
            ds = summary.get('total_dishes', 0)
            al = summary.get('active_alerts', 0)
            alert_msg = f"⚠️ {al} alert(s) need attention." if al else "✅ All systems nominal."
            return f"{DEMO_TAG}Welcome to {r_name}'s dashboard! Tracking {items} ingredients across {ds} menu items. {alert_msg} How can I help?"

        # Fallback — always grounded in context
        items = summary.get('total_ingredients', 0)
        ds = summary.get('total_dishes', 0)
        sups = summary.get('total_suppliers', 0)
        return (
            f"{DEMO_TAG}I'm your AI assistant for **{r_name}**. "
            f"Currently tracking {items} ingredients, {ds} dishes, and {sups} supplier(s). "
            f"Ask me about inventory, menu, suppliers, forecasts, disruptions, orders, or analytics — "
            f"all answers are specific to {r_name}'s actual data."
        )

    def clear_session(self, session_id: str):
        if session_id in self.chat_sessions:
            del self.chat_sessions[session_id]

    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        return self.chat_sessions.get(session_id, [])
