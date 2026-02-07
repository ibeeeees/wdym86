# WDYM86 - AI-Powered Restaurant Inventory Intelligence

A comprehensive AI-powered restaurant management platform featuring probabilistic forecasting, autonomous AI agents, and full restaurant operations.

**Demo Restaurant:** Mykonos Mediterranean Restaurant (Athens, GA)

## Features

### AI & Machine Learning
- **Ground-up TCN Model** - Temporal Convolutional Network in pure NumPy (no PyTorch/TensorFlow)
- **Negative Binomial Forecasting** - Probabilistic demand prediction with uncertainty quantification
- **3 Autonomous AI Agents** - Risk assessment, reorder optimization, supplier strategy
- **Gemini Integration** - Natural language explanations and conversational AI advisor

### Restaurant Operations
- **POS System** - Order management, table assignments, checkout
- **Menu Management** - Dishes, recipes, ingredient tracking
- **Inventory Control** - Real-time stock levels, expiration monitoring
- **Supplier Management** - Lead times, reliability scores, multi-sourcing

### Integrations
- **Delivery Platforms** - DoorDash, Uber Eats, Grubhub, Postmates, Seamless
- **Solana Pay** - Cryptocurrency payment processing
- **AWS Infrastructure** - RDS PostgreSQL, S3 storage, Cognito auth

### Subscription Tiers
| Tier | Price | Ingredients | Locations | Key Features |
|------|-------|-------------|-----------|--------------|
| Free | $0 | 10 | 1 | Basic forecasting |
| Starter | $49/mo | 50 | 1 | Gemini AI Chat, POS |
| Pro | $149/mo | 200 | 3 | Supplier Agent, Delivery, API |
| Enterprise | $399/mo | Unlimited | Unlimited | Custom integrations |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (React + TypeScript)                    │
│  Dashboard │ POS │ Delivery │ Dishes │ Suppliers │ Gemini Chat │ Crypto │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend (Python)                          │
│   Auth │ Inventory │ Forecasts │ Agents │ POS │ Delivery │ Payments     │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Ground-Up ML   │   │   AI Agents      │   │   Gemini Layer   │
│   NumPy TCN      │   │   Risk Agent     │   │   Explanations   │
│   NB Distribution│   │   Reorder Agent  │   │   Chat Advisor   │
│   Adam Optimizer │   │   Strategy Agent │   │   What-If        │
└──────────────────┘   └──────────────────┘   └──────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AWS Infrastructure                              │
│           RDS PostgreSQL │ S3 Storage │ Cognito Auth                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **FastAPI** - Async Python web framework
- **SQLAlchemy** - Async ORM with PostgreSQL/SQLite
- **NumPy** - Ground-up ML implementation
- **Google Gemini** - AI explanations and chat
- **Boto3** - AWS SDK

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling (UGA colors: red, black, white)
- **Lucide Icons** - Icon library
- **Recharts** - Data visualization

### Infrastructure
- **AWS RDS** - PostgreSQL database
- **AWS S3** - File storage
- **AWS Cognito** - Authentication (optional)
- **Docker** - Containerization

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key
- AWS account (optional, for production)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run server
uvicorn app.main:app --reload
```

API: http://localhost:8000
Docs: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend: http://localhost:5173

### Docker (Full Stack)

```bash
docker-compose up -d
```

## Environment Variables

```env
# Required
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-key

# Database (SQLite default, PostgreSQL for production)
DATABASE_URL=sqlite+aiosqlite:///./data/wdym86.db
# Or for AWS RDS:
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/wdym86

# AWS (optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket

# Solana Pay (optional)
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Get JWT token

### Inventory
- `GET /ingredients` - List ingredients
- `POST /ingredients/{id}/forecast` - Generate forecast
- `GET /inventory/{id}` - Current stock level

### AI Agents
- `POST /agents/{id}/run` - Run full pipeline
- `GET /agents/dashboard` - Dashboard summary

### Gemini AI
- `POST /gemini/chat` - Chat with advisor
- `POST /gemini/explain` - Explain decision
- `POST /gemini/what-if` - Scenario analysis
- `GET /gemini/context` - Full restaurant context

### POS
- `POST /pos/orders` - Create order
- `GET /pos/orders` - List orders
- `POST /pos/orders/{id}/pay` - Process payment

### Delivery
- `GET /delivery/platforms` - List platforms
- `POST /delivery/orders` - Create delivery order
- `GET /delivery/orders/{id}` - Order status

### Payments
- `POST /solana-pay/create` - Create crypto payment
- `GET /solana-pay/status/{id}` - Payment status
- `POST /solana-pay/verify/{id}` - Verify transaction

### Subscriptions
- `GET /subscriptions/tiers` - Available tiers
- `POST /subscriptions/subscribe` - Subscribe
- `GET /subscriptions/usage` - Current usage

## Project Structure

```
wdym86/
├── backend/
│   └── app/
│       ├── ml/                    # Ground-up ML (NumPy only)
│       │   ├── layers.py          # Conv1D, activations
│       │   ├── tcn.py             # TCN architecture
│       │   ├── losses.py          # Negative Binomial NLL
│       │   ├── optimizers.py      # Adam optimizer
│       │   └── model.py           # Full model
│       ├── agents/                # Autonomous AI agents
│       │   ├── inventory_risk.py  # Stockout detection
│       │   ├── reorder_opt.py     # Order optimization
│       │   ├── supplier_strategy.py
│       │   └── orchestrator.py    # Pipeline coordinator
│       ├── gemini/                # Gemini integration
│       │   ├── client.py          # API client
│       │   ├── prompts.py         # System prompts
│       │   └── explainer.py       # Decision explainer
│       ├── services/              # Business logic
│       │   ├── delivery.py        # Delivery platforms
│       │   └── solana_pay.py      # Crypto payments
│       ├── aws/                   # AWS integrations
│       │   ├── rds.py             # PostgreSQL
│       │   ├── s3.py              # Storage
│       │   └── cognito.py         # Auth
│       ├── routers/               # API endpoints
│       ├── models/                # Pydantic schemas
│       ├── data/                  # Seed data
│       └── database.py            # SQLAlchemy models
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx      # Main dashboard
│       │   ├── POS.tsx            # Point of sale
│       │   ├── Delivery.tsx       # Delivery management
│       │   ├── Dishes.tsx         # Menu management
│       │   ├── Suppliers.tsx      # Supplier management
│       │   ├── GeminiChat.tsx     # AI advisor
│       │   ├── SolanaPay.tsx      # Crypto payments
│       │   ├── Pricing.tsx        # Subscription tiers
│       │   └── Downloads.tsx      # Desktop apps
│       ├── components/
│       │   └── Layout.tsx         # App layout
│       ├── context/
│       │   └── ThemeContext.tsx   # Dark/light/system mode
│       └── services/
│           └── api.ts             # API client
└── docker-compose.yml
```

## AI Agents

### 1. Inventory Risk Agent
Monitors stockout probability for each ingredient:
- Aggregates forecasted demand over lead time
- Uses Normal approximation for Negative Binomial sum
- Classifies risk: SAFE (<5%), MONITOR (5-20%), URGENT (>20%)

### 2. Reorder Optimization Agent
Determines optimal order timing and quantity:
- Service-level based safety stock (default 95%)
- Considers MOQ, shelf life, storage constraints
- Balances holding vs. stockout costs

### 3. Supplier Strategy Agent
Adapts procurement during disruptions:
- Monitors weather, traffic, supplier reliability
- Recommends earlier ordering, split shipments
- Suggests alternative suppliers when needed

## Forecasting Model

### TCN Architecture (Pure NumPy)
- Input: 28-day historical usage + features
- Dilated causal convolutions (rates: 1, 2, 4)
- Residual connections
- Output: μ (mean) and k (dispersion)

### Input Features (14 dimensions)
1. Historical usage (normalized)
2. Day-of-week one-hot (7 dims)
3. Week-of-year sin/cos (2 dims)
4. Event/promotion flag
5. Weather severity
6. Traffic congestion
7. Hazard flag

### Negative Binomial Output
```
Var(y) = μ + μ²/k
```
Captures overdispersion common in restaurant demand.

## Demo Data

The system includes demo data for **Mykonos Mediterranean Restaurant**:

### Ingredients (30+)
- Proteins: Lamb, Chicken, Branzino, Octopus, Shrimp
- Dairy: Feta, Halloumi, Greek Yogurt
- Produce: Tomatoes, Cucumbers, Eggplant, Spinach
- Dry Goods: Orzo, Phyllo, Chickpeas, Olive Oil

### Menu Items (20+)
- Appetizers: Hummus, Spanakopita, Saganaki, Grilled Octopus
- Entrees: Lamb Souvlaki, Moussaka, Grilled Branzino
- Desserts: Baklava, Greek Yogurt with Honey

### Suppliers (5)
- Aegean Imports (4-day lead, 94% reliability)
- Athens Fresh Market (2-day lead, 88% reliability)
- Mediterranean Seafood Co. (1-day lead, 92% reliability)
- Hellenic Wines & Spirits (5-day lead, 96% reliability)
- Olympus Dairy (2-day lead, 90% reliability)

## Hackathon Tracks

Built for:
- **Ground-Up Model Track** - TCN + NB in pure NumPy
- **Best Overall Track** - Full-stack restaurant platform
- **MLH Best Use of Google Gemini API** - Conversational AI advisor

## License

MIT License - Built for hackathon demonstration
