# WDYM86 - AI-Powered Restaurant Inventory Intelligence

An AI-powered inventory intelligence platform for restaurants featuring:
- **Ground-up probabilistic forecasting** (NumPy TCN + Negative Binomial)
- **Autonomous AI agents** (Risk, Reorder, Supplier Strategy)
- **Gemini-powered explanations** and conversational interface

Built for hackathon tracks:
- Ground-Up Model Track
- Best Overall Track
- MLH Best Use of Google Gemini API

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/TS)                       │
│   Dashboard │ Ingredient Details │ Gemini Chat │ Visualizations │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (Python)                     │
│     Auth │ Restaurants │ Ingredients │ Forecasts │ Agents       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Ground-Up ML   │ │  AI Agents      │ │  Gemini Layer   │
│  NumPy TCN      │ │  Risk Agent     │ │  Explanations   │
│  NB Loss        │ │  Reorder Agent  │ │  Chat Advisor   │
│  Adam Optimizer │ │  Strategy Agent │ │  What-If        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Key Differentiators

### 1. Ground-Up Model (No PyTorch/TensorFlow)
- **Temporal Convolutional Network** implemented in pure NumPy
- **Negative Binomial loss** with manual gradient derivation
- **Adam optimizer** from scratch
- All backpropagation computed manually

### 2. Autonomous AI Agents
Each agent has **goals, state, and actions**:
- **InventoryRiskAgent**: Detects stockout risk, computes probability
- **ReorderOptimizationAgent**: Determines optimal timing and quantity
- **SupplierStrategyAgent**: Adapts to disruptions (weather, traffic, hazards)

### 3. Gemini for Reasoning (Not Forecasting)
Gemini is used **ONLY** for:
- Explaining agent decisions in natural language
- Answering manager questions conversationally
- What-if scenario analysis
- **NOT** for forecasting or computing quantities

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key (optional, uses mock responses without it)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# Run server
uvicorn app.main:app --reload
```

API will be available at http://localhost:8000
Swagger docs at http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend will be available at http://localhost:3000

### Docker (Full Stack)

```bash
# Set Gemini API key
export GEMINI_API_KEY=your-key-here

# Run everything
docker-compose up -d
```

## API Endpoints

### Core Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /ingredients?restaurant_id=X` - List ingredients
- `POST /forecasts/{ingredient_id}` - Generate forecast
- `POST /agents/{ingredient_id}/run` - Run agent pipeline
- `GET /agents/dashboard?restaurant_id=X` - Dashboard summary

### Gemini Endpoints
- `POST /gemini/explain` - Explain a decision
- `POST /gemini/chat` - Chat with AI advisor
- `POST /gemini/what-if` - Scenario analysis

## Project Structure

```
wdym86/
├── backend/
│   ├── app/
│   │   ├── ml/                 # Ground-up ML (NumPy)
│   │   │   ├── layers.py       # Conv1D, ReLU, Softplus
│   │   │   ├── tcn.py          # TCN architecture
│   │   │   ├── losses.py       # Negative Binomial NLL
│   │   │   ├── optimizers.py   # Adam from scratch
│   │   │   └── model.py        # Full forecasting model
│   │   ├── agents/             # Autonomous AI agents
│   │   │   ├── inventory_risk.py
│   │   │   ├── reorder_opt.py
│   │   │   ├── supplier_strategy.py
│   │   │   └── orchestrator.py
│   │   ├── gemini/             # Gemini integration
│   │   │   ├── client.py
│   │   │   ├── prompts.py
│   │   │   └── explainer.py
│   │   ├── routers/            # API endpoints
│   │   └── models/             # Pydantic models
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── IngredientDetail.tsx
│   │   │   └── GeminiChat.tsx
│   │   ├── components/
│   │   └── services/
│   └── package.json
└── docker-compose.yml
```

## Demo Scenarios

### 1. Urgent Reorder
- Chicken running low + storm warning
- Agent recommends immediate order
- Gemini explains risk factors

### 2. What-If Analysis
- "What if the supplier is delayed 2 days?"
- Strategy agent suggests alternatives
- Gemini provides impact analysis

### 3. Daily Briefing
- Full ingredient dashboard
- Risk heatmap
- Automated recommendations

## Technical Highlights

### Negative Binomial Distribution
Models overdispersed demand (variance > mean):
```
Var(y) = μ + μ²/k
```

### Stockout Probability
Using normal approximation for aggregated demand:
```
P(stockout) = 1 - Φ((inventory - μ_total) / σ_total)
```

### Reorder Quantity
Service-level based safety stock:
```
Q = μ_total + z_α × σ_total - current_inventory
```

## Success Criteria

- [x] TCN implemented in pure NumPy (no PyTorch/TF)
- [x] Negative Binomial loss with manual gradients
- [x] Adam optimizer from scratch
- [x] 3 autonomous agents with goal/state/action
- [x] Gemini explains decisions (not forecasts)
- [x] Working web dashboard with auth
- [x] Clear code separation: ML / Agents / Gemini

## License

MIT License - Built for hackathon demonstration
