"""
Supplier Strategy Agent

Goal: Adapt procurement strategy under disruptions

This agent monitors for persistent risks and supplier issues,
recommending strategic adjustments to procurement.

Observes:
- Persistent risk patterns
- Supplier reliability scores
- Weather/traffic disruptions
- Historical delivery performance

Actions:
- Suggest earlier ordering
- Recommend split shipments
- Propose alternate suppliers
"""

import numpy as np
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

from .base import Agent, AgentState


class StrategyType(str, Enum):
    """Types of procurement strategies"""
    STANDARD = "standard"
    EARLY_ORDER = "early_order"
    SPLIT_SHIPMENT = "split_shipment"
    ALTERNATE_SUPPLIER = "alternate_supplier"
    SAFETY_STOCK_INCREASE = "safety_stock_increase"
    MULTI_SOURCE = "multi_source"


@dataclass
class StrategyState(AgentState):
    """Extended state for supplier strategy agent"""
    recommended_strategy: StrategyType = StrategyType.STANDARD
    adjusted_lead_time: int = 0
    alternative_suppliers: List[Dict[str, Any]] = field(default_factory=list)
    risk_mitigation_actions: List[str] = field(default_factory=list)


class SupplierStrategyAgent(Agent):
    """
    Autonomous agent for adapting supplier strategy

    Monitors for disruptions and recommends strategic changes
    to procurement to ensure reliable supply.
    """

    def __init__(
        self,
        lead_time_buffer: float = 0.25,  # 25% buffer on lead time
        reliability_threshold: float = 0.85,  # Minimum acceptable reliability
        disruption_threshold: float = 0.5  # Risk level triggering strategy change
    ):
        """
        Initialize supplier strategy agent

        Args:
            lead_time_buffer: Buffer to add to lead time under disruption
            reliability_threshold: Minimum supplier reliability before switching
            disruption_threshold: External risk level triggering action
        """
        super().__init__(
            name="SupplierStrategyAgent",
            goal="Adapt procurement strategy under disruptions",
            config={
                'lead_time_buffer': lead_time_buffer,
                'reliability_threshold': reliability_threshold,
                'disruption_threshold': disruption_threshold
            }
        )
        self.state = StrategyState()

    def observe(self, observations: Dict[str, Any]) -> None:
        """
        Update state from observations

        Expected observations:
        - reorder_recommendation: Output from ReorderOptimizationAgent
        - risk_assessment: Output from InventoryRiskAgent
        - primary_supplier: Primary supplier details
        - alternative_suppliers: List of backup suppliers
        - disruption_signals: Weather, traffic, hazard data
        - historical_performance: Past delivery performance data
        """
        self.state.observations = observations
        self.state.last_updated = datetime.now()

        # Identify available alternative suppliers
        self.state.alternative_suppliers = self._evaluate_alternatives(
            observations.get('alternative_suppliers', [])
        )

        self.log_action(
            action_type='observe',
            parameters={'observation_keys': list(observations.keys())},
            result={'n_alternatives': len(self.state.alternative_suppliers)}
        )

    def decide(self) -> Dict[str, Any]:
        """
        Determine optimal procurement strategy

        Decision process:
        1. Assess current disruption level
        2. Evaluate supplier reliability
        3. Determine if strategy change is needed
        4. Select optimal strategy
        """
        obs = self.state.observations
        disruption = obs.get('disruption_signals', {})
        primary_supplier = obs.get('primary_supplier', {})
        risk = obs.get('risk_assessment', {})
        reorder = obs.get('reorder_recommendation', {})

        # 1. Compute overall disruption score
        disruption_score = self._compute_disruption_score(disruption)

        # 2. Evaluate supplier reliability
        reliability = self._evaluate_reliability(
            primary_supplier,
            obs.get('historical_performance', {})
        )

        # 3. Determine if strategy change is needed
        needs_change, reasons = self._needs_strategy_change(
            disruption_score, reliability, risk
        )

        # 4. Select optimal strategy
        if needs_change:
            strategy, actions = self._select_strategy(
                disruption_score, reliability, primary_supplier
            )
        else:
            strategy = StrategyType.STANDARD
            actions = []

        # 5. Compute adjusted parameters
        adjusted_lead_time = self._compute_adjusted_lead_time(
            primary_supplier.get('lead_time', 3),
            disruption_score
        )

        # Update state
        self.state.recommended_strategy = strategy
        self.state.adjusted_lead_time = adjusted_lead_time
        self.state.risk_mitigation_actions = actions
        self.state.confidence = self._compute_confidence(disruption, reliability)

        decision = {
            'strategy': strategy.value,
            'needs_change': needs_change,
            'reasons': reasons,
            'adjusted_lead_time': adjusted_lead_time,
            'original_lead_time': primary_supplier.get('lead_time', 3),
            'disruption_score': disruption_score,
            'reliability_score': reliability,
            'mitigation_actions': actions,
            'confidence': self.state.confidence
        }

        self.state.decisions = decision
        self.log_action(
            action_type='decide',
            parameters={'disruption_score': disruption_score},
            result=decision
        )

        return decision

    def act(self) -> Dict[str, Any]:
        """
        Execute strategy recommendation

        Returns structured strategy for implementation
        and Gemini explanation.
        """
        obs = self.state.observations
        decision = self.state.decisions
        primary_supplier = obs.get('primary_supplier', {})

        result = {
            'strategy': {
                'type': decision.get('strategy'),
                'description': self._get_strategy_description(decision.get('strategy')),
                'confidence': decision.get('confidence')
            },
            'lead_time': {
                'original': decision.get('original_lead_time'),
                'adjusted': decision.get('adjusted_lead_time'),
                'buffer_days': decision.get('adjusted_lead_time', 0) - decision.get('original_lead_time', 0)
            },
            'supplier_recommendation': self._generate_supplier_recommendation(decision),
            'mitigation_actions': decision.get('mitigation_actions', []),
            'risk_factors': decision.get('reasons', []),
            'alternative_suppliers': self._format_alternatives()
        }

        self.log_action(
            action_type='act',
            parameters={'strategy': decision.get('strategy')},
            result=result
        )

        return result

    def _compute_disruption_score(self, disruption: Dict[str, Any]) -> float:
        """
        Compute overall disruption score from signals

        Combines weather, traffic, and hazard signals into
        a single 0-1 disruption score.
        """
        weather = disruption.get('weather_risk', 0)
        traffic = disruption.get('traffic_risk', 0)
        hazard = 1.0 if disruption.get('hazard_flag', False) else 0.0

        # Weighted combination
        score = (
            0.35 * weather +
            0.25 * traffic +
            0.40 * hazard  # Hazards have highest weight
        )

        # Amplify if multiple factors present
        n_factors = sum([weather > 0.3, traffic > 0.3, hazard > 0])
        if n_factors >= 2:
            score = min(score * 1.3, 1.0)

        return score

    def _evaluate_reliability(
        self,
        supplier: Dict[str, Any],
        history: Dict[str, Any]
    ) -> float:
        """
        Evaluate supplier reliability based on history

        Reliability = on-time deliveries / total deliveries
        """
        # Use stored reliability if available
        stored_reliability = supplier.get('reliability_score', None)
        if stored_reliability is not None:
            return stored_reliability

        # Compute from history if available
        on_time = history.get('on_time_deliveries', 0)
        total = history.get('total_deliveries', 0)

        if total > 0:
            return on_time / total

        # Default to 90% if no data
        return 0.90

    def _needs_strategy_change(
        self,
        disruption: float,
        reliability: float,
        risk: Dict[str, Any]
    ) -> tuple:
        """Determine if procurement strategy needs to change"""
        reasons = []

        # Check disruption level
        if disruption > self.config['disruption_threshold']:
            reasons.append(f"High disruption score ({disruption:.0%})")

        # Check supplier reliability
        if reliability < self.config['reliability_threshold']:
            reasons.append(f"Low supplier reliability ({reliability:.0%})")

        # Check risk level
        risk_level = risk.get('level', 'SAFE')
        if risk_level in ['URGENT', 'CRITICAL']:
            reasons.append(f"Elevated inventory risk ({risk_level})")

        # Check for persistent patterns
        factors = risk.get('factors', [])
        if any('weather' in f.lower() for f in factors):
            reasons.append("Weather-related supply risk")
        if any('traffic' in f.lower() for f in factors):
            reasons.append("Transportation disruptions")

        return len(reasons) > 0, reasons

    def _select_strategy(
        self,
        disruption: float,
        reliability: float,
        supplier: Dict[str, Any]
    ) -> tuple:
        """Select optimal procurement strategy"""
        actions = []

        # Critical disruption - multi-source
        if disruption > 0.8:
            return StrategyType.MULTI_SOURCE, [
                "Source from multiple suppliers simultaneously",
                "Increase safety stock by 50%",
                "Expedite current orders if possible"
            ]

        # Low reliability - switch supplier
        if reliability < 0.7 and self.state.alternative_suppliers:
            return StrategyType.ALTERNATE_SUPPLIER, [
                f"Switch to backup supplier: {self.state.alternative_suppliers[0].get('name', 'Backup')}",
                "Monitor primary supplier performance",
                "Negotiate reliability improvements"
            ]

        # Moderate disruption - split shipments
        if disruption > 0.5:
            return StrategyType.SPLIT_SHIPMENT, [
                "Split order into multiple smaller shipments",
                "Stagger delivery dates to reduce single-point risk",
                "Consider expedited shipping for critical items"
            ]

        # Lower disruption - just order earlier
        if disruption > 0.3 or reliability < 0.85:
            return StrategyType.EARLY_ORDER, [
                "Place orders earlier than usual",
                f"Add {int(self.config['lead_time_buffer'] * 100)}% buffer to lead time",
                "Monitor disruption signals closely"
            ]

        # Marginal issues - increase safety stock
        return StrategyType.SAFETY_STOCK_INCREASE, [
            "Increase safety stock levels",
            "More frequent inventory monitoring",
            "Prepare contingency sourcing options"
        ]

    def _evaluate_alternatives(
        self,
        alternatives: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Evaluate and rank alternative suppliers"""
        if not alternatives:
            return []

        # Score each alternative
        scored = []
        for alt in alternatives:
            score = self._score_supplier(alt)
            scored.append({**alt, 'score': score})

        # Sort by score (higher is better)
        scored.sort(key=lambda x: x['score'], reverse=True)

        return scored

    def _score_supplier(self, supplier: Dict[str, Any]) -> float:
        """Score a supplier based on multiple factors"""
        reliability = supplier.get('reliability_score', 0.8)
        lead_time = supplier.get('lead_time', 5)
        cost_factor = supplier.get('cost_factor', 1.0)  # 1.0 = same as primary

        # Normalize factors (higher is better)
        reliability_score = reliability
        lead_time_score = 1 / (1 + lead_time / 10)  # Shorter is better
        cost_score = 1 / cost_factor  # Lower cost is better

        # Weighted combination
        return (
            0.5 * reliability_score +
            0.3 * lead_time_score +
            0.2 * cost_score
        )

    def _compute_adjusted_lead_time(
        self,
        base_lead_time: int,
        disruption: float
    ) -> int:
        """Compute adjusted lead time accounting for disruptions"""
        if disruption <= 0.1:
            return base_lead_time

        # Add buffer based on disruption level
        buffer_factor = self.config['lead_time_buffer']
        buffer_days = int(np.ceil(base_lead_time * buffer_factor * disruption * 2))

        return base_lead_time + buffer_days

    def _compute_confidence(
        self,
        disruption: Dict[str, Any],
        reliability: float
    ) -> float:
        """Compute confidence in strategy recommendation"""
        # More data = higher confidence
        has_weather = 'weather_risk' in disruption
        has_traffic = 'traffic_risk' in disruption
        has_hazard = 'hazard_flag' in disruption

        data_confidence = (has_weather + has_traffic + has_hazard) / 3

        # Higher reliability = higher confidence
        reliability_confidence = reliability

        return (data_confidence + reliability_confidence) / 2

    def _get_strategy_description(self, strategy: str) -> str:
        """Get human-readable strategy description"""
        descriptions = {
            'standard': "Maintain standard ordering procedures",
            'early_order': "Place orders earlier to buffer against delays",
            'split_shipment': "Split orders into multiple smaller shipments",
            'alternate_supplier': "Switch to backup supplier",
            'safety_stock_increase': "Increase safety stock levels",
            'multi_source': "Source from multiple suppliers simultaneously"
        }
        return descriptions.get(strategy, "Unknown strategy")

    def _generate_supplier_recommendation(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        """Generate supplier-specific recommendation"""
        strategy = decision.get('strategy')
        obs = self.state.observations
        primary = obs.get('primary_supplier', {})

        if strategy == 'alternate_supplier' and self.state.alternative_suppliers:
            alt = self.state.alternative_suppliers[0]
            return {
                'action': 'switch',
                'from': primary.get('name', 'Primary'),
                'to': alt.get('name', 'Alternative'),
                'reason': 'Higher reliability during disruption period'
            }
        elif strategy == 'multi_source':
            return {
                'action': 'multi_source',
                'suppliers': [primary.get('name', 'Primary')] +
                           [s.get('name', f'Alt{i}') for i, s in enumerate(self.state.alternative_suppliers[:2])],
                'allocation': 'Split order 50/25/25'
            }
        else:
            return {
                'action': 'continue',
                'supplier': primary.get('name', 'Primary'),
                'adjustments': decision.get('mitigation_actions', [])[:2]
            }

    def _format_alternatives(self) -> List[Dict[str, Any]]:
        """Format alternative suppliers for output"""
        return [
            {
                'name': s.get('name', 'Unknown'),
                'lead_time': s.get('lead_time', 0),
                'reliability': s.get('reliability_score', 0),
                'score': s.get('score', 0)
            }
            for s in self.state.alternative_suppliers[:3]
        ]
