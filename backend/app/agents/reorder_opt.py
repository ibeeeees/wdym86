"""
Reorder Optimization Agent

Goal: Determine optimal reorder timing and quantity

This agent takes risk assessments and computes the best reorder
strategy considering multiple constraints and costs.

Observes:
- Risk agent output
- Supplier lead time and MOQ
- Shelf life / perishability
- Budget and storage constraints

Actions:
- Determine optimal reorder date
- Compute optimal order quantity
- Evaluate cost tradeoffs
"""

import numpy as np
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

from .base import Agent, AgentState


class ReorderUrgency(str, Enum):
    """Reorder urgency levels"""
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    IMMEDIATE = "immediate"


@dataclass
class ReorderState(AgentState):
    """Extended state for reorder optimization agent"""
    recommended_date: Optional[datetime] = None
    recommended_quantity: float = 0.0
    urgency: ReorderUrgency = ReorderUrgency.NONE
    cost_breakdown: Dict[str, float] = field(default_factory=dict)
    constraints_satisfied: Dict[str, bool] = field(default_factory=dict)


class ReorderOptimizationAgent(Agent):
    """
    Autonomous agent for optimizing reorder decisions

    Determines when and how much to order based on:
    - Probabilistic demand forecasts
    - Risk assessments
    - Supplier constraints
    - Cost optimization
    """

    def __init__(
        self,
        service_level: float = 0.95,
        holding_cost_rate: float = 0.02,  # 2% of value per day
        stockout_cost_multiplier: float = 5.0  # 5x cost of stockout vs holding
    ):
        """
        Initialize reorder optimization agent

        Args:
            service_level: Target service level (probability of no stockout)
            holding_cost_rate: Daily cost of holding inventory (% of value)
            stockout_cost_multiplier: Cost ratio of stockout vs holding
        """
        super().__init__(
            name="ReorderOptimizationAgent",
            goal="Determine optimal reorder timing and quantity",
            config={
                'service_level': service_level,
                'holding_cost_rate': holding_cost_rate,
                'stockout_cost_multiplier': stockout_cost_multiplier
            }
        )
        self.state = ReorderState()

    def observe(self, observations: Dict[str, Any]) -> None:
        """
        Update state from observations

        Expected observations:
        - risk_assessment: Output from InventoryRiskAgent
        - forecasts: Daily demand forecasts
        - supplier: Supplier information (lead_time, moq, reliability)
        - ingredient: Ingredient details (shelf_life, is_perishable, unit_cost)
        - inventory: Current inventory level
        - storage_capacity: Maximum storage capacity
        - budget: Available budget for ordering
        """
        self.state.observations = observations
        self.state.last_updated = datetime.now()

        # Validate constraints
        self.state.constraints_satisfied = self._check_constraints(observations)

        self.log_action(
            action_type='observe',
            parameters={'observation_keys': list(observations.keys())},
            result={'constraints': self.state.constraints_satisfied}
        )

    def decide(self) -> Dict[str, Any]:
        """
        Compute optimal reorder decision

        Decision process:
        1. Determine if reorder is needed
        2. Calculate optimal reorder date
        3. Calculate optimal order quantity
        4. Evaluate cost tradeoffs
        """
        obs = self.state.observations
        risk = obs.get('risk_assessment', {})
        forecasts = obs.get('forecasts', [])
        supplier = obs.get('supplier', {})
        ingredient = obs.get('ingredient', {})
        inventory = obs.get('inventory', 0)

        # 1. Check if reorder is needed
        should_reorder, urgency = self._determine_need(risk)

        if not should_reorder:
            decision = {
                'should_reorder': False,
                'urgency': ReorderUrgency.NONE.value,
                'reason': 'Inventory levels adequate'
            }
            self.state.decisions = decision
            return decision

        # 2. Calculate optimal reorder date
        lead_time = supplier.get('lead_time', 3)
        reorder_date = self._compute_reorder_date(
            risk, forecasts, inventory, lead_time
        )

        # 3. Calculate optimal order quantity
        quantity = self._compute_order_quantity(
            forecasts, inventory, lead_time, supplier, ingredient
        )

        # 4. Apply constraints
        quantity = self._apply_constraints(quantity, supplier, ingredient, obs)

        # 5. Compute cost breakdown
        cost_breakdown = self._compute_costs(quantity, ingredient, supplier)

        # 6. Compute confidence
        confidence = self._compute_confidence(risk, forecasts)

        # Update state
        self.state.recommended_date = reorder_date
        self.state.recommended_quantity = quantity
        self.state.urgency = urgency
        self.state.cost_breakdown = cost_breakdown
        self.state.confidence = confidence

        decision = {
            'should_reorder': True,
            'urgency': urgency.value,
            'reorder_date': reorder_date.isoformat() if reorder_date else None,
            'quantity': quantity,
            'cost_breakdown': cost_breakdown,
            'confidence': confidence,
            'constraints_applied': list(self.state.constraints_satisfied.keys())
        }

        self.state.decisions = decision
        self.log_action(
            action_type='decide',
            parameters={'urgency': urgency.value},
            result=decision
        )

        return decision

    def act(self) -> Dict[str, Any]:
        """
        Execute reorder optimization action

        Returns structured recommendation for downstream
        processing and Gemini explanation.
        """
        obs = self.state.observations
        decision = self.state.decisions

        if not decision.get('should_reorder', False):
            return {
                'action': 'no_reorder',
                'reason': decision.get('reason', 'Not needed'),
                'next_check': (datetime.now() + timedelta(days=1)).isoformat()
            }

        ingredient = obs.get('ingredient', {})
        supplier = obs.get('supplier', {})

        result = {
            'action': 'reorder',
            'ingredient': ingredient.get('name', 'Unknown'),
            'recommendation': {
                'date': decision.get('reorder_date'),
                'quantity': decision.get('quantity'),
                'unit': ingredient.get('unit', 'units'),
                'urgency': decision.get('urgency'),
                'confidence': decision.get('confidence')
            },
            'supplier': {
                'name': supplier.get('name', 'Default Supplier'),
                'lead_time': supplier.get('lead_time', 3),
                'expected_delivery': self._compute_delivery_date(decision)
            },
            'costs': decision.get('cost_breakdown', {}),
            'rationale': self._generate_rationale()
        }

        self.log_action(
            action_type='act',
            parameters={'quantity': decision.get('quantity')},
            result=result
        )

        return result

    def _determine_need(
        self,
        risk: Dict[str, Any]
    ) -> tuple:
        """Determine if reorder is needed and urgency level"""
        risk_level = risk.get('level', 'SAFE')
        stockout_prob = risk.get('probability', 0)
        days_of_cover = risk.get('days_of_cover', 999)

        if risk_level == 'CRITICAL':
            return True, ReorderUrgency.IMMEDIATE
        elif risk_level == 'URGENT':
            return True, ReorderUrgency.HIGH
        elif risk_level == 'MONITOR':
            # Reorder if days of cover is low
            if days_of_cover <= 7:
                return True, ReorderUrgency.MEDIUM
            return False, ReorderUrgency.LOW
        else:
            return False, ReorderUrgency.NONE

    def _compute_reorder_date(
        self,
        risk: Dict[str, Any],
        forecasts: List[Dict[str, float]],
        inventory: float,
        lead_time: int
    ) -> datetime:
        """
        Compute optimal reorder date

        Reorder should be placed so that:
        inventory + order arrives before stockout risk exceeds threshold
        """
        today = datetime.now()

        # For urgent cases, order immediately
        risk_level = risk.get('level', 'SAFE')
        if risk_level in ['CRITICAL', 'URGENT']:
            return today

        # Calculate when inventory will hit reorder point
        daily_demand = sum(f.get('mu', 0) for f in forecasts[:7]) / 7 if forecasts else 0

        if daily_demand <= 0:
            return today + timedelta(days=lead_time)

        # Reorder point = lead_time demand + safety stock
        service_level = self.config['service_level']
        from scipy.stats import norm
        z = norm.ppf(service_level)

        # Estimate variance
        var_per_day = np.mean([
            f.get('mu', 0) + f.get('mu', 0)**2 / max(f.get('k', 10), 0.1)
            for f in forecasts[:7]
        ]) if forecasts else daily_demand

        safety_stock = z * np.sqrt(var_per_day * lead_time)
        reorder_point = daily_demand * lead_time + safety_stock

        # Days until hitting reorder point
        days_until_reorder = max(0, (inventory - reorder_point) / daily_demand)

        reorder_date = today + timedelta(days=int(days_until_reorder))

        return reorder_date

    def _compute_order_quantity(
        self,
        forecasts: List[Dict[str, float]],
        inventory: float,
        lead_time: int,
        supplier: Dict[str, Any],
        ingredient: Dict[str, Any]
    ) -> float:
        """
        Compute optimal order quantity using service level approach

        Q = μ_total + z_α * σ_total - current_inventory

        Where:
        - μ_total = expected demand over lead time + review period
        - σ_total = std dev of demand over that period
        - z_α = z-score for target service level
        """
        # Planning horizon = lead time + typical review period
        planning_horizon = lead_time + 7  # Review weekly

        if not forecasts:
            # Fallback to simple calculation
            return max(supplier.get('moq', 10), 0)

        # Aggregate demand over planning horizon
        days = min(planning_horizon, len(forecasts))
        mu_total = sum(f.get('mu', 0) for f in forecasts[:days])

        var_total = sum(
            f.get('mu', 0) + f.get('mu', 0)**2 / max(f.get('k', 10), 0.1)
            for f in forecasts[:days]
        )
        sigma_total = np.sqrt(var_total)

        # Service level z-score
        from scipy.stats import norm
        z = norm.ppf(self.config['service_level'])

        # Order-up-to level
        order_up_to = mu_total + z * sigma_total

        # Order quantity
        quantity = max(0, order_up_to - inventory)

        return quantity

    def _apply_constraints(
        self,
        quantity: float,
        supplier: Dict[str, Any],
        ingredient: Dict[str, Any],
        obs: Dict[str, Any]
    ) -> float:
        """Apply business constraints to order quantity"""
        # Minimum order quantity
        moq = supplier.get('moq', 0)
        if quantity > 0 and quantity < moq:
            quantity = moq

        # Storage capacity
        storage_capacity = obs.get('storage_capacity', float('inf'))
        current = obs.get('inventory', 0)
        max_order = storage_capacity - current
        quantity = min(quantity, max_order)

        # Shelf life constraint for perishables
        if ingredient.get('is_perishable', False):
            shelf_life = ingredient.get('shelf_life_days', 7)
            forecasts = obs.get('forecasts', [])
            # Don't order more than can be used before expiry
            if forecasts:
                usage_before_expiry = sum(
                    f.get('mu', 0) for f in forecasts[:shelf_life]
                )
                quantity = min(quantity, usage_before_expiry * 1.2)  # 20% buffer

        # Budget constraint
        budget = obs.get('budget', float('inf'))
        unit_cost = ingredient.get('unit_cost', 1)
        max_affordable = budget / unit_cost
        quantity = min(quantity, max_affordable)

        # Round to reasonable units
        quantity = max(0, round(quantity, 1))

        return quantity

    def _check_constraints(self, obs: Dict[str, Any]) -> Dict[str, bool]:
        """Check which constraints are satisfied"""
        constraints = {}

        supplier = obs.get('supplier', {})
        ingredient = obs.get('ingredient', {})

        constraints['moq_available'] = supplier.get('moq', 0) > 0
        constraints['lead_time_known'] = supplier.get('lead_time', 0) > 0
        constraints['storage_available'] = obs.get('storage_capacity', float('inf')) > obs.get('inventory', 0)
        constraints['budget_available'] = obs.get('budget', float('inf')) > 0
        constraints['shelf_life_ok'] = not ingredient.get('is_perishable', False) or ingredient.get('shelf_life_days', 0) > 0

        return constraints

    def _compute_costs(
        self,
        quantity: float,
        ingredient: Dict[str, Any],
        supplier: Dict[str, Any]
    ) -> Dict[str, float]:
        """Compute cost breakdown for the order"""
        unit_cost = ingredient.get('unit_cost', 1)
        order_cost = quantity * unit_cost

        # Estimated holding cost (for planning horizon)
        holding_rate = self.config['holding_cost_rate']
        holding_cost = order_cost * holding_rate * 7  # 1 week

        # Shipping cost estimate
        shipping_cost = supplier.get('shipping_cost', 0)
        if shipping_cost == 0 and quantity > 0:
            # Estimate as % of order
            shipping_cost = order_cost * 0.05

        return {
            'order_cost': round(order_cost, 2),
            'holding_cost': round(holding_cost, 2),
            'shipping_cost': round(shipping_cost, 2),
            'total_cost': round(order_cost + holding_cost + shipping_cost, 2)
        }

    def _compute_delivery_date(self, decision: Dict[str, Any]) -> str:
        """Compute expected delivery date"""
        reorder_date_str = decision.get('reorder_date')
        if not reorder_date_str:
            return None

        reorder_date = datetime.fromisoformat(reorder_date_str)
        lead_time = self.state.observations.get('supplier', {}).get('lead_time', 3)

        delivery = reorder_date + timedelta(days=lead_time)
        return delivery.isoformat()

    def _compute_confidence(
        self,
        risk: Dict[str, Any],
        forecasts: List[Dict[str, float]]
    ) -> float:
        """Compute confidence in the recommendation"""
        # More data = higher confidence
        data_confidence = min(len(forecasts) / 28, 1.0) if forecasts else 0.5

        # Lower risk agent confidence = lower reorder confidence
        risk_confidence = risk.get('confidence', 0.5) if isinstance(risk, dict) else 0.5

        return (data_confidence + risk_confidence) / 2

    def _generate_rationale(self) -> str:
        """Generate human-readable rationale for the recommendation"""
        decision = self.state.decisions
        obs = self.state.observations

        quantity = decision.get('quantity', 0)
        urgency = decision.get('urgency', 'none')
        confidence = decision.get('confidence', 0)
        risk = obs.get('risk_assessment', {})

        parts = []

        # Urgency explanation
        if urgency == 'immediate':
            parts.append("Immediate order required due to critical stock levels.")
        elif urgency == 'high':
            parts.append("High-priority order needed to prevent stockout.")
        elif urgency == 'medium':
            parts.append("Recommended order to maintain service levels.")

        # Quantity explanation
        parts.append(f"Order quantity of {quantity:.0f} units accounts for expected demand plus safety stock.")

        # Risk factors
        factors = risk.get('factors', [])
        if factors:
            parts.append(f"Key factors: {', '.join(factors[:2])}.")

        # Confidence
        if confidence < 0.5:
            parts.append("Confidence is moderate due to limited forecast data.")

        return " ".join(parts)
