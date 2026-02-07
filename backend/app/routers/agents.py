"""AI Agents router - Autonomous decision-making pipeline"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from ..database import (
    get_session,
    AgentDecision as AgentDecisionDB,
    Ingredient as IngredientDB,
    Supplier as SupplierDB,
    InventoryState as InventoryDB,
    Forecast as ForecastDB,
    User as UserDB
)
from ..models.forecast import AgentDecision, RiskAssessment, ReorderRecommendation, StrategyRecommendation
from ..agents import AgentOrchestrator
from .auth import get_current_user

router = APIRouter()


@router.post("/{ingredient_id}/run", response_model=Dict[str, Any])
async def run_agent_pipeline(
    ingredient_id: str,
    weather_risk: float = Query(default=0, ge=0, le=1, description="Weather severity 0-1"),
    traffic_risk: float = Query(default=0, ge=0, le=1, description="Traffic congestion 0-1"),
    hazard_flag: bool = Query(default=False, description="Natural hazard alert"),
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Run the full autonomous agent pipeline for an ingredient

    Pipeline:
    1. Inventory Risk Agent - Detect stockout risk
    2. Reorder Optimization Agent - Determine timing and quantity
    3. Supplier Strategy Agent - Adapt to disruptions

    This is a key differentiator for demonstrating autonomous AI agents.
    """
    # Get ingredient
    result = await db.execute(
        select(IngredientDB).where(IngredientDB.id == ingredient_id)
    )
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    # Get current inventory
    inv_result = await db.execute(
        select(InventoryDB)
        .where(InventoryDB.ingredient_id == ingredient_id)
        .order_by(InventoryDB.recorded_at.desc())
        .limit(1)
    )
    inventory = inv_result.scalar_one_or_none()
    current_inventory = inventory.quantity if inventory else 0

    # Get forecasts
    forecast_result = await db.execute(
        select(ForecastDB)
        .where(ForecastDB.ingredient_id == ingredient_id)
        .where(ForecastDB.forecast_date >= datetime.now())
        .order_by(ForecastDB.forecast_date)
        .limit(14)
    )
    forecast_records = forecast_result.scalars().all()
    forecasts = [{'mu': f.mu, 'k': f.k} for f in forecast_records]

    # If no forecasts, generate some defaults
    if not forecasts:
        import numpy as np
        for i in range(7):
            forecasts.append({'mu': 50 + np.random.uniform(-10, 10), 'k': 10})

    # Get primary supplier
    supplier_result = await db.execute(
        select(SupplierDB)
        .where(SupplierDB.restaurant_id == ingredient.restaurant_id)
        .limit(1)
    )
    supplier_record = supplier_result.scalar_one_or_none()

    supplier = {
        'name': supplier_record.name if supplier_record else 'Default Supplier',
        'lead_time': supplier_record.lead_time_days if supplier_record else 3,
        'moq': supplier_record.min_order_quantity if supplier_record else 10,
        'reliability_score': supplier_record.reliability_score if supplier_record else 0.9
    }

    # Build ingredient dict
    ingredient_dict = {
        'name': ingredient.name,
        'unit': ingredient.unit,
        'category': ingredient.category,
        'shelf_life_days': ingredient.shelf_life_days,
        'is_perishable': ingredient.is_perishable,
        'unit_cost': ingredient.unit_cost
    }

    # Disruption signals
    disruption_signals = {
        'weather_risk': weather_risk,
        'traffic_risk': traffic_risk,
        'hazard_flag': hazard_flag
    }

    # Run the agent pipeline
    orchestrator = AgentOrchestrator()
    pipeline_result = orchestrator.run_pipeline(
        ingredient=ingredient_dict,
        forecasts=forecasts,
        inventory=current_inventory,
        supplier=supplier,
        alternative_suppliers=[],
        disruption_signals=disruption_signals,
        storage_capacity=1000,
        budget=10000
    )

    # Store decision in database
    decision = AgentDecisionDB(
        ingredient_id=ingredient_id,
        decision_type='full_pipeline',
        decision_data=json.loads(json.dumps(pipeline_result, default=str))
    )
    db.add(decision)
    await db.commit()

    return pipeline_result


@router.get("/{ingredient_id}/decisions", response_model=List[Dict[str, Any]])
async def get_decisions(
    ingredient_id: str,
    limit: int = Query(default=10, ge=1, le=100),
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get decision history for an ingredient"""
    result = await db.execute(
        select(AgentDecisionDB)
        .where(AgentDecisionDB.ingredient_id == ingredient_id)
        .order_by(AgentDecisionDB.created_at.desc())
        .limit(limit)
    )
    decisions = result.scalars().all()

    return [
        {
            'id': d.id,
            'decision_type': d.decision_type,
            'decision_data': d.decision_data,
            'created_at': d.created_at
        }
        for d in decisions
    ]


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard(
    restaurant_id: str = Query(..., description="Restaurant ID"),
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Get dashboard summary for all ingredients

    Returns risk levels and recommendations for all tracked ingredients.
    """
    # Get all ingredients for restaurant
    result = await db.execute(
        select(IngredientDB).where(IngredientDB.restaurant_id == restaurant_id)
    )
    ingredients = result.scalars().all()

    dashboard = {
        'restaurant_id': restaurant_id,
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total_ingredients': len(ingredients),
            'urgent': 0,
            'monitor': 0,
            'safe': 0
        },
        'ingredients': []
    }

    for ing in ingredients:
        # Get latest decision
        decision_result = await db.execute(
            select(AgentDecisionDB)
            .where(AgentDecisionDB.ingredient_id == ing.id)
            .order_by(AgentDecisionDB.created_at.desc())
            .limit(1)
        )
        decision = decision_result.scalar_one_or_none()

        # Get inventory
        inv_result = await db.execute(
            select(InventoryDB)
            .where(InventoryDB.ingredient_id == ing.id)
            .order_by(InventoryDB.recorded_at.desc())
            .limit(1)
        )
        inv = inv_result.scalar_one_or_none()

        # Extract risk level from decision
        risk_level = 'UNKNOWN'
        if decision and decision.decision_data:
            summary = decision.decision_data.get('summary', {})
            risk_level = summary.get('risk_level', 'UNKNOWN')

        # Update summary counts
        if risk_level in ['URGENT', 'CRITICAL']:
            dashboard['summary']['urgent'] += 1
        elif risk_level == 'MONITOR':
            dashboard['summary']['monitor'] += 1
        else:
            dashboard['summary']['safe'] += 1

        dashboard['ingredients'].append({
            'id': ing.id,
            'name': ing.name,
            'category': ing.category,
            'current_inventory': inv.quantity if inv else 0,
            'unit': ing.unit,
            'risk_level': risk_level,
            'last_decision': decision.created_at if decision else None
        })

    # Sort by risk level (urgent first)
    risk_order = {'CRITICAL': 0, 'URGENT': 1, 'MONITOR': 2, 'SAFE': 3, 'UNKNOWN': 4}
    dashboard['ingredients'].sort(key=lambda x: risk_order.get(x['risk_level'], 5))

    return dashboard
