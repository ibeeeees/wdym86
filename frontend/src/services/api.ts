import axios from 'axios'

const API_BASE = '/api'

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

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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
  disruption?: { weather_risk?: number; traffic_risk?: number; hazard_flag?: boolean }
) => {
  const response = await api.post(`/agents/${ingredientId}/run`, null, {
    params: disruption
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

export default api
