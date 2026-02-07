"""
Neural Network Layer Primitives - Pure NumPy Implementation

All layers implement:
- forward(x): Compute output and cache values for backward pass
- backward(grad_output): Compute gradients w.r.t. inputs and parameters
- get_parameters(): Return list of trainable parameters
- get_gradients(): Return list of parameter gradients
"""

import numpy as np
from typing import Tuple, List, Optional


class Layer:
    """Base class for all layers"""

    def __init__(self):
        self.cache = {}
        self.training = True

    def forward(self, x: np.ndarray) -> np.ndarray:
        raise NotImplementedError

    def backward(self, grad_output: np.ndarray) -> np.ndarray:
        raise NotImplementedError

    def get_parameters(self) -> List[np.ndarray]:
        return []

    def get_gradients(self) -> List[np.ndarray]:
        return []

    def train(self):
        self.training = True

    def eval(self):
        self.training = False


class Linear(Layer):
    """
    Fully connected layer: y = xW + b

    Parameters:
        in_features: Input dimension
        out_features: Output dimension
        bias: Whether to include bias term
    """

    def __init__(self, in_features: int, out_features: int, bias: bool = True):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features

        # Xavier initialization
        scale = np.sqrt(2.0 / (in_features + out_features))
        self.weight = np.random.randn(in_features, out_features) * scale
        self.bias = np.zeros(out_features) if bias else None

        # Gradients
        self.grad_weight = np.zeros_like(self.weight)
        self.grad_bias = np.zeros_like(self.bias) if bias else None

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        Forward pass: y = xW + b

        Args:
            x: Input of shape (batch, ..., in_features)
        Returns:
            Output of shape (batch, ..., out_features)
        """
        self.cache['x'] = x
        output = np.dot(x, self.weight)
        if self.bias is not None:
            output = output + self.bias
        return output

    def backward(self, grad_output: np.ndarray) -> np.ndarray:
        """
        Backward pass

        Args:
            grad_output: Gradient w.r.t. output, shape (batch, ..., out_features)
        Returns:
            Gradient w.r.t. input, shape (batch, ..., in_features)
        """
        x = self.cache['x']

        # Reshape for matrix multiplication
        x_flat = x.reshape(-1, self.in_features)
        grad_flat = grad_output.reshape(-1, self.out_features)

        # Gradient w.r.t. weight: dL/dW = x^T @ dL/dy
        self.grad_weight = np.dot(x_flat.T, grad_flat)

        # Gradient w.r.t. bias: dL/db = sum(dL/dy)
        if self.bias is not None:
            self.grad_bias = np.sum(grad_flat, axis=0)

        # Gradient w.r.t. input: dL/dx = dL/dy @ W^T
        grad_input = np.dot(grad_output, self.weight.T)

        return grad_input

    def get_parameters(self) -> List[np.ndarray]:
        if self.bias is not None:
            return [self.weight, self.bias]
        return [self.weight]

    def get_gradients(self) -> List[np.ndarray]:
        if self.bias is not None:
            return [self.grad_weight, self.grad_bias]
        return [self.grad_weight]


class ReLU(Layer):
    """
    Rectified Linear Unit: y = max(0, x)
    """

    def forward(self, x: np.ndarray) -> np.ndarray:
        self.cache['mask'] = x > 0
        return np.maximum(0, x)

    def backward(self, grad_output: np.ndarray) -> np.ndarray:
        """Gradient is 1 where x > 0, else 0"""
        mask = self.cache['mask']
        return grad_output * mask


class Softplus(Layer):
    """
    Softplus activation: y = log(1 + exp(x))

    Ensures positive output, used for mu and k parameters.
    Numerically stable implementation.
    """

    def __init__(self, beta: float = 1.0, threshold: float = 20.0):
        super().__init__()
        self.beta = beta
        self.threshold = threshold

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        Numerically stable softplus:
        - For large x: return x (avoids overflow in exp)
        - For small x: return log(1 + exp(x))
        """
        self.cache['x'] = x

        # Stable computation
        output = np.where(
            x * self.beta > self.threshold,
            x,
            np.log1p(np.exp(self.beta * x)) / self.beta
        )
        return output

    def backward(self, grad_output: np.ndarray) -> np.ndarray:
        """
        Gradient: dy/dx = sigmoid(beta * x)
        = exp(beta * x) / (1 + exp(beta * x))
        = 1 / (1 + exp(-beta * x))
        """
        x = self.cache['x']

        # Stable sigmoid computation
        sigmoid = np.where(
            x * self.beta > self.threshold,
            1.0,
            1.0 / (1.0 + np.exp(-self.beta * x))
        )

        return grad_output * sigmoid


class CausalConv1D(Layer):
    """
    1D Causal Convolution - No future information leakage

    Uses left-padding to ensure output[t] only depends on input[:t+1].
    Supports dilation for capturing long-range dependencies.

    Parameters:
        in_channels: Number of input channels
        out_channels: Number of output channels (filters)
        kernel_size: Size of the convolving kernel
        dilation: Spacing between kernel elements (default: 1)
        bias: Whether to add a learnable bias
    """

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int,
        dilation: int = 1,
        bias: bool = True
    ):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.kernel_size = kernel_size
        self.dilation = dilation

        # Calculate padding for causal convolution
        # Padding = (kernel_size - 1) * dilation
        self.padding = (kernel_size - 1) * dilation

        # He initialization (good for ReLU)
        scale = np.sqrt(2.0 / (in_channels * kernel_size))
        self.weight = np.random.randn(out_channels, in_channels, kernel_size) * scale
        self.bias_flag = bias
        self.bias = np.zeros(out_channels) if bias else None

        # Gradients
        self.grad_weight = np.zeros_like(self.weight)
        self.grad_bias = np.zeros_like(self.bias) if bias else None

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        Forward pass with causal padding

        Args:
            x: Input of shape (batch, seq_len, in_channels)
        Returns:
            Output of shape (batch, seq_len, out_channels)
        """
        batch_size, seq_len, _ = x.shape

        # Add causal padding (only on the left)
        if self.padding > 0:
            x_padded = np.pad(
                x,
                ((0, 0), (self.padding, 0), (0, 0)),
                mode='constant',
                constant_values=0
            )
        else:
            x_padded = x

        self.cache['x_padded'] = x_padded
        self.cache['x_shape'] = x.shape

        # Perform convolution using im2col approach for efficiency
        # Create sliding windows
        output = np.zeros((batch_size, seq_len, self.out_channels))

        for t in range(seq_len):
            # Extract receptive field for position t
            # With dilation, we sample every 'dilation' steps
            receptive_field = []
            for k in range(self.kernel_size):
                idx = t + self.padding - k * self.dilation
                if 0 <= idx < x_padded.shape[1]:
                    receptive_field.append(x_padded[:, idx, :])
                else:
                    receptive_field.append(np.zeros((batch_size, self.in_channels)))

            # Stack: (batch, kernel_size, in_channels)
            receptive_field = np.stack(receptive_field[::-1], axis=1)

            # Convolve: sum over kernel_size and in_channels
            # weight: (out_channels, in_channels, kernel_size)
            for oc in range(self.out_channels):
                output[:, t, oc] = np.sum(
                    receptive_field * self.weight[oc].T,  # (in_channels, kernel_size).T
                    axis=(1, 2)
                )

        # Add bias
        if self.bias is not None:
            output = output + self.bias

        return output

    def backward(self, grad_output: np.ndarray) -> np.ndarray:
        """
        Backward pass for causal convolution

        Args:
            grad_output: Gradient w.r.t. output, shape (batch, seq_len, out_channels)
        Returns:
            Gradient w.r.t. input, shape (batch, seq_len, in_channels)
        """
        x_padded = self.cache['x_padded']
        batch_size, seq_len, _ = self.cache['x_shape']

        # Initialize gradients
        self.grad_weight = np.zeros_like(self.weight)
        if self.bias is not None:
            self.grad_bias = np.sum(grad_output, axis=(0, 1))

        grad_input_padded = np.zeros_like(x_padded)

        for t in range(seq_len):
            for k in range(self.kernel_size):
                idx = t + self.padding - k * self.dilation
                if 0 <= idx < x_padded.shape[1]:
                    # Gradient w.r.t. weight
                    # dL/dW[oc, ic, k] += sum over batch,t of dL/dy[b,t,oc] * x[b, idx, ic]
                    for oc in range(self.out_channels):
                        for ic in range(self.in_channels):
                            self.grad_weight[oc, ic, self.kernel_size - 1 - k] += np.sum(
                                grad_output[:, t, oc] * x_padded[:, idx, ic]
                            )

                    # Gradient w.r.t. input
                    # dL/dx[b, idx, ic] += sum over oc of dL/dy[b,t,oc] * W[oc, ic, k]
                    for oc in range(self.out_channels):
                        grad_input_padded[:, idx, :] += np.outer(
                            grad_output[:, t, oc],
                            self.weight[oc, :, self.kernel_size - 1 - k]
                        ).reshape(batch_size, self.in_channels)

        # Remove padding from gradient
        if self.padding > 0:
            grad_input = grad_input_padded[:, self.padding:, :]
        else:
            grad_input = grad_input_padded

        return grad_input

    def get_parameters(self) -> List[np.ndarray]:
        if self.bias is not None:
            return [self.weight, self.bias]
        return [self.weight]

    def get_gradients(self) -> List[np.ndarray]:
        if self.bias is not None:
            return [self.grad_weight, self.grad_bias]
        return [self.grad_weight]


class ResidualBlock(Layer):
    """
    Residual block with dilated causal convolutions

    Architecture:
        x -> Conv1 -> ReLU -> Conv2 -> ReLU -> (+) -> out
        |                                       ^
        +---------- (optional 1x1 conv) --------+

    The skip connection uses a 1x1 convolution if input and output
    channels differ, otherwise it's an identity connection.
    """

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int,
        dilation: int = 1
    ):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels

        # Main path
        self.conv1 = CausalConv1D(in_channels, out_channels, kernel_size, dilation)
        self.relu1 = ReLU()
        self.conv2 = CausalConv1D(out_channels, out_channels, kernel_size, dilation)
        self.relu2 = ReLU()

        # Skip connection (1x1 conv if dimensions don't match)
        self.skip_conv = None
        if in_channels != out_channels:
            self.skip_conv = Linear(in_channels, out_channels, bias=False)

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        Forward pass with residual connection

        Args:
            x: Input of shape (batch, seq_len, in_channels)
        Returns:
            Output of shape (batch, seq_len, out_channels)
        """
        # Main path
        out = self.conv1.forward(x)
        out = self.relu1.forward(out)
        out = self.conv2.forward(out)

        # Skip connection
        if self.skip_conv is not None:
            skip = self.skip_conv.forward(x)
        else:
            skip = x

        # Add and activate
        self.cache['pre_relu2'] = out + skip
        out = self.relu2.forward(out + skip)

        return out

    def backward(self, grad_output: np.ndarray) -> np.ndarray:
        """Backward pass through residual block"""

        # Backward through final ReLU
        grad = self.relu2.backward(grad_output)

        # Split gradient for residual connection
        grad_main = grad
        grad_skip = grad

        # Backward through main path
        grad_main = self.conv2.backward(grad_main)
        grad_main = self.relu1.backward(grad_main)
        grad_main = self.conv1.backward(grad_main)

        # Backward through skip connection
        if self.skip_conv is not None:
            grad_skip = self.skip_conv.backward(grad_skip)

        # Combine gradients
        return grad_main + grad_skip

    def get_parameters(self) -> List[np.ndarray]:
        params = self.conv1.get_parameters() + self.conv2.get_parameters()
        if self.skip_conv is not None:
            params += self.skip_conv.get_parameters()
        return params

    def get_gradients(self) -> List[np.ndarray]:
        grads = self.conv1.get_gradients() + self.conv2.get_gradients()
        if self.skip_conv is not None:
            grads += self.skip_conv.get_gradients()
        return grads


class Dropout(Layer):
    """
    Dropout regularization layer

    During training, randomly zeros elements with probability p.
    During evaluation, scales output by (1-p) or uses inverted dropout.
    """

    def __init__(self, p: float = 0.5):
        super().__init__()
        self.p = p

    def forward(self, x: np.ndarray) -> np.ndarray:
        if self.training and self.p > 0:
            # Inverted dropout: scale during training
            self.cache['mask'] = (np.random.rand(*x.shape) > self.p) / (1 - self.p)
            return x * self.cache['mask']
        return x

    def backward(self, grad_output: np.ndarray) -> np.ndarray:
        if self.training and self.p > 0:
            return grad_output * self.cache['mask']
        return grad_output


class LayerNorm(Layer):
    """
    Layer Normalization

    Normalizes across the last dimension (features).
    y = (x - mean) / sqrt(var + eps) * gamma + beta
    """

    def __init__(self, normalized_shape: int, eps: float = 1e-5):
        super().__init__()
        self.normalized_shape = normalized_shape
        self.eps = eps

        # Learnable parameters
        self.gamma = np.ones(normalized_shape)
        self.beta = np.zeros(normalized_shape)

        # Gradients
        self.grad_gamma = np.zeros_like(self.gamma)
        self.grad_beta = np.zeros_like(self.beta)

    def forward(self, x: np.ndarray) -> np.ndarray:
        # Compute mean and variance along last dimension
        mean = np.mean(x, axis=-1, keepdims=True)
        var = np.var(x, axis=-1, keepdims=True)

        # Normalize
        x_norm = (x - mean) / np.sqrt(var + self.eps)

        # Cache for backward
        self.cache['x'] = x
        self.cache['mean'] = mean
        self.cache['var'] = var
        self.cache['x_norm'] = x_norm

        # Scale and shift
        return self.gamma * x_norm + self.beta

    def backward(self, grad_output: np.ndarray) -> np.ndarray:
        x = self.cache['x']
        mean = self.cache['mean']
        var = self.cache['var']
        x_norm = self.cache['x_norm']

        N = x.shape[-1]

        # Gradients for gamma and beta
        self.grad_gamma = np.sum(grad_output * x_norm, axis=tuple(range(len(x.shape)-1)))
        self.grad_beta = np.sum(grad_output, axis=tuple(range(len(x.shape)-1)))

        # Gradient for input
        dx_norm = grad_output * self.gamma

        std_inv = 1.0 / np.sqrt(var + self.eps)

        dx = (1.0 / N) * std_inv * (
            N * dx_norm
            - np.sum(dx_norm, axis=-1, keepdims=True)
            - x_norm * np.sum(dx_norm * x_norm, axis=-1, keepdims=True)
        )

        return dx

    def get_parameters(self) -> List[np.ndarray]:
        return [self.gamma, self.beta]

    def get_gradients(self) -> List[np.ndarray]:
        return [self.grad_gamma, self.grad_beta]
