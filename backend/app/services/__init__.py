"""
Services Module

Business logic and utilities:
- Event simulation
- Parallel processing
- External integrations
"""

from .events import (
    EventSimulator,
    EventType,
    EventSeverity,
    get_event_simulator
)

__all__ = [
    'EventSimulator',
    'EventType',
    'EventSeverity',
    'get_event_simulator',
]
