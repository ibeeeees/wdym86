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

    Returns smart, context-aware responses for testing the integration.
    """

    def __init__(self, *args, **kwargs):
        self.chat_sessions = {}

    async def generate(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        return self._generate_smart_response(prompt, context)

    def generate_sync(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        return self._generate_smart_response(prompt, context)

    async def chat(
        self,
        message: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        return self._generate_smart_response(message, context)

    def chat_sync(
        self,
        message: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        return self._generate_smart_response(message, context)

    def _generate_smart_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate smart, context-aware responses based on keywords"""
        prompt_lower = prompt.lower()

        # Extract context data
        summary = context.get('summary', {}) if context else {}
        inventory = context.get('inventory', []) if context else []
        dishes = context.get('dishes', []) if context else []
        suppliers = context.get('suppliers', []) if context else []
        orders = context.get('orders', []) if context else []
        alerts = context.get('alerts', []) if context else []

        # INVENTORY & STOCK related questions
        if any(word in prompt_lower for word in ['inventory', 'stock', 'ingredient', 'running low', 'out of']):
            if inventory:
                low_stock = [i for i in inventory if i.get('current_stock', 0) < 20]
                if low_stock:
                    items = ', '.join([f"{i['name']} ({i['current_stock']} {i['unit']})" for i in low_stock[:3]])
                    return f"Based on current inventory levels, these items need attention: {items}. I recommend placing orders with your suppliers soon to avoid stockouts. The AI forecasting model predicts increased demand this week."
                return f"Your inventory looks healthy! You're tracking {len(inventory)} ingredients. All stock levels are within safe ranges. The AI risk assessment shows no urgent reorders needed."
            return "I can help you monitor inventory levels. Your system tracks ingredients with real-time stock updates and AI-powered demand forecasting to prevent stockouts."

        # DISH & MENU related questions
        if any(word in prompt_lower for word in ['dish', 'menu', 'recipe', 'food', 'meal', 'best seller', 'popular']):
            if dishes:
                active_dishes = [d for d in dishes if d.get('is_active', True)]
                categories = set(d.get('category', 'Main') for d in active_dishes)
                return f"Your menu has {len(active_dishes)} active dishes across {len(categories)} categories: {', '.join(categories)}. Popular items include Mediterranean classics like Moussaka, Lamb Souvlaki, and Grilled Branzino. Each dish is linked to its ingredient recipe for automatic inventory tracking."
            return "I can help you manage your menu. Add dishes with their recipes, and I'll automatically track ingredient usage and costs."

        # SUPPLIER related questions
        if any(word in prompt_lower for word in ['supplier', 'vendor', 'order', 'delivery', 'lead time']):
            if suppliers:
                avg_lead = sum(s.get('lead_time_days', 3) for s in suppliers) / len(suppliers)
                return f"You have {len(suppliers)} suppliers. Average lead time is {avg_lead:.1f} days. Aegean Imports has the highest reliability (94%). For urgent orders, Athens Fresh Market offers 2-day delivery. The Supplier Strategy Agent can recommend alternatives during disruptions."
            return "I can help you manage suppliers and optimize your procurement strategy. Add suppliers with their lead times and reliability scores for smart recommendations."

        # ORDER & POS related questions
        if any(word in prompt_lower for word in ['order', 'pos', 'sale', 'table', 'checkout', 'payment']):
            if orders:
                recent = orders[:5]
                total_sales = sum(o.get('total', 0) or 0 for o in recent)
                return f"Recent activity: {len(recent)} orders totaling ${total_sales:.2f}. Your POS system handles dine-in, takeout, and delivery orders. Tables can be managed with real-time status updates, and payments are processed through multiple methods including Solana Pay."
            return "The POS system handles complete order management - from table assignments to payment processing. You can track sales by shift, day, or custom date ranges."

        # DELIVERY related questions
        if any(word in prompt_lower for word in ['deliver', 'doordash', 'uber eats', 'grubhub', 'postmates']):
            return "Your restaurant is integrated with major delivery platforms: DoorDash, Uber Eats, Grubhub, Postmates, and Seamless. Orders sync automatically to your POS. Track delivery performance, manage menus per platform, and monitor commission costs all in one place."

        # PAYMENT & CRYPTO related questions
        if any(word in prompt_lower for word in ['payment', 'crypto', 'solana', 'bitcoin', 'wallet', 'sol']):
            return "WDYM86 supports multiple payment methods including traditional card/cash and cryptocurrency via Solana Pay. Generate QR codes for crypto payments, track SOL/USD conversions in real-time. Current SOL price integration helps with accurate pricing."

        # FORECAST & PREDICTION related questions
        if any(word in prompt_lower for word in ['forecast', 'predict', 'demand', 'future', 'tomorrow', 'next week']):
            return """Our AI forecasting uses a custom NumPy TCN (Temporal Convolutional Network) with Negative Binomial output. Here's how it works:

**Model Architecture:**
- Temporal Convolutional Network built from scratch in NumPy
- Dilated causal convolutions (dilation rates: 1, 2, 4)
- Negative Binomial distribution output for count data
- Adam optimizer with manual gradient computation

**Input Features:**
- Historical usage patterns (28-day lookback)
- Day-of-week encoding (Mon-Sun patterns)
- Seasonal adjustments
- Weather severity signals
- Event/promotion flags

**Output:**
- μ (mu): Expected demand
- k (dispersion): Uncertainty measure
- Probability intervals for risk assessment

The model predicts increased demand on weekends (Fri-Sat typically 25% higher) and adjusts for weather conditions."""

        # AI AGENTS related questions
        if any(word in prompt_lower for word in ['agent', 'risk agent', 'reorder agent', 'supplier agent', 'ai decision', 'why recommend']):
            return """WDYM86 uses three autonomous AI agents working in a pipeline:

**1. Inventory Risk Agent** 🎯
- Monitors stockout probability for each ingredient
- Aggregates demand forecasts over supplier lead time
- Uses Normal approximation for sum of Negative Binomial
- Classifies risk: SAFE (<5%), MONITOR (5-20%), URGENT (>20%)

**2. Reorder Optimization Agent** 📦
- Determines optimal order timing and quantity
- Considers: lead time, MOQ, shelf life, storage constraints
- Calculates safety stock: z × σ (where z = 1.65 for 95% service level)
- Balances stockout risk vs. overstocking costs

**3. Supplier Strategy Agent** 🚚
- Adapts procurement during disruptions
- Monitors weather, traffic, supplier reliability
- Recommends: earlier ordering, split shipments, alternative suppliers
- Adjusts lead time estimates based on conditions

The agents work sequentially: Risk → Reorder → Strategy, passing context to each step."""

        # RISK & ALERT related questions
        if any(word in prompt_lower for word in ['risk', 'alert', 'warning', 'urgent', 'critical']):
            if alerts:
                return f"Current alerts: {'; '.join(alerts)}. The Inventory Risk Agent continuously monitors stockout probabilities. Items are classified as SAFE (<5% risk), MONITOR (5-20%), or URGENT (>20%). Take action on urgent items first."
            return "No critical alerts at the moment. The AI Risk Agent monitors all ingredients and will flag items when stockout probability exceeds safe thresholds."

        # SUBSCRIPTION & PRICING related questions
        if any(word in prompt_lower for word in ['subscription', 'tier', 'pricing', 'plan', 'upgrade', 'feature']):
            restaurant = context.get('restaurant', {}) if context else {}
            current_tier = restaurant.get('subscription_tier', 'free')
            return f"You're on the {current_tier.upper()} tier. Upgrade options: Starter ($49/mo) adds Gemini AI Chat and 50 ingredients. Pro ($149/mo) includes Supplier Strategy Agent and 200 ingredients. Enterprise ($399/mo) offers unlimited everything with dedicated support."

        # HOW TO / HELP related questions
        if any(word in prompt_lower for word in ['how', 'help', 'what can', 'tell me about', 'explain']):
            return """I can help you with all aspects of restaurant management:

📦 **Inventory**: Track stock levels, view forecasts, manage reorders
🍽️ **Menu**: Manage dishes, recipes, and pricing
🚚 **Suppliers**: Compare vendors, track deliveries, optimize orders
💳 **POS**: Process orders, manage tables, handle payments
🛵 **Delivery**: Monitor DoorDash, Uber Eats, and other platforms
📊 **Analytics**: View sales trends, costs, and profitability
💎 **Crypto**: Accept Solana Pay for cryptocurrency payments

Just ask me anything specific!"""

        # GREETING or general questions
        if any(word in prompt_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
            total_items = summary.get('total_ingredients', 0)
            total_dishes = summary.get('total_dishes', 0)
            alert_count = summary.get('active_alerts', 0)
            return f"Hello! Welcome to your WDYM86 dashboard. Quick overview: You're tracking {total_items} ingredients across {total_dishes} menu items. {'⚠️ ' + str(alert_count) + ' alerts need attention.' if alert_count > 0 else '✅ All systems running smoothly.'} How can I help you today?"

        # DEFAULT response with context summary
        if summary:
            return f"I'm your AI assistant for Mykonos Mediterranean Restaurant. Currently tracking {summary.get('total_ingredients', 0)} ingredients, {summary.get('total_dishes', 0)} dishes, with {summary.get('total_suppliers', 0)} suppliers. Ask me about inventory, orders, suppliers, forecasts, or any other aspect of your restaurant operations!"

        return "I'm here to help with your restaurant operations. You can ask me about inventory levels, menu items, supplier recommendations, order management, delivery integrations, payment processing, or AI forecasts. What would you like to know?"

    def clear_session(self, session_id: str):
        pass

    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        return []
