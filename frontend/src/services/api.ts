import axios from 'axios'

// Use environment variable or default to localhost for development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors - but not for demo mode
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('token')
    // Don't redirect if using demo token - let the app use fallback data
    if (error.response?.status === 401 && token && token !== 'demo-token') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = async (email: string, password: string) => {
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  const response = await api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  return response.data
}

export const register = async (email: string, password: string, name?: string) => {
  const response = await api.post('/auth/register', { email, password, name })
  return response.data
}

// Dashboard
export const getDashboard = async (restaurantId: string) => {
  const response = await api.get('/agents/dashboard', {
    params: { restaurant_id: restaurantId }
  })
  return response.data
}

// Ingredients
export const getIngredients = async (restaurantId: string) => {
  const response = await api.get('/ingredients', {
    params: { restaurant_id: restaurantId }
  })
  return response.data
}

export const getIngredient = async (ingredientId: string) => {
  const response = await api.get(`/ingredients/${ingredientId}`)
  return response.data
}

// Forecasts
export const generateForecast = async (ingredientId: string, horizon: number = 7) => {
  const response = await api.post(`/forecasts/${ingredientId}`, null, {
    params: { horizon }
  })
  return response.data
}

export const getForecasts = async (ingredientId: string) => {
  const response = await api.get(`/forecasts/${ingredientId}`)
  return response.data
}

// Agents
export const runAgentPipeline = async (
  ingredientId: string,
  disruption?: { weather_risk?: number; traffic_risk?: number; hazard_flag?: boolean },
  serviceLevel?: number
) => {
  const response = await api.post(`/agents/${ingredientId}/run`, null, {
    params: { ...disruption, service_level: serviceLevel }
  })
  return response.data
}

export const getDecisions = async (ingredientId: string) => {
  const response = await api.get(`/agents/${ingredientId}/decisions`)
  return response.data
}

// Gemini
export const explainDecision = async (decisionId?: string, context?: object) => {
  const response = await api.post('/gemini/explain', {
    decision_id: decisionId,
    context: context || {}
  })
  return response.data
}

export const chatWithAdvisor = async (message: string, sessionId: string = 'default', ingredientId?: string) => {
  const response = await api.post('/gemini/chat', {
    message,
    session_id: sessionId,
    ingredient_id: ingredientId
  })
  return response.data
}

export const analyzeWhatIf = async (scenario: string, ingredientId: string) => {
  const response = await api.post('/gemini/what-if', {
    scenario,
    ingredient_id: ingredientId
  })
  return response.data
}

export const getDailySummary = async (restaurantId: string) => {
  const response = await api.get('/gemini/daily-summary', {
    params: { restaurant_id: restaurantId }
  })
  return response.data
}

// Suppliers
export const getSuppliers = async (restaurantId: string) => {
  const response = await api.get('/suppliers', {
    params: { restaurant_id: restaurantId }
  })
  return response.data
}

export const getSupplier = async (supplierId: string) => {
  const response = await api.get(`/suppliers/${supplierId}`)
  return response.data
}

// Dishes
export const getDishes = async (restaurantId: string) => {
  const response = await api.get('/dishes', {
    params: { restaurant_id: restaurantId }
  })
  return response.data
}

export const createDish = async (dish: {
  restaurant_id: string
  name: string
  category: string
  price: number
}) => {
  const response = await api.post('/dishes', dish)
  return response.data
}

// Inventory
export const updateInventory = async (ingredientId: string, quantity: number) => {
  const response = await api.post(`/inventory/${ingredientId}`, null, {
    params: { quantity }
  })
  return response.data
}

export const getInventoryHistory = async (ingredientId: string, days: number = 30) => {
  const response = await api.get(`/inventory/${ingredientId}/history`, {
    params: { days }
  })
  return response.data
}

// Events & Disruptions
export const getActiveEvents = async () => {
  const response = await api.get('/events/active')
  return response.data
}

export const simulateEvents = async (numEvents: number = 2) => {
  const response = await api.post('/events/simulate', { num_events: numEvents })
  return response.data
}

export const getDisruptionSignals = async () => {
  const response = await api.get('/events/disruption-signals')
  return response.data
}

export const clearEvents = async () => {
  const response = await api.delete('/events/clear')
  return response.data
}

export const getEventScenarios = async () => {
  const response = await api.get('/events/scenarios')
  return response.data
}

export const createRestaurantEvent = async (event: {
  name: string
  event_type: string
  start_date: string
  duration_days: number
  expected_demand_impact: number
  notes?: string
}) => {
  const response = await api.post('/events/restaurant-event', event)
  return response.data
}

// Delivery Services
export const getDeliveryOrders = async (platform?: string, status?: string) => {
  const params: Record<string, string> = {}
  if (platform) params.platform = platform
  if (status) params.status = status

  const response = await api.get('/delivery/orders', { params })
  return response.data
}

export const getDeliveryOrdersByPlatform = async (platform: string, status?: string) => {
  const params: Record<string, string> = {}
  if (status) params.status = status

  const response = await api.get(`/delivery/orders/${platform}`, { params })
  return response.data
}

export const acceptDeliveryOrder = async (platform: string, externalId: string) => {
  const response = await api.post(`/delivery/orders/${platform}/${externalId}/accept`)
  return response.data
}

export const updateDeliveryOrderStatus = async (platform: string, externalId: string, status: string) => {
  const response = await api.put(`/delivery/orders/${platform}/${externalId}/status`, { status })
  return response.data
}

export const cancelDeliveryOrder = async (platform: string, externalId: string, reason: string) => {
  const response = await api.post(`/delivery/orders/${platform}/${externalId}/cancel`, { reason })
  return response.data
}

export const getDriverLocation = async (platform: string, externalId: string) => {
  const response = await api.get(`/delivery/orders/${platform}/${externalId}/driver-location`)
  return response.data
}

export const getDeliveryStats = async () => {
  const response = await api.get('/delivery/stats')
  return response.data
}

export const getDeliveryPlatforms = async () => {
  const response = await api.get('/delivery/platforms')
  return response.data
}

// Helper to check if API is available (for demo mode fallback)
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await api.get('/health')
    return true
  } catch {
    return false
  }
}

export default api
