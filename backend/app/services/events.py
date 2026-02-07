"""
Real-World Event & Disruption Service

Simulates and fetches real-world events that affect restaurant inventory:
- Weather alerts
- Local events (sports, concerts, festivals)
- Restaurant-specific events (promotions, catering)
- Supply chain disruptions
- Traffic/transportation issues
- Holidays and seasonal patterns
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class EventType(str, Enum):
    WEATHER = "weather"
    LOCAL_EVENT = "local_event"
    RESTAURANT_EVENT = "restaurant_event"
    SUPPLY_CHAIN = "supply_chain"
    TRAFFIC = "traffic"
    HOLIDAY = "holiday"
    NEWS = "news"


class EventSeverity(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


# Predefined real-world event scenarios
WEATHER_EVENTS = [
    {"name": "Winter Storm Warning", "severity": "high", "impact": {"weather_risk": 0.8, "traffic_risk": 0.6}, "duration_days": 2},
    {"name": "Heavy Rain Advisory", "severity": "moderate", "impact": {"weather_risk": 0.5, "traffic_risk": 0.4}, "duration_days": 1},
    {"name": "Heat Wave", "severity": "moderate", "impact": {"weather_risk": 0.4, "demand_modifier": 0.85}, "duration_days": 3},
    {"name": "Fog Advisory", "severity": "low", "impact": {"weather_risk": 0.2, "traffic_risk": 0.3}, "duration_days": 1},
    {"name": "Hurricane Watch", "severity": "critical", "impact": {"weather_risk": 0.95, "hazard_flag": True}, "duration_days": 4},
    {"name": "Tornado Warning", "severity": "critical", "impact": {"weather_risk": 0.9, "hazard_flag": True}, "duration_days": 1},
    {"name": "Flash Flood Warning", "severity": "high", "impact": {"weather_risk": 0.7, "traffic_risk": 0.8}, "duration_days": 1},
]

LOCAL_EVENTS = [
    {"name": "NFL Game Day", "severity": "high", "impact": {"demand_modifier": 1.4, "traffic_risk": 0.5}, "duration_days": 1},
    {"name": "College Football Saturday", "severity": "moderate", "impact": {"demand_modifier": 1.25}, "duration_days": 1},
    {"name": "Marathon/Road Race", "severity": "moderate", "impact": {"traffic_risk": 0.7, "demand_modifier": 0.9}, "duration_days": 1},
    {"name": "Music Festival", "severity": "high", "impact": {"demand_modifier": 1.5, "traffic_risk": 0.4}, "duration_days": 3},
    {"name": "Convention in Town", "severity": "moderate", "impact": {"demand_modifier": 1.3}, "duration_days": 4},
    {"name": "Farmers Market Day", "severity": "low", "impact": {"demand_modifier": 1.1}, "duration_days": 1},
    {"name": "Street Fair", "severity": "moderate", "impact": {"traffic_risk": 0.5, "demand_modifier": 1.2}, "duration_days": 2},
    {"name": "Holiday Parade", "severity": "moderate", "impact": {"traffic_risk": 0.6, "demand_modifier": 1.15}, "duration_days": 1},
]

RESTAURANT_EVENTS = [
    {"name": "Valentine's Day Dinner Rush", "severity": "high", "impact": {"demand_modifier": 1.8}, "duration_days": 1},
    {"name": "Mother's Day Brunch", "severity": "high", "impact": {"demand_modifier": 1.6}, "duration_days": 1},
    {"name": "New Year's Eve Party", "severity": "critical", "impact": {"demand_modifier": 2.0}, "duration_days": 1},
    {"name": "Large Catering Order", "severity": "moderate", "impact": {"demand_modifier": 1.3}, "duration_days": 1},
    {"name": "Food Blogger Visit", "severity": "low", "impact": {"demand_modifier": 1.1}, "duration_days": 1},
    {"name": "Happy Hour Promotion", "severity": "low", "impact": {"demand_modifier": 1.15}, "duration_days": 5},
    {"name": "Prix Fixe Menu Launch", "severity": "moderate", "impact": {"demand_modifier": 1.25}, "duration_days": 7},
    {"name": "Private Event Booking", "severity": "moderate", "impact": {"demand_modifier": 1.4}, "duration_days": 1},
]

SUPPLY_CHAIN_EVENTS = [
    {"name": "Port Strike", "severity": "critical", "impact": {"supplier_delay": 7, "weather_risk": 0.3}, "duration_days": 14},
    {"name": "Supplier Truck Breakdown", "severity": "moderate", "impact": {"supplier_delay": 2}, "duration_days": 2},
    {"name": "Fuel Price Spike", "severity": "low", "impact": {"cost_modifier": 1.15}, "duration_days": 30},
    {"name": "Recall on Ingredient", "severity": "critical", "impact": {"ingredient_unavailable": True}, "duration_days": 7},
    {"name": "Supplier Out of Stock", "severity": "high", "impact": {"supplier_delay": 5}, "duration_days": 5},
    {"name": "Shipping Container Shortage", "severity": "moderate", "impact": {"supplier_delay": 3, "cost_modifier": 1.1}, "duration_days": 21},
]

HOLIDAY_EVENTS = [
    {"name": "Thanksgiving Week", "severity": "critical", "impact": {"demand_modifier": 1.7, "supplier_delay": 1}, "duration_days": 4},
    {"name": "Christmas Week", "severity": "high", "impact": {"demand_modifier": 0.6, "supplier_delay": 2}, "duration_days": 7},
    {"name": "Super Bowl Sunday", "severity": "high", "impact": {"demand_modifier": 1.5}, "duration_days": 1},
    {"name": "Cinco de Mayo", "severity": "moderate", "impact": {"demand_modifier": 1.4}, "duration_days": 1},
    {"name": "St. Patrick's Day", "severity": "moderate", "impact": {"demand_modifier": 1.35}, "duration_days": 1},
    {"name": "Fourth of July Weekend", "severity": "high", "impact": {"demand_modifier": 1.3}, "duration_days": 3},
    {"name": "Labor Day Weekend", "severity": "moderate", "impact": {"demand_modifier": 1.25}, "duration_days": 3},
]


class EventSimulator:
    """
    Simulates real-world events for disruption modeling

    Can generate:
    - Random events based on probability
    - Scheduled events (holidays, restaurant promotions)
    - Custom events (user-defined)
    """

    def __init__(self):
        self.active_events: List[Dict[str, Any]] = []
        self.scheduled_events: List[Dict[str, Any]] = []
        self.custom_events: List[Dict[str, Any]] = []

    def get_active_events(self, date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Get all currently active events"""
        date = date or datetime.now()
        active = []

        for event in self.active_events + self.scheduled_events + self.custom_events:
            start = event.get('start_date', date)
            end = event.get('end_date', start + timedelta(days=event.get('duration_days', 1)))
            if start <= date <= end:
                active.append(event)

        return active

    def simulate_random_events(self, num_events: int = 2) -> List[Dict[str, Any]]:
        """Generate random realistic events"""
        all_events = (
            WEATHER_EVENTS +
            LOCAL_EVENTS +
            RESTAURANT_EVENTS +
            SUPPLY_CHAIN_EVENTS +
            HOLIDAY_EVENTS
        )

        selected = random.sample(all_events, min(num_events, len(all_events)))

        events = []
        for event_template in selected:
            event = {
                **event_template,
                'id': f"evt-{random.randint(1000, 9999)}",
                'start_date': datetime.now(),
                'end_date': datetime.now() + timedelta(days=event_template.get('duration_days', 1)),
                'simulated': True
            }
            events.append(event)
            self.active_events.append(event)

        return events

    def add_restaurant_event(
        self,
        name: str,
        event_type: str,
        start_date: datetime,
        duration_days: int = 1,
        expected_impact: float = 1.0,
        notes: str = ""
    ) -> Dict[str, Any]:
        """Add a restaurant-specific event (promotion, catering, etc.)"""
        event = {
            'id': f"rest-{random.randint(1000, 9999)}",
            'name': name,
            'type': EventType.RESTAURANT_EVENT.value,
            'event_subtype': event_type,
            'start_date': start_date,
            'end_date': start_date + timedelta(days=duration_days),
            'duration_days': duration_days,
            'severity': 'moderate' if expected_impact < 1.3 else 'high',
            'impact': {
                'demand_modifier': expected_impact
            },
            'notes': notes,
            'user_created': True
        }
        self.custom_events.append(event)
        return event

    def compute_aggregate_disruption(
        self,
        events: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Compute aggregate disruption signals from all active events

        Returns signals compatible with agent pipeline.
        """
        events = events or self.get_active_events()

        # Aggregate impacts
        weather_risk = 0.0
        traffic_risk = 0.0
        hazard_flag = False
        demand_modifier = 1.0
        supplier_delay = 0
        cost_modifier = 1.0

        for event in events:
            impact = event.get('impact', {})

            # Max for risk factors
            weather_risk = max(weather_risk, impact.get('weather_risk', 0))
            traffic_risk = max(traffic_risk, impact.get('traffic_risk', 0))

            # OR for hazard flag
            hazard_flag = hazard_flag or impact.get('hazard_flag', False)

            # Multiply demand modifiers
            demand_modifier *= impact.get('demand_modifier', 1.0)

            # Max delay
            supplier_delay = max(supplier_delay, impact.get('supplier_delay', 0))

            # Multiply cost
            cost_modifier *= impact.get('cost_modifier', 1.0)

        return {
            'weather_risk': min(weather_risk, 1.0),
            'traffic_risk': min(traffic_risk, 1.0),
            'hazard_flag': hazard_flag,
            'demand_modifier': round(demand_modifier, 2),
            'supplier_delay_days': supplier_delay,
            'cost_modifier': round(cost_modifier, 2),
            'active_events': [e.get('name') for e in events],
            'event_count': len(events),
            'overall_severity': self._compute_severity(events)
        }

    def _compute_severity(self, events: List[Dict[str, Any]]) -> str:
        """Compute overall severity from events"""
        if not events:
            return 'none'

        severities = [e.get('severity', 'low') for e in events]

        if 'critical' in severities:
            return 'critical'
        elif 'high' in severities:
            return 'high'
        elif 'moderate' in severities:
            return 'moderate'
        return 'low'

    def get_upcoming_events(self, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """Get events scheduled for the next N days"""
        now = datetime.now()
        future = now + timedelta(days=days_ahead)

        upcoming = []
        for event in self.scheduled_events + self.custom_events:
            start = event.get('start_date', now)
            if now <= start <= future:
                upcoming.append(event)

        return sorted(upcoming, key=lambda e: e.get('start_date', now))

    def clear_events(self):
        """Clear all simulated events"""
        self.active_events = []

    def get_event_recommendations(self) -> List[str]:
        """Get AI recommendations based on current events"""
        events = self.get_active_events()
        disruption = self.compute_aggregate_disruption(events)

        recommendations = []

        if disruption['weather_risk'] > 0.5:
            recommendations.append("Consider placing orders 1-2 days earlier due to weather conditions")

        if disruption['demand_modifier'] > 1.3:
            recommendations.append(f"Increase inventory by {int((disruption['demand_modifier'] - 1) * 100)}% for expected demand surge")

        if disruption['supplier_delay_days'] > 0:
            recommendations.append(f"Account for {disruption['supplier_delay_days']}-day supplier delay in planning")

        if disruption['hazard_flag']:
            recommendations.append("CRITICAL: Natural hazard alert - verify all supply chains")

        if disruption['traffic_risk'] > 0.5:
            recommendations.append("Schedule deliveries during off-peak hours to avoid delays")

        return recommendations


# Singleton instance
_event_simulator = None

def get_event_simulator() -> EventSimulator:
    """Get or create the event simulator instance"""
    global _event_simulator
    if _event_simulator is None:
        _event_simulator = EventSimulator()
    return _event_simulator
