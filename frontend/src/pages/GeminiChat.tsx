import { useState, useRef, useEffect } from 'react'
import { Send, RotateCcw } from 'lucide-react'

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
]

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

Trained using manual gradient computation and custom Adam optimizer.`
}

export default function GeminiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello. I'm your AI inventory advisor powered by Google Gemini. I can explain the agents' decisions, analyze risk factors, and answer questions about your inventory. What would you like to know?"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

    setTimeout(() => {
      const response = demoResponses[text] ||
        `I understand you're asking about "${text}". Based on the current agent analysis, I can help you with this. The forecasting model shows stable demand patterns, and the autonomous agents are monitoring all risk factors. Would you like me to explain any specific aspect?`

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      }

      setMessages(prev => [...prev, assistantMessage])
      setLoading(false)
    }, 1000)
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
          <h1 className="text-2xl font-semibold text-black">AI Advisor</h1>
          <p className="text-neutral-500 text-sm">Powered by Google Gemini</p>
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-neutral-500 hover:text-black border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto border border-neutral-200 rounded-lg p-4 space-y-4 bg-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
              <div className={`rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-black'
              }`}>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 rounded-lg px-4 py-3">
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
          <p className="text-xs text-neutral-400 mb-2">Suggested</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, i) => (
              <button
                key={i}
                onClick={() => handleSend(question)}
                className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-full transition-colors"
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
          className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:border-black focus:ring-0 transition-colors"
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="bg-black text-white p-3 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-30"
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
