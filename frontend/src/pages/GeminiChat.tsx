import { useState, useRef, useEffect } from 'react'
import { Send, RotateCcw, Wifi, WifiOff, AlertTriangle, TrendingDown } from 'lucide-react'
import { chatWithAdvisor, checkApiHealth, getIngredients } from '../services/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const suggestedQuestions = [
  "Why is Chicken Breast showing urgent risk?",
  "What if the supplier is delayed by 2 days?",
  "Should I order more Salmon before the weekend?",
  "Explain the forecast model",
  "How do dish recipes affect demand?",
]

// Fallback responses when API is unavailable
const demoResponses: Record<string, string> = {
  "Why is Chicken Breast showing urgent risk?": `Chicken Breast is showing urgent risk due to several factors:

1. Low inventory relative to demand — Current stock of 45 lbs provides only 2 days of cover
2. Weekend surge expected — Historical data shows 25-30% higher demand on Fri-Sat
3. Weather risk — Moderate weather conditions may delay deliveries

The stockout probability of 38% exceeds our 20% threshold for urgent action.

Recommendation: Place an order for 120 lbs by February 8th to maintain adequate stock through the weekend.`,

  "What if the supplier is delayed by 2 days?": `If the supplier is delayed by 2 additional days:

Impact on Chicken Breast:
• Current days of cover: 2 days
• With delay: Effectively 0 days (stockout likely)
• Stockout probability: Would increase from 38% to ~75%

Recommended Actions:
1. Contact backup supplier (QuickSupply) with 2-day lead time
2. Consider splitting the order between suppliers
3. The Strategy Agent would recommend "multi-source" procurement

Would you like me to run a detailed simulation?`,

  "Should I order more Salmon before the weekend?": `Checking Salmon Fillet status...

Current Status:
• Inventory: 15 lbs (CRITICAL risk)
• Days of cover: Only 1 day
• Stockout probability: 65%

Yes, you should order immediately.

Recommendation:
• Order quantity: 40 lbs
• Order today (before 2 PM for next-day delivery)
• Consider expedited shipping

The weekend typically sees 40% higher Salmon orders due to special menu items.`,

  "Explain the forecast model": `Our forecasting model is built entirely from scratch using NumPy (no PyTorch/TensorFlow).

Architecture: Temporal Convolutional Network (TCN)
• Processes 28 days of historical data
• Uses dilated causal convolutions (rates: 1, 2, 4, 8)
• Captures short-term patterns and weekly seasonality

Output: Negative Binomial Distribution
Instead of a single number, we output:
• μ (mu): Expected demand
• k: Dispersion parameter
• Variance = μ + μ²/k

This properly models overdispersion in restaurant demand.

Input Features:
• Historical usage
• Day of week (one-hot)
• Week of year (sin/cos)
• Event flags, weather severity, traffic index

Trained using manual gradient computation and custom Adam optimizer.`,

  "How do dish recipes affect demand?": `Great question! Dish recipes are a key input to our demand model.

How it works:
1. You define dishes and their ingredient quantities (e.g., Salmon Bowl uses 0.4 lbs salmon)
2. We forecast dish sales using historical POS data
3. Ingredient demand = Σ(predicted dish sales × recipe quantity)

Example:
• Predicted Salmon Bowl sales tomorrow: 50 orders
• Recipe: 0.4 lbs salmon per bowl
• Salmon demand: 50 × 0.4 = 20 lbs

This "build-up" approach is more accurate than forecasting ingredients directly because:
• Dish sales patterns are more stable
• Promotions affect dishes, not ingredients
• Menu changes are automatically reflected

You can manage recipes in the Dishes tab.`
}

interface InventoryContext {
  name: string
  risk_level: string
  days_of_cover: number
}

export default function GeminiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI inventory advisor powered by Google Gemini. I can explain the agents' decisions, analyze risk factors, and answer questions about your inventory. What would you like to know?"
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
        // Demo fallback
        setInventoryContext([
          { name: 'Salmon Fillet', risk_level: 'CRITICAL', days_of_cover: 1 },
          { name: 'Chicken Breast', risk_level: 'URGENT', days_of_cover: 2 },
        ])
      }
    }
    init()
  }, [])

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
      // Fallback to demo responses
      const response = demoResponses[text] ||
        `I understand you're asking about "${text}". Based on the current agent analysis:

• The forecasting model is continuously monitoring demand patterns
• Risk agents are evaluating stockout probabilities for all ingredients
• Reorder agents are calculating optimal order quantities

Would you like me to explain any specific aspect of the inventory analysis?`

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
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-black dark:text-white">AI Advisor</h1>
            {apiConnected !== null && (
              <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                apiConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{apiConnected ? 'Gemini' : 'Demo'}</span>
              </span>
            )}
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Powered by Google Gemini</p>
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>

      {/* Context Panel */}
      {showContext && inventoryContext.length > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Current Inventory Alerts</span>
            </div>
            <button
              onClick={() => setShowContext(false)}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              Hide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {inventoryContext.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSend(`Why is ${item.name} at ${item.risk_level} risk?`)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  item.risk_level === 'CRITICAL'
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900'
                    : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900'
                }`}
              >
                <TrendingDown className="w-3 h-3" />
                <span>{item.name}</span>
                <span className="opacity-70">({item.days_of_cover}d)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-4 bg-white dark:bg-neutral-800">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
              <div className={`rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-black dark:text-white'
              }`}>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="mt-4">
          <p className="text-xs text-neutral-400 mb-2">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, i) => (
              <button
                key={i}
                onClick={() => handleSend(question)}
                className="text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-full transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="mt-4 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about inventory decisions..."
          className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-black dark:focus:border-white focus:ring-0 transition-colors bg-white dark:bg-neutral-800 text-black dark:text-white"
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-30"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-neutral-400 mt-3 text-center">
        Gemini provides explanations. Forecasts and decisions are made by the ML model and agents.
      </p>
    </div>
  )
}
