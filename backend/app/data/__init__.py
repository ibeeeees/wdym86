"""Data utilities for synthetic data generation and external APIs"""

from .synthetic import generate_restaurant_data, generate_usage_series

__all__ = [
    'generate_restaurant_data',
    'generate_usage_series',
]
