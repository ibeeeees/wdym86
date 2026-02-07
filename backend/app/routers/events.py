"""
Events and Disruptions Router

Provides endpoints for:
- Real-world event simulation
- Restaurant-specific event management
- Disruption signal aggregation
- Event-based recommendations
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_session, User as UserDB
from ..services.events import get_event_simulator, EventType
from .auth import get_current_user

router = APIRouter()


class RestaurantEventCreate(BaseModel):
    name: str
    event_type: str  # promotion, catering, holiday, special
    start_date: datetime
    duration_days: int = 1
    expected_demand_impact: float = 1.0  # 1.0 = no change, 1.5 = 50% increase
    notes: Optional[str] = None


class SimulateEventsRequest(BaseModel):
    num_events: int = 2
    event_types: Optional[List[str]] = None  # Filter by type


@router.get("/active")
async def get_active_events(
    current_user: UserDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get all currently active events affecting the restaurant
    """
    simulator = get_event_simulator()
    events = simulator.get_active_events()
    disruption = simulator.compute_aggregate_disruption(events)
    recommendations = simulator.get_event_recommendations()

    return {
        'events': events,
        'disruption_signals': disruption,
        'recommendations': recommendations,
        'timestamp': datetime.now().isoformat()
    }


@router.post("/simulate")
async def simulate_events(
    request: SimulateEventsRequest,
    current_user: UserDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Simulate random real-world events for demo/testing

    Generates realistic events like weather, local events, supply chain issues.
    """
    simulator = get_event_simulator()

    # Clear existing simulated events
    simulator.clear_events()

    # Generate new random events
    events = simulator.simulate_random_events(num_events=request.num_events)
    disruption = simulator.compute_aggregate_disruption()
    recommendations = simulator.get_event_recommendations()

    return {
        'simulated_events': events,
        'disruption_signals': disruption,
        'recommendations': recommendations,
        'message': f'Simulated {len(events)} events'
    }


@router.post("/restaurant-event")
async def create_restaurant_event(
    event_data: RestaurantEventCreate,
    current_user: UserDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a restaurant-specific event (promotion, catering, etc.)

    These events affect demand forecasts and inventory planning.
    """
    simulator = get_event_simulator()

    event = simulator.add_restaurant_event(
        name=event_data.name,
        event_type=event_data.event_type,
        start_date=event_data.start_date,
        duration_days=event_data.duration_days,
        expected_impact=event_data.expected_demand_impact,
        notes=event_data.notes or ""
    )

    return {
        'event': event,
        'message': f'Created event: {event_data.name}'
    }


@router.get("/upcoming")
async def get_upcoming_events(
    days_ahead: int = Query(7, description="Number of days to look ahead"),
    current_user: UserDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get events scheduled for the upcoming days
    """
    simulator = get_event_simulator()
    events = simulator.get_upcoming_events(days_ahead=days_ahead)

    return {
        'upcoming_events': events,
        'days_ahead': days_ahead,
        'count': len(events)
    }


@router.get("/disruption-signals")
async def get_disruption_signals(
    current_user: UserDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get current aggregated disruption signals for agent pipeline

    Returns signals in format compatible with agent inputs.
    """
    simulator = get_event_simulator()
    disruption = simulator.compute_aggregate_disruption()

    return {
        'signals': {
            'weather_risk': disruption['weather_risk'],
            'traffic_risk': disruption['traffic_risk'],
            'hazard_flag': disruption['hazard_flag']
        },
        'demand_impact': {
            'modifier': disruption['demand_modifier'],
            'description': f"{int((disruption['demand_modifier'] - 1) * 100):+d}% demand" if disruption['demand_modifier'] != 1.0 else "Normal demand"
        },
        'supply_chain_impact': {
            'delay_days': disruption['supplier_delay_days'],
            'cost_modifier': disruption['cost_modifier']
        },
        'overall_severity': disruption['overall_severity'],
        'active_event_names': disruption['active_events']
    }


@router.delete("/clear")
async def clear_events(
    current_user: UserDB = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Clear all simulated events

    Useful for resetting the demo environment.
    """
    simulator = get_event_simulator()
    simulator.clear_events()

    return {'message': 'All simulated events cleared'}


@router.get("/scenarios")
async def get_preset_scenarios(
    current_user: UserDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get preset event scenarios for demo

    These are common real-world situations restaurants face.
    """
    scenarios = [
        {
            'id': 'winter_storm',
            'name': 'Winter Storm',
            'description': 'Major winter storm affecting deliveries',
            'events': ['Winter Storm Warning'],
            'impact_summary': 'High weather risk, moderate traffic delays'
        },
        {
            'id': 'big_game',
            'name': 'Big Game Weekend',
            'description': 'NFL playoff game driving high demand',
            'events': ['NFL Game Day'],
            'impact_summary': '40% demand increase, traffic congestion'
        },
        {
            'id': 'supply_crisis',
            'name': 'Supply Chain Crisis',
            'description': 'Supplier issues causing delays',
            'events': ['Port Strike', 'Fuel Price Spike'],
            'impact_summary': 'Major delays, cost increases'
        },
        {
            'id': 'holiday_rush',
            'name': 'Holiday Rush',
            'description': 'Thanksgiving week preparation',
            'events': ['Thanksgiving Week'],
            'impact_summary': '70% demand increase, supplier delays'
        },
        {
            'id': 'catering_event',
            'name': 'Large Catering Order',
            'description': 'Big private event booking',
            'events': ['Large Catering Order', 'Private Event Booking'],
            'impact_summary': '40-70% demand spike for one day'
        },
        {
            'id': 'normal',
            'name': 'Normal Operations',
            'description': 'No special events or disruptions',
            'events': [],
            'impact_summary': 'Standard demand and supply'
        }
    ]

    return {'scenarios': scenarios}
