"""
Ground-up Machine Learning Module

All implementations are in pure NumPy with manual gradient computation.
No PyTorch, TensorFlow, or Keras allowed.

Components:
- layers.py: Neural network layer primitives (CausalConv1D, ReLU, Softplus, Linear)
- tcn.py: Temporal Convolutional Network architecture
- distributions.py: Negative Binomial distribution
- losses.py: Negative Binomial NLL loss with manual gradients
- optimizers.py: Adam optimizer from scratch
- model.py: Full forecasting model
- training.py: Training loop
"""

from .layers import CausalConv1D, ReLU, Softplus, Linear, ResidualBlock
from .tcn import TCN
from .distributions import NegativeBinomial
from .losses import negative_binomial_nll
from .optimizers import Adam
from .model import DemandForecastModel

__all__ = [
    'CausalConv1D',
    'ReLU',
    'Softplus',
    'Linear',
    'ResidualBlock',
    'TCN',
    'NegativeBinomial',
    'negative_binomial_nll',
    'Adam',
    'DemandForecastModel',
]
