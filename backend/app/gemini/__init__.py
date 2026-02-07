"""
Gemini Reasoning Layer

Google Gemini is used ONLY for:
- Reasoning
- Explanation
- Summarization
- Conversational interaction

Gemini does NOT:
- Forecast demand
- Compute reorder quantities
- Tune the model
"""

from .client import GeminiClient
from .prompts import INVENTORY_ADVISOR_SYSTEM, DECISION_SUMMARY_TEMPLATE
from .explainer import DecisionExplainer

__all__ = [
    'GeminiClient',
    'DecisionExplainer',
    'INVENTORY_ADVISOR_SYSTEM',
    'DECISION_SUMMARY_TEMPLATE',
]
