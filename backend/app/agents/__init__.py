"""
Autonomous AI Agents Module

Three-agent pipeline for inventory intelligence:
1. InventoryRiskAgent: Detects stockout risk
2. ReorderOptimizationAgent: Optimal timing and quantity
3. SupplierStrategyAgent: Disruption adaptation

All agents have:
- Goals
- State
- Decision logic
- Actions
"""

from .base import Agent
from .inventory_risk import InventoryRiskAgent
from .reorder_opt import ReorderOptimizationAgent
from .supplier_strategy import SupplierStrategyAgent
from .orchestrator import AgentOrchestrator

__all__ = [
    'Agent',
    'InventoryRiskAgent',
    'ReorderOptimizationAgent',
    'SupplierStrategyAgent',
    'AgentOrchestrator',
]
