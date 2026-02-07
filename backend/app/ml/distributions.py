"""
Probability Distributions - Pure NumPy Implementation

Negative Binomial distribution for modeling overdispersed count data.
Restaurant ingredient usage is:
- Non-negative
- Discrete (or semi-discrete)
- Overdispersed (variance > mean)
"""

import numpy as np
from math import lgamma, gamma
from typing import Union, Tuple


class NegativeBinomial:
    """
    Negative Binomial Distribution parameterized by (mu, k)

    Alternative parameterization where:
    - mu > 0: mean (expected value)
    - k > 0: dispersion parameter (higher k = less variance)

    Properties:
    - E[Y] = mu
    - Var[Y] = mu + mu^2/k

    As k -> infinity, NB approaches Poisson(mu).
    As k -> 0, variance becomes very large.

    This parameterization is common in count regression models
    and allows modeling overdispersion in demand data.
    """

    @staticmethod
    def mean(mu: np.ndarray, k: np.ndarray) -> np.ndarray:
        """Expected value: E[Y] = mu"""
        return mu

    @staticmethod
    def variance(mu: np.ndarray, k: np.ndarray) -> np.ndarray:
        """Variance: Var[Y] = mu + mu^2/k"""
        return mu + (mu ** 2) / k

    @staticmethod
    def std(mu: np.ndarray, k: np.ndarray) -> np.ndarray:
        """Standard deviation"""
        return np.sqrt(NegativeBinomial.variance(mu, k))

    @staticmethod
    def pmf(y: np.ndarray, mu: np.ndarray, k: np.ndarray) -> np.ndarray:
        """
        Probability Mass Function

        P(Y = y) = Γ(y+k) / (Γ(k) * y!) * (k/(k+μ))^k * (μ/(k+μ))^y

        Args:
            y: Observed counts (non-negative integers)
            mu: Mean parameter (> 0)
            k: Dispersion parameter (> 0)

        Returns:
            Probability of observing y
        """
        return np.exp(NegativeBinomial.log_pmf(y, mu, k))

    @staticmethod
    def log_pmf(y: np.ndarray, mu: np.ndarray, k: np.ndarray) -> np.ndarray:
        """
        Log Probability Mass Function (numerically stable)

        log P(Y = y) = log Γ(y+k) - log Γ(k) - log Γ(y+1)
                     + k * log(k/(k+μ)) + y * log(μ/(k+μ))

        Uses lgamma for numerical stability with large values.
        """
        # Ensure inputs are numpy arrays
        y = np.asarray(y, dtype=np.float64)
        mu = np.asarray(mu, dtype=np.float64)
        k = np.asarray(k, dtype=np.float64)

        # Clamp to avoid numerical issues
        mu = np.maximum(mu, 1e-8)
        k = np.maximum(k, 1e-8)
        y = np.maximum(y, 0)

        # Compute log probability using lgamma
        # Vectorized lgamma
        log_gamma_yk = np.vectorize(lgamma)(y + k)
        log_gamma_k = np.vectorize(lgamma)(k)
        log_gamma_y1 = np.vectorize(lgamma)(y + 1)

        # Compute probability terms
        p = k / (k + mu)  # probability of "success"
        q = mu / (k + mu)  # probability of "failure"

        log_prob = (
            log_gamma_yk
            - log_gamma_k
            - log_gamma_y1
            + k * np.log(p + 1e-10)
            + y * np.log(q + 1e-10)
        )

        return log_prob

    @staticmethod
    def nll(y: np.ndarray, mu: np.ndarray, k: np.ndarray) -> np.ndarray:
        """
        Negative Log Likelihood

        NLL = -log P(Y = y)
        """
        return -NegativeBinomial.log_pmf(y, mu, k)

    @staticmethod
    def sample(
        mu: Union[float, np.ndarray],
        k: Union[float, np.ndarray],
        size: Tuple[int, ...] = None
    ) -> np.ndarray:
        """
        Sample from Negative Binomial distribution

        Uses the gamma-Poisson mixture representation:
        1. Sample λ ~ Gamma(k, k/mu)
        2. Sample Y ~ Poisson(λ)

        This gives Y ~ NB(mu, k)

        Args:
            mu: Mean parameter
            k: Dispersion parameter
            size: Output shape (if mu and k are scalars)

        Returns:
            Samples from NB(mu, k)
        """
        mu = np.asarray(mu)
        k = np.asarray(k)

        # Gamma-Poisson mixture
        # Scale parameter = mu/k (so that mean of Gamma is mu)
        # Shape parameter = k
        lam = np.random.gamma(shape=k, scale=mu/k, size=size)

        # Sample from Poisson
        samples = np.random.poisson(lam)

        return samples

    @staticmethod
    def cdf(y: np.ndarray, mu: np.ndarray, k: np.ndarray) -> np.ndarray:
        """
        Cumulative Distribution Function

        P(Y <= y) = sum_{i=0}^{floor(y)} P(Y = i)

        Note: This is computationally expensive for large y.
        For practical use, consider using scipy.stats.nbinom.
        """
        y = np.asarray(y, dtype=np.int32)
        y_max = int(np.max(y))

        # Compute PMF for all values up to max
        pmf_values = np.zeros((y_max + 1,) + mu.shape)
        for i in range(y_max + 1):
            pmf_values[i] = NegativeBinomial.pmf(i, mu, k)

        # Cumulative sum
        cdf_values = np.cumsum(pmf_values, axis=0)

        # Index into CDF
        result = np.zeros_like(mu)
        for i, yi in enumerate(y.flat):
            idx = np.unravel_index(i, y.shape)
            result[idx] = cdf_values[yi][idx]

        return result

    @staticmethod
    def quantile(q: float, mu: np.ndarray, k: np.ndarray, max_iter: int = 1000) -> np.ndarray:
        """
        Quantile function (inverse CDF)

        Finds smallest y such that P(Y <= y) >= q

        Uses iterative search since no closed form exists.
        """
        result = np.zeros_like(mu, dtype=np.int32)

        for i in range(max_iter):
            cdf = NegativeBinomial.cdf(result, mu, k)
            mask = cdf < q
            if not np.any(mask):
                break
            result[mask] += 1

        return result


def digamma(x: np.ndarray) -> np.ndarray:
    """
    Digamma function: ψ(x) = d/dx log Γ(x)

    Uses asymptotic expansion for numerical computation.
    """
    from scipy.special import digamma as scipy_digamma
    return scipy_digamma(x)


def trigamma(x: np.ndarray) -> np.ndarray:
    """
    Trigamma function: ψ'(x) = d²/dx² log Γ(x)

    Used for computing second derivatives in optimization.
    """
    from scipy.special import polygamma
    return polygamma(1, x)
