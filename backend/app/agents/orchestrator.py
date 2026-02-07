"""
Agent Orchestrator

Coordinates the three-agent pipeline:
1. Inventory Risk Agent
2. Reorder Optimization Agent
3. Supplier Strategy Agent

Manages data flow between agents and collects results
for the Gemini explanation layer.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from .inventory_risk import InventoryRiskAgent, RiskLevel
from .reorder_opt import ReorderOptimizationAgent, ReorderUrgency
from .supplier_strategy import SupplierStrategyAgent, StrategyType


class AgentOrchestrator:
    """
    Orchestrates the autonomous agent pipeline

    Manages the flow:
    Forecast Model → Risk Agent → Reorder Agent → Strategy Agent → Gemini

    Each agent receives observations from the previous stage
    and produces outputs for the next stage.
    """

    def __init__(
        self,
        service_level: float = 0.95,
        risk_thresholds: Optional[Dict[str, float]] = None
    ):
        """
        Initialize the orchestrator

        Args:
            service_level: Target service level for inventory
            risk_thresholds: Custom risk classification thresholds
        """
        self.service_level = service_level
        self.risk_thresholds = risk_thresholds

        # Initialize agents
        self.risk_agent = InventoryRiskAgent(
            risk_thresholds=risk_thresholds,
            service_level=service_level
        )
        self.reorder_agent = ReorderOptimizationAgent(
            service_level=service_level
        )
        self.strategy_agent = SupplierStrategyAgent()

        # Pipeline state
        self.last_run = None
        self.pipeline_results = {}

    def run_pipeline(
        self,
        ingredient: Dict[str, Any],
        forecasts: List[Dict[str, float]],
        inventory: float,
        supplier: Dict[str, Any],
        alternative_suppliers: Optional[List[Dict[str, Any]]] = None,
        disruption_signals: Optional[Dict[str, Any]] = None,
        storage_capacity: float = float('inf'),
        budget: float = float('inf')
    ) -> Dict[str, Any]:
        """
        Run the complete agent pipeline

        Args:
            ingredient: Ingredient details (name, unit, category, shelf_life, etc.)
            forecasts: List of daily forecasts [{mu, k}, ...]
            inventory: Current inventory level
            supplier: Primary supplier info (name, lead_time, moq, reliability)
            alternative_suppliers: Backup supplier options
            disruption_signals: External signals (weather, traffic, hazard)
            storage_capacity: Maximum storage
            budget: Available budget

        Returns:
            Complete pipeline results with all agent outputs
        """
        self.last_run = datetime.now()

        disruption_signals = disruption_signals or {}
        alternative_suppliers = alternative_suppliers or []

        # ========================================
        # Stage 1: Inventory Risk Agent
        # ========================================
        risk_observations = {
            'ingredient_name': ingredient.get('name', 'Unknown'),
            'unit': ingredient.get('unit', 'units'),
            'forecasts': forecasts,
            'inventory': inventory,
            'lead_time': supplier.get('lead_time', 3),
            'weather_risk': disruption_signals.get('weather_risk', 0),
            'traffic_risk': disruption_signals.get('traffic_risk', 0),
            'hazard_flag': disruption_signals.get('hazard_flag', False)
        }

        risk_result = self.risk_agent.run(risk_observations)

        # ========================================
        # Stage 2: Reorder Optimization Agent
        # ========================================
        reorder_observations = {
            'risk_assessment': risk_result.get('result', {}),
            'forecasts': forecasts,
            'supplier': supplier,
            'ingredient': ingredient,
            'inventory': inventory,
            'storage_capacity': storage_capacity,
            'budget': budget
        }

        reorder_result = self.reorder_agent.run(reorder_observations)

        # ========================================
        # Stage 3: Supplier Strategy Agent
        # ========================================
        strategy_observations = {
            'reorder_recommendation': reorder_result.get('result', {}),
            'risk_assessment': risk_result.get('result', {}),
            'primary_supplier': supplier,
            'alternative_suppliers': alternative_suppliers,
            'disruption_signals': disruption_signals,
            'historical_performance': supplier.get('performance_history', {})
        }

        strategy_result = self.strategy_agent.run(strategy_observations)

        # ========================================
        # Compile Results
        # ========================================
        self.pipeline_results = {
            'timestamp': self.last_run.isoformat(),
            'ingredient': ingredient,
            'current_inventory': inventory,
            'stages': {
                'risk': risk_result,
                'reorder': reorder_result,
                'strategy': strategy_result
            },
            'summary': self._generate_summary(
                risk_result, reorder_result, strategy_result
            ),
            'gemini_context': self._build_gemini_context(
                ingredient, risk_result, reorder_result, strategy_result, disruption_signals
            )
        }

        return self.pipeline_results

    def _generate_summary(
        self,
        risk: Dict[str, Any],
        reorder: Dict[str, Any],
        strategy: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate executive summary of pipeline results"""
        risk_data = risk.get('result', {})
        reorder_data = reorder.get('result', {})
        strategy_data = strategy.get('result', {})

        # Extract key metrics
        risk_assessment = risk_data.get('risk_assessment', {})
        recommendation = reorder_data.get('recommendation', {})
        strategy_rec = strategy_data.get('strategy', {})

        return {
            'risk_level': risk_assessment.get('level', 'UNKNOWN'),
            'stockout_probability': risk_assessment.get('probability', 0),
            'days_of_cover': risk_assessment.get('days_of_cover', 0),
            'should_reorder': reorder_data.get('action') == 'reorder',
            'reorder_quantity': recommendation.get('quantity', 0),
            'reorder_urgency': recommendation.get('urgency', 'none'),
            'strategy_type': strategy_rec.get('type', 'standard'),
            'adjusted_lead_time': strategy_data.get('lead_time', {}).get('adjusted', 0),
            'overall_confidence': self._compute_overall_confidence(
                risk, reorder, strategy
            ),
            'action_items': self._compile_action_items(
                risk_data, reorder_data, strategy_data
            )
        }

    def _build_gemini_context(
        self,
        ingredient: Dict[str, Any],
        risk: Dict[str, Any],
        reorder: Dict[str, Any],
        strategy: Dict[str, Any],
        disruption: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Build context for Gemini explanation layer

        Structures all agent outputs for natural language explanation.
        """
        risk_data = risk.get('result', {})
        reorder_data = reorder.get('result', {})
        strategy_data = strategy.get('result', {})

        return {
            'ingredient': ingredient.get('name', 'Unknown'),
            'unit': ingredient.get('unit', 'units'),
            'category': ingredient.get('category', 'general'),

            # Risk assessment
            'stockout_prob': risk_data.get('risk_assessment', {}).get('probability', 0),
            'risk_level': risk_data.get('risk_assessment', {}).get('level', 'SAFE'),
            'days_of_cover': risk_data.get('risk_assessment', {}).get('days_of_cover', 0),
            'risk_factors': risk_data.get('risk_assessment', {}).get('factors', []),

            # Reorder recommendation
            'should_reorder': reorder_data.get('action') == 'reorder',
            'reorder_date': reorder_data.get('recommendation', {}).get('date'),
            'quantity': reorder_data.get('recommendation', {}).get('quantity', 0),
            'reorder_urgency': reorder_data.get('recommendation', {}).get('urgency', 'none'),
            'reorder_confidence': reorder_data.get('recommendation', {}).get('confidence', 0),

            # Cost info
            'estimated_cost': reorder_data.get('costs', {}).get('total_cost', 0),

            # Strategy
            'strategy_type': strategy_data.get('strategy', {}).get('type', 'standard'),
            'strategy_description': strategy_data.get('strategy', {}).get('description', ''),
            'lead_time': strategy_data.get('lead_time', {}).get('adjusted', 0),
            'mitigation_actions': strategy_data.get('mitigation_actions', []),

            # External factors
            'weather_risk': 'High' if disruption.get('weather_risk', 0) > 0.5 else
                          ('Moderate' if disruption.get('weather_risk', 0) > 0.2 else 'Low'),
            'traffic_risk': 'High' if disruption.get('traffic_risk', 0) > 0.5 else
                          ('Moderate' if disruption.get('traffic_risk', 0) > 0.2 else 'Low'),
            'hazard_alert': disruption.get('hazard_flag', False),

            # Supplier
            'supplier_recommendation': strategy_data.get('supplier_recommendation', {}),
            'alternative_suppliers': strategy_data.get('alternative_suppliers', [])
        }

    def _compute_overall_confidence(
        self,
        risk: Dict[str, Any],
        reorder: Dict[str, Any],
        strategy: Dict[str, Any]
    ) -> float:
        """Compute overall pipeline confidence"""
        confidences = [
            risk.get('state', {}).get('confidence', 0.5),
            reorder.get('decision', {}).get('confidence', 0.5),
            strategy.get('decision', {}).get('confidence', 0.5)
        ]
        return sum(confidences) / len(confidences)

    def _compile_action_items(
        self,
        risk: Dict[str, Any],
        reorder: Dict[str, Any],
        strategy: Dict[str, Any]
    ) -> List[str]:
        """Compile prioritized action items from all agents"""
        actions = []

        # High priority: Risk-driven actions
        risk_level = risk.get('risk_assessment', {}).get('level', 'SAFE')
        if risk_level == 'CRITICAL':
            actions.append("IMMEDIATE: Place emergency order to prevent stockout")
        elif risk_level == 'URGENT':
            actions.append("HIGH: Review and approve reorder within 24 hours")

        # Medium priority: Reorder actions
        if reorder.get('action') == 'reorder':
            qty = reorder.get('recommendation', {}).get('quantity', 0)
            date = reorder.get('recommendation', {}).get('date', 'soon')
            actions.append(f"Order {qty:.0f} units by {date}")

        # Strategy actions
        mitigation = strategy.get('mitigation_actions', [])
        actions.extend(mitigation[:2])  # Top 2 mitigation actions

        return actions

    def get_agent_states(self) -> Dict[str, Any]:
        """Get current state of all agents"""
        return {
            'risk_agent': self.risk_agent.get_explanation_context(),
            'reorder_agent': self.reorder_agent.get_explanation_context(),
            'strategy_agent': self.strategy_agent.get_explanation_context()
        }

    def reset_agents(self):
        """Reset all agents to initial state"""
        self.risk_agent.reset()
        self.reorder_agent.reset()
        self.strategy_agent.reset()
        self.pipeline_results = {}


def run_demo_pipeline() -> Dict[str, Any]:
    """
    Run a demo pipeline with synthetic data

    Useful for testing and demonstration purposes.
    """
    # Demo ingredient
    ingredient = {
        'name': 'Chicken Breast',
        'unit': 'lbs',
        'category': 'meat',
        'shelf_life_days': 5,
        'is_perishable': True,
        'unit_cost': 4.50
    }

    # Demo forecasts (7 days)
    forecasts = [
        {'mu': 45, 'k': 8},   # Day 1
        {'mu': 50, 'k': 10},  # Day 2
        {'mu': 48, 'k': 9},   # Day 3
        {'mu': 55, 'k': 7},   # Day 4: Weekend surge
        {'mu': 60, 'k': 6},   # Day 5: Weekend
        {'mu': 52, 'k': 8},   # Day 6
        {'mu': 47, 'k': 9},   # Day 7
    ]

    # Demo supplier
    supplier = {
        'name': 'Fresh Foods Co.',
        'lead_time': 3,
        'moq': 50,
        'reliability_score': 0.92
    }

    # Demo alternatives
    alternatives = [
        {'name': 'QuickSupply', 'lead_time': 2, 'reliability_score': 0.85, 'cost_factor': 1.1},
        {'name': 'BulkMeats Inc.', 'lead_time': 5, 'reliability_score': 0.95, 'cost_factor': 0.9}
    ]

    # Demo disruption (moderate weather risk)
    disruption = {
        'weather_risk': 0.4,
        'traffic_risk': 0.2,
        'hazard_flag': False
    }

    # Run pipeline
    orchestrator = AgentOrchestrator()
    results = orchestrator.run_pipeline(
        ingredient=ingredient,
        forecasts=forecasts,
        inventory=85,  # Current inventory
        supplier=supplier,
        alternative_suppliers=alternatives,
        disruption_signals=disruption,
        storage_capacity=500,
        budget=5000
    )

    return results


if __name__ == '__main__':
    # Run demo
    results = run_demo_pipeline()
    print(json.dumps(results, indent=2, default=str))
