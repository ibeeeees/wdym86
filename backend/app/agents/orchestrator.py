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
import asyncio
from concurrent.futures import ThreadPoolExecutor

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


class ParallelAgentRunner:
    """
    Runs agent pipelines for multiple ingredients in parallel

    Uses ThreadPoolExecutor for CPU-bound agent computations.
    """

    def __init__(self, max_workers: int = 4, service_level: float = 0.95):
        self.max_workers = max_workers
        self.service_level = service_level

    def run_parallel(
        self,
        ingredients_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Run pipelines for multiple ingredients in parallel

        Args:
            ingredients_data: List of dicts, each containing:
                - ingredient: Dict with ingredient info
                - forecasts: List of forecast dicts
                - inventory: Current inventory
                - supplier: Primary supplier
                - alternative_suppliers: Optional list
                - disruption_signals: Optional dict

        Returns:
            List of pipeline results for each ingredient
        """
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = []
            for data in ingredients_data:
                future = executor.submit(self._run_single_pipeline, data)
                futures.append(future)

            results = []
            for future in futures:
                try:
                    result = future.result(timeout=30)
                    results.append(result)
                except Exception as e:
                    results.append({'error': str(e)})

        return results

    async def run_parallel_async(
        self,
        ingredients_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Async version of parallel runner"""
        loop = asyncio.get_event_loop()

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            tasks = [
                loop.run_in_executor(executor, self._run_single_pipeline, data)
                for data in ingredients_data
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        # Convert exceptions to error dicts
        return [
            r if not isinstance(r, Exception) else {'error': str(r)}
            for r in results
        ]

    def _run_single_pipeline(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single pipeline"""
        orchestrator = AgentOrchestrator(service_level=self.service_level)

        return orchestrator.run_pipeline(
            ingredient=data.get('ingredient', {}),
            forecasts=data.get('forecasts', []),
            inventory=data.get('inventory', 0),
            supplier=data.get('supplier', {}),
            alternative_suppliers=data.get('alternative_suppliers', []),
            disruption_signals=data.get('disruption_signals', {}),
            storage_capacity=data.get('storage_capacity', float('inf')),
            budget=data.get('budget', float('inf'))
        )

    def analyze_portfolio(
        self,
        results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze results across all ingredients

        Provides portfolio-level insights:
        - Overall risk distribution
        - Total reorder recommendations
        - Budget impact
        - Priority ranking
        """
        total = len(results)
        successful = [r for r in results if 'error' not in r]

        risk_counts = {'CRITICAL': 0, 'URGENT': 0, 'MONITOR': 0, 'SAFE': 0}
        total_reorder_cost = 0
        reorder_items = []

        for result in successful:
            summary = result.get('summary', {})
            risk_level = summary.get('risk_level', 'SAFE')
            risk_counts[risk_level] = risk_counts.get(risk_level, 0) + 1

            if summary.get('should_reorder'):
                reorder_items.append({
                    'ingredient': result.get('ingredient', {}).get('name'),
                    'quantity': summary.get('reorder_quantity', 0),
                    'urgency': summary.get('reorder_urgency', 'none')
                })

        # Priority ranking
        priority_order = []
        for result in successful:
            summary = result.get('summary', {})
            priority_score = self._compute_priority_score(summary)
            priority_order.append({
                'ingredient': result.get('ingredient', {}).get('name'),
                'risk_level': summary.get('risk_level'),
                'priority_score': priority_score,
                'action_items': summary.get('action_items', [])
            })

        priority_order.sort(key=lambda x: x['priority_score'], reverse=True)

        return {
            'total_ingredients': total,
            'analyzed': len(successful),
            'errors': total - len(successful),
            'risk_distribution': risk_counts,
            'reorder_recommendations': len(reorder_items),
            'reorder_items': reorder_items,
            'priority_ranking': priority_order[:10],  # Top 10
            'requires_immediate_action': risk_counts.get('CRITICAL', 0) + risk_counts.get('URGENT', 0)
        }

    def _compute_priority_score(self, summary: Dict[str, Any]) -> float:
        """Compute priority score for ranking"""
        score = 0.0

        # Risk level contribution
        risk_scores = {'CRITICAL': 100, 'URGENT': 75, 'MONITOR': 25, 'SAFE': 0}
        score += risk_scores.get(summary.get('risk_level', 'SAFE'), 0)

        # Stockout probability
        score += summary.get('stockout_probability', 0) * 50

        # Days of cover (lower = higher priority)
        days = summary.get('days_of_cover', 30)
        if days < 3:
            score += 30
        elif days < 7:
            score += 10

        # Reorder urgency
        urgency_scores = {'critical': 40, 'high': 20, 'medium': 10, 'low': 0}
        score += urgency_scores.get(summary.get('reorder_urgency', 'low'), 0)

        return score


if __name__ == '__main__':
    # Run demo
    results = run_demo_pipeline()
    print(json.dumps(results, indent=2, default=str))
