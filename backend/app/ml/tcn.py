"""
Temporal Convolutional Network (TCN) - Pure NumPy Implementation

A sequence-to-sequence model using dilated causal convolutions.
Used for probabilistic demand forecasting with Negative Binomial output.

Architecture:
- Input: (batch, seq_len=28, features=14)
- Multiple residual blocks with increasing dilation
- Dual output heads for μ (mean) and k (dispersion)
"""

import numpy as np
from typing import List, Tuple, Optional
from .layers import (
    Layer,
    CausalConv1D,
    ResidualBlock,
    Linear,
    ReLU,
    Softplus,
    LayerNorm,
    Dropout
)


class TCNBlock(Layer):
    """
    Single TCN block with dilated causal convolution

    Architecture:
        Input -> Conv1D (dilated) -> LayerNorm -> ReLU -> Dropout -> Output
                   |                                                   |
                   +------------------ Residual ---------------------+
    """

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int,
        dilation: int,
        dropout: float = 0.1
    ):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels

        # Main convolution
        self.conv = CausalConv1D(
            in_channels, out_channels,
            kernel_size, dilation
        )
        self.norm = LayerNorm(out_channels)
        self.relu = ReLU()
        self.dropout = Dropout(dropout)

        # Skip connection
        self.skip_conv = None
        if in_channels != out_channels:
            self.skip_conv = Linear(in_channels, out_channels, bias=False)

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        Forward pass

        Args:
            x: (batch, seq_len, in_channels)
        Returns:
            (batch, seq_len, out_channels)
        """
        # Main path
        out = self.conv.forward(x)
        out = self.norm.forward(out)
        out = self.relu.forward(out)
        out = self.dropout.forward(out)

        # Skip connection
        if self.skip_conv is not None:
            skip = self.skip_conv.forward(x)
        else:
            skip = x

        return out + skip

    def backward(self, grad_output: np.ndarray) -> np.ndarray:
        """Backward pass through TCN block"""
        # Split gradient for residual
        grad_main = grad_output
        grad_skip = grad_output

        # Backward through main path
        grad_main = self.dropout.backward(grad_main)
        grad_main = self.relu.backward(grad_main)
        grad_main = self.norm.backward(grad_main)
        grad_main = self.conv.backward(grad_main)

        # Backward through skip
        if self.skip_conv is not None:
            grad_skip = self.skip_conv.backward(grad_skip)

        return grad_main + grad_skip

    def get_parameters(self) -> List[np.ndarray]:
        params = self.conv.get_parameters() + self.norm.get_parameters()
        if self.skip_conv is not None:
            params += self.skip_conv.get_parameters()
        return params

    def get_gradients(self) -> List[np.ndarray]:
        grads = self.conv.get_gradients() + self.norm.get_gradients()
        if self.skip_conv is not None:
            grads += self.skip_conv.get_gradients()
        return grads


class TCN(Layer):
    """
    Temporal Convolutional Network

    Multi-layer TCN with increasing dilation rates for capturing
    both short-term and long-term temporal patterns.

    Default architecture for 28-day input:
    - Dilation rates: [1, 2, 4, 8] (receptive field = 60 days)
    - Hidden channels: 32
    - Kernel size: 3

    Outputs:
    - mu: Mean demand (via Softplus for positivity)
    - k: Dispersion parameter (via Softplus for positivity)
    """

    def __init__(
        self,
        input_dim: int = 14,
        hidden_dim: int = 32,
        output_dim: int = 1,
        kernel_size: int = 3,
        num_layers: int = 4,
        dropout: float = 0.1,
        dilations: Optional[List[int]] = None
    ):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.output_dim = output_dim

        # Default dilations: exponentially increasing
        if dilations is None:
            dilations = [2 ** i for i in range(num_layers)]
        self.dilations = dilations

        # Build TCN blocks
        self.blocks = []
        for i, dilation in enumerate(dilations):
            in_ch = input_dim if i == 0 else hidden_dim
            block = TCNBlock(
                in_ch, hidden_dim,
                kernel_size, dilation, dropout
            )
            self.blocks.append(block)

        # Output heads
        # mu head: predicts mean demand
        self.mu_linear = Linear(hidden_dim, output_dim)
        self.mu_activation = Softplus()  # Ensures positive output

        # k head: predicts dispersion parameter
        self.k_linear = Linear(hidden_dim, output_dim)
        self.k_activation = Softplus()  # Ensures positive output

    def forward(self, x: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Forward pass through TCN

        Args:
            x: Input features (batch, seq_len, input_dim)
               Features include:
               - Historical usage (1)
               - Day of week one-hot (7)
               - Week of year sin/cos (2)
               - Event flag (1)
               - Weather severity (1)
               - Traffic index (1)
               - Hazard flag (1)

        Returns:
            mu: Predicted mean (batch, seq_len, 1) or (batch, 1) for last step
            k: Predicted dispersion (batch, seq_len, 1) or (batch, 1) for last step
        """
        # Pass through TCN blocks
        h = x
        for block in self.blocks:
            h = block.forward(h)

        self.cache['hidden'] = h

        # Take the last timestep for prediction
        # Or use all timesteps for sequence-to-sequence
        h_last = h[:, -1, :]  # (batch, hidden_dim)

        # Mu head
        mu_logit = self.mu_linear.forward(h_last)
        mu = self.mu_activation.forward(mu_logit)

        # K head
        k_logit = self.k_linear.forward(h_last)
        k = self.k_activation.forward(k_logit)

        # Add small constant to ensure numerical stability
        mu = mu + 1e-4
        k = k + 1e-4

        return mu.squeeze(-1), k.squeeze(-1)

    def forward_sequence(self, x: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Forward pass returning predictions for all timesteps

        Useful for training on full sequences.

        Returns:
            mu: (batch, seq_len, 1)
            k: (batch, seq_len, 1)
        """
        # Pass through TCN blocks
        h = x
        for block in self.blocks:
            h = block.forward(h)

        self.cache['hidden'] = h

        # Apply output heads to all timesteps
        batch, seq_len, hidden_dim = h.shape
        h_flat = h.reshape(-1, hidden_dim)

        mu_logit = self.mu_linear.forward(h_flat)
        mu = self.mu_activation.forward(mu_logit)
        mu = mu.reshape(batch, seq_len, -1)

        k_logit = self.k_linear.forward(h_flat)
        k = self.k_activation.forward(k_logit)
        k = k.reshape(batch, seq_len, -1)

        return mu + 1e-4, k + 1e-4

    def backward(
        self,
        grad_mu: np.ndarray,
        grad_k: np.ndarray
    ) -> np.ndarray:
        """
        Backward pass through TCN

        Args:
            grad_mu: Gradient w.r.t. mu output
            grad_k: Gradient w.r.t. k output

        Returns:
            Gradient w.r.t. input (though usually not needed)
        """
        # Reshape if needed
        if grad_mu.ndim == 1:
            grad_mu = grad_mu.reshape(-1, 1)
        if grad_k.ndim == 1:
            grad_k = grad_k.reshape(-1, 1)

        # Backward through activation and linear (mu head)
        grad_mu = self.mu_activation.backward(grad_mu)
        grad_mu = self.mu_linear.backward(grad_mu)

        # Backward through activation and linear (k head)
        grad_k = self.k_activation.backward(grad_k)
        grad_k = self.k_linear.backward(grad_k)

        # Combine gradients at hidden layer
        # Both heads receive from the same hidden state
        h = self.cache['hidden']
        batch, seq_len, hidden_dim = h.shape

        # Gradients only flow to last timestep
        grad_hidden = np.zeros_like(h)
        grad_hidden[:, -1, :] = grad_mu + grad_k

        # Backward through TCN blocks (in reverse order)
        grad = grad_hidden
        for block in reversed(self.blocks):
            grad = block.backward(grad)

        return grad

    def get_parameters(self) -> List[np.ndarray]:
        """Get all trainable parameters"""
        params = []
        for block in self.blocks:
            params += block.get_parameters()
        params += self.mu_linear.get_parameters()
        params += self.k_linear.get_parameters()
        return params

    def get_gradients(self) -> List[np.ndarray]:
        """Get all parameter gradients"""
        grads = []
        for block in self.blocks:
            grads += block.get_gradients()
        grads += self.mu_linear.get_gradients()
        grads += self.k_linear.get_gradients()
        return grads

    def train(self):
        """Set model to training mode"""
        self.training = True
        for block in self.blocks:
            block.train()

    def eval(self):
        """Set model to evaluation mode"""
        self.training = False
        for block in self.blocks:
            block.eval()

    def count_parameters(self) -> int:
        """Count total number of trainable parameters"""
        return sum(p.size for p in self.get_parameters())

    def receptive_field(self) -> int:
        """
        Calculate the receptive field of the TCN

        For dilated convolutions:
        RF = 1 + sum(kernel_size - 1) * dilation
        """
        kernel_size = self.blocks[0].conv.kernel_size if self.blocks else 3
        rf = 1
        for d in self.dilations:
            rf += (kernel_size - 1) * d
        return rf


def create_tcn_small(input_dim: int = 14) -> TCN:
    """Create a small TCN for quick testing"""
    return TCN(
        input_dim=input_dim,
        hidden_dim=16,
        num_layers=2,
        kernel_size=3,
        dropout=0.1,
        dilations=[1, 2]
    )


def create_tcn_medium(input_dim: int = 14) -> TCN:
    """Create a medium TCN for production use"""
    return TCN(
        input_dim=input_dim,
        hidden_dim=32,
        num_layers=4,
        kernel_size=3,
        dropout=0.1,
        dilations=[1, 2, 4, 8]
    )


def create_tcn_large(input_dim: int = 14) -> TCN:
    """Create a large TCN for maximum capacity"""
    return TCN(
        input_dim=input_dim,
        hidden_dim=64,
        num_layers=6,
        kernel_size=3,
        dropout=0.2,
        dilations=[1, 2, 4, 8, 16, 32]
    )
