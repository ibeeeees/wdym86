"""Forecast and agent decision models"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ForecastBase(BaseModel):
    forecast_date: datetime
    mu: float  # Mean demand
    k: float   # Dispersion parameter


class ForecastCreate(ForecastBase):
    pass


class Forecast(ForecastBase):
    id: str
    ingredient_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ForecastResult(BaseModel):
    """Complete forecast result with uncertainty"""
    ingredient_id: str
    ingredient_name: str
    forecasts: List[ForecastBase]
    point_forecast: float
    lower_bound: float  # 5th percentile
    upper_bound: float  # 95th percentile
    variance: float
    generated_at: datetime


class RiskAssessment(BaseModel):
    """Risk assessment from InventoryRiskAgent"""
    probability: float
    level: str  # SAFE, MONITOR, URGENT, CRITICAL
    days_of_cover: int
    factors: List[str]


class ReorderRecommendation(BaseModel):
    """Reorder recommendation from ReorderOptimizationAgent"""
    should_reorder: bool
    date: Optional[str] = None
    quantity: float
    unit: str
    urgency: str
    confidence: float
    estimated_cost: float


class StrategyRecommendation(BaseModel):
    """Strategy from SupplierStrategyAgent"""
    type: str
    description: str
    adjusted_lead_time: int
    mitigation_actions: List[str]


class AgentDecision(BaseModel):
    """Complete agent pipeline decision"""
    ingredient_id: str
    ingredient_name: str
    timestamp: datetime
    risk: RiskAssessment
    reorder: ReorderRecommendation
    strategy: StrategyRecommendation
    summary: Dict[str, Any]
    explanation: Optional[str] = None


class GeminiExplanationRequest(BaseModel):
    """Request for Gemini explanation"""
    decision_id: Optional[str] = None
    context: Dict[str, Any]


class GeminiChatRequest(BaseModel):
    """Chat message request"""
    message: str
    session_id: Optional[str] = "default"
    ingredient_id: Optional[str] = None


class GeminiChatResponse(BaseModel):
    """Chat response"""
    response: str
    session_id: str


class WhatIfRequest(BaseModel):
    """What-if analysis request"""
    scenario: str
    ingredient_id: str
