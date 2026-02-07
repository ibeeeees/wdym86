"""
Loss Functions - Pure NumPy Implementation with Manual Gradients

Negative Binomial Negative Log Likelihood for demand forecasting.
All gradients are derived analytically and computed manually.
"""

import numpy as np
from math import lgamma
from typing import Tuple
from .distributions import digamma


def negative_binomial_nll(
    y_true: np.ndarray,
    mu: np.ndarray,
    k: np.ndarray,
    eps: float = 1e-8
) -> Tuple[float, Tuple[np.ndarray, np.ndarray]]:
    """
    Negative Binomial Negative Log Likelihood Loss

    For NB(mu, k) parameterization:

    NLL = -log P(Y = y | mu, k)
        = -[log Γ(y+k) - log Γ(k) - log Γ(y+1)
            + k*log(k/(k+μ)) + y*log(μ/(k+μ))]

    Gradients (derived analytically):

    ∂NLL/∂μ = -(y - μ) / (μ * (1 + μ/k))
            = (μ - y) / (μ + μ²/k)
            = (μ - y) * k / (μ * (k + μ))

    ∂NLL/∂k = ψ(k) - ψ(y+k) + log(k/(k+μ)) + 1 - k/(k+μ) + (y-μ)/(k+μ)
            = ψ(k) - ψ(y+k) + log(k/(k+μ)) + μ/(k+μ) + (y-μ)/(k+μ)
            = ψ(k) - ψ(y+k) + log(k/(k+μ)) + y/(k+μ)

    where ψ is the digamma function.

    Args:
        y_true: Observed values (batch,) or (batch, seq)
        mu: Predicted mean (same shape as y_true)
        k: Predicted dispersion (same shape as y_true)
        eps: Small constant for numerical stability

    Returns:
        loss: Scalar mean NLL
        (grad_mu, grad_k): Gradients w.r.t. mu and k
    """
    # Ensure numpy arrays
    y_true = np.asarray(y_true, dtype=np.float64)
    mu = np.asarray(mu, dtype=np.float64)
    k = np.asarray(k, dtype=np.float64)

    # Clamp for numerical stability
    mu = np.maximum(mu, eps)
    k = np.maximum(k, eps)
    y_true = np.maximum(y_true, 0)

    # Compute NLL terms
    # log Γ(y+k)
    log_gamma_yk = np.vectorize(lgamma)(y_true + k)
    # log Γ(k)
    log_gamma_k = np.vectorize(lgamma)(k)
    # log Γ(y+1)
    log_gamma_y1 = np.vectorize(lgamma)(y_true + 1)

    # Probability terms
    p = k / (k + mu)  # k/(k+μ)

    # NLL = -(log Γ(y+k) - log Γ(k) - log Γ(y+1) + k*log(p) + y*log(1-p))
    nll = -(
        log_gamma_yk
        - log_gamma_k
        - log_gamma_y1
        + k * np.log(p + eps)
        + y_true * np.log(1 - p + eps)
    )

    # Mean loss
    loss = np.mean(nll)

    # ====== Compute Gradients ======

    # ∂NLL/∂μ = (μ - y) * k / (μ * (k + μ))
    #         = (μ - y) / (μ * (1 + μ/k))
    grad_mu = (mu - y_true) * k / (mu * (k + mu) + eps)

    # ∂NLL/∂k = ψ(k) - ψ(y+k) + log(k/(k+μ)) + y/(k+μ)
    psi_k = digamma(k)
    psi_yk = digamma(y_true + k)

    grad_k = psi_k - psi_yk + np.log(p + eps) + y_true / (k + mu + eps)

    # Average gradients (for mean loss)
    n = np.prod(y_true.shape)
    grad_mu = grad_mu / n
    grad_k = grad_k / n

    return loss, (grad_mu, grad_k)


def negative_binomial_nll_batch(
    y_true: np.ndarray,
    mu: np.ndarray,
    k: np.ndarray,
    reduction: str = 'mean',
    eps: float = 1e-8
) -> Tuple[float, Tuple[np.ndarray, np.ndarray]]:
    """
    Batch version of NB NLL with flexible reduction

    Args:
        y_true: (batch, seq_len) observed values
        mu: (batch, seq_len) predicted means
        k: (batch, seq_len) predicted dispersions
        reduction: 'mean', 'sum', or 'none'
        eps: Numerical stability constant

    Returns:
        loss: Reduced loss (scalar if mean/sum, array if none)
        (grad_mu, grad_k): Gradients matching input shapes
    """
    loss, (grad_mu, grad_k) = negative_binomial_nll(y_true, mu, k, eps)

    if reduction == 'mean':
        return loss, (grad_mu, grad_k)
    elif reduction == 'sum':
        n = np.prod(y_true.shape)
        return loss * n, (grad_mu * n, grad_k * n)
    else:  # 'none'
        # Recompute without reduction
        mu = np.maximum(mu, eps)
        k = np.maximum(k, eps)

        log_gamma_yk = np.vectorize(lgamma)(y_true + k)
        log_gamma_k = np.vectorize(lgamma)(k)
        log_gamma_y1 = np.vectorize(lgamma)(y_true + 1)
        p = k / (k + mu)

        nll = -(
            log_gamma_yk - log_gamma_k - log_gamma_y1
            + k * np.log(p + eps)
            + y_true * np.log(1 - p + eps)
        )

        grad_mu_full = (mu - y_true) * k / (mu * (k + mu) + eps)
        psi_k = digamma(k)
        psi_yk = digamma(y_true + k)
        grad_k_full = psi_k - psi_yk + np.log(p + eps) + y_true / (k + mu + eps)

        return nll, (grad_mu_full, grad_k_full)


def mse_loss(
    y_true: np.ndarray,
    y_pred: np.ndarray
) -> Tuple[float, np.ndarray]:
    """
    Mean Squared Error loss (for comparison/debugging)

    Args:
        y_true: Target values
        y_pred: Predicted values

    Returns:
        loss: Scalar MSE
        grad: Gradient w.r.t. y_pred
    """
    diff = y_pred - y_true
    loss = np.mean(diff ** 2)
    grad = 2 * diff / np.prod(y_true.shape)
    return loss, grad


def poisson_nll(
    y_true: np.ndarray,
    log_rate: np.ndarray,
    eps: float = 1e-8
) -> Tuple[float, np.ndarray]:
    """
    Poisson Negative Log Likelihood (simpler alternative)

    NLL = λ - y*log(λ) + log(y!)
        = exp(log_rate) - y*log_rate + log(y!)

    Args:
        y_true: Observed counts
        log_rate: Log of predicted rate (log λ)

    Returns:
        loss: Mean NLL
        grad: Gradient w.r.t. log_rate
    """
    rate = np.exp(log_rate)

    # NLL (ignoring constant log(y!))
    nll = rate - y_true * log_rate

    loss = np.mean(nll)

    # Gradient: ∂NLL/∂(log λ) = λ - y
    grad = (rate - y_true) / np.prod(y_true.shape)

    return loss, grad


class GradientChecker:
    """
    Numerical gradient checking for verifying analytical gradients

    Usage:
        checker = GradientChecker()
        is_correct = checker.check(loss_fn, params, analytical_grads)
    """

    def __init__(self, eps: float = 1e-5, rtol: float = 1e-3, atol: float = 1e-5):
        self.eps = eps
        self.rtol = rtol
        self.atol = atol

    def numerical_gradient(
        self,
        f,
        x: np.ndarray,
        *args
    ) -> np.ndarray:
        """Compute numerical gradient using central differences"""
        grad = np.zeros_like(x)

        it = np.nditer(x, flags=['multi_index'])
        while not it.finished:
            idx = it.multi_index

            # f(x + eps)
            x[idx] += self.eps
            fx_plus = f(x, *args)
            if isinstance(fx_plus, tuple):
                fx_plus = fx_plus[0]

            # f(x - eps)
            x[idx] -= 2 * self.eps
            fx_minus = f(x, *args)
            if isinstance(fx_minus, tuple):
                fx_minus = fx_minus[0]

            # Central difference
            grad[idx] = (fx_plus - fx_minus) / (2 * self.eps)

            # Restore
            x[idx] += self.eps

            it.iternext()

        return grad

    def check(
        self,
        loss_fn,
        params: list,
        analytical_grads: list,
        *args
    ) -> bool:
        """
        Check if analytical gradients match numerical gradients

        Returns True if all gradients are close within tolerance
        """
        all_close = True

        for i, (param, analytical) in enumerate(zip(params, analytical_grads)):
            # Compute numerical gradient
            def f(p, *a):
                old_val = params[i].copy()
                params[i][:] = p
                result = loss_fn(*a)
                params[i][:] = old_val
                return result

            numerical = self.numerical_gradient(
                lambda p: loss_fn(args[0], p if i == 0 else params[0], params[1] if i == 0 else p),
                param.copy(),
            )

            # Compare
            close = np.allclose(analytical, numerical, rtol=self.rtol, atol=self.atol)

            if not close:
                max_diff = np.max(np.abs(analytical - numerical))
                print(f"Gradient {i} mismatch! Max diff: {max_diff}")
                all_close = False

        return all_close
