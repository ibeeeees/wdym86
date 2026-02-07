# WDYM86 - AI-Powered Restaurant Intelligence Platform

> **NCR Voyix BSP Integration** | **Google Gemini Disruption Simulation** | **NumPy TCN Forecasting**

A comprehensive AI-powered restaurant management platform featuring **live NCR Voyix POS integration** (Aloha, Toast, Square, Clover), **Gemini-powered disruption simulation** (weather, traffic, supply chain), probabilistic TCN forecasting in pure NumPy, autonomous AI agents, drag-and-drop floor plans, multi-restaurant management, and full analytics.

**6 Demo Restaurants across the USA:**
| Restaurant | Cuisine | Location |
|-----------|---------|----------|
| Mykonos Mediterranean | Greek | Athens, GA |
| Sakura Japanese Kitchen | Japanese | San Francisco, CA |
| Casa del Sol | Mexican | Austin, TX |
| Spice Route | Indian | Chicago, IL |
| Trattoria Bella | Italian | New York, NY |
| Magnolia Smokehouse | Southern BBQ | Nashville, TN |

**Demo Users:** Ibe Mohammed Ali (Admin), Carter Tierney (Manager), Shaw Tesafye (POS)

## Features

### AI & Machine Learning
- **Ground-up TCN Model** - Temporal Convolutional Network in pure NumPy (no PyTorch/TensorFlow)
- **Negative Binomial Forecasting** - Probabilistic demand prediction with uncertainty quantification
- **3 Autonomous AI Agents** - Risk assessment, reorder optimization, supplier strategy
- **Business-Specific Gemini AI** - All AI responses are grounded in YOUR restaurant data (name, cuisine, ingredients, orders) — never generic

### Restaurant Operations
- **POS System** - Order management, table assignments, multi-provider checkout
- **Floor Plan Editor** - Drag-and-drop table layout designer with zones, ADA markers, preset layouts
- **Menu Management** - Dishes, recipes, ingredient tracking per cuisine type
- **Inventory Control** - Real-time food stock levels, expiration monitoring
- **Full Inventory Tracking** - Non-food items: kitchen equipment, serviceware, cleaning, beverages, staff supplies
- **Supplier Management** - Lead times, reliability scores, volatility risk, substitute suppliers, region coverage

### Intelligence & Analytics
- **Automated Disruption Engine** - Weather, supply chain, local events generated per-restaurant per-day (never user-triggered)
- **Timeline Analytics** - Daily/weekly/monthly/seasonal KPIs with trend indicators
- **Day-of-Week Analysis** - Busiest/slowest day identification from real order data
- **Ingredient Risk Assessment** - Disruption impact on specific ingredients and menu items

### Staff & Roles
- **Role-Based Access** - `restaurant_admin`, `manager`, `pos_user` with granular permissions
- **Staff PIN Authentication** - 4-6 digit PINs for clock-in and POS access
- **Business PIN Join Codes** - Generate invite codes for new staff to self-onboard
- **Demo Roles**: Ibe Mohammed Ali (Admin), Carter Tierney (Manager), Shaw Tesafye (Manager)

### NCR Voyix BSP Integration (Headline Feature)
- **HMAC-SHA512 Authentication** - Production-grade NCR BSP API auth with signed requests
- **Live Catalog Sync** - Pull menu items, categories, and prices from NCR BSP
- **Transaction Logs (TDM)** - Revenue, tips, item sales, employee data from NCR
- **Order Management** - Push/pull orders to/from NCR BSP API
- **Connection Verification** - Real-time NCR API connectivity checks
- **Sandbox Credentials** - Pre-configured with NCR test-drive environment

### POS Platform Support
- **Toast** - Menu sync, order sync, inventory sync, reporting
- **Aloha (NCR Voyix)** - Full BSP API integration with HMAC auth
- **Square** - Payment processing, order management
- **Clover** - Cloud POS and employee management

### Integrations
- **Delivery Platforms** - DoorDash, Uber Eats, Grubhub, Postmates, Seamless
- **Solana Pay** - Cryptocurrency payment processing
- **AWS Infrastructure** - RDS PostgreSQL, S3 storage, Cognito auth, Secrets Manager

### Subscription Tiers
| Tier | Price | Ingredients | Locations | Key Features |
|------|-------|-------------|-----------|--------------|
| Free | $0 | 10 | 1 | Basic forecasting |
| Starter | $49/mo | 50 | 1 | Gemini AI Chat, POS |
| Pro | $149/mo | 200 | 3 | Supplier Agent, Delivery, API |
| Enterprise | $399/mo | Unlimited | Unlimited | Custom integrations |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Frontend (React + TypeScript)                         │
│  Dashboard │ POS │ Floor Plan │ Delivery │ Dishes │ Suppliers │ AI Chat │ Crypto │
│  Timeline Analytics │ Full Inventory │ Staff & Roles │ POS Integrations          │
└───────────────────────────────────┬─────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Backend (Python)                                │
│  Auth │ Inventory │ Forecasts │ Agents │ POS │ Delivery │ Payments │ Floor Plans │
│  Disruptions │ Timeline │ Staff │ POS Integrations │ Full Inventory              │
└───────────────────────────────────┬─────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌──────────────────┐   ┌────────────────────────┐   ┌──────────────────┐
│   Ground-Up ML   │   │   AI Agents            │   │   Gemini Layer   │
│   NumPy TCN      │   │   Risk Agent           │   │   Business-      │
│   NB Distribution│   │   Reorder Agent        │   │   Specific       │
│   Adam Optimizer │   │   Strategy Agent       │   │   Explanations   │
│                  │   │   Disruption Engine    │   │   Chat Advisor   │
└──────────────────┘   └────────────────────────┘   └──────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             AWS Infrastructure                                   │
│        RDS PostgreSQL │ S3 Storage │ Cognito Auth │ Secrets Manager              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **FastAPI** - Async Python web framework
- **SQLAlchemy** - Async ORM with PostgreSQL/SQLite (18+ models)
- **NumPy** - Ground-up ML implementation
- **Google Gemini 2.0 Flash** - Business-specific AI explanations and chat
- **Boto3** - AWS SDK

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Glassmorphism UI with dark mode
- **Framer Motion** - Animations and transitions
- **Lucide Icons** - Icon library

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

# NCR Voyix BSP Integration (pre-configured sandbox)
NCR_BSP_SHARED_KEY=your-shared-key
NCR_BSP_SECRET_KEY=your-secret-key
NCR_BSP_ORGANIZATION=your-org-id
NCR_BSP_ENTERPRISE_UNIT=your-enterprise-unit
NCR_BSP_BASE_URL=https://api.ncr.com

# AWS (optional)
AWS_REGION=us-east-1
S3_ENABLED=false
S3_BUCKET_NAME=wdym86-uploads

# Solana Pay (optional)
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Get JWT token

### Inventory (Food)
- `GET /ingredients` - List ingredients
- `POST /ingredients/{id}/forecast` - Generate forecast
- `GET /inventory/{id}` - Current stock level

### Full Inventory (Non-Food)
- `GET /inventory-items/{restaurant_id}` - List all non-food items (filter by category, low stock)
- `POST /inventory-items/{restaurant_id}` - Add item
- `POST /inventory-items/{restaurant_id}/seed-defaults` - Seed 89 default items across 5 categories
- `POST /inventory-items/{restaurant_id}/adjust` - Adjust quantity with reason tracking
- `GET /inventory-items/{restaurant_id}/alerts` - Low stock alerts
- `GET /inventory-items/{restaurant_id}/value-summary` - Total value by category

### AI Agents
- `POST /agents/{id}/run` - Run full pipeline
- `GET /agents/dashboard` - Dashboard summary

### Gemini AI (Business-Specific)
- `POST /gemini/chat` - Chat with advisor (uses your restaurant's data)
- `POST /gemini/explain` - Explain decision
- `POST /gemini/what-if` - Scenario analysis
- `GET /gemini/context` - Full restaurant context

### Floor Plans
- `GET /floor-plans/{restaurant_id}` - List floor plans
- `POST /floor-plans/{restaurant_id}` - Create plan (blank or preset: small/medium/large)
- `POST /floor-plans/{plan_id}/tables` - Add table
- `PUT /floor-plans/{plan_id}/tables/batch` - Batch update positions (drag-and-drop save)
- `DELETE /floor-plans/tables/{table_id}` - Remove table

### Automated Disruptions
- `GET /disruptions/{restaurant_id}/today` - Today's auto-generated disruptions
- `GET /disruptions/{restaurant_id}/range` - Disruptions for date range (max 30 days)
- `GET /disruptions/{restaurant_id}/ingredient-risk` - Per-ingredient risk assessment
- `GET /disruptions/{restaurant_id}/menu-impact` - Menu items affected by disruptions

### Timeline Analytics
- `GET /timeline/{restaurant_id}/daily` - Daily snapshots
- `POST /timeline/{restaurant_id}/compute-snapshot` - Compute from real order data
- `GET /timeline/{restaurant_id}/weekly` - Weekly aggregation
- `GET /timeline/{restaurant_id}/monthly` - Monthly trends with change %
- `GET /timeline/{restaurant_id}/seasonal` - Seasonal analysis (spring/summer/fall/winter)
- `GET /timeline/{restaurant_id}/day-of-week` - Day-of-week performance
- `GET /timeline/{restaurant_id}/kpi` - KPI summary (revenue, orders, tips, refunds, labor, food cost)

### Staff & Roles
- `GET /staff/{restaurant_id}` - List staff
- `POST /staff/{restaurant_id}` - Add staff member
- `POST /staff/{restaurant_id}/verify-pin` - PIN authentication
- `POST /staff/{restaurant_id}/business-pin` - Generate join code
- `POST /staff/join` - Join restaurant via PIN
- `POST /staff/{restaurant_id}/seed-demo` - Seed demo staff
- `GET /staff/roles/permissions` - Role permission matrix

### POS Integrations
- `GET /pos-integrations/platforms` - Supported platforms (Toast, Aloha, Square, Clover)
- `POST /pos-integrations/{restaurant_id}` - Connect platform
- `POST /pos-integrations/{restaurant_id}/integrations/{id}/verify` - Verify credentials
- `POST /pos-integrations/{restaurant_id}/integrations/{id}/sync` - Trigger sync

### NCR Voyix BSP (Direct API)
- `GET /pos-integrations/{restaurant_id}/ncr/catalog` - Live NCR catalog items
- `GET /pos-integrations/{restaurant_id}/ncr/tlogs` - Transaction logs with revenue/tips summary
- `GET /pos-integrations/{restaurant_id}/ncr/orders` - NCR orders
- `POST /pos-integrations/{restaurant_id}/ncr/push-order` - Push order to NCR BSP
- `GET /pos-integrations/{restaurant_id}/ncr/verify` - NCR API connectivity check

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
│       │   ├── distributions.py   # NB distribution
│       │   ├── training.py        # Training loop
│       │   └── model.py           # Full model
│       ├── agents/                # Autonomous AI agents
│       │   ├── inventory_risk.py  # Stockout detection
│       │   ├── reorder_opt.py     # Order optimization
│       │   ├── supplier_strategy.py
│       │   └── orchestrator.py    # Pipeline coordinator
│       ├── gemini/                # Business-specific Gemini AI
│       │   ├── client.py          # API client + context-aware mock
│       │   ├── prompts.py         # Dynamic system prompts (build_system_prompt)
│       │   └── explainer.py       # Business-grounded explainer
│       ├── services/              # Business logic
│       │   ├── ncr_auth.py        # NCR BSP HMAC-SHA512 authentication
│       │   ├── ncr_client.py      # NCR BSP async API client (Order, TDM, Catalog, Sites)
│       │   ├── ncr_adapter.py     # NCR data mapping adapter
│       │   ├── disruption_engine.py # Location-aware disruption generation (6 regions)
│       │   ├── gemini_client.py   # Google Gemini integration
│       │   ├── delivery.py        # Delivery platforms
│       │   ├── solana_pay.py      # Crypto payments
│       │   ├── full_inventory.py  # Non-food inventory templates (89 items)
│       │   ├── events.py          # Event management
│       │   └── payments.py        # Payment processing
│       ├── aws/                   # AWS integrations
│       │   ├── rds.py             # PostgreSQL
│       │   ├── s3.py              # Storage
│       │   ├── cognito.py         # Auth
│       │   └── secrets.py         # Secrets Manager
│       ├── routers/               # API endpoints (17 routers)
│       │   ├── auth.py            # JWT authentication
│       │   ├── ingredients.py     # Food inventory
│       │   ├── inventory.py       # Stock levels
│       │   ├── inventory_items.py # Non-food inventory CRUD
│       │   ├── forecasts.py       # ML forecasting
│       │   ├── agents.py          # AI agent pipeline
│       │   ├── gemini.py          # Business-specific AI chat
│       │   ├── pos.py             # POS operations
│       │   ├── pos_integration.py # Toast/Aloha/Square/Clover
│       │   ├── floor_plan.py      # Floor plan & tables
│       │   ├── disruptions.py     # Automated disruptions
│       │   ├── timeline.py        # Timeline analytics & KPIs
│       │   ├── staff.py           # Staff, roles, PIN auth
│       │   ├── dishes.py          # Menu management
│       │   ├── suppliers.py       # Supplier management
│       │   ├── delivery.py        # Delivery platforms
│       │   ├── subscriptions.py   # Subscription tiers
│       │   └── solana_pay.py      # Crypto payments
│       ├── models/                # Pydantic schemas
│       ├── data/                  # Seed data
│       └── database.py            # SQLAlchemy models (18+ tables)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx      # Main dashboard (glassmorphism)
│       │   ├── AdminDashboard.tsx # Admin overview
│       │   ├── POS.tsx            # Point of sale
│       │   ├── FloorPlanEditor.tsx# Drag-and-drop floor plans
│       │   ├── TimelineAnalytics.tsx # KPI & trend analytics
│       │   ├── InventoryTracking.tsx # Non-food inventory UI
│       │   ├── Delivery.tsx       # Delivery management
│       │   ├── Dishes.tsx         # Menu management
│       │   ├── Suppliers.tsx      # Supplier management
│       │   ├── GeminiChat.tsx     # Business-specific AI advisor
│       │   ├── SolanaPay.tsx      # Crypto payments
│       │   ├── Pricing.tsx        # Subscription tiers
│       │   ├── Downloads.tsx      # Desktop apps
│       │   ├── StaffLogin.tsx     # Staff PIN login
│       │   ├── TeamManagement.tsx # Team & role management
│       │   ├── KeyManagement.tsx  # API key management
│       │   └── RestaurantSettings.tsx # Restaurant config
│       ├── components/
│       │   └── Layout.tsx         # App layout with role-based nav
│       ├── context/
│       │   ├── AuthContext.tsx     # Auth + restaurantId
│       │   └── ThemeContext.tsx    # Dark/light/system mode
│       └── services/
│           └── api.ts             # API client (44+ functions)
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

### Gemini-Powered Disruption Engine (Headline Feature)
Generates realistic daily disruptions per-restaurant with **location-aware intelligence** (never user-triggered):
- **6 Regional Profiles** - Southeast (Athens), West Coast (SF), South Central (Austin), Midwest (Chicago), Northeast (NYC), Mid-South (Nashville)
- **Weather Events** - Region-specific patterns: lake effect snow (Chicago), nor'easters (NYC), heat waves (Austin), fog (SF), tornadoes (Nashville), hurricanes (Athens)
- **Supply Chain Issues** - Carrier delays, port congestion, crop failures, supplier-specific
- **Local Events** - UGA football, SXSW, Lollapalooza, Broadway openings, CMA Fest, Fleet Week
- **Gemini Analysis** - Location context fed to Google Gemini for intelligent impact assessment
- Ingredient-level risk scoring and menu impact assessment

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

The system includes complete demo data for **6 restaurants** across the USA, each with 20+ ingredients, 15+ dishes, 5 suppliers, and full menu/order/delivery mock data:

| Restaurant | Cuisine | Signature Dishes | Location |
|-----------|---------|-----------------|----------|
| Mykonos Mediterranean | Greek | Lamb Souvlaki, Moussaka, Spanakopita | Athens, GA |
| Sakura Japanese Kitchen | Japanese | Sushi, Ramen, Tempura | San Francisco, CA |
| Casa del Sol | Mexican | Tacos, Mole Poblano, Ceviche | Austin, TX |
| Spice Route | Indian | Chicken Tikka, Biryani, Palak Paneer | Chicago, IL |
| Trattoria Bella | Italian | Margherita Pizza, Osso Buco, Tiramisu | New York, NY |
| Magnolia Smokehouse | BBQ | Brisket, Pulled Pork, Smoked Wings | Nashville, TN |

### Non-Food Inventory (89 default items across 5 categories)
- **Kitchen Equipment** - Pans, knives, thermometers, cutting boards, tongs
- **Serviceware** - Plates, glasses, napkins, silverware, menus
- **Cleaning Supplies** - Sanitizer, dish soap, trash bags, mop heads
- **Beverages** - Coffee, tea, sparkling water, juices, soft drinks
- **Staff Supplies** - Aprons, gloves, name tags, order pads, pens

## Commit History

| Hash | Date | Description |
|------|------|-------------|
| `f7913d3` | 2026-02-07 | feat: Premium dashboard redesign with glassmorphism and animations |
| `b7a5a4e` | 2026-02-07 | Fix navbar overflow by consolidating dropdowns and compacting actions |
| `ffa6785` | 2026-02-07 | Implement full platform auth, role-based routing, admin pages, POS enhancements, and emoji removal |
| `9f7a2d3` | 2026-02-07 | Fix unused ChevronDown import in Layout.tsx |
| `265a72d` | 2026-02-07 | Improve Suppliers page mobile responsiveness |
| `2de00be` | 2026-02-07 | Improve mobile responsiveness and visual consistency |
| `324adfe` | 2026-02-07 | Update README with comprehensive platform documentation |
| `f5c2c38` | 2026-02-07 | Enhance frontend with Mykonos Mediterranean theming and improved navigation |
| `eb948d3` | 2026-02-07 | Fix signup error and update demo data to Mykonos Mediterranean theme |
| `415865b` | 2026-02-06 | Enhance Gemini AI to interact with all features - comprehensive restaurant advisor |
| `8434e34` | 2026-02-06 | Add Solana Pay config settings and fix validation |
| `4a3f393` | 2026-02-06 | Add desktop app downloads page with macOS and Windows support |
| `a76501b` | 2026-02-06 | Add Solana Pay integration and Mykonos restaurant demo data |
| `58e6d57` | 2026-02-06 | Add subscription tiers and pricing system |
| `118d76c` | 2026-02-06 | Add AWS integration for production deployment |
| `412f26c` | 2026-02-06 | Update color theme to UGA red, black, and white |
| `77384b6` | 2026-02-06 | Add delivery services integration and polish UI |
| `35ea01a` | 2026-02-06 | Add POS system with multi-provider payment integration |
| `3b5abee` | 2026-02-06 | Fix demo mode - prevent 401 redirect for demo token |
| `c3a3dcd` | 2026-02-06 | Add inventory visualizations, service levels, and UX improvements |
| `5b9525d` | 2026-02-06 | Add dark mode, dishes/recipes management, enhanced dashboard |
| `00e1a23` | 2026-02-06 | Fix TypeScript errors for production build |
| `e9cf8bd` | 2026-02-06 | Fix Vercel build config |
| `6462849` | 2026-02-06 | Fix Vercel 404 error with SPA rewrites |
| `d88c5d5` | 2026-02-06 | Initial commit: wdym86 AI inventory intelligence platform |

### Latest Session (Current)
Major feature expansion adding 6 new backend routers, 3 new services, 9 new database models, 3 new frontend pages, and full Gemini AI refactoring:

**Backend:**
- 9 new database models: `FloorPlan`, `FloorPlanTable`, `DailySnapshot`, `InventoryItem`, `StaffMember`, `StaffRole`, `POSIntegration`, `AutomatedDisruption`, `TimelineEvent`
- 6 new routers: Floor Plans, Disruptions, Inventory Items, Staff, Timeline, POS Integrations
- `AutomatedDisruptionEngine` — deterministic daily disruption generation (weather, supply chain, local events)
- Non-food inventory service with 89 default items across 5 categories
- Gemini AI refactored: all responses grounded in actual restaurant data (no generic answers)

**Frontend:**
- `FloorPlanEditor.tsx` — Drag-and-drop table layout designer with zones, ADA compliance, presets
- `TimelineAnalytics.tsx` — 5-tab analytics (KPI cards, weekly trends, monthly growth, seasonal patterns, day-of-week)
- `InventoryTracking.tsx` — Category filtering, low stock alerts, value summary, add/adjust modals
- 44+ API functions in `api.ts`
- Updated routing and navigation with new pages

## Security

- **Rate Limiting** - 100 req/min general, 10 req/min auth (sliding window)
- **Security Headers** - X-Content-Type-Options, X-Frame-Options, HSTS, XSS Protection
- **API Key Masking** - Automatic detection and masking of secrets in response bodies
- **Global Exception Handler** - Safe error responses, never exposes stack traces
- **S3 Graceful Degradation** - Falls back to local storage when S3 is disabled

## Demo Script

1. Visit the app and click **"Try Demo"** on the login page
2. Select any of the 6 restaurant cuisines (Greek, Japanese, Mexican, Indian, Italian, BBQ)
3. Choose a role (Admin has full access, Manager sees operational pages, POS sees only the register)
4. **Dashboard** - View AI risk assessments, today's disruptions, revenue metrics
5. **POS** - Select a table, enter party size, take orders, process payment
6. **NCR Aloha** - View live NCR catalog, transaction logs, orders synced from BSP API
7. **Timeline Analytics** - Switch between KPIs, weekly, monthly, seasonal, Top Dishes tabs
8. **Gemini Chat** - Ask the AI advisor about your restaurant's inventory and operations
9. **Inventory** - Track non-food items, filter by category, view low stock alerts
10. **Floor Plan** - Drag and drop tables, assign servers, manage zones

## Hackathon Tracks

Built for:
- **Ground-Up Model Track** - TCN + NB in pure NumPy
- **Best Overall Track** - Full-stack restaurant platform with NCR Voyix + Gemini
- **MLH Best Use of Google Gemini API** - Business-specific conversational AI advisor + disruption simulation

## License

MIT License - Built for hackathon demonstration
