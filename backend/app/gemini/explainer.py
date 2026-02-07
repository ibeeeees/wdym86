"""
Decision Explainer Service

Uses Gemini to generate human-readable explanations
of AI agent decisions.

This is the main interface between the agent pipeline
and natural language explanations.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

from .client import GeminiClient, MockGeminiClient
from .prompts import (
    INVENTORY_ADVISOR_SYSTEM,
    DECISION_SUMMARY_TEMPLATE,
    CHAT_RESPONSE_TEMPLATE,
    WHAT_IF_ANALYSIS_TEMPLATE,
    DAILY_SUMMARY_TEMPLATE,
    RISK_EXPLANATION_TEMPLATE,
    format_context_for_chat,
    format_risk_factors,
    format_alternatives
)


class DecisionExplainer:
    """
    Generates explanations for AI agent decisions

    Takes structured output from the agent pipeline and
    uses Gemini to create clear, actionable explanations.
    """

    def __init__(
        self,
        client: Optional[GeminiClient] = None,
        use_mock: bool = False
    ):
        """
        Initialize the explainer

        Args:
            client: Gemini client instance
            use_mock: If True, use mock client for testing
        """
        if use_mock:
            self.client = MockGeminiClient()
        else:
            self.client = client or GeminiClient()

    async def explain_decision(
        self,
        gemini_context: Dict[str, Any]
    ) -> str:
        """
        Generate an explanation for a complete pipeline decision

        Args:
            gemini_context: Context from AgentOrchestrator.gemini_context

        Returns:
            Human-readable explanation
        """
        # Format the prompt
        prompt = DECISION_SUMMARY_TEMPLATE.format(
            ingredient=gemini_context.get('ingredient', 'Unknown'),
            category=gemini_context.get('category', 'general'),
            stockout_prob=gemini_context.get('stockout_prob', 0),
            risk_level=gemini_context.get('risk_level', 'Unknown'),
            days_of_cover=gemini_context.get('days_of_cover', 0),
            risk_factors=format_risk_factors(gemini_context.get('risk_factors', [])),
            should_reorder='Yes' if gemini_context.get('should_reorder') else 'No',
            reorder_date=gemini_context.get('reorder_date', 'N/A'),
            quantity=gemini_context.get('quantity', 0),
            unit=gemini_context.get('unit', 'units'),
            reorder_urgency=gemini_context.get('reorder_urgency', 'none'),
            reorder_confidence=gemini_context.get('reorder_confidence', 0),
            estimated_cost=gemini_context.get('estimated_cost', 0),
            strategy_type=gemini_context.get('strategy_type', 'standard'),
            strategy_description=gemini_context.get('strategy_description', ''),
            lead_time=gemini_context.get('lead_time', 0),
            weather_risk=gemini_context.get('weather_risk', 'Low'),
            traffic_risk=gemini_context.get('traffic_risk', 'Low'),
            hazard_alert='Yes' if gemini_context.get('hazard_alert') else 'No'
        )

        return await self.client.generate(
            prompt=prompt,
            system_prompt=INVENTORY_ADVISOR_SYSTEM
        )

    def explain_decision_sync(
        self,
        gemini_context: Dict[str, Any]
    ) -> str:
        """Synchronous version of explain_decision"""
        prompt = DECISION_SUMMARY_TEMPLATE.format(
            ingredient=gemini_context.get('ingredient', 'Unknown'),
            category=gemini_context.get('category', 'general'),
            stockout_prob=gemini_context.get('stockout_prob', 0),
            risk_level=gemini_context.get('risk_level', 'Unknown'),
            days_of_cover=gemini_context.get('days_of_cover', 0),
            risk_factors=format_risk_factors(gemini_context.get('risk_factors', [])),
            should_reorder='Yes' if gemini_context.get('should_reorder') else 'No',
            reorder_date=gemini_context.get('reorder_date', 'N/A'),
            quantity=gemini_context.get('quantity', 0),
            unit=gemini_context.get('unit', 'units'),
            reorder_urgency=gemini_context.get('reorder_urgency', 'none'),
            reorder_confidence=gemini_context.get('reorder_confidence', 0),
            estimated_cost=gemini_context.get('estimated_cost', 0),
            strategy_type=gemini_context.get('strategy_type', 'standard'),
            strategy_description=gemini_context.get('strategy_description', ''),
            lead_time=gemini_context.get('lead_time', 0),
            weather_risk=gemini_context.get('weather_risk', 'Low'),
            traffic_risk=gemini_context.get('traffic_risk', 'Low'),
            hazard_alert='Yes' if gemini_context.get('hazard_alert') else 'No'
        )

        return self.client.generate_sync(
            prompt=prompt,
            system_prompt=INVENTORY_ADVISOR_SYSTEM
        )

    async def answer_question(
        self,
        question: str,
        context: Dict[str, Any],
        session_id: str = "default"
    ) -> str:
        """
        Answer a manager's question about inventory

        Args:
            question: The manager's question
            context: Current inventory context
            session_id: Chat session ID for conversation continuity

        Returns:
            Conversational answer
        """
        formatted_context = format_context_for_chat(context)

        prompt = CHAT_RESPONSE_TEMPLATE.format(
            context=formatted_context,
            question=question
        )

        return await self.client.chat(
            message=prompt,
            session_id=session_id,
            context=context,
            system_prompt=INVENTORY_ADVISOR_SYSTEM
        )

    def answer_question_sync(
        self,
        question: str,
        context: Dict[str, Any],
        session_id: str = "default"
    ) -> str:
        """Synchronous version of answer_question"""
        formatted_context = format_context_for_chat(context)

        prompt = CHAT_RESPONSE_TEMPLATE.format(
            context=formatted_context,
            question=question
        )

        return self.client.chat_sync(
            message=prompt,
            session_id=session_id,
            context=context,
            system_prompt=INVENTORY_ADVISOR_SYSTEM
        )

    async def analyze_what_if(
        self,
        scenario: str,
        current_context: Dict[str, Any]
    ) -> str:
        """
        Analyze a hypothetical scenario

        Args:
            scenario: Description of the hypothetical change
            current_context: Current inventory state

        Returns:
            Analysis of how the scenario would affect decisions
        """
        prompt = WHAT_IF_ANALYSIS_TEMPLATE.format(
            current_context=format_context_for_chat(current_context),
            scenario=scenario
        )

        return await self.client.generate(
            prompt=prompt,
            context=current_context,
            system_prompt=INVENTORY_ADVISOR_SYSTEM
        )

    def analyze_what_if_sync(
        self,
        scenario: str,
        current_context: Dict[str, Any]
    ) -> str:
        """Synchronous version of analyze_what_if"""
        prompt = WHAT_IF_ANALYSIS_TEMPLATE.format(
            current_context=format_context_for_chat(current_context),
            scenario=scenario
        )

        return self.client.generate_sync(
            prompt=prompt,
            context=current_context,
            system_prompt=INVENTORY_ADVISOR_SYSTEM
        )

    async def generate_daily_summary(
        self,
        inventory_data: List[Dict[str, Any]],
        weather_summary: str = "Normal conditions",
        traffic_summary: str = "Normal traffic",
        alerts: List[str] = None
    ) -> str:
        """
        Generate a daily inventory briefing

        Args:
            inventory_data: List of ingredient status
            weather_summary: Weather conditions description
            traffic_summary: Traffic conditions description
            alerts: Any active alerts

        Returns:
            Daily briefing text
        """
        # Categorize items
        urgent = [i for i in inventory_data if i.get('risk_level') in ['URGENT', 'CRITICAL']]
        monitor = [i for i in inventory_data if i.get('risk_level') == 'MONITOR']

        # Format urgent items
        urgent_text = "\n".join([
            f"- {i.get('ingredient', 'Unknown')}: {i.get('risk_level')} - "
            f"{i.get('days_of_cover', 0)} days of cover"
            for i in urgent
        ]) if urgent else "None - all items adequately stocked"

        # Format monitor items
        monitor_text = "\n".join([
            f"- {i.get('ingredient', 'Unknown')}: {i.get('days_of_cover', 0)} days of cover"
            for i in monitor
        ]) if monitor else "None"

        # Format inventory summary
        inventory_summary = f"Total ingredients tracked: {len(inventory_data)}\n"
        inventory_summary += f"Urgent reorders needed: {len(urgent)}\n"
        inventory_summary += f"Items to monitor: {len(monitor)}"

        prompt = DAILY_SUMMARY_TEMPLATE.format(
            date=datetime.now().strftime("%A, %B %d, %Y"),
            inventory_summary=inventory_summary,
            urgent_items=urgent_text,
            monitor_items=monitor_text,
            weather_summary=weather_summary,
            traffic_summary=traffic_summary,
            alerts="\n".join(alerts) if alerts else "No active alerts"
        )

        return await self.client.generate(
            prompt=prompt,
            system_prompt=INVENTORY_ADVISOR_SYSTEM
        )

    async def explain_risk(
        self,
        ingredient_context: Dict[str, Any]
    ) -> str:
        """
        Explain why an ingredient is showing elevated risk

        Args:
            ingredient_context: Context for the specific ingredient

        Returns:
            Detailed risk explanation
        """
        # Determine variability description
        k = ingredient_context.get('k', 10)
        if k < 3:
            variability = "Very high (unpredictable demand)"
        elif k < 7:
            variability = "High"
        elif k < 15:
            variability = "Moderate"
        else:
            variability = "Low (consistent demand)"

        prompt = RISK_EXPLANATION_TEMPLATE.format(
            ingredient=ingredient_context.get('ingredient', 'Unknown'),
            risk_level=ingredient_context.get('risk_level', 'Unknown'),
            factors=format_risk_factors(ingredient_context.get('risk_factors', [])),
            avg_demand=ingredient_context.get('avg_demand', 0),
            unit=ingredient_context.get('unit', 'units'),
            variability=variability,
            inventory=ingredient_context.get('current_inventory', 0),
            days_of_cover=ingredient_context.get('days_of_cover', 0)
        )

        return await self.client.generate(
            prompt=prompt,
            system_prompt=INVENTORY_ADVISOR_SYSTEM
        )

    def clear_chat_session(self, session_id: str):
        """Clear a chat session"""
        self.client.clear_session(session_id)

    def get_chat_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get chat history for a session"""
        return self.client.get_session_history(session_id)


# Convenience function for quick explanations
def explain_pipeline_result(
    pipeline_result: Dict[str, Any],
    use_mock: bool = False
) -> str:
    """
    Quick explanation of a pipeline result

    Args:
        pipeline_result: Output from AgentOrchestrator.run_pipeline()
        use_mock: Use mock client for testing

    Returns:
        Human-readable explanation
    """
    explainer = DecisionExplainer(use_mock=use_mock)
    gemini_context = pipeline_result.get('gemini_context', {})
    return explainer.explain_decision_sync(gemini_context)
