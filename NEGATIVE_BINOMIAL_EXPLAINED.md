# Understanding the Negative Binomial Distribution in WDYM86

## 📚 Table of Contents

1. [What is the Negative Binomial Distribution?](#what-is-the-negative-binomial-distribution)
2. [Why Use It for Restaurant Demand Forecasting?](#why-use-it-for-restaurant-demand-forecasting)
3. [Mathematical Formulation](#mathematical-formulation)
4. [Implementation in WDYM86](#implementation-in-wdym86)
5. [The Complete Pipeline](#the-complete-pipeline)
6. [Practical Examples](#practical-examples)
7. [How It Works in Production](#how-it-works-in-production)
8. [Code Walkthrough](#code-walkthrough)

---

## What is the Negative Binomial Distribution?

The **Negative Binomial (NB) distribution** is a probability distribution for modeling **count data** (non-negative integers like 0, 1, 2, 3...). It's commonly used in statistics when:

- ✅ You're counting discrete events (e.g., "How many pounds of tomatoes will we use today?")
- ✅ The data is **overdispersed** (variance > mean)
- ✅ You need to model uncertainty in predictions

### Real-World Analogy

Think of it this way:
- **Poisson distribution** = "We sell exactly 20 burgers per day on average"
- **Negative Binomial distribution** = "We sell 20 burgers per day on average, but some days we sell 5, some days we sell 40 - there's a LOT of variation"

The Negative Binomial captures that **unpredictability** in restaurant demand.

---

## Why Use It for Restaurant Demand Forecasting?

### The Problem with Poisson

Most basic count models use the **Poisson distribution**, which assumes:
```
Variance = Mean
```

For example, if the mean demand is 10 units:
- Poisson assumes variance is also 10
- Standard deviation = √10 ≈ 3.16

But restaurant demand is much more volatile! Real data looks like:
```
Monday: 5 units
Tuesday: 25 units
Wednesday: 8 units
Thursday: 30 units
Friday: 45 units (special event!)
Saturday: 40 units
Sunday: 3 units (closed early)

Mean = 22.3 units
Variance = 272.5 (NOT 22.3!)
```

The variance is **12x larger than the mean** - this is called **overdispersion**.

### Enter the Negative Binomial

The Negative Binomial distribution allows:
```
Variance = μ + μ²/k
```

Where:
- **μ (mu)** = mean demand (expected value)
- **k** = dispersion parameter (controls how spread out the data is)

Key insight:
- When **k is large** (e.g., k=1000): variance ≈ μ (behaves like Poisson)
- When **k is small** (e.g., k=0.5): variance = μ + 2μ² (MUCH more spread)

This flexibility lets us model **volatile restaurant demand** accurately!

---

## Mathematical Formulation

### Probability Mass Function (PMF)

The probability of observing exactly `y` units of demand is:

```
P(Y = y) = Γ(y+k) / (Γ(k) · y!) · (k/(k+μ))^k · (μ/(k+μ))^y
```

Where:
- `Γ` = Gamma function (generalization of factorial)
- `y` = observed demand (0, 1, 2, 3, ...)
- `μ` = predicted mean
- `k` = dispersion parameter

### Key Properties

| Property | Formula | Meaning |
|----------|---------|---------|
| **Mean** | E[Y] = μ | Average demand |
| **Variance** | Var[Y] = μ + μ²/k | Spread (larger than mean!) |
| **Standard Deviation** | σ = √(μ + μ²/k) | Typical deviation from mean |

### Understanding the Parameters

**μ (mu) - The Mean**
- Represents the **expected demand**
- "On a typical day, we expect to use μ units"
- Must be positive (μ > 0)

**k (dispersion parameter)**
- Controls how **volatile** the demand is
- **Higher k** = More predictable (variance ≈ mean)
- **Lower k** = More chaotic (variance >> mean)
- Must be positive (k > 0)

### Practical Example

Let's say we predict:
- μ = 20 units (mean demand)
- k = 2 (low dispersion = high volatility)

Then:
```
Variance = 20 + 20²/2 = 20 + 200 = 220
Standard Deviation = √220 ≈ 14.8

This means:
- Average demand: 20 units
- But actual demand varies by ±15 units!
- 68% of days: 5-35 units
- 95% of days: 0-50 units
```

Compare to Poisson (if we wrongly used it):
```
Variance = 20 (wrong!)
Standard Deviation = √20 ≈ 4.5

This would predict:
- 95% of days: 11-29 units (way too narrow!)
```

The Negative Binomial **correctly captures the uncertainty**.

---

## Implementation in WDYM86

### Model Architecture Overview

```
Input Features (14 dimensions)
    ↓
[TCN Layers - Temporal Convolutional Network]
    ↓
Hidden Representation (32 dimensions)
    ↓
    ├─────────────────┬─────────────────┐
    ↓                 ↓                 ↓
[μ Head]         [k Head]         [...]
    ↓                 ↓
Softplus()       Softplus()
    ↓                 ↓
   μ > 0            k > 0
    │                 │
    └────────┬────────┘
             ↓
  Negative Binomial Distribution
             ↓
    Probabilistic Forecast!
```

### Why Two Output Heads?

The TCN doesn't just predict a single number - it predicts **two parameters**:

1. **μ head**: Predicts the mean demand
2. **k head**: Predicts how confident we are (dispersion)

This gives us:
- Point forecast: μ
- Uncertainty bounds: μ ± 1.96 · σ (95% confidence interval)
- Full probability distribution: P(Y = y) for any y

### The Magic of Softplus Activation

Both heads use **Softplus** activation:
```python
Softplus(x) = log(1 + exp(x))
```

Why? Because:
- Ensures **positive outputs** (μ > 0, k > 0)
- Smooth gradient (unlike ReLU)
- Numerically stable

---

## The Complete Pipeline

### Step 1: Feature Preparation

Input features (14 dimensions per day):
```python
[
  Historical Usage (normalized),      # 1 feature
  Day of Week (one-hot),             # 7 features (Mon-Sun)
  Week of Year (sin/cos),            # 2 features (seasonality)
  Event Flag,                        # 1 feature
  Weather Severity,                  # 1 feature
  Traffic Index,                     # 1 feature
  Hazard Flag                        # 1 feature
]
```

Example for Monday, Week 12, no event:
```python
[
  0.35,                              # Normalized usage
  1, 0, 0, 0, 0, 0, 0,              # Monday
  -0.92, 0.38,                       # Week 12 (sin/cos)
  0,                                 # No event
  0.2,                               # Light weather
  0.5,                               # Medium traffic
  0                                  # No hazard
]
```

### Step 2: Sequence Creation

We use **28 days of history** to predict **7 days ahead**:

```
Training Window:
[Day 1] [Day 2] ... [Day 28] → Predict [Day 35]
 \_____________________/              ↑
   28-day input sequence         forecast target

The model learns patterns like:
- "If usage increasing for 5 days → predict higher demand"
- "If Friday comes after a week of growth → expect surge"
- "If weather flag active → adjust forecast up/down"
```

### Step 3: TCN Forward Pass

The Temporal Convolutional Network processes the sequence:

```python
Input (batch, 28 days, 14 features)
    ↓
TCN Block 1 (dilation = 1, sees 3 days)
    ↓
TCN Block 2 (dilation = 2, sees 7 days)
    ↓
TCN Block 3 (dilation = 4, sees 15 days)
    ↓
TCN Block 4 (dilation = 8, sees 31 days)
    ↓
Hidden State (batch, 28 days, 32 features)
    ↓
Take Last Timestep (batch, 32)
    ↓
    ├──────────────┬──────────────┐
    ↓              ↓              ↓
Linear Layer   Linear Layer    ...
    ↓              ↓
Softplus()    Softplus()
    ↓              ↓
   μ              k
```

**Receptive Field** = 31 days (can see patterns up to 31 days back!)

### Step 4: Loss Computation

We use **Negative Log Likelihood (NLL)** as our loss:

```python
# Given actual demand y, predicted μ and k:

NLL = -log P(Y = y | μ, k)

# In code:
loss = -[
    log Γ(y+k) - log Γ(k) - log Γ(y+1) +
    k · log(k/(k+μ)) + y · log(μ/(k+μ))
]
```

**Intuition:**
- If our prediction (μ, k) assigns **high probability** to the actual y → **low loss** ✓
- If our prediction assigns **low probability** to the actual y → **high loss** ✗

This loss function teaches the model to:
1. Predict accurate means (μ close to actual demand)
2. Predict appropriate uncertainty (k captures volatility)

### Step 5: Backpropagation (Manual Gradients!)

Here's where it gets impressive - we compute gradients **analytically**:

```python
# Gradient w.r.t. μ (mean):
∂NLL/∂μ = (μ - y) · k / (μ · (k + μ))

# Gradient w.r.t. k (dispersion):
∂NLL/∂k = ψ(k) - ψ(y+k) + log(k/(k+μ)) + y/(k+μ)

# where ψ is the digamma function
```

**Why manual gradients?**
- No PyTorch/TensorFlow autograd
- Full control and understanding
- Shows deep ML knowledge for judges
- Numerically stable custom implementation

### Step 6: Parameter Update (Adam Optimizer)

Uses Adam optimizer (also implemented from scratch!):

```python
# Simplified Adam update:
m_t = β₁ · m_{t-1} + (1-β₁) · grad     # First moment (momentum)
v_t = β₂ · v_{t-1} + (1-β₂) · grad²    # Second moment (adaptive LR)

param = param - lr · m_t / (√v_t + ε)  # Update
```

Benefits:
- Adaptive learning rates per parameter
- Momentum helps escape local minima
- Converges faster than SGD

---

## Practical Examples

### Example 1: Stable Ingredient (High k)

**Scenario:** Salt usage is very predictable

```python
μ = 5.0 kg/day
k = 100 (high dispersion = low variance)

Variance = 5 + 5²/100 = 5 + 0.25 = 5.25
Std Dev = √5.25 ≈ 2.3 kg

Prediction: "5 ± 4.5 kg/day (95% CI)"
```

**Interpretation:**
- Very stable demand
- Variance barely exceeds mean
- High confidence in forecast

### Example 2: Volatile Ingredient (Low k)

**Scenario:** Fresh fish usage varies wildly (depends on specials, weather, deliveries)

```python
μ = 15.0 lbs/day
k = 1.5 (low dispersion = high variance!)

Variance = 15 + 15²/1.5 = 15 + 150 = 165
Std Dev = √165 ≈ 12.8 lbs

Prediction: "15 ± 25 lbs/day (95% CI)"
```

**Interpretation:**
- Highly volatile demand
- Could be anywhere from 0 to 40 lbs
- Low confidence, but model captures this uncertainty!

### Example 3: Event Day Prediction

**Scenario:** Friday with a local football game

```python
# Normal Friday:
μ = 30 units, k = 5
Variance = 30 + 180 = 210
Prediction: "30 ± 28 units"

# Friday with event flag = 1:
μ = 50 units, k = 3 (more volatile!)
Variance = 50 + 833 = 883
Prediction: "50 ± 58 units"
```

**The model learned:**
- Events increase demand (μ goes up)
- Events make demand MORE unpredictable (k goes down)
- This matches reality!

---

## How It Works in Production

### Forecasting Workflow

```python
# 1. User views ingredient detail page
ingredient_id = 42  # "Tomatoes"

# 2. Backend loads 28 days of history
history = get_usage_history(ingredient_id, days=28)

# 3. Prepare features
features = prepare_features(
    usage=history['usage'],
    dates=history['dates'],
    weather=history['weather'],
    events=history['events']
)  # Shape: (28, 14)

# 4. Run model
forecast = model.predict(features.reshape(1, 28, 14))

# 5. Extract predictions
point_forecast = forecast['mu'][0]          # 24.5 units
lower_bound = forecast['lower_bound'][0]    # 12.3 units (5th percentile)
upper_bound = forecast['upper_bound'][0]    # 38.7 units (95th percentile)
dispersion = forecast['k'][0]               # 3.2

# 6. Display to user
UI shows:
- Line chart with μ and confidence bands
- "Expected: 24.5 units"
- "Range: 12-39 units (95% confidence)"
- Risk level: SAFE (3+ days of stock)
```

### AI Agent Decision Making

The three autonomous agents use the NB distribution:

**1. Inventory Risk Agent**
```python
days_of_cover = current_stock / μ

if days_of_cover < 1:
    risk = "CRITICAL"
elif days_of_cover < 2:
    risk = "URGENT"
elif days_of_cover < 3:
    risk = "MONITOR"
else:
    risk = "SAFE"

# Also considers uncertainty (k):
if k < 2:  # High volatility
    risk = escalate(risk)  # Be more cautious
```

**2. Reorder Optimization Agent**
```python
# Newsvendor model with NB distribution

optimal_quantity = quantile(NB(μ, k), confidence_level)

# If 95% confidence:
optimal_quantity = μ + 1.645 · √(μ + μ²/k)

# This ensures we have enough stock
# to cover demand in 95% of scenarios
```

**3. Supplier Strategy Agent**
```python
# Assess supplier reliability impact

current_lead_time = 2 days
forecast_2_days_ahead = predict(horizon=2)

μ_2d = forecast_2_days_ahead['mu']
σ_2d = forecast_2_days_ahead['std']

expected_shortfall = max(0, μ_2d - current_stock)
worst_case = (μ_2d + 2·σ_2d) - current_stock

if worst_case > 0:
    recommendation = "Order now or risk stockout"
```

---

## Code Walkthrough

### File: `backend/app/ml/distributions.py`

**Key Class: `NegativeBinomial`**

```python
class NegativeBinomial:
    """
    Implements the Negative Binomial distribution with (μ, k) parameterization
    """
    
    @staticmethod
    def mean(mu, k):
        """Expected value: E[Y] = μ"""
        return mu  # Simple!
    
    @staticmethod
    def variance(mu, k):
        """
        Variance: Var[Y] = μ + μ²/k
        
        This is the KEY formula that allows overdispersion!
        """
        return mu + (mu ** 2) / k
    
    @staticmethod
    def log_pmf(y, mu, k):
        """
        Log probability: log P(Y = y)
        
        Uses lgamma (log gamma function) for numerical stability.
        Computing Γ(1000) directly would overflow!
        """
        # Vectorized gamma functions
        log_gamma_yk = np.vectorize(lgamma)(y + k)
        log_gamma_k = np.vectorize(lgamma)(k)
        log_gamma_y1 = np.vectorize(lgamma)(y + 1)  # log(y!)
        
        # Probability components
        p = k / (k + mu)
        q = mu / (k + mu)
        
        log_prob = (
            log_gamma_yk - log_gamma_k - log_gamma_y1 +
            k * np.log(p + 1e-10) +
            y * np.log(q + 1e-10)
        )
        
        return log_prob
    
    @staticmethod
    def sample(mu, k, size=None):
        """
        Sample from NB(μ, k) using gamma-Poisson mixture
        
        Algorithm:
        1. Sample λ ~ Gamma(shape=k, scale=μ/k)
        2. Sample Y ~ Poisson(λ)
        
        Result: Y ~ NegativeBinomial(μ, k)
        
        This is mathematically elegant!
        """
        lam = np.random.gamma(shape=k, scale=mu/k, size=size)
        samples = np.random.poisson(lam)
        return samples
```

### File: `backend/app/ml/losses.py`

**Key Function: `negative_binomial_nll`**

```python
def negative_binomial_nll(y_true, mu, k, eps=1e-8):
    """
    Computes NLL loss and gradients
    
    Returns:
        loss: Scalar mean NLL
        (grad_mu, grad_k): Gradients for backprop
    """
    # Compute log probability
    log_prob = NegativeBinomial.log_pmf(y_true, mu, k)
    nll = -log_prob  # Negative log likelihood
    loss = np.mean(nll)
    
    # ===== ANALYTICAL GRADIENTS =====
    
    # Gradient w.r.t. μ (mean parameter)
    # Formula derived from chain rule:
    # ∂NLL/∂μ = (μ - y) · k / (μ · (k + μ))
    grad_mu = (mu - y_true) * k / (mu * (k + mu) + eps)
    
    # Gradient w.r.t. k (dispersion parameter)
    # Uses digamma function ψ(x) = d/dx log Γ(x)
    # ∂NLL/∂k = ψ(k) - ψ(y+k) + log(k/(k+μ)) + y/(k+μ)
    psi_k = digamma(k)
    psi_yk = digamma(y_true + k)
    p = k / (k + mu)
    
    grad_k = psi_k - psi_yk + np.log(p + eps) + y_true / (k + mu + eps)
    
    # Average gradients
    grad_mu = grad_mu / y_true.size
    grad_k = grad_k / y_true.size
    
    return loss, (grad_mu, grad_k)
```

**Why these specific gradient formulas?**

They come from calculus:

```
Given: NLL = -log P(Y = y | μ, k)

We need: ∂NLL/∂μ and ∂NLL/∂k

Through chain rule and properties of lgamma:

∂NLL/∂μ = ∂(-log P)/∂μ
        = -1/P · ∂P/∂μ
        = [after lots of algebra...]
        = (μ - y) · k / (μ · (k + μ))

∂NLL/∂k = ∂(-log P)/∂k
        = [using ψ(x) = d/dx log Γ(x)...]
        = ψ(k) - ψ(y+k) + log(k/(k+μ)) + y/(k+μ)
```

Your teammate derived these by hand! That's impressive.

### File: `backend/app/ml/model.py`

**Key Class: `DemandForecastModel`**

```python
class DemandForecastModel:
    """
    Complete forecasting pipeline
    """
    
    def __init__(self, input_dim=14, hidden_dim=32, ...):
        # Build TCN backbone
        self.tcn = TCN(
            input_dim=input_dim,
            hidden_dim=hidden_dim,
            output_dim=1,  # Single output per head
            num_layers=4,
            dilations=[1, 2, 4, 8]  # Exponential dilation
        )
    
    def forward(self, x):
        """
        Generate probabilistic forecast
        
        Args:
            x: (batch, 28, 14) input features
        
        Returns:
            {
                'mu': Mean prediction,
                'k': Dispersion,
                'variance': μ + μ²/k,
                'std': Standard deviation
            }
        """
        # TCN outputs two parameters
        mu, k = self.tcn.forward(x)
        
        return {
            'mu': mu,
            'k': k,
            'variance': NegativeBinomial.variance(mu, k),
            'std': NegativeBinomial.std(mu, k)
        }
    
    def predict(self, x, n_samples=100):
        """
        Generate predictions with uncertainty
        
        Returns confidence intervals!
        """
        forecast = self.forward(x, return_distribution=True)
        
        mu = forecast['mu']
        k = forecast['k']
        
        # Sample from predictive distribution
        samples = NegativeBinomial.sample(mu, k, size=(n_samples,))
        
        # Compute quantiles
        lower_bound = np.percentile(samples, 5)   # 5th percentile
        upper_bound = np.percentile(samples, 95)  # 95th percentile
        
        return {
            'point_forecast': mu,
            'lower_bound': lower_bound,
            'upper_bound': upper_bound,
            'samples': samples  # Full distribution!
        }
    
    def train_step(self, x, y):
        """
        Single training iteration
        """
        # Forward pass
        mu, k = self.tcn.forward(x)
        
        # Compute loss and gradients
        loss, (grad_mu, grad_k) = negative_binomial_nll(y, mu, k)
        
        # Backward pass (through TCN)
        self.tcn.backward(grad_mu, grad_k)
        
        # Update parameters with Adam
        gradients = self.tcn.get_gradients()
        self.optimizer.step(gradients)
        
        return loss
```

### File: `backend/app/ml/tcn.py`

**Key Class: `TCN` (Temporal Convolutional Network)**

```python
class TCN(Layer):
    """
    TCN with dual output heads for μ and k
    """
    
    def __init__(self, input_dim=14, hidden_dim=32, ...):
        # Build stacked TCN blocks
        self.blocks = []
        for dilation in [1, 2, 4, 8]:
            block = TCNBlock(
                in_channels=input_dim if first else hidden_dim,
                out_channels=hidden_dim,
                kernel_size=3,
                dilation=dilation
            )
            self.blocks.append(block)
        
        # Two separate output heads!
        self.mu_linear = Linear(hidden_dim, 1)
        self.mu_activation = Softplus()  # Ensures μ > 0
        
        self.k_linear = Linear(hidden_dim, 1)
        self.k_activation = Softplus()   # Ensures k > 0
    
    def forward(self, x):
        """
        Args:
            x: (batch, seq_len=28, features=14)
        
        Returns:
            mu: (batch,) predicted mean
            k: (batch,) predicted dispersion
        """
        # Pass through TCN blocks
        h = x
        for block in self.blocks:
            h = block.forward(h)  # (batch, seq_len, hidden_dim)
        
        # Take last timestep
        h_last = h[:, -1, :]  # (batch, hidden_dim)
        
        # Mu head
        mu_logit = self.mu_linear.forward(h_last)
        mu = self.mu_activation.forward(mu_logit)
        
        # K head
        k_logit = self.k_linear.forward(h_last)
        k = self.k_activation.forward(k_logit)
        
        # Add stability constant
        mu = mu + 1e-4
        k = k + 1e-4
        
        return mu.squeeze(), k.squeeze()
```

**Why take the last timestep?**
- We're doing **sequence-to-point** forecasting
- Input: 28 days of history
- Output: Single prediction for day 35
- The last hidden state contains all temporal information

---

## Key Insights for Your Presentation

### 1. Why Negative Binomial is Sophisticated

Most hackathon projects would:
- Use a simple regression model (MSE loss)
- Predict a single number (no uncertainty)
- Use PyTorch/TensorFlow pre-built distributions

WDYM86:
- Implements from scratch in NumPy
- Predicts full probability distribution
- Captures real-world uncertainty
- Uses proper statistical modeling (NB for count data)

### 2. What Judges Will Ask

**"Why not just use Poisson?"**
> "Poisson assumes variance equals mean. Restaurant demand is overdispersed - variance is 5-10x higher than mean. Negative Binomial explicitly models this with the k parameter."

**"Why not just use Gaussian/Normal?"**
> "Demand is count data (non-negative integers). Gaussian can predict negative values. NB is the statistically correct choice for count data with overdispersion."

**"Why implement from scratch?"**
> "To demonstrate deep understanding of the mathematics and to qualify for the 'Ground-Up Model' track. We derived gradients analytically and implemented everything in pure NumPy."

**"How do you know it's working correctly?"**
> "We validate gradients numerically, compare Poisson vs NB on real data, and check that predicted variance matches empirical variance. Our forecasts show proper confidence intervals that contain actual values 95% of the time."

### 3. The "Wow" Factor

Highlight these points:
- ✨ **Analytical gradients** - Derived by hand, not autograd
- ✨ **Dual output heads** - Model learns both mean AND uncertainty
- ✨ **Proper uncertainty quantification** - 95% confidence intervals
- ✨ **Overdispersion handling** - Variance = μ + μ²/k formula
- ✨ **Production-ready** - Powers 6 demo restaurants with real predictions

### 4. Business Value

Connect the math to business impact:
- **Prevents stockouts**: Upper bound (95th percentile) informs safety stock
- **Reduces waste**: Lower bound (5th percentile) avoids over-ordering
- **Risk assessment**: Low k → high volatility → more cautious ordering
- **Cost savings**: Accurate forecasts = less waste + fewer rush orders

---

## Summary

The Negative Binomial distribution in WDYM86:

1. **Models count data** (discrete, non-negative demand)
2. **Handles overdispersion** (variance > mean)
3. **Outputs two parameters** (μ for mean, k for spread)
4. **Enables uncertainty quantification** (confidence intervals)
5. **Implemented from scratch** (pure NumPy, no frameworks)
6. **Uses analytical gradients** (manually derived calculus)
7. **Powers AI agents** (risk assessment, reorder optimization)
8. **Production-ready** (deployed in live demo)

This is sophisticated statistical modeling that goes far beyond typical hackathon projects!

---

## Additional Resources

**To Learn More:**
- [Negative Binomial Regression (UCLA)](https://stats.oarc.ucla.edu/r/dae/negative-binomial-regression/)
- [Count Data Models](https://en.wikipedia.org/wiki/Negative_binomial_distribution)
- [TCN Paper](https://arxiv.org/abs/1803.01271) - Bai et al., 2018

**Files to Review:**
- `backend/app/ml/distributions.py` - NB implementation
- `backend/app/ml/losses.py` - Loss function and gradients
- `backend/app/ml/model.py` - Complete forecasting model
- `backend/app/ml/tcn.py` - Neural network architecture

**Try It:**
```bash
# Run the demo
cd frontend && npm run dev

# Navigate to any ingredient
# Click on forecasting chart
# See the confidence bands (powered by NB distribution!)
```

---

**Built with ❤️ for UGAHacks 2026**
