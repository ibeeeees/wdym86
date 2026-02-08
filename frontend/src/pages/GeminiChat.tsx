import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Send, RotateCcw, Wifi, WifiOff, AlertTriangle, TrendingDown,
  Sparkles, Bot, User, Lightbulb, Zap, ImagePlus,
  X, Code, Globe, ChevronDown, ChevronUp,
} from 'lucide-react'
import { chatWithAdvisor, checkApiHealth, getIngredients } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getCuisineTemplate } from '../data/cuisineTemplates'
import {
  GoogleGenerativeAI,
  FunctionCallingMode,
} from '@google/generative-ai'
import {
  restaurantToolDeclarations,
  executeToolCall,
  buildRestaurantContext,
} from '../services/geminiTools'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  imageUrl?: string
  toolsUsed?: string[]
  codeExecution?: { code: string; output: string }
  groundingSources?: { title: string; uri: string }[]
}

interface InventoryContext {
  name: string
  risk_level: string
  days_of_cover: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const suggestedQuestions = [
  { text: "Am I running low on anything?", icon: AlertTriangle, color: 'from-red-400 to-orange-500' },
  { text: "Show me a chart of my top dishes by revenue", icon: Code, color: 'from-purple-400 to-pink-500' },
  { text: "What's the current market price for olive oil?", icon: Globe, color: 'from-blue-400 to-cyan-500' },
  { text: "Which suppliers are most reliable?", icon: TrendingDown, color: 'from-green-400 to-emerald-500' },
  { text: "What should I reorder today?", icon: Lightbulb, color: 'from-amber-400 to-yellow-500' },
]

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY)

const MAX_TOOL_ROUNDS = 5

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSystemPrompt(restaurantName: string, cuisineLabel: string, restaurantContext: string): string {
  return `You are an AI-powered assistant for ${restaurantName}, a ${cuisineLabel} restaurant using the WDYM86 platform.

You help with ALL aspects of restaurant operations: inventory management, menu planning, supplier strategy, order analytics, staffing, delivery platforms, payments (including Solana Pay crypto), and business optimization.

CURRENT RESTAURANT DATA:
${restaurantContext}

TOOLS AVAILABLE:
You have restaurant-specific function calling tools (check_inventory, search_menu, get_supplier_info, get_daily_stats, get_low_stock_alerts, create_reorder_suggestion). USE THEM whenever the user asks about inventory, menu items, suppliers, stats, or reorders. Always call a tool first rather than guessing from your training data.

You also have Google Search and code execution (Python). Use code execution to create charts, calculations, or data analysis when the user asks for visualizations or comparisons. Use Google Search when the user asks about market prices, industry trends, or external information.

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

/** Convert a File to a base64 data URL */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GeminiChat() {
  const { cuisineType, restaurantName } = useAuth()
  const template = useMemo(() => getCuisineTemplate(cuisineType || 'mediterranean'), [cuisineType])

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: template.initialChatMessage },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [inventoryContext, setInventoryContext] = useState<InventoryContext[]>([])
  const [showContext, setShowContext] = useState(true)
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null)
  const [expandedCode, setExpandedCode] = useState<Record<string, boolean>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const geminiChatRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const restaurantContext = useMemo(() => buildRestaurantContext(template), [template])
  const systemPrompt = useMemo(
    () => buildSystemPrompt(restaurantName, template.label, restaurantContext),
    [restaurantName, template.label, restaurantContext],
  )

  // ---- Init ----
  useEffect(() => {
    const init = async () => {
      const connected = await checkApiHealth()
      setApiConnected(connected)
      try {
        const data = await getIngredients('demo-restaurant-id')
        if (data) {
          setInventoryContext(
            data
              .filter((i: any) => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT')
              .slice(0, 4)
              .map((i: any) => ({ name: i.name, risk_level: i.risk_level, days_of_cover: i.days_of_cover || 0 })),
          )
        }
      } catch {
        const criticalItems = template.ingredients
          .filter(i => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT' || i.risk_level === 'MONITOR')
          .slice(0, 3)
          .map(i => ({ name: i.name, risk_level: i.risk_level, days_of_cover: i.days_of_cover }))
        setInventoryContext(criticalItems)
      }
    }
    init()
  }, [template])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ---- Gemini Frontend (with tools) ----
  const callGeminiFrontend = async (
    userMessage: string,
    imageData?: { base64: string; mimeType: string },
  ): Promise<Omit<Message, 'id' | 'role'>> => {
    try {
      // Build parts for the user message
      const userParts: any[] = []

      // Add image if present
      if (imageData) {
        userParts.push({
          inlineData: {
            data: imageData.base64,
            mimeType: imageData.mimeType,
          },
        })
        // Add contextual prompt for images
        const imagePrompt = userMessage.trim()
          ? userMessage
          : 'Analyze this image in the context of restaurant operations. If it\'s a food photo, describe the dish, suggest a menu price, and estimate ingredient costs. If it\'s an invoice or receipt, extract line items and totals. If it\'s a shelf or storage photo, assess inventory levels and organization.'
        userParts.push({ text: imagePrompt })
      } else {
        userParts.push({ text: userMessage })
      }

      // Create model with all tools enabled
      const model = geminiClient.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
        tools: [
          { functionDeclarations: restaurantToolDeclarations },
          { codeExecution: {} } as any,
          { googleSearchRetrieval: {} } as any,
        ],
        toolConfig: {
          functionCallingConfig: { mode: FunctionCallingMode.AUTO },
        },
      })

      // Start or reuse chat session
      if (!geminiChatRef.current) {
        geminiChatRef.current = model.startChat({
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.95,
          },
        })
      }

      // Send message and handle function calling loop
      let result = await geminiChatRef.current.sendMessage(userParts)
      let response = result.response
      const toolsUsed: string[] = []
      let codeExecution: { code: string; output: string } | undefined
      let groundingSources: { title: string; uri: string }[] = []

      // Function calling loop
      let rounds = 0
      while (rounds < MAX_TOOL_ROUNDS) {
        const functionCalls = response.functionCalls?.()
        if (!functionCalls || functionCalls.length === 0) break

        // Execute each function call locally
        const functionResponses = functionCalls.map((fc: any) => {
          toolsUsed.push(fc.name)
          const fnResult = executeToolCall(fc.name, fc.args || {}, template)
          return {
            functionResponse: {
              name: fc.name,
              response: fnResult,
            },
          }
        })

        // Send function results back to Gemini
        result = await geminiChatRef.current.sendMessage(functionResponses)
        response = result.response
        rounds++
      }

      // Extract code execution parts
      const candidate = response.candidates?.[0]
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if ((part as any).executableCode) {
            const execCode = (part as any).executableCode
            codeExecution = {
              code: execCode.code || '',
              output: '',
            }
          }
          if ((part as any).codeExecutionResult) {
            const execResult = (part as any).codeExecutionResult
            if (codeExecution) {
              codeExecution.output = execResult.output || ''
            } else {
              codeExecution = { code: '', output: execResult.output || '' }
            }
            if (!toolsUsed.includes('code_execution')) toolsUsed.push('code_execution')
          }
        }
      }

      // Extract grounding metadata (Google Search citations)
      const grounding = candidate?.groundingMetadata as any
      if (grounding?.groundingChunks) {
        groundingSources = grounding.groundingChunks
          .filter((c: any) => c.web)
          .map((c: any) => ({
            title: c.web.title || 'Source',
            uri: c.web.uri || '#',
          }))
        if (groundingSources.length > 0 && !toolsUsed.includes('google_search')) {
          toolsUsed.push('google_search')
        }
      }

      const textContent = response.text()

      return {
        content: textContent,
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        codeExecution,
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
      }
    } catch (error: any) {
      geminiChatRef.current = null
      return {
        content: `Gemini API error: ${error?.message || 'Connection failed'}. Check that your VITE_GEMINI_API_KEY is valid.`,
      }
    }
  }

  // ---- Send message ----
  const handleSend = async (text: string = input) => {
    if (!text.trim() && !pendingImage) return

    const imagePreview = pendingImage?.preview
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || '(Sent an image)',
      imageUrl: imagePreview,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Prepare image data for Gemini
    let imageData: { base64: string; mimeType: string } | undefined
    if (pendingImage) {
      const dataUrl = await fileToBase64(pendingImage.file)
      const base64 = dataUrl.split(',')[1]
      imageData = { base64, mimeType: pendingImage.file.type }
      setPendingImage(null)
    }

    try {
      let assistantData: Omit<Message, 'id' | 'role'>

      if (apiConnected && !imageData) {
        // Use backend API when connected (no image)
        const result = await chatWithAdvisor(text, sessionId)
        assistantData = {
          content: result.response || result.message || 'Let me analyze that for you.',
        }
      } else {
        // Use Gemini directly (demo mode or image upload)
        assistantData = await callGeminiFrontend(text, imageData)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        ...assistantData,
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const fallback = await callGeminiFrontend(text, imageData)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        ...fallback,
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

  const handleNewChat = () => {
    setMessages([messages[0]])
    geminiChatRef.current = null
    setPendingImage(null)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setPendingImage({ file, preview })
    e.target.value = ''
  }

  const toolLabel = (tool: string) => {
    switch (tool) {
      case 'check_inventory': return 'Checked inventory'
      case 'search_menu': return 'Searched menu'
      case 'get_supplier_info': return 'Checked suppliers'
      case 'get_daily_stats': return 'Pulled daily stats'
      case 'get_low_stock_alerts': return 'Checked stock alerts'
      case 'create_reorder_suggestion': return 'Created reorder suggestion'
      case 'code_execution': return 'Ran Python code'
      case 'google_search': return 'Searched the web'
      default: return tool
    }
  }

  const toolIcon = (tool: string) => {
    if (tool === 'code_execution') return Code
    if (tool === 'google_search') return Globe
    return Zap
  }

  // ---- Render ----
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
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Powered by Google Gemini 2.0 &middot; Vision &middot; Tools &middot; Search</p>
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
            <button onClick={() => setShowContext(false)} className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium">
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
              {/* User image */}
              {message.imageUrl && (
                <div className={`mb-2 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  <img
                    src={message.imageUrl}
                    alt="Uploaded"
                    className="max-w-[200px] max-h-[200px] rounded-xl border border-neutral-200 dark:border-neutral-600 object-cover"
                  />
                </div>
              )}

              <div className={`rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white dark:bg-neutral-700 text-black dark:text-white border border-neutral-200 dark:border-neutral-600 shadow-sm'
              }`}>
                <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
              </div>

              {/* Tool usage badges */}
              {message.toolsUsed && message.toolsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                  {message.toolsUsed.map((tool, i) => {
                    const Icon = toolIcon(tool)
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300"
                      >
                        <Icon className="w-2.5 h-2.5" />
                        <span>{toolLabel(tool)}</span>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Code execution display */}
              {message.codeExecution && (
                <div className="mt-2 border border-neutral-200 dark:border-neutral-600 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCode(prev => ({ ...prev, [message.id]: !prev[message.id] }))}
                    className="w-full flex items-center justify-between px-3 py-2 bg-neutral-100 dark:bg-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-650 transition-colors"
                  >
                    <span className="flex items-center space-x-1.5">
                      <Code className="w-3 h-3" />
                      <span>Python Code</span>
                    </span>
                    {expandedCode[message.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {expandedCode[message.id] && (
                    <>
                      {message.codeExecution.code && (
                        <pre className="px-3 py-2 text-[11px] bg-neutral-900 text-green-400 overflow-x-auto leading-relaxed">
                          <code>{message.codeExecution.code}</code>
                        </pre>
                      )}
                      {message.codeExecution.output && (
                        <div className="px-3 py-2 text-[11px] bg-neutral-800 text-neutral-200 border-t border-neutral-700">
                          <span className="text-neutral-500 text-[10px]">Output:</span>
                          <pre className="mt-1 overflow-x-auto">{message.codeExecution.output}</pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Google Search citations */}
              {message.groundingSources && message.groundingSources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                  {message.groundingSources.map((source, i) => (
                    <a
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      <Globe className="w-2.5 h-2.5" />
                      <span className="max-w-[150px] truncate">{source.title}</span>
                    </a>
                  ))}
                </div>
              )}

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
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 font-medium">Try these to see Gemini's tools in action</p>
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

      {/* Pending image preview */}
      {pendingImage && (
        <div className="mt-3 flex items-center space-x-2 px-2">
          <div className="relative">
            <img src={pendingImage.preview} alt="Pending" className="w-16 h-16 rounded-xl object-cover border border-neutral-200 dark:border-neutral-600" />
            <button
              onClick={() => { URL.revokeObjectURL(pendingImage.preview); setPendingImage(null) }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Image attached — Gemini will analyze it</span>
        </div>
      )}

      {/* Input */}
      <div className="mt-4 flex items-center space-x-3">
        {/* Image upload button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all hover:scale-105 text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
          title="Upload image for analysis"
        >
          <ImagePlus className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingImage ? 'Describe what to analyze, or send as-is...' : 'Ask about inventory, menu, suppliers, or upload a photo...'}
            className="w-full px-5 py-4 pr-14 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm focus:border-red-500 dark:focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && !pendingImage) || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white p-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg shadow-red-500/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-400 mt-3 text-center flex items-center justify-center space-x-1">
        <Sparkles className="w-3 h-3" />
        <span>Gemini 2.0 with function calling, vision, code execution, and web search.</span>
      </p>
    </div>
  )
}
