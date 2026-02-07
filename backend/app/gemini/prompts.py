"""
System Prompts for Gemini Integration

These prompts define how Gemini should interact with users
and explain AI-driven inventory decisions.

IMPORTANT: Gemini is used ONLY for:
- Reasoning about decisions
- Explaining agent outputs
- Summarizing complex information
- Conversational interaction

Gemini does NOT:
- Make forecasts
- Calculate quantities
- Override agent decisions
"""

# Main system prompt for inventory advisor
INVENTORY_ADVISOR_SYSTEM = """You are an AI inventory advisor for restaurant managers. You explain AI-driven inventory decisions in clear, actionable language.

IMPORTANT CONSTRAINTS:
- You do NOT make forecasts or predictions yourself
- You do NOT calculate reorder quantities
- You do NOT override the AI agents' decisions
- You ONLY explain, summarize, and reason about the decisions made by the forecasting model and agents

You receive structured data about:
- Probabilistic demand forecasts (from a custom Negative Binomial model)
- Stockout risk assessments (from the Inventory Risk Agent)
- Reorder recommendations (from the Reorder Optimization Agent)
- Supplier strategies (from the Supplier Strategy Agent)
- External disruption signals (weather, traffic, hazards)

Your role:
1. Explain WHY decisions were made in simple terms
2. Highlight the key risk factors driving the recommendation
3. Translate statistical concepts (probability, variance) into business language
4. Suggest actionable next steps the manager can take
5. Answer questions about the inventory situation conversationally

When explaining probabilities:
- "5% stockout risk" → "There's a 1 in 20 chance of running out"
- "High variance" → "Usage is unpredictable, we're being extra cautious"
- "95% service level" → "We're planning to have stock 19 out of 20 times"

Always be:
- Concise and practical
- Focused on actionable insights
- Clear about uncertainty and confidence levels
- Helpful without being alarmist"""


# Template for decision summaries
DECISION_SUMMARY_TEMPLATE = """Summarize this inventory decision for the restaurant manager:

INGREDIENT: {ingredient}
CATEGORY: {category}

RISK ASSESSMENT:
- Stockout Probability: {stockout_prob:.1%}
- Risk Level: {risk_level}
- Days of Cover: {days_of_cover} days
- Key Risk Factors: {risk_factors}

REORDER RECOMMENDATION:
- Should Reorder: {should_reorder}
- Reorder Date: {reorder_date}
- Quantity: {quantity} {unit}
- Urgency: {reorder_urgency}
- Confidence: {reorder_confidence:.0%}
- Estimated Cost: ${estimated_cost:.2f}

PROCUREMENT STRATEGY:
- Strategy Type: {strategy_type}
- Strategy Description: {strategy_description}
- Adjusted Lead Time: {lead_time} days

EXTERNAL FACTORS:
- Weather Risk: {weather_risk}
- Traffic Risk: {traffic_risk}
- Hazard Alert: {hazard_alert}

Provide a clear, 2-4 sentence executive summary that:
1. States the current risk situation
2. Recommends the specific action to take
3. Explains why this action is recommended
4. Notes any external factors affecting the decision"""


# Template for chat responses
CHAT_RESPONSE_TEMPLATE = """You are helping a restaurant manager understand their inventory situation.

CURRENT CONTEXT:
{context}

MANAGER'S QUESTION: {question}

Respond helpfully and concisely. Remember:
- Explain the AI agents' reasoning, don't override their decisions
- Use business language, not technical jargon
- Be specific about numbers and dates
- Acknowledge uncertainty where appropriate"""


# Template for what-if analysis
WHAT_IF_ANALYSIS_TEMPLATE = """Analyze how the following scenario change would affect the inventory decision:

CURRENT SITUATION:
{current_context}

HYPOTHETICAL CHANGE: {scenario}

Explain:
1. How this change would likely affect stockout risk
2. How the reorder recommendation might change
3. What the manager should consider
4. Any additional precautions to take

Be specific and practical in your analysis."""


# Template for daily summary
DAILY_SUMMARY_TEMPLATE = """Generate a morning briefing for the restaurant manager about today's inventory status.

TODAY'S DATE: {date}

INVENTORY OVERVIEW:
{inventory_summary}

URGENT ITEMS (Reorder Needed):
{urgent_items}

ITEMS TO MONITOR:
{monitor_items}

EXTERNAL CONDITIONS:
- Weather: {weather_summary}
- Traffic: {traffic_summary}
- Alerts: {alerts}

Provide a brief (3-5 sentence) executive summary focusing on:
1. Most critical action items for today
2. Items that need attention
3. Any external factors to be aware of"""


# Template for explaining risk factors
RISK_EXPLANATION_TEMPLATE = """Explain why {ingredient} is showing {risk_level} risk:

CONTRIBUTING FACTORS:
{factors}

DEMAND STATISTICS:
- Average daily usage: {avg_demand} {unit}
- Usage variability: {variability}
- Current inventory: {inventory} {unit}
- Days until stockout risk: {days_of_cover}

Explain in plain language:
1. What's causing the elevated risk
2. Why the AI agents are recommending action
3. What could happen if no action is taken
4. What the recommended action will accomplish"""


# Template for supplier recommendation explanation
SUPPLIER_EXPLANATION_TEMPLATE = """Explain the supplier strategy recommendation:

CURRENT SUPPLIER: {primary_supplier}
- Lead Time: {lead_time} days
- Reliability: {reliability:.0%}

RECOMMENDED STRATEGY: {strategy_type}
- {strategy_description}

DISRUPTION FACTORS:
{disruption_factors}

ALTERNATIVE SUPPLIERS AVAILABLE:
{alternatives}

Explain:
1. Why this strategy was recommended
2. How it protects against the identified risks
3. What the manager should do next"""


def format_context_for_chat(gemini_context: dict) -> str:
    """Format agent context for chat prompt"""
    lines = [
        f"Ingredient: {gemini_context.get('ingredient', 'Unknown')}",
        f"Current Risk: {gemini_context.get('risk_level', 'Unknown')} "
        f"({gemini_context.get('stockout_prob', 0):.0%} stockout probability)",
        f"Days of Cover: {gemini_context.get('days_of_cover', 0)}",
        f"Should Reorder: {'Yes' if gemini_context.get('should_reorder') else 'No'}",
    ]

    if gemini_context.get('should_reorder'):
        lines.append(f"Recommended Quantity: {gemini_context.get('quantity', 0)} {gemini_context.get('unit', 'units')}")
        lines.append(f"Reorder By: {gemini_context.get('reorder_date', 'As soon as possible')}")

    lines.append(f"Weather Risk: {gemini_context.get('weather_risk', 'Unknown')}")
    lines.append(f"Strategy: {gemini_context.get('strategy_type', 'Standard')}")

    return "\n".join(lines)


def format_risk_factors(factors: list) -> str:
    """Format risk factors for prompts"""
    if not factors:
        return "No significant risk factors identified"
    return "\n".join(f"- {factor}" for factor in factors)


def format_alternatives(alternatives: list) -> str:
    """Format alternative suppliers for prompts"""
    if not alternatives:
        return "No alternative suppliers available"

    lines = []
    for alt in alternatives:
        lines.append(
            f"- {alt.get('name', 'Unknown')}: "
            f"{alt.get('lead_time', '?')} day lead time, "
            f"{alt.get('reliability', 0):.0%} reliability"
        )
    return "\n".join(lines)
