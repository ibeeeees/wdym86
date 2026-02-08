# WDYM86

## Elevator Pitch

WDYM86 is an AI-powered restaurant intelligence platform that predicts what you'll run out of before you do. It connects your POS, forecasts demand with a ground-up neural network, and uses Google Gemini to turn raw data into decisions — so you can stop guessing and start running your restaurant with confidence.

## About

WDYM86 replaces spreadsheets, gut feelings, and last-minute supplier calls with a single platform that sees everything happening in your restaurant.

**What it does:**
- **Predicts demand** using a Temporal Convolutional Network built from scratch in pure NumPy — no PyTorch, no TensorFlow, just math
- **Runs 3 autonomous AI agents** that continuously assess inventory risk, optimize reorder timing, and adapt supplier strategy
- **Connects to your POS** (NCR Voyix, Toast, Square, Clover) to pull live sales data and push orders
- **Manages your entire operation** — check-first POS with 7 payment methods, kitchen display (BOHPOS), floor plans, delivery platforms, payroll, and team management
- **Talks to you** through a Gemini 2.5-powered AI advisor that can query your live inventory, analyze food photos, run Python calculations, and search the web for market prices — all in one chat

**What makes it different:**
- The ML model is ground-up NumPy (no frameworks) with Negative Binomial output for real uncertainty quantification
- Gemini integration goes beyond chat — function calling, vision, code execution, Google Search grounding, and structured output power AI insight cards across the entire app
- 6 demo restaurants across the USA with complete data (Greek, Japanese, Mexican, Indian, Italian, BBQ) — every feature works without a backend
- Location-aware disruption engine generates realistic daily events (weather, supply chain, local events) per restaurant region

## Tech Stack

### AI & Machine Learning
- NumPy TCN (Temporal Convolutional Network) — ground-up implementation
- Negative Binomial Distribution — probabilistic demand forecasting
- Google Gemini 2.5 Flash — function calling, vision, code execution, search grounding, structured output
- 3 Autonomous AI Agents — inventory risk, reorder optimization, supplier strategy

### Frontend
- React 18 + TypeScript
- Vite (dev server + build)
- Tailwind CSS (glassmorphism UI, dark mode)
- Recharts (Line, Bar, Area, Pie charts)
- Framer Motion (animations)
- Lucide Icons
- @google/generative-ai SDK

### Backend
- FastAPI (28 routers, 130+ endpoints)
- Python 3.11+
- SQLAlchemy (async ORM, 35+ models)
- Alembic (database migrations)

### Payments
- Stripe (cards, subscriptions, webhooks)
- Solana Pay (cryptocurrency with QR codes)
- TaxJar (automated sales tax)

### Infrastructure
- AWS RDS (PostgreSQL)
- AWS S3 (file storage with local fallback)
- AWS Cognito (authentication)
- AWS Secrets Manager

### Integrations
- NCR Voyix BSP (HMAC-SHA512 auth, live catalog, transaction logs)
- DoorDash, Uber Eats, Grubhub, Postmates, Seamless

## Try It Out

**Live Demo:** [wdym86.tech](https://wdym86.tech)

Click "Try Demo" — no account required. Pick any of 6 cuisines, choose a role (Admin/Manager/POS), and explore every feature with real demo data.

**Source Code:** [github.com/ibeeeees/wdym86](https://github.com/ibeeeees/wdym86)
