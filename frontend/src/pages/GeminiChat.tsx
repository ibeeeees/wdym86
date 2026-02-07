import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, RotateCcw, Wifi, WifiOff, AlertTriangle, TrendingDown, Sparkles, Bot, User, MessageCircle, Lightbulb, Zap } from 'lucide-react'
import { chatWithAdvisor, checkApiHealth, getIngredients } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getCuisineTemplate } from '../data/cuisineTemplates'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

const suggestedQuestions = [
  { text: "What's my inventory status?", icon: AlertTriangle, color: 'from-red-400 to-orange-500' },
  { text: "How do the AI agents work?", icon: Zap, color: 'from-purple-400 to-pink-500' },
  { text: "Show me today's orders", icon: MessageCircle, color: 'from-blue-400 to-cyan-500' },
  { text: "Which suppliers are most reliable?", icon: TrendingDown, color: 'from-green-400 to-emerald-500' },
  { text: "Tell me about Solana Pay", icon: Lightbulb, color: 'from-amber-400 to-yellow-500' },
]

// Smart fallback response generator when API is unavailable
const generateSmartResponse = (question: string, restName: string, ingredientKeywords: string[]): string => {
  const q = question.toLowerCase()

  // Risk and stockout questions
  if (q.includes('risk') || q.includes('urgent') || q.includes('critical') || q.includes('stockout')) {
    const ingredient = extractIngredient(question, ingredientKeywords) || 'this ingredient'
    return `Based on my analysis of ${ingredient}:

**Risk Assessment:**
• The stockout probability has crossed our threshold based on current inventory levels
• Lead time considerations suggest ordering within the next 24-48 hours
• External factors (weather, traffic) may impact delivery timing

**Contributing Factors:**
1. Current inventory is below the safety stock threshold
2. Demand forecast shows elevated usage in the coming days
3. Supplier lead time of 2-3 days means acting now is prudent

**Recommendation:** The Reorder Agent suggests placing an order today to maintain adequate stock levels through the weekend.

Would you like me to analyze specific quantities or timing?`
  }

  // Supplier and delay questions
  if (q.includes('supplier') || q.includes('delay') || q.includes('late') || q.includes('delivery')) {
    return `Analyzing supplier impact...

**Scenario Analysis:**
If suppliers are delayed, here's what happens:
• Days of cover decreases by the delay duration
• Stockout probability increases significantly
• The Strategy Agent activates backup protocols

**Mitigation Strategies:**
1. **Multi-source procurement** — Split orders between primary and backup suppliers
2. **Safety stock increase** — Temporarily raise inventory targets
3. **Expedited shipping** — Use faster delivery options for critical items

**Current Backup Options:**
• QuickSupply: 2-day lead time (vs. 3-day standard)
• FreshDirect: Next-day available for premium items

The Strategy Agent continuously monitors supplier reliability scores to anticipate issues.`
  }

  // Ordering questions
  if (q.includes('order') || q.includes('reorder') || q.includes('buy') || q.includes('quantity')) {
    const ingredient = extractIngredient(question, ingredientKeywords) || 'the ingredient'
    return `Let me check the optimal order for ${ingredient}...

**Reorder Analysis:**
• The Reorder Agent calculates quantities using the newsvendor model
• We target a 95% service level (5% stockout tolerance)
• Order quantity = Expected demand + Safety stock - Current inventory

**Current Recommendation:**
• Order Quantity: Calculated based on 7-day forecast horizon
• Order Date: Within 24 hours for critical items
• Supplier: Primary supplier unless reliability concerns exist

**Cost Considerations:**
• Holding cost vs. stockout cost tradeoff
• Minimum order quantities factored in
• Bulk discounts applied when beneficial

The system automatically generates reorder suggestions each morning.`
  }

  // Forecast model questions
  if (q.includes('forecast') || q.includes('model') || q.includes('predict') || q.includes('tcn') || q.includes('ml') || q.includes('machine learning')) {
    return `Our forecasting model is built **entirely from scratch** using NumPy (no PyTorch/TensorFlow).

**Architecture: Temporal Convolutional Network (TCN)**
• Processes 28 days of historical data
• Uses dilated causal convolutions (rates: 1, 2, 4, 8)
• Captures both short-term patterns and weekly seasonality

**Output: Negative Binomial Distribution**
Instead of a single number, we output:
• μ (mu): Expected demand
• k: Dispersion parameter
• Variance = μ + μ²/k

This properly models the **overdispersion** common in restaurant demand.

**Input Features (14 dimensions):**
• Historical usage (normalized)
• Day of week one-hot encoding
• Week of year (sin/cos for continuity)
• Event/promotion flags
• Weather severity index
• Traffic congestion index

**Training:** Manual gradient computation with custom Adam optimizer implementation.

This ground-up approach demonstrates deep understanding of ML fundamentals.`
  }

  // Dish and recipe questions
  if (q.includes('dish') || q.includes('recipe') || q.includes('menu') || q.includes('ingredient')) {
    return `Great question about how dishes affect inventory planning!

**Recipe-Based Demand Forecasting:**
1. Each dish has defined ingredient quantities (e.g., Salmon Bowl uses 0.4 lbs salmon)
2. We forecast dish sales using historical POS data
3. Ingredient demand = Σ(predicted dish sales × recipe quantity)

**Example Calculation:**
• Predicted Salmon Bowl sales tomorrow: 50 orders
• Recipe: 0.4 lbs salmon per bowl
• Salmon demand: 50 × 0.4 = 20 lbs

**Why This Approach Works Better:**
• Dish sales patterns are more stable than raw ingredients
• Promotions and events affect dishes, not ingredients directly
• Menu changes are automatically reflected in forecasts
• Seasonal menu items handled correctly

You can manage recipes in the **Dishes** tab to keep forecasts accurate.`
  }

  // Agent questions
  if (q.includes('agent') || q.includes('ai') || q.includes('autonomous') || q.includes('decision')) {
    return `Our system uses **three autonomous AI agents** that work together:

**1. Inventory Risk Agent**
• Monitors stockout probability for all ingredients
• Considers lead times, weather, and traffic disruptions
• Classifies risk as SAFE, MONITOR, URGENT, or CRITICAL

**2. Reorder Optimization Agent**
• Calculates optimal order quantities and timing
• Balances holding costs vs. stockout costs
• Respects supplier MOQs and budget constraints

**3. Supplier Strategy Agent**
• Evaluates supplier reliability continuously
• Suggests backup suppliers when needed
• Recommends multi-sourcing for critical items

**How They Work Together:**
Risk Agent → Identifies problems
Reorder Agent → Proposes solutions
Strategy Agent → Optimizes execution

I (Gemini) explain their decisions in natural language.`
  }

  // Weather and external factors
  if (q.includes('weather') || q.includes('traffic') || q.includes('disruption') || q.includes('external')) {
    return `**External Factor Monitoring:**

Our system continuously monitors disruptions that affect inventory:

**Weather Impact:**
• Severe weather can delay supplier deliveries
• Weather also affects customer demand (storms → more delivery orders)
• We factor weather forecasts into demand predictions

**Traffic Conditions:**
• Rush hour patterns affect delivery windows
• Major events (sports, concerts) create congestion
• Real-time traffic data adjusts lead time estimates

**How It Affects Decisions:**
• Risk Agent raises stockout probability during disruptions
• Reorder Agent suggests ordering earlier as buffer
• Strategy Agent may recommend expedited shipping

**Data Sources:**
• Weather: National Weather Service API
• Traffic: Real-time congestion indices
• Events: Local event calendars

This "disruption-aware" forecasting is a key differentiator.`
  }

  // Weekend and timing questions
  if (q.includes('weekend') || q.includes('saturday') || q.includes('sunday') || q.includes('friday') || q.includes('busy')) {
    return `**Weekend Demand Analysis:**

Weekends typically show **25-40% higher demand** for most ingredients.

**Pattern Breakdown:**
• Friday: +15-20% (date nights, end of week celebrations)
• Saturday: +30-40% (peak day for most restaurants)
• Sunday: +20-25% (brunch rush, family dinners)

**What This Means for Inventory:**
1. Orders should arrive by Thursday for weekend coverage
2. Safety stock should be higher going into Friday
3. Fresh items need extra attention due to shelf life

**Current Recommendations:**
The system automatically adjusts forecasts for day-of-week patterns. For this weekend, ensure high-demand items are well-stocked by Thursday EOD.

Check the Dashboard for specific ingredient recommendations.`
  }

  // POS and orders questions
  if (q.includes('pos') || q.includes('point of sale') || q.includes('orders') || q.includes('table') || q.includes('checkout')) {
    return `**POS System Overview:**

Your ${restName} POS handles all order types:

**Order Types:**
• **Dine-in**: Table assignment, course timing, split checks
• **Takeout**: Quick checkout, scheduled pickups
• **Delivery**: Integrated with 5 platforms (DoorDash, Uber Eats, etc.)

**Key Features:**
1. Real-time order tracking from kitchen to table
2. Automatic inventory deduction when dishes are sold
3. Multiple payment methods including Solana Pay
4. Table management with status indicators

**Today's Quick Stats:**
• Orders sync automatically to the dashboard
• Each sale updates ingredient forecasts
• Sales patterns feed into demand prediction

Open the **POS** tab to view current orders and process payments.`
  }

  // Delivery platform questions
  if (q.includes('delivery') || q.includes('doordash') || q.includes('uber eats') || q.includes('grubhub') || q.includes('postmates') || q.includes('seamless')) {
    return `**Delivery Platform Integration:**

${restName} is connected to all major platforms:

**Active Platforms:**
• 🚗 DoorDash - Most popular, best for lunch
• 🚙 Uber Eats - Strong dinner performance
• 🍔 Grubhub - Good corporate orders
• 📦 Postmates - Quick local delivery
• 🍽️ Seamless - NYC/urban focus

**How It Works:**
1. Orders sync automatically to your POS
2. Menu and pricing managed centrally
3. Delivery status tracked in real-time
4. Commission reports generated weekly

**Performance Insights:**
• Track which platform drives most revenue
• Monitor average order values
• Identify peak delivery hours
• Optimize menu for delivery packaging

Check the **Delivery** tab to manage platform settings and view analytics.`
  }

  // Solana Pay and crypto questions
  if (q.includes('solana') || q.includes('crypto') || q.includes('bitcoin') || q.includes('wallet') || q.includes('sol') || q.includes('blockchain')) {
    return `**Solana Pay Integration:**

Accept cryptocurrency payments directly at ${restName}!

**How It Works:**
1. Generate a QR code for the order amount
2. Customer scans with their Solana wallet
3. Payment confirms in ~400ms (sub-second!)
4. Automatic USD conversion tracking

**Benefits:**
• **Speed**: Faster than card processing
• **Fees**: Lower than 2.9% card fees
• **Global**: Accept payments from anywhere
• **Modern**: Appeal to crypto-native customers

**Current SOL Price:** Updated in real-time
• Amount shown in both USD and SOL
• Historical rate tracking

**Getting Started:**
1. Go to **Crypto Pay** tab
2. Enter payment amount
3. Show QR code to customer
4. Confirm when payment received

The system tracks all crypto transactions for accounting.`
  }

  // Subscription and pricing questions
  if (q.includes('subscription') || q.includes('tier') || q.includes('pricing') || q.includes('plan') || q.includes('upgrade')) {
    return `**WDYM86 Subscription Tiers:**

**🆓 Free Tier**
• 10 ingredients, 1 location
• Basic forecasting
• 30-day data retention

**⚡ Starter - $49/month**
• 50 ingredients, 3 team members
• Gemini AI Chat
• POS integration
• 90-day data retention

**👑 Pro - $149/month** *(Most Popular)*
• 200 ingredients, 3 locations
• Supplier Strategy Agent
• Delivery integrations
• API access, Custom reports
• 1-year data retention

**🏢 Enterprise - $399/month**
• Unlimited everything
• Dedicated account manager
• Custom integrations
• Unlimited data retention

**Current Plan Benefits:**
Check the **Pricing** tab to see feature comparison and upgrade options.`
  }

  // Default intelligent response
  return `I can help with that question about "${question.slice(0, 50)}${question.length > 50 ? '...' : ''}".

Based on the current inventory analysis:

**System Status:**
• The forecasting model is actively monitoring demand patterns across all ingredients
• Risk agents are evaluating stockout probabilities in real-time
• Reorder agents have calculated optimal quantities for items needing attention

**Quick Actions I Can Help With:**
1. Explain why specific ingredients show certain risk levels
2. Analyze "what-if" scenarios (supplier delays, demand spikes)
3. Break down how the ML model generates forecasts
4. Recommend ordering strategies

**Try asking about:**
• A specific ingredient's risk status
• How weather affects your inventory
• The TCN forecasting model architecture
• Optimal reorder timing and quantities

What specific aspect would you like me to dive deeper into?`
}

// Helper to extract ingredient name from question
const extractIngredient = (question: string, keywords: string[]): string | null => {
  const q = question.toLowerCase()
  for (const ing of keywords) {
    if (q.includes(ing)) {
      return ing.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }
  return null
}

interface InventoryContext {
  name: string
  risk_level: string
  days_of_cover: number
}

export default function GeminiChat() {
  const { cuisineType, restaurantName } = useAuth()
  const template = useMemo(() => getCuisineTemplate(cuisineType || 'mediterranean'), [cuisineType])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: template.initialChatMessage
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [inventoryContext, setInventoryContext] = useState<InventoryContext[]>([])
  const [showContext, setShowContext] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      const connected = await checkApiHealth()
      setApiConnected(connected)

      // Fetch current inventory context
      try {
        const data = await getIngredients('demo-restaurant-id')
        if (data) {
          setInventoryContext(
            data
              .filter((i: any) => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT')
              .slice(0, 4)
              .map((i: any) => ({
                name: i.name,
                risk_level: i.risk_level,
                days_of_cover: i.days_of_cover || 0
              }))
          )
        }
      } catch {
        // Demo fallback using cuisine template ingredients
        const criticalItems = template.ingredients
          .filter(i => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT' || i.risk_level === 'MONITOR')
          .slice(0, 3)
          .map(i => ({ name: i.name, risk_level: i.risk_level, days_of_cover: i.days_of_cover }))
        setInventoryContext(criticalItems)
      }
    }
    init()
  }, [template])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Try to call the API first
      const result = await chatWithAdvisor(text, sessionId)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response || result.message || 'I understand your question. Let me analyze the current inventory data and agent decisions to provide you with a helpful response.',
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      // Fallback to smart demo responses with keyword matching
      const response = generateSmartResponse(text, restaurantName, template.chatIngredientKeywords)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      }
      setMessages(prev => [...prev, assistantMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-black dark:text-white">AI Advisor</h1>
              {apiConnected !== null && (
                <span className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                  apiConnected
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gradient-to-r from-red-100 to-purple-100 dark:from-red-900/30 dark:to-purple-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{apiConnected ? 'Gemini Live' : 'Demo Mode'}</span>
                </span>
              )}
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Powered by Google Gemini 2.0</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="flex items-center space-x-2 px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all hover:scale-105"
        >
          <RotateCcw className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Context Panel */}
      {showContext && inventoryContext.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Inventory Alerts</span>
            </div>
            <button
              onClick={() => setShowContext(false)}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
            >
              Dismiss
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {inventoryContext.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSend(`Why is ${item.name} at ${item.risk_level} risk?`)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 ${
                  item.risk_level === 'CRITICAL'
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                }`}
              >
                <TrendingDown className="w-3 h-3" />
                <span>{item.name}</span>
                <span className="opacity-80">({item.days_of_cover}d)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl p-4 space-y-4 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                : 'bg-gradient-to-br from-red-500 to-red-700'
            }`}>
              {message.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>

            {/* Message */}
            <div className={`max-w-[75%] ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white dark:bg-neutral-700 text-black dark:text-white border border-neutral-200 dark:border-neutral-600 shadow-sm'
              }`}>
                <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
              </div>
              <p className={`text-[10px] text-neutral-400 mt-1 ${message.role === 'user' ? 'text-right mr-2' : 'ml-2'}`}>
                {message.role === 'user' ? 'You' : 'Gemini'}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="mt-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 font-medium">Quick questions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {suggestedQuestions.map((q, i) => {
              const Icon = q.icon
              return (
                <button
                  key={i}
                  onClick={() => handleSend(q.text)}
                  className="group flex flex-col items-center p-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 rounded-xl transition-all hover:scale-[1.02] text-center"
                >
                  <div className={`w-8 h-8 bg-gradient-to-br ${q.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">{q.text}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="mt-4 flex items-center space-x-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your inventory..."
            className="w-full px-5 py-4 pr-14 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm focus:border-red-500 dark:focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white p-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg shadow-red-500/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-400 mt-3 text-center flex items-center justify-center space-x-1">
        <Sparkles className="w-3 h-3" />
        <span>Gemini provides explanations. Forecasts and decisions are made by the ML model and agents.</span>
      </p>
    </div>
  )
}
