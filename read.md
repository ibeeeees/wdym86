# WDYM86 — AI-Powered Restaurant Inventory Intelligence

**Version:** 1.0
**Date:** February 2026
**Track:** Ground-Up Model + Best Use of Gemini API
**Status:** Fully Functional Interactive Demo

---

## Project Overview

WDYM86 is an AI-powered inventory intelligence platform for restaurants. It combines a ground-up NumPy TCN forecasting model, autonomous AI agents, and Google Gemini integration to help restaurant managers reduce waste, prevent stockouts, and optimize operations.

**Demo Restaurant:** Mykonos Mediterranean — Athens, GA
**Tech Stack:** React + TypeScript + Vite + Tailwind (frontend), FastAPI + Python (backend)
**Database:** SQLite (dev) / AWS RDS PostgreSQL (production)

---

## Core Architecture

### AI/ML Pipeline (Ground-Up)
- **NumPy TCN** — Temporal Convolutional Network built from scratch (no PyTorch/TensorFlow)
- **Negative Binomial output** — Models overdispersion in restaurant demand
- **14 input features** — Historical usage, day-of-week encoding, seasonality, weather, traffic, event flags
- **Manual gradient computation** with custom Adam optimizer

### Three Autonomous AI Agents
1. **Inventory Risk Agent** — Monitors stockout probability, classifies risk (SAFE/MONITOR/URGENT/CRITICAL)
2. **Reorder Optimization Agent** — Calculates optimal order quantities and timing using newsvendor model
3. **Supplier Strategy Agent** — Evaluates supplier reliability, recommends alternatives during disruptions

### Gemini Integration
- **AI Advisor Chat** — Natural language Q&A powered by Google Gemini 2.0 Flash
- **Decision Explanations** — Gemini explains agent decisions in plain English
- **What-If Analysis** — Scenario modeling ("What if supplier is delayed 2 days?")
- **Daily Briefings** — AI-generated morning summaries for managers
- **Graceful Fallback** — Context-aware mock responses when API quota is exceeded

---

## Authentication & Roles

### Role-Based Access Control
| Role | Access |
|------|--------|
| **Restaurant Admin** | Full platform access: settings, keys, users, all features |
| **Manager** | Dashboard, POS, team management, analytics, AI chat |
| **POS User** | Point of sale terminal only |

### Login Options
- **Email/Password** — Standard registration and login with JWT auth
- **Demo Mode** — Full feature access without account (3 roles, 6 cuisine templates)
- **Staff Login** — Restaurant key + Manager ID authentication for staff onboarding

### Cuisine Templates
6 options available at login: Mediterranean, Japanese, Mexican, Indian, Italian, Southern BBQ
- **Fully themed** (unique ingredients, dishes, suppliers): Mediterranean, Japanese
- **Available** (selectable, defaults to Mediterranean data): Mexican, Indian, Italian, Southern BBQ

---

## Interactive Demo Features

### 1. Manager Dashboard (`/`)
- AI Daily Briefing with active event tracking
- Key metrics: total items, critical/urgent/safe counts, estimated value
- 7-day demand forecast chart (actual vs predicted)
- Inventory overview table with risk badges, consumption sparklines, days-of-cover gauges
- Top trending dishes widget
- Attention needed section for critical items
- Category spread chart (Proteins, Produce, Dairy, Pantry)

### 2. Admin Dashboard (`/admin`)
- Restaurant info card
- Manager and POS user counts
- Subscription tier and monthly revenue
- Quick links to Settings, Keys, Users
- Recent activity feed

### 3. Point of Sale (`/pos`)
**Three order types:**

**Dine-In:**
- Interactive floor plan with 8 tables (status indicators, capacity, server assignments)
- Category-based menu (Mezze, Salads, Seafood, Mains, Drinks, Desserts)
- Live order cart with quantity controls and real-time totals

**Takeout:**
- Customer info form (name, phone, pickup time)
- Pickup queue with status progression (Pending → Preparing → Ready → Picked Up)

**Delivery:**
- 5 platform integrations: DoorDash, Uber Eats, Grubhub, Postmates, Seamless
- Platform-branded order cards with accept/reject actions
- Connection status per platform

**Payment Processing (all types):**
- Tip selection (15%, 18%, 20%, 25%, custom)
- 8 payment methods: Credit/Debit, Cash, Apple Pay, Google Pay, PayPal, Venmo, Cash App, Klarna
- Cash change calculation with quick amount buttons
- Payment confirmation animation

### 4. Ingredient Detail (`/ingredient/:id`)
- Individual ingredient analytics
- Forecast chart with confidence intervals (upper/lower bounds)
- AI agent decision panel: risk assessment, reorder recommendations, strategy
- What-if analysis capability
- Historical consumption data and supplier info

### 5. Dishes Management (`/dishes`)
- Category filtering (Appetizer, Salad, Soup, Seafood, Meat, Vegetarian, Dessert, Cocktail)
- Sorting by popularity, name, revenue, trend
- Dish cards with orders today, 7/30-day history, trend percentage, popularity rank
- Recipe breakdown per dish with ingredient quantities
- Revenue metrics and daily order mini charts
- Active/inactive toggle, edit, delete

### 6. Suppliers Management (`/suppliers`)
- Supplier list with lead times, MOQs, reliability scores, shipping costs
- Ingredient-supplier pricing tables
- Performance metrics and comparison tools
- Purchase order creation and history

### 7. Delivery Orders (`/delivery`)
- Multi-platform order management (DoorDash, Uber Eats, Grubhub, Postmates, Seamless)
- Per-order details: platform branding, customer info, items, driver tracking
- Delivery fee and tip breakdown

### 8. AI Advisor Chat (`/chat`)
- Conversational AI powered by Google Gemini 2.0 Flash
- Context-aware responses using real restaurant data (inventory, suppliers, dishes, orders)
- Suggested quick questions
- Inventory alert panel with clickable risk items
- "Gemini Live" / "Demo Mode" connection indicator
- New chat / session management

### 9. Solana Pay (`/solana-pay`)
- QR code payment generation with amount, label, message
- Real-time SOL/USD conversion
- Payment history tracking (completed/pending)
- Currency converter (USD ↔ SOL)

### 10. Team Management (`/team`)
- POS users roster with activity status and orders processed
- Manager ID display with copy functionality
- Invite new staff form

### 11. Floor Plan Editor (`/floor-plan`)
- Visual drag-and-drop floor plan canvas
- Table management: add/remove, shape selection, capacity, section assignment
- Sections: dining, bar, patio, kitchen, storage, bathrooms, waiting, private dining
- Accessibility marking and server assignment
- Save/load multiple floor plan configurations

### 12. Timeline Analytics (`/timeline`)
- **KPI Summary** — Revenue, orders, average order value, tips, refunds, labor/food cost percentages
- **Weekly Trends** — 8-week historical charts
- **Monthly Trends** — 6-month growth metrics
- **Seasonal Analysis** — Peak vs off-season breakdown
- **Day of Week** — 12-week day-of-week patterns
- Configurable time periods (7, 30, 90 days)

### 13. Inventory Tracking (`/inventory-tracking`)
- Non-food inventory: Kitchen Equipment, Serviceware, Cleaning, Beverages, Staff Supplies
- Quantity tracking with min thresholds, cost per unit, supplier associations
- Storage location, restock dates, notes
- Low-stock alerts and value summary by category
- Add, adjust, delete items; seed default inventory

### 14. Automated Disruptions
- Auto-generated from regional data (weather, traffic, supply chain, local events, news)
- Severity levels: low, moderate, high, critical
- Impact data: delivery delays, cost impact, affected ingredients
- Menu impact analysis and ingredient risk scoring
- Historical disruption tracking

---

## Admin-Only Pages

### 15. Restaurant Settings (`/restaurant/settings`)
- Restaurant info form (name, address, phone, email)
- Subscription tier display with feature matrix (Free / Starter $49 / Pro $149 / Enterprise $399)
- Integration toggles (DoorDash, Uber Eats, Grubhub, Postmates, Solana Pay)

### 16. Key Management (`/restaurant/keys`)
- Active restaurant key with copy button
- Key history (active/expired, dates)
- Regenerate key functionality
- Usage log showing who signed up with each key

### 17. User Management (`/restaurant/users`)
- Managers tab: list with active/inactive toggle, email, manager ID, join date
- POS Users tab: staff roster, status, email, manager assignments

---

## Public Pages

### 18. Pricing (`/pricing`)
- 4-tier comparison: Free, Starter ($49), Pro ($149), Enterprise ($399)
- Per-feature breakdown: AI forecasting, risk alerts, reorder, Gemini chat, delivery, POS, API, reports
- Limits: ingredients, suppliers, locations, team members, data retention
- Monthly/yearly billing toggle

### 19. Downloads (`/downloads`)
- Desktop: macOS and Windows (available)
- Mobile: iOS and Android (coming soon)
- Feature highlights: speed, cloud sync, encryption

### 20. Staff Login (`/staff/login`)
- Manager mode: restaurant key + manager ID validation
- POS mode: simple credentials
- Sign in / sign up tabs
- Demo login buttons

---

## Navigation & UX

### Role-Aware Navigation
- **POS User**: POS only
- **Manager**: Dashboard, POS, Manage dropdown (Delivery, Dishes, Suppliers, Crypto Pay, AI Advisor, Team, Floor Plan, Analytics, Inventory)
- **Admin**: Overview, POS, Manage dropdown, Admin dropdown (Settings, Keys, Users, Team)

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Show shortcuts modal |
| `G` then `D` | Dashboard |
| `G` then `P` | POS |
| `G` then `O` | Delivery |
| `G` then `I` | Dishes |
| `G` then `S` | Suppliers |
| `G` then `W` | Solana Pay |
| `G` then `C` | Chat |
| `?` | Toggle shortcuts help |

### Theme Support
- Light / Dark / System mode
- Persisted in localStorage
- UGA color scheme (red, black, white)

---

## Demo Data

All features work **fully offline** using cuisine templates and mock data:

- **30 ingredients** with categories, costs, risk levels, days of cover, consumption trends
- **15+ menu items** across 6 categories with recipes and pricing
- **5 suppliers** with lead times, reliability scores, ingredient mappings
- **3 managers** (Elena, Maria, Dimitri) and **5 POS users** (Nikos, Sofia, Andreas, Katerina, Petros)
- **8 payment methods** and **5 delivery platforms**
- **7-day demand forecasts**, weekly trends, KPI summaries

---

## Subscription Tiers

| Feature | Free | Starter ($49) | Pro ($149) | Enterprise ($399) |
|---------|------|---------------|------------|-------------------|
| AI Demand Forecasting | Basic | Full | Full | Full |
| Risk Alerts | 3/day | Unlimited | Unlimited | Unlimited |
| Gemini AI Chat | — | Included | Included | Included |
| Delivery Integration | — | — | 5 platforms | Unlimited |
| POS System | — | Basic | Full | Full + Custom |
| API Access | — | — | Included | Included |
| Max Ingredients | 10 | 50 | 200 | Unlimited |
| Locations | 1 | 1 | 3 | Unlimited |
| Data Retention | 30 days | 90 days | 1 year | Unlimited |

---

## Tech Summary

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI + Python 3.11+ |
| Database | SQLite (dev) / PostgreSQL via AWS RDS (prod) |
| ML Model | NumPy TCN (ground-up, no frameworks) |
| AI Chat | Google Gemini 2.0 Flash |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Charts | Recharts (BarChart, AreaChart, ResponsiveContainer) |
| Icons | Lucide React (no emojis in UI) |
| Router | React Router DOM (BrowserRouter) |
| Crypto | Solana Pay (devnet) |
| AWS | RDS, S3, Cognito, Secrets Manager |

---

**Built for Hackathon 2026 — Ground-Up Model Track + Best Use of Gemini API**
