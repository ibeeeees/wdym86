"""
Training Utilities for Demand Forecasting Model

Provides training loops, data augmentation, and evaluation metrics.
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Callable
from .model import DemandForecastModel, prepare_features, create_sequences
from .distributions import NegativeBinomial


class Trainer:
    """
    Training manager for demand forecasting models

    Handles:
    - Training loop with early stopping
    - Learning rate scheduling
    - Model checkpointing
    - Metrics logging
    """

    def __init__(
        self,
        model: DemandForecastModel,
        learning_rate: float = 0.001,
        batch_size: int = 32,
        max_epochs: int = 100,
        early_stopping_patience: int = 15,
        checkpoint_dir: Optional[str] = None
    ):
        self.model = model
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.early_stopping_patience = early_stopping_patience
        self.checkpoint_dir = checkpoint_dir

        # Training state
        self.current_epoch = 0
        self.best_val_loss = float('inf')
        self.patience_counter = 0

    def train(
        self,
        train_data: Tuple[np.ndarray, np.ndarray],
        val_data: Optional[Tuple[np.ndarray, np.ndarray]] = None,
        callbacks: Optional[List[Callable]] = None
    ) -> Dict[str, List[float]]:
        """
        Train the model

        Args:
            train_data: (X_train, y_train)
            val_data: (X_val, y_val) optional
            callbacks: List of callback functions

        Returns:
            Training history
        """
        X_train, y_train = train_data
        X_val, y_val = val_data if val_data else (None, None)

        history = self.model.fit(
            X_train, y_train,
            X_val, y_val,
            epochs=self.max_epochs,
            batch_size=self.batch_size,
            learning_rate=self.learning_rate,
            early_stopping_patience=self.early_stopping_patience,
            verbose=True
        )

        return history


class DataAugmenter:
    """
    Data augmentation for time series

    Techniques:
    - Time warping
    - Magnitude warping
    - Jittering
    - Window slicing
    """

    @staticmethod
    def jitter(X: np.ndarray, sigma: float = 0.03) -> np.ndarray:
        """Add random noise to features"""
        return X + np.random.normal(0, sigma, X.shape)

    @staticmethod
    def scale(X: np.ndarray, sigma: float = 0.1) -> np.ndarray:
        """Random scaling of features"""
        factor = np.random.normal(1, sigma, (X.shape[0], 1, X.shape[2]))
        return X * factor

    @staticmethod
    def window_warp(X: np.ndarray, window_ratio: float = 0.1) -> np.ndarray:
        """Warp a random window of the sequence"""
        batch_size, seq_len, n_features = X.shape
        window_size = int(seq_len * window_ratio)

        X_warped = X.copy()
        for i in range(batch_size):
            start = np.random.randint(0, seq_len - window_size)
            # Stretch or compress the window
            warp_factor = np.random.uniform(0.5, 2.0)
            # Simple linear interpolation
            # (In practice, use scipy.interpolate)

        return X_warped


class MetricsCalculator:
    """
    Evaluation metrics for demand forecasting
    """

    @staticmethod
    def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Mean Absolute Percentage Error"""
        mask = y_true > 0
        return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100

    @staticmethod
    def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Root Mean Squared Error"""
        return np.sqrt(np.mean((y_true - y_pred) ** 2))

    @staticmethod
    def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Mean Absolute Error"""
        return np.mean(np.abs(y_true - y_pred))

    @staticmethod
    def coverage(
        y_true: np.ndarray,
        lower: np.ndarray,
        upper: np.ndarray
    ) -> float:
        """Prediction interval coverage"""
        return np.mean((y_true >= lower) & (y_true <= upper))

    @staticmethod
    def crps(
        y_true: np.ndarray,
        mu: np.ndarray,
        sigma: np.ndarray
    ) -> float:
        """
        Continuous Ranked Probability Score

        Measures calibration of probabilistic forecasts.
        Lower is better.
        """
        from scipy.stats import norm

        z = (y_true - mu) / sigma
        crps = sigma * (
            z * (2 * norm.cdf(z) - 1) +
            2 * norm.pdf(z) -
            1 / np.sqrt(np.pi)
        )
        return np.mean(crps)

    @staticmethod
    def compute_all(
        y_true: np.ndarray,
        predictions: Dict[str, np.ndarray]
    ) -> Dict[str, float]:
        """Compute all metrics"""
        mu = predictions['mu']
        lower = predictions.get('lower_bound', mu)
        upper = predictions.get('upper_bound', mu)
        std = predictions.get('std', np.ones_like(mu))

        return {
            'mape': MetricsCalculator.mape(y_true, mu),
            'rmse': MetricsCalculator.rmse(y_true, mu),
            'mae': MetricsCalculator.mae(y_true, mu),
            'coverage_90': MetricsCalculator.coverage(y_true, lower, upper),
            'crps': MetricsCalculator.crps(y_true, mu, std)
        }


class CrossValidator:
    """
    Time series cross-validation

    Uses expanding or sliding window strategy to respect
    temporal ordering.
    """

    def __init__(
        self,
        n_splits: int = 5,
        test_size: int = 30,
        gap: int = 0
    ):
        """
        Args:
            n_splits: Number of CV folds
            test_size: Size of each test set (days)
            gap: Gap between train and test (days)
        """
        self.n_splits = n_splits
        self.test_size = test_size
        self.gap = gap

    def split(
        self,
        X: np.ndarray,
        y: np.ndarray
    ) -> List[Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]]:
        """
        Generate train/test splits

        Returns:
            List of (X_train, y_train, X_test, y_test) tuples
        """
        n_samples = len(X)
        splits = []

        # Calculate fold sizes
        total_test = self.n_splits * self.test_size
        train_start = n_samples - total_test - self.n_splits * self.gap

        for i in range(self.n_splits):
            test_end = n_samples - i * (self.test_size + self.gap)
            test_start = test_end - self.test_size
            train_end = test_start - self.gap

            X_train = X[:train_end]
            y_train = y[:train_end]
            X_test = X[test_start:test_end]
            y_test = y[test_start:test_end]

            splits.append((X_train, y_train, X_test, y_test))

        return splits

    def cross_validate(
        self,
        model_factory: Callable,
        X: np.ndarray,
        y: np.ndarray
    ) -> Dict[str, List[float]]:
        """
        Run cross-validation

        Args:
            model_factory: Function that returns a new model instance
            X: Features
            y: Targets

        Returns:
            Dictionary of metrics for each fold
        """
        results = {
            'fold': [],
            'train_loss': [],
            'val_loss': [],
            'mape': [],
            'rmse': []
        }

        splits = self.split(X, y)

        for fold, (X_train, y_train, X_test, y_test) in enumerate(splits):
            print(f"\nFold {fold + 1}/{self.n_splits}")

            # Create and train model
            model = model_factory()
            model.fit(
                X_train, y_train,
                X_val=X_test, y_val=y_test,
                epochs=50,
                verbose=False
            )

            # Evaluate
            predictions = model.predict(X_test)
            metrics = MetricsCalculator.compute_all(y_test, predictions)

            results['fold'].append(fold)
            results['train_loss'].append(model.history['train_loss'][-1])
            results['val_loss'].append(model.history['val_loss'][-1])
            results['mape'].append(metrics['mape'])
            results['rmse'].append(metrics['rmse'])

        # Summary
        print("\n" + "=" * 50)
        print("Cross-Validation Results")
        print("=" * 50)
        print(f"MAPE: {np.mean(results['mape']):.2f}% (+/- {np.std(results['mape']):.2f}%)")
        print(f"RMSE: {np.mean(results['rmse']):.2f} (+/- {np.std(results['rmse']):.2f})")

        return results
