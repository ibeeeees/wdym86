"""
Inventory Risk Agent

Goal: Detect stockout risk early

This agent monitors inventory levels against probabilistic demand
forecasts and external disruption signals to identify risk.

Observes:
- Forecast parameters (μ_t, k_t) for each day
- Current inventory level
- Supplier lead time
- Weather/traffic/hazard signals
- Service level target

Actions:
- Compute stockout probability
- Classify risk level (SAFE/MONITOR/URGENT)
- Escalate urgency under high dispersion
"""

import numpy as np
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

from .base import Agent, AgentState


class RiskLevel(str, Enum):
    """Risk classification levels"""
    SAFE = "SAFE"
    MONITOR = "MONITOR"
    URGENT = "URGENT"
    CRITICAL = "CRITICAL"


@dataclass
class RiskState(AgentState):
    """Extended state for inventory risk agent"""
    stockout_probability: float = 0.0
    days_of_cover: int = 0
    risk_level: RiskLevel = RiskLevel.SAFE
    contributing_factors: List[str] = field(default_factory=list)
    demand_forecast: Dict[str, float] = field(default_factory=dict)
    external_risks: Dict[str, float] = field(default_factory=dict)


class InventoryRiskAgent(Agent):
    """
    Autonomous agent for detecting inventory stockout risk

    Uses probabilistic forecasts to compute stockout probability
    and classify risk levels for proactive inventory management.
    """

    def __init__(
        self,
        risk_thresholds: Optional[Dict[str, float]] = None,
        service_level: float = 0.95
    ):
        """
        Initialize inventory risk agent

        Args:
            risk_thresholds: Custom thresholds for risk classification
            service_level: Target service level (default 95%)
        """
        super().__init__(
            name="InventoryRiskAgent",
            goal="Detect stockout risk early and classify urgency",
            config={
                'risk_thresholds': risk_thresholds or {
                    'safe': 0.05,      # < 5% stockout prob
                    'monitor': 0.10,   # 5-10% stockout prob
                    'urgent': 0.20,    # 10-20% stockout prob
                    # > 20% = critical
                },
                'service_level': service_level
            }
        )
        self.state = RiskState()

    def observe(self, observations: Dict[str, Any]) -> None:
        """
        Update state from observations

        Expected observations:
        - forecasts: List of {mu, k} for each forecast day
        - inventory: Current inventory level
        - lead_time: Supplier lead time in days
        - weather_risk: 0-1 weather severity
        - traffic_risk: 0-1 traffic congestion
        - hazard_flag: Boolean for natural hazards
        - ingredient_name: Name of ingredient
        - unit: Unit of measurement
        """
        self.state.observations = observations
        self.state.last_updated = datetime.now()

        # Extract and validate key observations
        forecasts = observations.get('forecasts', [])
        inventory = observations.get('inventory', 0)
        lead_time = observations.get('lead_time', 3)

        # Store demand forecast summary
        if forecasts:
            mu_total = sum(f.get('mu', 0) for f in forecasts[:lead_time])
            k_avg = np.mean([f.get('k', 10) for f in forecasts[:lead_time]])
            self.state.demand_forecast = {
                'mu_total': mu_total,
                'k_avg': k_avg,
                'forecast_days': len(forecasts)
            }

        # Store external risk factors
        self.state.external_risks = {
            'weather': observations.get('weather_risk', 0),
            'traffic': observations.get('traffic_risk', 0),
            'hazard': 1.0 if observations.get('hazard_flag', False) else 0.0
        }

        self.log_action(
            action_type='observe',
            parameters={'observation_keys': list(observations.keys())},
            result={'inventory': inventory, 'lead_time': lead_time}
        )

    def decide(self) -> Dict[str, Any]:
        """
        Analyze observations and compute risk assessment

        Decision process:
        1. Aggregate demand over lead time
        2. Compute stockout probability using normal approximation
        3. Adjust for external risk factors
        4. Classify risk level
        """
        obs = self.state.observations
        forecasts = obs.get('forecasts', [])
        inventory = obs.get('inventory', 0)
        lead_time = obs.get('lead_time', 3)

        # 1. Compute aggregate demand statistics
        mu_total, var_total = self._aggregate_demand(forecasts, lead_time)
        sigma_total = np.sqrt(var_total) if var_total > 0 else 1.0

        # 2. Compute base stockout probability
        stockout_prob = self._compute_stockout_probability(
            inventory, mu_total, sigma_total
        )

        # 3. Adjust for external factors
        risk_multiplier = self._compute_risk_multiplier()
        adjusted_prob = min(stockout_prob * risk_multiplier, 1.0)

        # 4. Compute days of cover
        daily_demand = mu_total / max(lead_time, 1)
        days_of_cover = int(inventory / daily_demand) if daily_demand > 0 else 999

        # 5. Classify risk level
        risk_level = self._classify_risk(adjusted_prob)

        # 6. Identify contributing factors
        factors = self._identify_factors(stockout_prob, adjusted_prob)

        # Update state
        self.state.stockout_probability = adjusted_prob
        self.state.days_of_cover = days_of_cover
        self.state.risk_level = risk_level
        self.state.contributing_factors = factors
        self.state.confidence = self._compute_confidence(forecasts)

        decision = {
            'stockout_probability': adjusted_prob,
            'base_probability': stockout_prob,
            'risk_level': risk_level.value,
            'days_of_cover': days_of_cover,
            'contributing_factors': factors,
            'demand_stats': {
                'mu_total': mu_total,
                'sigma_total': sigma_total,
                'lead_time': lead_time
            },
            'confidence': self.state.confidence
        }

        self.state.decisions = decision
        self.log_action(
            action_type='decide',
            parameters={'lead_time': lead_time},
            result=decision
        )

        return decision

    def act(self) -> Dict[str, Any]:
        """
        Execute risk assessment action

        Returns structured risk assessment for downstream agents
        and the Gemini explanation layer.
        """
        obs = self.state.observations
        decision = self.state.decisions

        result = {
            'ingredient': obs.get('ingredient_name', 'Unknown'),
            'unit': obs.get('unit', 'units'),
            'current_inventory': obs.get('inventory', 0),
            'risk_assessment': {
                'probability': decision.get('stockout_probability', 0),
                'level': decision.get('risk_level', 'SAFE'),
                'days_of_cover': decision.get('days_of_cover', 0),
                'factors': decision.get('contributing_factors', [])
            },
            'should_reorder': decision.get('risk_level') in ['URGENT', 'CRITICAL'],
            'urgency_score': self._compute_urgency_score(),
            'recommendation': self._generate_recommendation()
        }

        self.log_action(
            action_type='act',
            parameters={},
            result=result
        )

        return result

    def _aggregate_demand(
        self,
        forecasts: List[Dict[str, float]],
        lead_time: int
    ) -> tuple:
        """
        Aggregate demand statistics over lead time

        For NB(μ, k), assuming independence:
        μ_total = Σ μ_t
        Var_total = Σ (μ_t + μ_t²/k_t)
        """
        if not forecasts:
            return 0.0, 1.0

        days = min(lead_time, len(forecasts))
        mu_total = 0.0
        var_total = 0.0

        for i in range(days):
            mu = forecasts[i].get('mu', 0)
            k = forecasts[i].get('k', 10)
            k = max(k, 0.1)  # Prevent division by zero

            mu_total += mu
            var_total += mu + (mu ** 2) / k

        return mu_total, var_total

    def _compute_stockout_probability(
        self,
        inventory: float,
        mu: float,
        sigma: float
    ) -> float:
        """
        Compute stockout probability using normal approximation

        P(stockout) = P(Demand > Inventory)
                    = 1 - Φ((Inventory - μ) / σ)
        """
        from scipy.stats import norm

        if sigma <= 0:
            sigma = 1.0

        # Z-score
        z = (inventory - mu) / sigma

        # Probability that demand exceeds inventory
        stockout_prob = 1 - norm.cdf(z)

        return float(stockout_prob)

    def _compute_risk_multiplier(self) -> float:
        """
        Adjust stockout probability based on external factors

        Risk multipliers:
        - Weather risk: Up to 1.5x
        - Traffic risk: Up to 1.3x
        - Hazard: 2.0x
        """
        multiplier = 1.0

        weather = self.state.external_risks.get('weather', 0)
        traffic = self.state.external_risks.get('traffic', 0)
        hazard = self.state.external_risks.get('hazard', 0)

        # Weather impact (storms, extreme temperatures)
        multiplier += 0.5 * weather

        # Traffic impact (delivery delays)
        multiplier += 0.3 * traffic

        # Hazard impact (major disruption)
        if hazard > 0:
            multiplier *= 2.0

        return multiplier

    def _classify_risk(self, probability: float) -> RiskLevel:
        """Classify risk level based on stockout probability"""
        thresholds = self.config['risk_thresholds']

        if probability < thresholds['safe']:
            return RiskLevel.SAFE
        elif probability < thresholds['monitor']:
            return RiskLevel.MONITOR
        elif probability < thresholds['urgent']:
            return RiskLevel.URGENT
        else:
            return RiskLevel.CRITICAL

    def _identify_factors(
        self,
        base_prob: float,
        adjusted_prob: float
    ) -> List[str]:
        """Identify factors contributing to risk"""
        factors = []

        obs = self.state.observations

        # Low inventory
        if obs.get('inventory', 0) < self.state.demand_forecast.get('mu_total', 0):
            factors.append("Low inventory vs expected demand")

        # High variability
        k_avg = self.state.demand_forecast.get('k_avg', 10)
        if k_avg < 5:
            factors.append("High demand variability (low dispersion)")

        # External factors
        if self.state.external_risks.get('weather', 0) > 0.5:
            factors.append("Severe weather conditions")

        if self.state.external_risks.get('traffic', 0) > 0.5:
            factors.append("High traffic congestion")

        if self.state.external_risks.get('hazard', 0) > 0:
            factors.append("Natural hazard alert")

        # Risk amplification
        if adjusted_prob > base_prob * 1.2:
            factors.append("External factors amplifying risk")

        return factors

    def _compute_confidence(self, forecasts: List[Dict[str, float]]) -> float:
        """Compute confidence in the risk assessment"""
        if not forecasts:
            return 0.5

        # More forecast data = higher confidence
        data_confidence = min(len(forecasts) / 28, 1.0)

        # Lower variance = higher confidence
        k_values = [f.get('k', 10) for f in forecasts]
        avg_k = np.mean(k_values)
        variance_confidence = min(avg_k / 20, 1.0)

        return (data_confidence + variance_confidence) / 2

    def _compute_urgency_score(self) -> float:
        """Compute urgency score 0-100"""
        prob = self.state.stockout_probability
        days = self.state.days_of_cover

        # Base urgency from probability
        urgency = prob * 50

        # Adjust for days of cover
        if days <= 1:
            urgency += 40
        elif days <= 3:
            urgency += 25
        elif days <= 7:
            urgency += 10

        # External factors
        if self.state.external_risks.get('hazard', 0) > 0:
            urgency += 10

        return min(urgency, 100)

    def _generate_recommendation(self) -> str:
        """Generate human-readable recommendation"""
        level = self.state.risk_level
        days = self.state.days_of_cover
        prob = self.state.stockout_probability

        if level == RiskLevel.CRITICAL:
            return f"CRITICAL: Immediate reorder required. Only {days} days of cover remaining. {prob:.0%} stockout risk."
        elif level == RiskLevel.URGENT:
            return f"URGENT: Reorder recommended within 24 hours. {days} days of cover. {prob:.0%} stockout risk."
        elif level == RiskLevel.MONITOR:
            return f"MONITOR: Watch inventory levels. {days} days of cover. Consider reorder if conditions worsen."
        else:
            return f"SAFE: Inventory levels adequate. {days} days of cover remaining."
