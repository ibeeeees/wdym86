"""
Optimizers - Pure NumPy Implementation

Adam optimizer with momentum and adaptive learning rates.
All implemented from scratch without any ML frameworks.
"""

import numpy as np
from typing import List, Optional


class Optimizer:
    """Base class for optimizers"""

    def __init__(self, parameters: List[np.ndarray], lr: float = 0.001):
        self.parameters = parameters
        self.lr = lr

    def step(self, gradients: List[np.ndarray]):
        """Update parameters using gradients"""
        raise NotImplementedError

    def zero_grad(self):
        """Reset gradients (not needed for NumPy, but for API consistency)"""
        pass


class SGD(Optimizer):
    """
    Stochastic Gradient Descent with optional momentum

    Update rule:
        v_t = momentum * v_{t-1} + lr * grad
        param = param - v_t

    Args:
        parameters: List of parameter arrays to optimize
        lr: Learning rate
        momentum: Momentum factor (0 = no momentum)
        weight_decay: L2 regularization factor
    """

    def __init__(
        self,
        parameters: List[np.ndarray],
        lr: float = 0.01,
        momentum: float = 0.0,
        weight_decay: float = 0.0
    ):
        super().__init__(parameters, lr)
        self.momentum = momentum
        self.weight_decay = weight_decay

        # Initialize velocity
        self.v = [np.zeros_like(p) for p in parameters]

    def step(self, gradients: List[np.ndarray]):
        """Perform one optimization step"""
        for i, (param, grad) in enumerate(zip(self.parameters, gradients)):
            # Add weight decay (L2 regularization)
            if self.weight_decay > 0:
                grad = grad + self.weight_decay * param

            # Update velocity
            self.v[i] = self.momentum * self.v[i] + self.lr * grad

            # Update parameter
            param -= self.v[i]


class Adam(Optimizer):
    """
    Adam Optimizer - Adaptive Moment Estimation

    Combines momentum (first moment) and RMSprop (second moment)
    for adaptive per-parameter learning rates.

    Update rules:
        m_t = β1 * m_{t-1} + (1 - β1) * g_t          # First moment
        v_t = β2 * v_{t-1} + (1 - β2) * g_t²         # Second moment

        m̂_t = m_t / (1 - β1^t)                       # Bias correction
        v̂_t = v_t / (1 - β2^t)

        θ_t = θ_{t-1} - lr * m̂_t / (√v̂_t + ε)

    Args:
        parameters: List of parameter arrays to optimize
        lr: Learning rate (default: 0.001)
        beta1: Exponential decay rate for first moment (default: 0.9)
        beta2: Exponential decay rate for second moment (default: 0.999)
        eps: Small constant for numerical stability (default: 1e-8)
        weight_decay: L2 regularization factor (default: 0)
    """

    def __init__(
        self,
        parameters: List[np.ndarray],
        lr: float = 0.001,
        beta1: float = 0.9,
        beta2: float = 0.999,
        eps: float = 1e-8,
        weight_decay: float = 0.0
    ):
        super().__init__(parameters, lr)
        self.beta1 = beta1
        self.beta2 = beta2
        self.eps = eps
        self.weight_decay = weight_decay

        # Initialize moments
        self.m = [np.zeros_like(p) for p in parameters]  # First moment
        self.v = [np.zeros_like(p) for p in parameters]  # Second moment

        # Timestep
        self.t = 0

    def step(self, gradients: List[np.ndarray]):
        """
        Perform one Adam optimization step

        Args:
            gradients: List of gradients, one per parameter
        """
        self.t += 1

        for i, (param, grad) in enumerate(zip(self.parameters, gradients)):
            # Add weight decay (decoupled, like AdamW)
            if self.weight_decay > 0:
                param -= self.lr * self.weight_decay * param

            # Update first moment estimate
            self.m[i] = self.beta1 * self.m[i] + (1 - self.beta1) * grad

            # Update second moment estimate
            self.v[i] = self.beta2 * self.v[i] + (1 - self.beta2) * (grad ** 2)

            # Bias correction
            m_hat = self.m[i] / (1 - self.beta1 ** self.t)
            v_hat = self.v[i] / (1 - self.beta2 ** self.t)

            # Update parameters
            param -= self.lr * m_hat / (np.sqrt(v_hat) + self.eps)

    def get_state(self) -> dict:
        """Get optimizer state for checkpointing"""
        return {
            't': self.t,
            'm': [m.copy() for m in self.m],
            'v': [v.copy() for v in self.v],
        }

    def load_state(self, state: dict):
        """Load optimizer state from checkpoint"""
        self.t = state['t']
        self.m = [m.copy() for m in state['m']]
        self.v = [v.copy() for v in state['v']]


class AdamW(Adam):
    """
    AdamW - Adam with decoupled weight decay

    Fixes the L2 regularization issue in Adam by applying
    weight decay directly to parameters, not to gradients.

    This is the default Adam variant used in modern deep learning.
    """

    def step(self, gradients: List[np.ndarray]):
        """AdamW step with decoupled weight decay"""
        self.t += 1

        for i, (param, grad) in enumerate(zip(self.parameters, gradients)):
            # Decoupled weight decay (applied before Adam update)
            if self.weight_decay > 0:
                param *= (1 - self.lr * self.weight_decay)

            # Standard Adam update
            self.m[i] = self.beta1 * self.m[i] + (1 - self.beta1) * grad
            self.v[i] = self.beta2 * self.v[i] + (1 - self.beta2) * (grad ** 2)

            m_hat = self.m[i] / (1 - self.beta1 ** self.t)
            v_hat = self.v[i] / (1 - self.beta2 ** self.t)

            param -= self.lr * m_hat / (np.sqrt(v_hat) + self.eps)


class LearningRateScheduler:
    """
    Learning rate scheduling utilities

    Supports:
    - Step decay
    - Exponential decay
    - Cosine annealing
    - Warmup
    """

    def __init__(
        self,
        optimizer: Optimizer,
        schedule: str = 'constant',
        **kwargs
    ):
        self.optimizer = optimizer
        self.base_lr = optimizer.lr
        self.schedule = schedule
        self.kwargs = kwargs
        self.step_count = 0

    def step(self):
        """Update learning rate based on schedule"""
        self.step_count += 1

        if self.schedule == 'constant':
            return

        elif self.schedule == 'step':
            # Decay by factor every step_size epochs
            step_size = self.kwargs.get('step_size', 30)
            gamma = self.kwargs.get('gamma', 0.1)
            self.optimizer.lr = self.base_lr * (gamma ** (self.step_count // step_size))

        elif self.schedule == 'exponential':
            # Exponential decay
            gamma = self.kwargs.get('gamma', 0.95)
            self.optimizer.lr = self.base_lr * (gamma ** self.step_count)

        elif self.schedule == 'cosine':
            # Cosine annealing
            T_max = self.kwargs.get('T_max', 100)
            eta_min = self.kwargs.get('eta_min', 0)
            self.optimizer.lr = eta_min + (self.base_lr - eta_min) * (
                1 + np.cos(np.pi * self.step_count / T_max)
            ) / 2

        elif self.schedule == 'warmup':
            # Linear warmup then constant
            warmup_steps = self.kwargs.get('warmup_steps', 100)
            if self.step_count < warmup_steps:
                self.optimizer.lr = self.base_lr * self.step_count / warmup_steps
            else:
                self.optimizer.lr = self.base_lr

    def get_lr(self) -> float:
        """Get current learning rate"""
        return self.optimizer.lr


class GradientClipper:
    """
    Gradient clipping to prevent exploding gradients

    Supports:
    - Clip by value
    - Clip by norm (global)
    """

    @staticmethod
    def clip_by_value(
        gradients: List[np.ndarray],
        clip_value: float
    ) -> List[np.ndarray]:
        """Clip gradients to [-clip_value, clip_value]"""
        return [np.clip(g, -clip_value, clip_value) for g in gradients]

    @staticmethod
    def clip_by_norm(
        gradients: List[np.ndarray],
        max_norm: float,
        norm_type: float = 2.0
    ) -> List[np.ndarray]:
        """
        Clip gradients by global norm

        If ||g||_p > max_norm, scale g by max_norm / ||g||_p
        """
        # Compute global norm
        if norm_type == float('inf'):
            total_norm = max(np.max(np.abs(g)) for g in gradients)
        else:
            total_norm = 0.0
            for g in gradients:
                total_norm += np.sum(np.abs(g) ** norm_type)
            total_norm = total_norm ** (1.0 / norm_type)

        # Clip
        clip_coef = max_norm / (total_norm + 1e-6)
        if clip_coef < 1:
            return [g * clip_coef for g in gradients]
        return gradients
