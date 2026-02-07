"""Gemini router - AI-powered explanations and chat"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Optional
from datetime import datetime

from ..database import (
    get_session,
    AgentDecision as AgentDecisionDB,
    Ingredient as IngredientDB,
    User as UserDB
)
from ..models.forecast import (
    GeminiExplanationRequest,
    GeminiChatRequest,
    GeminiChatResponse,
    WhatIfRequest
)
from ..gemini import DecisionExplainer, GeminiClient
from ..config import settings
from .auth import get_current_user

router = APIRouter()

# Initialize explainer (use mock if no API key)
def get_explainer() -> DecisionExplainer:
    use_mock = not settings.gemini_api_key
    return DecisionExplainer(use_mock=use_mock)


@router.post("/explain", response_model=Dict[str, Any])
async def explain_decision(
    request: GeminiExplanationRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Get Gemini explanation for an AI agent decision

    This is a key differentiator for the MLH Best Use of Gemini API track.
    Gemini explains the reasoning behind agent decisions in natural language.
    """
    explainer = get_explainer()

    # If decision_id provided, load context from database
    if request.decision_id:
        result = await db.execute(
            select(AgentDecisionDB).where(AgentDecisionDB.id == request.decision_id)
        )
        decision = result.scalar_one_or_none()
        if not decision:
            raise HTTPException(status_code=404, detail="Decision not found")

        context = decision.decision_data.get('gemini_context', decision.decision_data)
    else:
        context = request.context

    # Generate explanation
    explanation = explainer.explain_decision_sync(context)

    return {
        'decision_id': request.decision_id,
        'explanation': explanation,
        'context_summary': {
            'ingredient': context.get('ingredient', 'Unknown'),
            'risk_level': context.get('risk_level', 'Unknown'),
            'should_reorder': context.get('should_reorder', False)
        },
        'generated_at': datetime.now().isoformat()
    }


@router.post("/chat", response_model=GeminiChatResponse)
async def chat_with_advisor(
    request: GeminiChatRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Chat with the AI inventory advisor

    Provides conversational interface for managers to ask questions
    about inventory decisions, get clarifications, and understand
    the AI's reasoning.
    """
    explainer = get_explainer()

    # Build context from ingredient if provided
    context = {}
    if request.ingredient_id:
        # Get latest decision for ingredient
        result = await db.execute(
            select(AgentDecisionDB)
            .where(AgentDecisionDB.ingredient_id == request.ingredient_id)
            .order_by(AgentDecisionDB.created_at.desc())
            .limit(1)
        )
        decision = result.scalar_one_or_none()
        if decision:
            context = decision.decision_data.get('gemini_context', {})

    # Get response
    response = explainer.answer_question_sync(
        question=request.message,
        context=context,
        session_id=request.session_id
    )

    return GeminiChatResponse(
        response=response,
        session_id=request.session_id
    )


@router.post("/what-if", response_model=Dict[str, Any])
async def analyze_scenario(
    request: WhatIfRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Analyze a hypothetical scenario

    Allows managers to explore "what if" questions:
    - "What if the supplier is delayed 2 days?"
    - "What if we have a busy weekend event?"
    - "What if the weather forecast shows a storm?"
    """
    explainer = get_explainer()

    # Get current context for ingredient
    result = await db.execute(
        select(AgentDecisionDB)
        .where(AgentDecisionDB.ingredient_id == request.ingredient_id)
        .order_by(AgentDecisionDB.created_at.desc())
        .limit(1)
    )
    decision = result.scalar_one_or_none()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="No decision found for ingredient. Run agent pipeline first."
        )

    context = decision.decision_data.get('gemini_context', {})

    # Analyze scenario
    analysis = explainer.analyze_what_if_sync(
        scenario=request.scenario,
        current_context=context
    )

    return {
        'ingredient_id': request.ingredient_id,
        'scenario': request.scenario,
        'analysis': analysis,
        'current_context': {
            'risk_level': context.get('risk_level'),
            'stockout_prob': context.get('stockout_prob'),
            'days_of_cover': context.get('days_of_cover')
        },
        'analyzed_at': datetime.now().isoformat()
    }


@router.get("/daily-summary", response_model=Dict[str, Any])
async def get_daily_summary(
    restaurant_id: str = Query(..., description="Restaurant ID"),
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Get AI-generated daily inventory summary

    Provides a morning briefing for the restaurant manager
    summarizing inventory status and key action items.
    """
    explainer = get_explainer()

    # Get all ingredients and their latest decisions
    from ..database import Ingredient as IngredientDB
    result = await db.execute(
        select(IngredientDB).where(IngredientDB.restaurant_id == restaurant_id)
    )
    ingredients = result.scalars().all()

    inventory_data = []
    for ing in ingredients:
        decision_result = await db.execute(
            select(AgentDecisionDB)
            .where(AgentDecisionDB.ingredient_id == ing.id)
            .order_by(AgentDecisionDB.created_at.desc())
            .limit(1)
        )
        decision = decision_result.scalar_one_or_none()

        if decision:
            context = decision.decision_data.get('gemini_context', {})
            inventory_data.append({
                'ingredient': ing.name,
                'risk_level': context.get('risk_level', 'UNKNOWN'),
                'days_of_cover': context.get('days_of_cover', 0),
                'should_reorder': context.get('should_reorder', False)
            })

    # Generate summary (async to sync wrapper)
    import asyncio

    async def generate():
        return await explainer.generate_daily_summary(
            inventory_data=inventory_data,
            weather_summary="Normal conditions",
            traffic_summary="Normal traffic"
        )

    summary = asyncio.get_event_loop().run_until_complete(generate())

    return {
        'restaurant_id': restaurant_id,
        'date': datetime.now().strftime("%Y-%m-%d"),
        'summary': summary,
        'item_count': len(inventory_data),
        'generated_at': datetime.now().isoformat()
    }


@router.delete("/chat/{session_id}")
async def clear_chat_session(
    session_id: str,
    current_user: UserDB = Depends(get_current_user)
):
    """Clear a chat session"""
    explainer = get_explainer()
    explainer.clear_chat_session(session_id)
    return {"status": "cleared", "session_id": session_id}
