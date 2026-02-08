# WDYM86 - AI-Powered Restaurant Intelligence Platform

> **Ground-Up NumPy TCN** | **Google Gemini 2.5 AI Agents** | **NCR Voyix BSP Integration** | **Check-First POS + BOHPOS**

A full-stack AI-powered restaurant management platform with **probabilistic demand forecasting** (pure NumPy TCN + Negative Binomial), **3 autonomous AI agents**, **Google Gemini 2.5 Flash with function calling, vision, code execution, and Google Search grounding**, **AI Insight Cards** on Dashboard/Menu/Procurement, **check-first POS workflow** with 7 payment methods and kitchen display (BOHPOS), **daily projections dashboard**, **NCR Voyix BSP integration**, **Stripe payments**, **Solana Pay**, and **25 frontend pages** backed by **28 API routers** and **130+ endpoints**.

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
- **Google Gemini 2.5 Flash** - All AI responses grounded in YOUR restaurant data (name, cuisine, ingredients, orders)
- **Function Calling** - 6 restaurant tools (check_inventory, search_menu, get_supplier_info, get_daily_stats, get_low_stock_alerts, create_reorder_suggestion) — Gemini queries your live data automatically
- **Vision Analysis** - Upload food photos, invoices, or shelf images for AI analysis (dish pricing, ingredient extraction, inventory assessment)
- **Code Execution** - Gemini writes and runs Python code for charts, calculations, and data analysis in the chat
- **Google Search Grounding** - Real-time market prices, industry trends, and external data with clickable source citations
- **AI Insight Cards** - Auto-generated structured insights on Dashboard (risks/opportunities), Dishes (menu engineering), and Suppliers (procurement recommendations) powered by Gemini structured output
- **Tool Usage Badges** - Visual indicators showing which tools Gemini used (function calls, code execution, web search)

### POS & Kitchen Operations
- **Check-First POS Workflow** - Order type selection, check management, menu ordering, payment processing, tip input, receipt display
- **7 Payment Methods** - Credit Card, Cash, Apple Pay, Stripe, Klarna, Cash App, Venmo with touch-grid selection
- **BOHPOS Kitchen Display** - Real-time kitchen order queue, status tracking, bump-to-complete, auto-refresh with POS bridge
- **POS-BOHPOS Demo Bridge** - Shared POSContext lets POS send orders directly to BOHPOS kitchen in demo mode (all 3 order types)
- **Delivery Mode Overhaul** - Active deliveries with status tracking + upcoming scheduled deliveries with ETA
- **Operating Date Awareness** - POS and BOHPOS display the operating date; date-scoped order history
- **End-of-Day Checkout** - Daily sales report with order type breakdown, payment method summary, receipt-style export
- **Send & Stay** - Send order to kitchen and continue editing the same check, or send and go back to check list
- **Demo Mode** - Full POS workflow works without backend using in-memory check storage
- **Tip Percentages** - 15/18/20/25% with custom amount, change calculation for cash
- **Receipt Download** - Text-file receipt generation with print support

### Restaurant Operations
- **Floor Plan Editor** - Drag-and-drop table layout designer with zones, ADA markers, preset layouts
- **Menu Management** - Dishes, recipes, ingredient tracking per cuisine type
- **Inventory Control** - Real-time food stock levels with risk gauges and sparkline trends
- **Full Inventory Tracking** - Non-food items: kitchen equipment, serviceware, cleaning, beverages, staff supplies (89 default items)
- **Supplier Management** - Lead times, reliability scores, volatility risk, substitute suppliers

### Intelligence & Analytics
- **Daily Projections Dashboard** - Projected vs actual sales/orders with SVG arc gauge, status badges (Exceeding/On Track/Below/Critical), top performing dishes
- **Automated Disruption Engine** - Location-aware weather, supply chain, local events generated per-restaurant per-day
- **Timeline Analytics** - Daily/weekly/monthly/seasonal KPIs with trend indicators
- **Day-of-Week Analysis** - Busiest/slowest day identification from order data
- **Ingredient Risk Assessment** - Disruption impact on specific ingredients and menu items
- **Popular/Least Popular Dishes** - Order analytics with 7-day trend sparklines
- **Enterprise Footer** - Professional branding with version badge across all dashboard pages

### Payments & Billing
- **Stripe Integration** - Card payments, subscription management, webhook processing
- **Solana Pay** - Cryptocurrency payments with QR codes and USD/SOL conversion
- **TaxJar Integration** - Automated sales tax calculation by state
- **Subscription Tiers** - Free, Starter ($49), Pro ($149), Enterprise ($399) with feature gating

### Staff & Roles
- **Role-Based Access** - `restaurant_admin`, `manager`, `pos_user` with granular permissions
- **Staff PIN Authentication** - 4-6 digit PINs for clock-in and POS access
- **Business PIN Join Codes** - Generate invite codes for new staff to self-onboard
- **Payroll Management** - Employee tracking, pay runs, expense management, S3 import/export

### NCR Voyix BSP Integration
- **HMAC-SHA512 Authentication** - Production-grade NCR BSP API auth with signed requests
- **Live Catalog Sync** - Pull menu items, categories, and prices from NCR BSP
- **Transaction Logs (TDM)** - Revenue, tips, item sales, employee data from NCR
- **Order Management** - Push/pull orders to/from NCR BSP API
- **Multi-Platform POS** - Toast, Aloha (NCR Voyix), Square, Clover

### Integrations
- **Delivery Platforms** - DoorDash, Uber Eats, Grubhub, Postmates, Seamless with driver tracking
- **AWS Infrastructure** - RDS PostgreSQL, S3 storage, Cognito auth, Secrets Manager
- **Alembic Migrations** - Database schema versioning for production deployments

### Subscription Tiers
| Tier | Price | Ingredients | Locations | Key Features |
|------|-------|-------------|-----------|--------------|
| Free | $0 | 10 | 1 | Basic forecasting |
| Starter | $49/mo | 50 | 1 | Gemini AI Chat, POS |
| Pro | $149/mo | 200 | 3 | Supplier Agent, Delivery, API |
| Enterprise | $399/mo | Unlimited | Unlimited | Custom integrations |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          Frontend (React 18 + TypeScript + Vite)                      │
│  25 Pages: Dashboard | POS | BOHPOS | Floor Plan | Delivery | Dishes | Suppliers     │
│  AI Chat | Solana Pay | Timeline | Inventory | Payroll | Admin | Team | Settings     │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │  Vite Proxy (/api → :8001)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Backend (28 Routers, 130+ Endpoints)                 │
│  Auth | Checks | BOHPOS | POS Payments | Inventory | Forecasts | Agents | Gemini     │
│  Dishes | Suppliers | Delivery | Stripe | Subscriptions | Tax | Payroll | Staff       │
│  Floor Plans | Disruptions | Timeline | POS Integrations | Solana Pay | AWS           │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
  ┌──────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
  │   Ground-Up ML   │      │   AI Agents          │      │   Gemini 2.5     │
  │   NumPy TCN      │      │   Risk Agent         │      │   Function Call  │
  │   NB Distribution│      │   Reorder Agent      │      │   Vision         │
  │   Adam Optimizer │      │   Strategy Agent     │      │   Code Execution │
  │                  │      │   Disruption Engine  │      │   Search Ground  │
  └──────────────────┘      └──────────────────────┘      └──────────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
  ┌──────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
  │   Payments       │      │   External APIs      │      │   AWS            │
  │   Stripe         │      │   NCR Voyix BSP      │      │   RDS PostgreSQL │
  │   Solana Pay     │      │   TaxJar             │      │   S3 Storage     │
  │   TaxJar Tax     │      │   Delivery Platforms │      │   Cognito Auth   │
  └──────────────────┘      └──────────────────────┘      └──────────────────┘
```

## Tech Stack

### Backend
- **FastAPI** - Async Python web framework with 28 routers
- **SQLAlchemy** - Async ORM with PostgreSQL/SQLite (35+ models)
- **NumPy** - Ground-up ML implementation (TCN + Negative Binomial)
- **Google Gemini 2.5 Flash** - Business-specific AI explanations and chat
- **Stripe** - Payment processing and subscription management
- **Boto3** - AWS SDK (RDS, S3, Cognito, Secrets Manager)
- **Alembic** - Database migrations

### Frontend
- **React 18** + TypeScript (25 pages)
- **Vite** - Dev server with API proxy
- **Tailwind CSS** - Glassmorphism UI with dark mode
- **@google/generative-ai** - Gemini 2.5 SDK (function calling, vision, code execution, search grounding, structured output)
- **Recharts** - Charts (Line, Bar, Area, Pie)
- **Framer Motion** - Animations and transitions
- **Lucide Icons** - Icon library (no emojis)
- **Stripe.js** - Card payment elements

### Infrastructure
- **AWS RDS** - PostgreSQL database
- **AWS S3** - File storage with local fallback
- **AWS Cognito** - Authentication (optional)
- **Alembic** - Schema migrations

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key (optional, demo mode works without it)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment (optional - demo mode works without .env)
cp .env.example .env

# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

API: http://localhost:8001 | Docs: http://localhost:8001/docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

## Environment Variables

```env
# Required
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-key

# Frontend URL (for Stripe redirects)
FRONTEND_URL=http://localhost:3000

# Database (SQLite default, PostgreSQL for production)
DATABASE_URL=sqlite+aiosqlite:///./wdym86.db

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NCR Voyix BSP (optional, pre-configured sandbox)
NCR_BSP_SHARED_KEY=your-shared-key
NCR_BSP_SECRET_KEY=your-secret-key
NCR_BSP_ORGANIZATION=your-org-id
NCR_BSP_ENTERPRISE_UNIT=your-enterprise-unit

# AWS (optional)
AWS_REGION=us-east-1
RDS_ENABLED=false
S3_ENABLED=false

# Solana Pay (optional)
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## API Endpoints (130+)

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - JWT token
- `GET /auth/me` - Current user
- `POST /auth/complete-onboarding` - Finish setup

### Check Management (POS)
- `POST /checks/create` - Create check (dine_in/takeout/delivery)
- `GET /checks/list` - List checks by restaurant and order type
- `GET /checks/{id}` - Get check details
- `POST /checks/{id}/items/add` - Add menu item to check
- `POST /checks/{id}/send` - Send order to BOHPOS kitchen
- `POST /checks/{id}/finalize` - Complete with tip and total
- `POST /checks/{id}/void` - Void a check

### BOHPOS (Kitchen Display)
- `GET /bohpos/orders/active` - Active kitchen orders
- `GET /bohpos/orders/recent` - Recently completed orders
- `POST /bohpos/orders/{id}/bump` - Mark order complete
- `POST /bohpos/orders/{id}/status` - Update order status

### POS Payments
- `POST /pos-payments/create-payment` - Create payment intent
- `POST /pos-payments/confirm-card-payment` - Confirm Stripe card payment
- `POST /pos-payments/process-cash` - Record cash payment
- `POST /pos-payments/refund` - Refund transaction

### POS Operations
- `GET /pos/menu` - Menu items
- `GET /pos/tables` - Table status
- `POST /pos/orders` - Create order
- `POST /pos/orders/{id}/pay` - Process payment

### Inventory (Food)
- `GET /ingredients` - List ingredients
- `POST /forecasts/{id}` - Generate demand forecast
- `GET /inventory/{id}` - Current stock level

### Full Inventory (Non-Food)
- `GET /inventory-items/{restaurant_id}` - List items (filter by category, low stock)
- `POST /inventory-items/{restaurant_id}` - Add item
- `POST /inventory-items/{restaurant_id}/seed-defaults` - Seed 89 default items
- `POST /inventory-items/{restaurant_id}/adjust` - Adjust quantity
- `GET /inventory-items/{restaurant_id}/alerts` - Low stock alerts

### AI Agents
- `POST /agents/{id}/run` - Run full pipeline (risk + reorder + strategy)
- `GET /agents/dashboard` - Dashboard summary

### Gemini AI
- `POST /gemini/chat` - Chat with restaurant advisor
- `POST /gemini/explain` - Explain AI decision
- `POST /gemini/what-if` - Scenario analysis
- `GET /gemini/daily-summary` - Daily AI briefing

### Floor Plans
- `POST /{plan_id}/tables` - Add table
- `POST /tables/batch-update` - Batch update (drag-and-drop save)
- `GET /presets` - Preset layouts (small/medium/large)

### Automated Disruptions
- `GET /disruptions/{restaurant_id}/today` - Today's auto-generated disruptions
- `GET /disruptions/{restaurant_id}/range` - Date range disruptions
- `GET /disruptions/{restaurant_id}/ingredient-risk` - Per-ingredient risk
- `GET /disruptions/{restaurant_id}/menu-impact` - Menu items affected

### Timeline Analytics
- `GET /timeline/{restaurant_id}/daily` - Daily snapshots
- `GET /timeline/{restaurant_id}/weekly` - Weekly aggregation
- `GET /timeline/{restaurant_id}/monthly` - Monthly trends
- `GET /timeline/{restaurant_id}/seasonal` - Seasonal analysis
- `GET /timeline/{restaurant_id}/kpi` - KPI summary

### Staff & Roles
- `GET /staff/{restaurant_id}` - List staff
- `POST /staff/{restaurant_id}/verify-pin` - PIN authentication
- `POST /staff/{restaurant_id}/business-pin` - Generate join code
- `GET /staff/roles/permissions` - Role permission matrix

### Payments & Billing
- `POST /payments/process` - Process payment (multi-provider)
- `POST /payments/split` - Split payments
- `GET /subscriptions/tiers` - Subscription tiers
- `POST /subscriptions/subscribe` - Subscribe via Stripe
- `POST /tax/calculate` - Calculate sales tax (TaxJar)

### Delivery
- `GET /delivery/platforms` - List platforms (DoorDash, Uber Eats, etc.)
- `GET /delivery/orders` - All delivery orders
- `POST /delivery/orders/{platform}/{id}/accept` - Accept order

### Solana Pay
- `POST /solana-pay/create` - Create crypto payment
- `GET /solana-pay/status/{id}` - Payment status
- `POST /solana-pay/verify/{id}` - Verify on-chain

### Payroll
- `GET /payroll/{restaurant_id}/employees` - Employee list
- `POST /payroll/{restaurant_id}/pay-runs` - Generate pay run
- `POST /payroll/{restaurant_id}/expenses/export-s3` - Export to S3

### NCR Voyix BSP
- `GET /pos-integrations/{restaurant_id}/ncr/catalog` - Live catalog
- `GET /pos-integrations/{restaurant_id}/ncr/tlogs` - Transaction logs
- `POST /pos-integrations/{restaurant_id}/ncr/push-order` - Push order

### AWS & System
- `GET /aws/status` - AWS service status
- `GET /aws/health` - AWS health check
- `GET /health` - Application health

## Project Structure

```
wdym86/
├── backend/
│   ├── app/
│   │   ├── ml/                    # Ground-up ML (NumPy only)
│   │   │   ├── tcn.py             # TCN architecture
│   │   │   ├── layers.py          # Conv1D, activations
│   │   │   ├── losses.py          # Negative Binomial NLL
│   │   │   ├── distributions.py   # NB distribution
│   │   │   ├── optimizers.py      # Adam optimizer
│   │   │   ├── training.py        # Training loop
│   │   │   └── model.py           # Full model
│   │   ├── agents/                # Autonomous AI agents
│   │   │   ├── inventory_risk.py  # Stockout detection
│   │   │   ├── reorder_opt.py     # Order optimization
│   │   │   ├── supplier_strategy.py
│   │   │   └── orchestrator.py    # Pipeline coordinator
│   │   ├── gemini/                # Business-specific Gemini AI
│   │   │   ├── client.py          # API client + context-aware mock
│   │   │   ├── prompts.py         # Dynamic system prompts
│   │   │   └── explainer.py       # Business-grounded explainer
│   │   ├── services/              # Business logic (15 services)
│   │   │   ├── check_manager.py   # Check lifecycle management
│   │   │   ├── bohpos_service.py  # Kitchen display logic
│   │   │   ├── receipt_service.py # Receipt generation
│   │   │   ├── stripe_service.py  # Stripe payments & subscriptions
│   │   │   ├── taxjar_service.py  # Tax calculations
│   │   │   ├── ncr_auth.py        # NCR BSP HMAC-SHA512 auth
│   │   │   ├── ncr_client.py      # NCR BSP async API client
│   │   │   ├── ncr_adapter.py     # NCR data mapping
│   │   │   ├── disruption_engine.py # Location-aware disruptions (6 regions)
│   │   │   ├── delivery.py        # Delivery platforms
│   │   │   ├── solana_pay.py      # Crypto payments
│   │   │   ├── full_inventory.py  # Non-food inventory (89 items)
│   │   │   ├── payments.py        # Payment processing
│   │   │   └── events.py          # Event management
│   │   ├── aws/                   # AWS integrations
│   │   │   ├── config.py          # AWS settings
│   │   │   ├── rds.py             # PostgreSQL
│   │   │   ├── s3.py              # Storage (with local fallback)
│   │   │   ├── cognito.py         # Auth
│   │   │   └── secrets.py         # Secrets Manager
│   │   ├── routers/               # API endpoints (28 routers)
│   │   │   ├── auth.py            # JWT authentication
│   │   │   ├── checks.py          # Check management (POS)
│   │   │   ├── bohpos.py          # Kitchen display system
│   │   │   ├── pos_payments.py    # POS payment processing
│   │   │   ├── pos.py             # POS operations
│   │   │   ├── ingredients.py     # Food inventory
│   │   │   ├── inventory.py       # Stock levels
│   │   │   ├── inventory_items.py # Non-food inventory
│   │   │   ├── forecasts.py       # ML forecasting
│   │   │   ├── agents.py          # AI agent pipeline
│   │   │   ├── gemini.py          # Business AI chat
│   │   │   ├── dishes.py          # Menu management
│   │   │   ├── suppliers.py       # Supplier management
│   │   │   ├── floor_plan.py      # Floor plan & tables
│   │   │   ├── disruptions.py     # Automated disruptions
│   │   │   ├── timeline.py        # Timeline analytics
│   │   │   ├── staff.py           # Staff, roles, PIN auth
│   │   │   ├── delivery.py        # Delivery platforms
│   │   │   ├── payments.py        # Multi-provider payments
│   │   │   ├── subscriptions.py   # Stripe subscription tiers
│   │   │   ├── stripe_webhooks.py # Stripe webhook handler
│   │   │   ├── tax.py             # TaxJar sales tax
│   │   │   ├── payroll.py         # Employee payroll
│   │   │   ├── pos_integration.py # Toast/Aloha/Square/Clover
│   │   │   ├── solana_pay.py      # Crypto payments
│   │   │   ├── events.py          # Event simulation
│   │   │   ├── restaurants.py     # Restaurant CRUD
│   │   │   └── aws_status.py      # AWS health/statu
│   │   ├── models/                # Pydantic schemas
│   │   └── database.py            # SQLAlchemy models (35+ tables)
│   ├── migrations/                # Alembic migrations
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/                 # 25 pages
│       │   ├── Dashboard.tsx      # AI forecasting dashboard
│       │   ├── AdminDashboard.tsx  # Admin overview
│       │   ├── POS.tsx            # Check-first POS workflow
│       │   ├── BOHPOS.tsx         # Kitchen display system
│       │   ├── Delivery.tsx       # Multi-platform delivery
│       │   ├── GeminiChat.tsx     # AI advisor (vision, tools, code exec, search)
│       │   ├── FloorPlanEditor.tsx # Drag-and-drop floor plans
│       │   ├── TimelineAnalytics.tsx # KPI analytics
│       │   ├── InventoryTracking.tsx # Non-food inventory
│       │   ├── Payroll.tsx        # Employee payroll
│       │   ├── POSIntegration.tsx # NCR Aloha integration
│       │   ├── Dishes.tsx         # Menu management
│       │   ├── Suppliers.tsx      # Supplier management
│       │   ├── SolanaPay.tsx      # Crypto payments
│       │   ├── Pricing.tsx        # Subscription tiers
│       │   ├── TeamManagement.tsx # POS staff management
│       │   ├── RestaurantSettings.tsx # Restaurant config
│       │   ├── KeyManagement.tsx  # API key management
│       │   ├── UserManagement.tsx # User administration
│       │   ├── Onboarding.tsx     # Initial setup flow
│       │   ├── Login.tsx          # Auth gateway
│       │   ├── StaffLogin.tsx     # Staff PIN login
│       │   ├── HowItWorks.tsx     # Marketing page
│       │   ├── Downloads.tsx      # Desktop apps
│       │   └── IngredientDetail.tsx # Ingredient deep dive
│       ├── components/
│       │   ├── Layout.tsx         # App shell with role-based nav
│       │   ├── AiInsightCard.tsx   # Gemini-powered AI insight cards
│       │   ├── EnterpriseFooter.tsx # Professional footer with branding
│       │   ├── CheckList.tsx      # POS check list
│       │   ├── CheckModal.tsx     # Check detail modal
│       │   ├── PaymentModal.tsx   # Stripe payment modal
│       │   ├── PaymentConfirmation.tsx
│       │   └── ReceiptDisplay.tsx # Receipt with download
│       ├── guards/
│       │   └── NavigationGuard.tsx # POS user route protection
│       ├── context/
│       │   ├── AuthContext.tsx     # Auth + role-based access
│       │   ├── ThemeContext.tsx    # Dark/light/system mode
│       │   └── POSContext.tsx      # Shared POS state (operating date, daily stats, BOHPOS bridge)
│       ├── services/
│       │   ├── api.ts             # Axios API client (60+ functions)
│       │   ├── geminiTools.ts     # Gemini function calling tools + structured output
│       │   ├── checks.ts          # Check management API
│       │   ├── bohpos.ts          # BOHPOS kitchen API
│       │   ├── payroll.ts         # Payroll API
│       │   ├── tax.ts             # Tax calculation
│       │   └── http.ts            # Fetch helper with timeout
│       └── data/
│           └── cuisineTemplates.ts # 6 cuisine demo datasets
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

### Gemini-Powered Disruption Engine
Generates realistic daily disruptions per-restaurant with **location-aware intelligence** (never user-triggered):
- **6 Regional Profiles** - Southeast (Athens), West Coast (SF), South Central (Austin), Midwest (Chicago), Northeast (NYC), Mid-South (Nashville)
- **Weather Events** - Region-specific: lake effect snow (Chicago), nor'easters (NYC), heat waves (Austin), fog (SF), tornadoes (Nashville), hurricanes (Athens)
- **Supply Chain Issues** - Carrier delays, port congestion, crop failures, supplier-specific
- **Local Events** - UGA football, SXSW, Lollapalooza, Broadway openings, CMA Fest, Fleet Week
- **Gemini Analysis** - Location context fed to Google Gemini for intelligent impact assessment

## Forecasting Model

### TCN Architecture (Pure NumPy)
- Input: 28-day historical usage + features
- Dilated causal convolutions (rates: 1, 2, 4)
- Residual connections
- Output: mu (mean) and k (dispersion)

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
Var(y) = mu + mu^2/k
```
Captures overdispersion common in restaurant demand.

## Demo Data

Complete demo data for **6 restaurants** across the USA, each with 20+ ingredients, 15+ dishes, 5 suppliers, and full menu/order/delivery mock data:

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

## Security

- **Rate Limiting** - 100 req/min general, 10 req/min auth (sliding window, in-memory; auto-disabled in test env)
- **Security Headers** - X-Content-Type-Options, X-Frame-Options, HSTS, XSS Protection, Referrer-Policy
- **API Key Masking** - Automatic detection and masking of secrets in JSON response bodies
- **Global Exception Handler** - Safe error responses in production, debug details in development
- **S3 Graceful Degradation** - Falls back to local storage when S3 is disabled
- **JWT Authentication** - Token-based auth with role claims
- **Demo Mode Isolation** - Demo tokens never trigger auth redirects or data mutations

## Testing

**132 backend tests** covering all major API surfaces:

```bash
cd backend
TESTING=1 pytest --tb=short -q
```

- **Health & Root** - Health check, security headers, rate-limit headers, API key masking passthrough
- **POS Operations** - Orders (CRUD), menu items, table status, pagination, filtering
- **Check Management** - Create, list, add items, send to kitchen, finalize with tip, void
- **BOHPOS Kitchen** - Active/recent orders, bump-to-complete, status updates
- **Auth** - Registration, login, JWT validation, onboarding
- **Restaurants** - CRUD, ownership validation
- **Ingredients** - CRUD, restaurant-scoped
- **Suppliers** - CRUD, reliability scoring
- **Inventory** - Stock levels, adjustments
- **Dishes** - Menu CRUD
- **Forecasts** - ML pipeline invocation

## Demo Script

1. Visit the app and click **"Try Demo"** on the login page
2. Select any of the 6 restaurant cuisines (Greek, Japanese, Mexican, Indian, Italian, BBQ)
3. Choose a role (Admin has full access, Manager sees operational pages, POS sees only the register)
4. **Admin Dashboard** - View daily projections hero (projected vs actual sales with arc gauge), quick links, recent activity
5. **Forecasting Dashboard** - View AI risk assessments, ingredient gauges, demand forecast charts
6. **POS** - Select order type (Dine In/Takeout/Delivery), create a check, add menu items, "Send to Kitchen" or "Send & Stay", process payment with any of 7 methods (Credit Card, Cash, Apple Pay, Stripe, Klarna, Cash App, Venmo), add tip, view receipt
7. **POS Delivery Mode** - View active deliveries with status badges and upcoming scheduled deliveries with ETAs
8. **End of Day** - Run end-of-day checkout from POS to generate a daily sales report with order type and payment breakdown
9. **BOHPOS Kitchen** - See orders arrive from POS in real-time (all 3 order types), bump completed orders, track by operating date
10. **NCR Aloha** - View live NCR catalog, transaction logs, orders synced from BSP API
11. **Timeline Analytics** - Switch between KPIs, weekly, monthly, seasonal, day-of-week tabs
12. **Gemini Chat** - Ask "Am I running low on anything?" (function calling), upload a food photo (vision), ask "Show me a chart of my top dishes" (code execution), ask "What's the market price for olive oil?" (Google Search with citations)
13. **Inventory** - Track non-food items, filter by category, view low stock alerts
14. **Floor Plan** - Drag and drop tables, assign servers, manage zones
15. **Payroll** - View employees, generate pay runs, import/export via S3

## Hackathon Tracks

Built for:
- **Ground-Up Model Track** - TCN + NB in pure NumPy (no ML frameworks)
- **Best Overall Track** - Full-stack restaurant platform with NCR Voyix + Gemini + Check-First POS
- **MLH Best Use of Google Gemini API** - Function calling, vision, code execution, Google Search grounding, structured output, and business-specific conversational AI advisor + disruption simulation

## License

MIT License - Built for hackathon demonstration


built with love by Ibe Carter Shaw
