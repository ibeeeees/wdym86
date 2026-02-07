"""
Base Agent Class

All autonomous agents inherit from this base class.
Each agent has:
- Goal: What the agent is trying to achieve
- State: Current internal state
- Decision logic: How the agent makes decisions
- Actions: What the agent can do
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Any, Optional
from enum import Enum
import uuid


class AgentStatus(str, Enum):
    """Agent execution status"""
    IDLE = "idle"
    OBSERVING = "observing"
    DECIDING = "deciding"
    ACTING = "acting"
    COMPLETED = "completed"
    ERROR = "error"


@dataclass
class AgentAction:
    """Record of an action taken by an agent"""
    action_id: str
    action_type: str
    parameters: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    timestamp: datetime = field(default_factory=datetime.now)
    success: bool = True
    error_message: Optional[str] = None


@dataclass
class AgentState:
    """Base state class for agents"""
    observations: Dict[str, Any] = field(default_factory=dict)
    decisions: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 0.0
    last_updated: datetime = field(default_factory=datetime.now)


class Agent(ABC):
    """
    Abstract base class for autonomous agents

    Agents follow a simple observe-decide-act loop:
    1. Observe: Gather information from the environment
    2. Decide: Analyze observations and determine actions
    3. Act: Execute decisions and record results

    Subclasses must implement:
    - observe(): Update state from observations
    - decide(): Make decisions based on state
    - act(): Execute decisions
    """

    def __init__(
        self,
        name: str,
        goal: str,
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize agent

        Args:
            name: Agent identifier
            goal: Description of what the agent is trying to achieve
            config: Optional configuration parameters
        """
        self.agent_id = str(uuid.uuid4())[:8]
        self.name = name
        self.goal = goal
        self.config = config or {}

        # State
        self.state = AgentState()
        self.status = AgentStatus.IDLE

        # Action log for audit trail
        self.action_log: List[AgentAction] = []

        # Timestamps
        self.created_at = datetime.now()
        self.last_run = None

    @abstractmethod
    def observe(self, observations: Dict[str, Any]) -> None:
        """
        Update internal state from observations

        Args:
            observations: Dictionary of observation data
        """
        pass

    @abstractmethod
    def decide(self) -> Dict[str, Any]:
        """
        Make decision based on current state

        Returns:
            Decision dictionary with action recommendations
        """
        pass

    @abstractmethod
    def act(self) -> Dict[str, Any]:
        """
        Execute action and return result

        Returns:
            Action result dictionary
        """
        pass

    def run(self, observations: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute full agent loop: observe → decide → act

        Args:
            observations: Input observations

        Returns:
            Complete result including state, decision, and action
        """
        self.last_run = datetime.now()

        try:
            # Observe
            self.status = AgentStatus.OBSERVING
            self.observe(observations)

            # Decide
            self.status = AgentStatus.DECIDING
            decision = self.decide()

            # Act
            self.status = AgentStatus.ACTING
            result = self.act()

            self.status = AgentStatus.COMPLETED

            return {
                'agent_id': self.agent_id,
                'agent_name': self.name,
                'goal': self.goal,
                'status': self.status.value,
                'state': self._serialize_state(),
                'decision': decision,
                'result': result,
                'timestamp': self.last_run.isoformat()
            }

        except Exception as e:
            self.status = AgentStatus.ERROR
            return {
                'agent_id': self.agent_id,
                'agent_name': self.name,
                'status': self.status.value,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def log_action(
        self,
        action_type: str,
        parameters: Dict[str, Any],
        result: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> AgentAction:
        """Record an action to the audit log"""
        action = AgentAction(
            action_id=str(uuid.uuid4())[:8],
            action_type=action_type,
            parameters=parameters,
            result=result,
            success=success,
            error_message=error_message
        )
        self.action_log.append(action)
        return action

    def get_explanation_context(self) -> Dict[str, Any]:
        """
        Get context for Gemini explanation

        Returns dictionary that Gemini can use to explain
        the agent's decisions in natural language.
        """
        return {
            'agent_name': self.name,
            'goal': self.goal,
            'status': self.status.value,
            'state': self._serialize_state(),
            'recent_actions': [
                {
                    'type': a.action_type,
                    'params': a.parameters,
                    'result': a.result,
                    'success': a.success
                }
                for a in self.action_log[-5:]  # Last 5 actions
            ]
        }

    def _serialize_state(self) -> Dict[str, Any]:
        """Serialize state to dictionary"""
        return {
            'observations': self.state.observations,
            'decisions': self.state.decisions,
            'confidence': self.state.confidence,
            'last_updated': self.state.last_updated.isoformat()
        }

    def reset(self):
        """Reset agent to initial state"""
        self.state = AgentState()
        self.status = AgentStatus.IDLE
        self.action_log = []

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(id={self.agent_id}, status={self.status.value})>"
