import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, RotateCcw, Wifi, WifiOff, AlertTriangle, TrendingDown, Sparkles, Bot, User, MessageCircle, Lightbulb, Zap } from 'lucide-react'
import { chatWithAdvisor, checkApiHealth, getIngredients } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getCuisineTemplate } from '../data/cuisineTemplates'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

// Build restaurant context from cuisine template for Gemini
function buildRestaurantContext(template: ReturnType<typeof getCuisineTemplate>): string {
  const topIngredients = template.ingredients.slice(0, 15).map(i =>
    `- ${i.name} (${i.category}): ${i.current_inventory} ${i.unit}, risk=${i.risk_level}, days_of_cover=${i.days_of_cover}`
  ).join('\n')

  const topDishes = template.dishes.slice(0, 8).map(d =>
    `- ${d.name} ($${d.price}): ${d.orders_today} orders today, ${d.orders_7d} this week`
  ).join('\n')

  const supplierInfo = template.suppliers.map(s =>
    `- ${s.name}: ${s.lead_time_days}d lead time, ${(s.reliability_score * 100).toFixed(0)}% reliable, $${s.shipping_cost} shipping`
  ).join('\n')

  return `RESTAURANT: ${template.restaurantName} (${template.label} cuisine, ${template.country})

CURRENT INVENTORY (top items):
${topIngredients}

MENU HIGHLIGHTS:
${topDishes}

SUPPLIERS:
${supplierInfo}

DAILY BRIEFING: ${template.dailyBriefing}`
}

// Build system prompt for frontend Gemini calls
function buildFrontendSystemPrompt(restaurantName: string, cuisineType: string, restaurantContext: string): string {
  return `You are an AI-powered assistant for ${restaurantName}, a ${cuisineType} restaurant using the WDYM86 platform.

You help with ALL aspects of restaurant operations: inventory management, menu planning, supplier strategy, order analytics, staffing, delivery platforms, payments (including Solana Pay crypto), and business optimization.

CURRENT RESTAURANT DATA:
${restaurantContext}

PLATFORM FEATURES you can discuss:
- AI forecasting with NumPy TCN model (Negative Binomial output)
- 3 autonomous AI agents: Inventory Risk Agent, Reorder Optimization Agent, Supplier Strategy Agent
- POS system with dine-in, takeout, delivery
- Floor plan editor
- Delivery integrations (DoorDash, Uber Eats, Grubhub, Postmates, Seamless)
- Solana Pay cryptocurrency payments
- Timeline analytics (daily/weekly/monthly/seasonal)
- Automated disruption monitoring (weather, supply chain, local events)
- Subscription tiers: Free, Starter ($49), Pro ($149), Enterprise ($399)

CRITICAL BEHAVIOR RULE:
If the user asks about topics UNRELATED to restaurant operations, inventory, food service, business management, or the WDYM86 platform, politely redirect them. Example: "That's an interesting question! However, I'm specialized in helping you run ${restaurantName} efficiently. I can help with inventory, menu planning, suppliers, orders, analytics, staffing, and more. What would you like to know about your restaurant?"

Always be:
- Concise and practical
- Specific with numbers from the restaurant data when relevant
- Focused on actionable insights
- Clear about what the AI agents handle vs what you explain`
}

interface InventoryContext {
  name: string
  risk_level: string
  days_of_cover: number
}

// Initialize Gemini client for frontend direct calls
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY
let geminiClient: GoogleGenerativeAI | null = null
if (geminiApiKey) {
  geminiClient = new GoogleGenerativeAI(geminiApiKey)
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
  const geminiChatRef = useRef<any>(null)

  // Build context once from template
  const restaurantContext = useMemo(() => buildRestaurantContext(template), [template])
  const systemPrompt = useMemo(
    () => buildFrontendSystemPrompt(restaurantName, template.label, restaurantContext),
    [restaurantName, template.label, restaurantContext]
  )

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

  // Call Gemini directly from frontend when backend is unavailable
  const callGeminiFrontend = async (userMessage: string): Promise<string> => {
    if (!geminiClient) {
      return "I'm having trouble connecting to the AI service. Please check your configuration and try again."
    }

    try {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' })

      // Start or reuse chat session
      if (!geminiChatRef.current) {
        geminiChatRef.current = model.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: `[System Instructions]\n${systemPrompt}` }],
            },
            {
              role: 'model',
              parts: [{ text: `I understand. I'm the AI assistant for ${restaurantName}. I'll help with inventory, menu, suppliers, orders, and all restaurant operations using the actual data provided. I'll redirect off-topic questions back to restaurant management.` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.95,
          },
        })
      }

      const result = await geminiChatRef.current.sendMessage(userMessage)
      const response = await result.response
      return response.text()
    } catch (error: any) {
      // If chat session errored, reset it for next attempt
      geminiChatRef.current = null
      return `I'm having trouble connecting right now. Please try again in a moment. (${error?.message || 'Connection error'})`
    }
  }

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
      let responseContent: string

      if (apiConnected) {
        // Use backend API when connected
        const result = await chatWithAdvisor(text, sessionId)
        responseContent = result.response || result.message || 'I understand your question. Let me analyze the current inventory data and agent decisions to provide you with a helpful response.'
      } else {
        // Skip backend entirely in demo mode — go straight to Gemini
        responseContent = await callGeminiFrontend(text)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      // Fallback to Gemini frontend if backend call fails unexpectedly
      const response = await callGeminiFrontend(text)
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

  // Reset chat session when starting new chat
  const handleNewChat = () => {
    setMessages([messages[0]])
    geminiChatRef.current = null
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
          onClick={handleNewChat}
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
