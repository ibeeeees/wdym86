import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ChevronDown, ChevronRight, Shield, Activity, Brain, Sparkles,
  Package, Truck, ShoppingCart, BarChart3, Users, MapPin, Clock, Wallet,
  Server, Database, Cloud, Lock, FileText, TestTube, Heart, Monitor,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
}

interface ApiSection {
  title: string
  icon: any
  color: string
  description: string
  endpoints: ApiEndpoint[]
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const methodColor: Record<string, string> = {
  GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const apiSections: ApiSection[] = [
  {
    title: 'Authentication',
    icon: Shield,
    color: 'from-red-500 to-rose-600',
    description: 'OAuth2 with JWT tokens. Password hashing with bcrypt. Supports AWS Cognito for production.',
    endpoints: [
      { method: 'POST', path: '/auth/login', description: 'Authenticate user with email/password (OAuth2 form-urlencoded). Returns JWT access token.' },
      { method: 'POST', path: '/auth/register', description: 'Register a new user account with email, password, and optional name.' },
    ],
  },
  {
    title: 'Dashboard & AI Agents',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    description: '3-tier autonomous agent pipeline: Inventory Risk Agent detects stockout risk, Reorder Optimization Agent optimizes timing and quantity, Supplier Strategy Agent adapts to disruptions.',
    endpoints: [
      { method: 'GET', path: '/agents/dashboard', description: 'Get full dashboard summary with risk scores, agent decisions, and KPIs.' },
      { method: 'POST', path: '/agents/{ingredient_id}/run', description: 'Run the complete 3-agent pipeline for a specific ingredient. Accepts disruption params.' },
      { method: 'GET', path: '/agents/{ingredient_id}/decisions', description: 'Retrieve historical agent decisions and recommendations for an ingredient.' },
    ],
  },
  {
    title: 'Gemini AI Integration',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
    description: 'Google Gemini 2.0 Flash powers natural language explanations, chat, what-if analysis, and daily summaries. Uses REST API with structured JSON output.',
    endpoints: [
      { method: 'POST', path: '/gemini/explain', description: 'Generate a natural language explanation of an agent decision using Gemini.' },
      { method: 'POST', path: '/gemini/chat', description: 'Multi-turn chat with the AI advisor. Supports session persistence and ingredient context.' },
      { method: 'POST', path: '/gemini/what-if', description: 'Analyze a hypothetical scenario (e.g., "What if olive oil price doubles?").' },
      { method: 'GET', path: '/gemini/daily-summary', description: 'AI-generated daily insights covering risks, opportunities, and recommended actions.' },
      { method: 'GET', path: '/gemini/disruption-forecast', description: 'AI analysis of upcoming disruption risks (weather, supply chain, events).' },
    ],
  },
  {
    title: 'Ingredients & Forecasting',
    icon: Package,
    color: 'from-green-500 to-emerald-600',
    description: 'Ingredient CRUD with NumPy TCN (Temporal Convolutional Network) forecasting model. Uses Negative Binomial distribution for probabilistic demand predictions.',
    endpoints: [
      { method: 'GET', path: '/ingredients', description: 'List all ingredients for a restaurant with current stock, risk level, and trends.' },
      { method: 'GET', path: '/ingredients/{ingredient_id}', description: 'Get detailed ingredient data including inventory history and forecast.' },
      { method: 'POST', path: '/forecasts/{ingredient_id}', description: 'Generate a new demand forecast using the TCN model. Configurable horizon (default 7 days).' },
      { method: 'GET', path: '/forecasts/{ingredient_id}', description: 'Retrieve existing forecasts with confidence intervals and accuracy metrics.' },
    ],
  },
  {
    title: 'Inventory Management',
    icon: BarChart3,
    color: 'from-cyan-500 to-blue-600',
    description: 'Full inventory tracking for food and non-food items. Supports stock adjustments, usage recording, alerts, and value summaries.',
    endpoints: [
      { method: 'POST', path: '/inventory/{ingredient_id}', description: 'Update current inventory quantity for an ingredient.' },
      { method: 'GET', path: '/inventory/{ingredient_id}/history', description: 'Get inventory level history over a configurable number of days.' },
      { method: 'GET', path: '/inventory-items/{restaurant_id}', description: 'List all inventory items with optional category and low-stock filters.' },
      { method: 'POST', path: '/inventory-items/{restaurant_id}', description: 'Create a new inventory item (food or non-food category).' },
      { method: 'POST', path: '/inventory-items/{restaurant_id}/adjust', description: 'Record a stock adjustment with reason (received, used, waste, etc.).' },
      { method: 'GET', path: '/inventory-items/{restaurant_id}/alerts', description: 'Get all items below minimum quantity thresholds.' },
    ],
  },
  {
    title: 'Suppliers',
    icon: Truck,
    color: 'from-teal-500 to-green-600',
    description: 'Supplier management with reliability scoring, lead time tracking, and pricing comparison.',
    endpoints: [
      { method: 'GET', path: '/suppliers', description: 'List all suppliers for a restaurant with reliability scores and lead times.' },
      { method: 'GET', path: '/suppliers/{supplier_id}', description: 'Get detailed supplier profile including pricing, ingredients supplied, and history.' },
    ],
  },
  {
    title: 'Menu & Dishes',
    icon: FileText,
    color: 'from-orange-500 to-red-600',
    description: 'Menu management with order tracking, popularity ranking, and trend analysis.',
    endpoints: [
      { method: 'GET', path: '/dishes', description: 'List all dishes with prices, categories, order counts, and trend data.' },
      { method: 'POST', path: '/dishes', description: 'Create a new dish with name, category, and price.' },
    ],
  },
  {
    title: 'Delivery Platforms',
    icon: ShoppingCart,
    color: 'from-pink-500 to-rose-600',
    description: 'Unified API for DoorDash, Uber Eats, Grubhub, Postmates, and Seamless. Accept, track, and manage orders across all platforms.',
    endpoints: [
      { method: 'GET', path: '/delivery/orders', description: 'Get all delivery orders across platforms. Filter by platform or status.' },
      { method: 'GET', path: '/delivery/orders/{platform}', description: 'Get orders for a specific delivery platform.' },
      { method: 'POST', path: '/delivery/orders/{platform}/{id}/accept', description: 'Accept an incoming delivery order.' },
      { method: 'PUT', path: '/delivery/orders/{platform}/{id}/status', description: 'Update order status (preparing, ready, picked_up, delivered).' },
      { method: 'GET', path: '/delivery/stats', description: 'Aggregate delivery statistics across all platforms.' },
      { method: 'GET', path: '/delivery/platforms', description: 'List supported delivery platforms and their connection status.' },
    ],
  },
  {
    title: 'Events & Disruptions',
    icon: Activity,
    color: 'from-yellow-500 to-amber-600',
    description: 'Automated disruption monitoring for weather, supply chain, traffic, and local events. Models impact on demand and ingredient availability.',
    endpoints: [
      { method: 'GET', path: '/events/active', description: 'Get currently active events affecting the restaurant.' },
      { method: 'POST', path: '/events/simulate', description: 'Simulate disruption events for testing (weather, supply shortage, etc.).' },
      { method: 'GET', path: '/events/disruption-signals', description: 'Get real-time disruption signals from monitoring engines.' },
      { method: 'GET', path: '/disruptions/{restaurant_id}/today', description: 'Get all disruptions affecting the restaurant today.' },
      { method: 'GET', path: '/disruptions/{restaurant_id}/ingredient-risk', description: 'Risk assessment per ingredient based on active disruptions.' },
      { method: 'GET', path: '/disruptions/{restaurant_id}/menu-impact', description: 'Analyze how disruptions affect menu item availability and pricing.' },
    ],
  },
  {
    title: 'POS & NCR Voyix',
    icon: Monitor,
    color: 'from-red-500 to-red-700',
    description: 'Point of sale with NCR Voyix BSP (Aloha) integration. Live catalog sync, transaction logs, and order push.',
    endpoints: [
      { method: 'GET', path: '/pos-integrations/platforms', description: 'List supported POS platforms (NCR Voyix, Square, Toast, Clover, etc.).' },
      { method: 'POST', path: '/pos-integrations/{restaurant_id}', description: 'Create a new POS integration with API credentials.' },
      { method: 'POST', path: '/pos-integrations/.../verify', description: 'Verify POS integration credentials and connectivity.' },
      { method: 'POST', path: '/pos-integrations/.../sync', description: 'Trigger a data sync (menu, orders, inventory) from POS.' },
      { method: 'GET', path: '/pos-integrations/{restaurant_id}/ncr/catalog', description: 'Fetch NCR Voyix menu catalog via BSP API.' },
      { method: 'GET', path: '/pos-integrations/{restaurant_id}/ncr/tlogs', description: 'Fetch NCR transaction logs for a date range.' },
      { method: 'POST', path: '/pos-integrations/{restaurant_id}/ncr/push-order', description: 'Push an order to NCR Voyix POS terminal.' },
    ],
  },
  {
    title: 'Floor Plans & Tables',
    icon: MapPin,
    color: 'from-indigo-500 to-purple-600',
    description: 'Visual floor plan editor with drag-and-drop table management. Supports presets for common layouts.',
    endpoints: [
      { method: 'GET', path: '/floor-plans/{restaurant_id}', description: 'Get all floor plans with table positions and configurations.' },
      { method: 'POST', path: '/floor-plans/{restaurant_id}', description: 'Create a new floor plan (blank or from preset template).' },
      { method: 'POST', path: '/floor-plans/{plan_id}/tables', description: 'Add a table with position, shape, capacity, and section.' },
      { method: 'PUT', path: '/floor-plans/tables/{table_id}', description: 'Update table properties (position, status, capacity).' },
      { method: 'GET', path: '/floor-plans/presets', description: 'Get available floor plan preset templates.' },
    ],
  },
  {
    title: 'Staff & Roles',
    icon: Users,
    color: 'from-blue-500 to-cyan-600',
    description: 'Staff management with role-based access control (Admin, Manager, POS Staff). PIN-based auth for POS, business PINs for onboarding.',
    endpoints: [
      { method: 'GET', path: '/staff/{restaurant_id}', description: 'List all staff members with roles and contact info.' },
      { method: 'POST', path: '/staff/{restaurant_id}', description: 'Create a new staff member with role and optional PIN.' },
      { method: 'POST', path: '/staff/{restaurant_id}/verify-pin', description: 'Verify a staff member PIN for POS access.' },
      { method: 'POST', path: '/staff/{restaurant_id}/business-pin', description: 'Generate a business PIN for new staff self-onboarding.' },
      { method: 'POST', path: '/staff/join', description: 'Join a restaurant using a business PIN code.' },
      { method: 'GET', path: '/staff/roles/permissions', description: 'Get all roles and their permission sets.' },
    ],
  },
  {
    title: 'Timeline Analytics',
    icon: Clock,
    color: 'from-violet-500 to-purple-600',
    description: 'Multi-resolution analytics: daily snapshots, weekly summaries, monthly trends, seasonal patterns, and KPI tracking.',
    endpoints: [
      { method: 'GET', path: '/timeline/{restaurant_id}/daily', description: 'Get daily snapshots (orders, revenue, waste) for a date range.' },
      { method: 'POST', path: '/timeline/{restaurant_id}/compute-snapshot', description: 'Compute and store a daily snapshot for a specific date.' },
      { method: 'GET', path: '/timeline/{restaurant_id}/weekly', description: 'Aggregated weekly summary with week-over-week comparisons.' },
      { method: 'GET', path: '/timeline/{restaurant_id}/monthly', description: 'Monthly trend data with year-over-year comparisons.' },
      { method: 'GET', path: '/timeline/{restaurant_id}/seasonal', description: 'Seasonal demand patterns and ingredient usage cycles.' },
      { method: 'GET', path: '/timeline/{restaurant_id}/kpi', description: 'Key performance indicators: revenue, waste rate, stockout frequency, etc.' },
    ],
  },
  {
    title: 'Payroll & Expenses',
    icon: Wallet,
    color: 'from-emerald-500 to-green-600',
    description: 'Employee payroll processing, expense tracking, and S3-based import/export for tips, paychecks, and sales data.',
    endpoints: [
      { method: 'GET', path: '/payroll/{restaurant_id}/employees', description: 'List employees with pay rates, departments, and hours.' },
      { method: 'POST', path: '/payroll/{restaurant_id}/employees', description: 'Create a new payroll employee record.' },
      { method: 'POST', path: '/payroll/{restaurant_id}/pay-runs', description: 'Run payroll for a specified period. Calculates wages, tips, and deductions.' },
      { method: 'GET', path: '/payroll/{restaurant_id}/expenses', description: 'List expenses with optional category filter.' },
      { method: 'POST', path: '/payroll/{restaurant_id}/tips/import-s3', description: 'Import tip data from S3 bucket.' },
      { method: 'POST', path: '/payroll/{restaurant_id}/paychecks/export-s3', description: 'Export paycheck reports to S3 bucket.' },
    ],
  },
  {
    title: 'Payments',
    icon: Wallet,
    color: 'from-violet-500 to-indigo-600',
    description: 'Dual payment rails: Stripe for traditional card payments and Solana Pay for cryptocurrency. Webhook support for real-time updates.',
    endpoints: [
      { method: 'POST', path: '/payments/create-intent', description: 'Create a Stripe payment intent for card processing.' },
      { method: 'POST', path: '/stripe-webhooks', description: 'Stripe webhook receiver for payment confirmations and disputes.' },
      { method: 'POST', path: '/solana-pay/create-transaction', description: 'Generate a Solana Pay transaction for crypto payments.' },
      { method: 'GET', path: '/solana-pay/verify/{reference}', description: 'Verify a Solana Pay transaction status on-chain.' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApiDocs() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const expandAll = () => {
    const all: Record<string, boolean> = {}
    apiSections.forEach(s => { all[s.title] = true })
    setExpandedSections(all)
  }

  const collapseAll = () => setExpandedSections({})

  const totalEndpoints = apiSections.reduce((sum, s) => sum + s.endpoints.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-black py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
              <Server className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">API Documentation</h1>
              <p className="text-white/60 text-sm mt-1">wdym86 REST API Reference</p>
            </div>
          </div>
          <p className="text-white/80 max-w-2xl">
            FastAPI backend with {apiSections.length} API groups and {totalEndpoints}+ endpoints.
            OAuth2 + JWT authentication, rate limiting, and automatic OpenAPI docs at <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">/docs</code>.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-full text-xs text-white font-medium">FastAPI</span>
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-full text-xs text-white font-medium">Python 3.11+</span>
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-full text-xs text-white font-medium">SQLAlchemy</span>
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-full text-xs text-white font-medium">OAuth2 + JWT</span>
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-full text-xs text-white font-medium">Gemini 2.0</span>
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-full text-xs text-white font-medium">NumPy TCN</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Health Check Section */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white">Health Checks</h2>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              The API exposes health check endpoints for monitoring uptime and connectivity. The frontend uses these to determine whether to show <strong>"Gemini Live"</strong> or <strong>"Demo Mode"</strong> badges.
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${methodColor.GET}`}>GET</span>
                <div>
                  <code className="text-sm font-mono text-black dark:text-white">/health</code>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Returns <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded text-[11px]">{`{"status": "healthy"}`}</code>. Used by the frontend <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded text-[11px]">checkApiHealth()</code> on every page load to determine online/offline state.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${methodColor.GET}`}>GET</span>
                <div>
                  <code className="text-sm font-mono text-black dark:text-white">/</code>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Root endpoint returning platform info: version, available components (TCN model, agents, Gemini), and link to <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded text-[11px]">/docs</code>.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400">
                <strong>Demo Mode:</strong> When the health check fails (backend not running), the frontend automatically switches to demo mode using local cuisine template data. All features remain functional with simulated data.
              </p>
            </div>
          </div>
        </section>

        {/* Unit Tests Section */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <TestTube className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white">Unit Tests</h2>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Backend tests use <strong>pytest</strong> with <strong>async</strong> test client for FastAPI. Tests run against an isolated test database with fixtures for authentication and sample data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <h4 className="text-sm font-semibold text-black dark:text-white mb-2">Inventory Tests</h4>
                <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /><span>GET /inventory/{'{id}'} returns current stock</span></li>
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /><span>POST /inventory/{'{id}'} creates new record</span></li>
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /><span>GET /inventory/{'{id}'}/history returns list</span></li>
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /><span>404 for non-existent ingredient</span></li>
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /><span>POST /inventory/{'{id}'}/usage records usage</span></li>
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /><span>GET /inventory/{'{id}'}/usage returns history</span></li>
                </ul>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <h4 className="text-sm font-semibold text-black dark:text-white mb-2">Test Infrastructure</h4>
                <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /><span>Async test client (httpx + FastAPI)</span></li>
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /><span>Isolated SQLite test database</span></li>
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /><span>Auth header fixtures (JWT tokens)</span></li>
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /><span>Sample ingredient/inventory fixtures</span></li>
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /><span>Rate limiting disabled in test env</span></li>
                  <li className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /><span>Run: <code className="bg-neutral-200 dark:bg-neutral-600 px-1 rounded">pytest backend/tests/</code></span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* AWS Section */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white">AWS Infrastructure</h2>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Production-ready AWS integration with graceful degradation. Every AWS service falls back to a local alternative when disabled, so the platform runs fully offline for development and demos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-semibold text-black dark:text-white">Amazon RDS (PostgreSQL)</h4>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Primary database for all restaurant data. Uses asyncpg driver with SQLAlchemy ORM.
                  Falls back to local SQLite when <code className="bg-neutral-200 dark:bg-neutral-600 px-1 rounded">RDS_ENABLED=false</code>.
                  Supports SSL connections and IAM authentication.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Cloud className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h4 className="text-sm font-semibold text-black dark:text-white">Amazon S3</h4>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  File storage for images, reports, paycheck exports, tip imports, and sales data.
                  Falls back to local <code className="bg-neutral-200 dark:bg-neutral-600 px-1 rounded">uploads/</code> directory.
                  Supports presigned URLs for secure temporary access and automatic retry with adaptive mode.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-sm font-semibold text-black dark:text-white">Amazon Cognito</h4>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  User authentication and management in production. Handles sign-up, sign-in, token refresh, password reset, and MFA.
                  Falls back to local JWT auth with bcrypt password hashing when <code className="bg-neutral-200 dark:bg-neutral-600 px-1 rounded">COGNITO_ENABLED=false</code>.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h4 className="text-sm font-semibold text-black dark:text-white">Secrets Manager</h4>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Secure credential storage for database passwords, API keys, and third-party secrets.
                  Cached with LRU to minimize API calls. Falls back to environment variables (<code className="bg-neutral-200 dark:bg-neutral-600 px-1 rounded">.env</code>) when disabled.
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Configuration:</strong> All AWS services are configured via environment variables in <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env</code>. Set <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">*_ENABLED=true</code> to activate each service. Default region: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">us-east-1</code>. Uses boto3 with adaptive retry (3 max attempts).
              </p>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white">Security & Middleware</h2>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <h4 className="text-sm font-semibold text-black dark:text-white mb-2">Rate Limiting</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  100 requests/min general, 10 requests/min for auth endpoints. Per-IP tracking. Disabled in test environment.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <h4 className="text-sm font-semibold text-black dark:text-white mb-2">Security Headers</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  XSS protection, HSTS, X-Frame-Options, Content-Type-Options, Referrer-Policy. Automatic on every response.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-750 rounded-xl border border-neutral-100 dark:border-neutral-700">
                <h4 className="text-sm font-semibold text-black dark:text-white mb-2">API Key Safety</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Middleware automatically masks secrets in API responses. Prevents accidental credential exposure in logs and client responses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-neutral-700 to-black dark:from-neutral-300 dark:to-white rounded-xl flex items-center justify-center">
                <Server className="w-5 h-5 text-white dark:text-black" />
              </div>
              <h2 className="text-xl font-bold text-black dark:text-white">API Endpoints</h2>
            </div>
            <div className="flex space-x-2">
              <button onClick={expandAll} className="text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors">Expand All</button>
              <span className="text-neutral-300 dark:text-neutral-600">|</span>
              <button onClick={collapseAll} className="text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors">Collapse All</button>
            </div>
          </div>

          <div className="space-y-3">
            {apiSections.map((section) => {
              const Icon = section.icon
              const isExpanded = expandedSections[section.title]
              return (
                <div key={section.title} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 bg-gradient-to-br ${section.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-black dark:text-white">{section.title}</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{section.endpoints.length} endpoints</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-neutral-100 dark:border-neutral-700 pt-4">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">{section.description}</p>
                      <div className="space-y-2">
                        {section.endpoints.map((ep, i) => (
                          <div key={i} className="flex items-start space-x-3 p-2.5 bg-neutral-50 dark:bg-neutral-750 rounded-lg border border-neutral-100 dark:border-neutral-700">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide flex-shrink-0 ${methodColor[ep.method]}`}>
                              {ep.method}
                            </span>
                            <div className="min-w-0">
                              <code className="text-xs font-mono text-black dark:text-white break-all">{ep.path}</code>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{ep.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pb-10">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Full interactive API docs available at <code className="bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">/docs</code> (Swagger UI) and <code className="bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">/redoc</code> (ReDoc) when the backend is running.
          </p>
        </div>
      </div>
    </div>
  )
}
