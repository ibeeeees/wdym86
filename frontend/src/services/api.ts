import axios from 'axios'

// In dev, prefer same-origin `/api` so Vite proxy handles CORS + port routing.
// In prod, set `VITE_API_URL` (e.g. https://api.yourdomain.com).
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:8001')

export const API_BASE_URL = API_BASE

const api = axios.create({
  baseURL: API_BASE,
  timeout: 3000,
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


// ==========================================
// Floor Plans & Tables
// ==========================================

export const getFloorPlans = async (restaurantId: string) => {
  const response = await api.get(`/floor-plans/${restaurantId}`)
  return response.data
}

export const createFloorPlan = async (restaurantId: string, data: {
  name: string
  preset?: string
  width?: number
  height?: number
  zones?: string
}) => {
  const response = await api.post(`/floor-plans/${restaurantId}`, data)
  return response.data
}

export const updateFloorPlan = async (planId: string, data: Record<string, unknown>) => {
  const response = await api.put(`/floor-plans/plans/${planId}`, data)
  return response.data
}

export const addTable = async (planId: string, data: {
  table_number: string
  x: number
  y: number
  width?: number
  height?: number
  shape?: string
  capacity?: number
  section?: string
}) => {
  const response = await api.post(`/floor-plans/${planId}/tables`, data)
  return response.data
}

export const updateTable = async (tableId: string, data: Record<string, unknown>) => {
  const response = await api.put(`/floor-plans/tables/${tableId}`, data)
  return response.data
}

export const batchUpdateTables = async (planId: string, updates: Array<{ table_id: string; x: number; y: number }>) => {
  const response = await api.post('/floor-plans/tables/batch-update', {
    floor_plan_id: planId,
    updates,
  })
  return response.data
}

export const deleteTable = async (tableId: string) => {
  const response = await api.delete(`/floor-plans/tables/${tableId}`)
  return response.data
}

export const getFloorPlanPresets = async () => {
  const response = await api.get('/floor-plans/presets')
  return response.data
}


// ==========================================
// Automated Disruptions
// ==========================================

export const getTodaysDisruptions = async (restaurantId: string) => {
  const response = await api.get(`/disruptions/${restaurantId}/today`)
  return response.data
}

export const getDisruptionsRange = async (restaurantId: string, startDate: string, endDate: string) => {
  const response = await api.get(`/disruptions/${restaurantId}/range`, {
    params: { start_date: startDate, end_date: endDate }
  })
  return response.data
}

export const getIngredientRisk = async (restaurantId: string) => {
  const response = await api.get(`/disruptions/${restaurantId}/ingredient-risk`)
  return response.data
}

export const getMenuImpact = async (restaurantId: string) => {
  const response = await api.get(`/disruptions/${restaurantId}/menu-impact`)
  return response.data
}

export const getDisruptionHistory = async (restaurantId: string, days: number = 7) => {
  const response = await api.get(`/disruptions/${restaurantId}/history`, {
    params: { days }
  })
  return response.data
}


// ==========================================
// Full Inventory (Non-Food)
// ==========================================

export const getInventoryItems = async (restaurantId: string, category?: string, lowStockOnly?: boolean) => {
  const params: Record<string, unknown> = {}
  if (category) params.category = category
  if (lowStockOnly) params.low_stock_only = true
  const response = await api.get(`/inventory-items/${restaurantId}`, { params })
  return response.data
}

export const createInventoryItem = async (restaurantId: string, data: {
  name: string
  category: string
  subcategory: string
  unit?: string
  current_quantity?: number
  min_quantity?: number
  unit_cost?: number
  storage_location?: string
}) => {
  const response = await api.post(`/inventory-items/${restaurantId}`, data)
  return response.data
}

export const seedDefaultInventory = async (restaurantId: string, categories?: string[]) => {
  const response = await api.post(`/inventory-items/${restaurantId}/seed-defaults`, null, {
    params: categories ? { categories } : undefined
  })
  return response.data
}

export const updateInventoryItem = async (restaurantId: string, itemId: string, data: Record<string, unknown>) => {
  const response = await api.put(`/inventory-items/${restaurantId}/items/${itemId}`, data)
  return response.data
}

export const adjustInventory = async (restaurantId: string, data: {
  item_id: string
  adjustment: number
  reason: string
}) => {
  const response = await api.post(`/inventory-items/${restaurantId}/adjust`, data)
  return response.data
}

export const deleteInventoryItem = async (restaurantId: string, itemId: string) => {
  const response = await api.delete(`/inventory-items/${restaurantId}/items/${itemId}`)
  return response.data
}

export const getInventoryAlerts = async (restaurantId: string) => {
  const response = await api.get(`/inventory-items/${restaurantId}/alerts`)
  return response.data
}

export const getInventoryValueSummary = async (restaurantId: string) => {
  const response = await api.get(`/inventory-items/${restaurantId}/value-summary`)
  return response.data
}

export const getInventoryCategories = async () => {
  const response = await api.get('/inventory-items/categories/list')
  return response.data
}


// ==========================================
// Staff & Roles
// ==========================================

export const getStaff = async (restaurantId: string, role?: string) => {
  const params: Record<string, unknown> = {}
  if (role) params.role = role
  const response = await api.get(`/staff/${restaurantId}`, { params })
  return response.data
}

export const createStaffMember = async (restaurantId: string, data: {
  name: string
  role: string
  email?: string
  pin_code?: string
  phone?: string
}) => {
  const response = await api.post(`/staff/${restaurantId}`, data)
  return response.data
}

export const updateStaffMember = async (restaurantId: string, staffId: string, data: Record<string, unknown>) => {
  const response = await api.put(`/staff/${restaurantId}/members/${staffId}`, data)
  return response.data
}

export const removeStaffMember = async (restaurantId: string, staffId: string) => {
  const response = await api.delete(`/staff/${restaurantId}/members/${staffId}`)
  return response.data
}

export const verifyStaffPin = async (restaurantId: string, pin: string) => {
  const response = await api.post(`/staff/${restaurantId}/verify-pin`, null, {
    params: { pin }
  })
  return response.data
}

export const createBusinessPin = async (restaurantId: string, data: {
  role: string
  max_uses?: number
  expires_hours?: number
}) => {
  const response = await api.post(`/staff/${restaurantId}/business-pin`, data)
  return response.data
}

export const joinWithBusinessPin = async (data: {
  pin: string
  name: string
  email?: string
  phone?: string
}) => {
  const response = await api.post('/staff/join', data)
  return response.data
}

export const getBusinessPins = async (restaurantId: string) => {
  const response = await api.get(`/staff/${restaurantId}/business-pins`)
  return response.data
}

export const seedDemoStaff = async (restaurantId: string) => {
  const response = await api.post(`/staff/${restaurantId}/seed-demo`)
  return response.data
}

export const getRolePermissions = async () => {
  const response = await api.get('/staff/roles/permissions')
  return response.data
}


// ==========================================
// Timeline Analytics
// ==========================================

export const getDailySnapshots = async (restaurantId: string, startDate: string, endDate: string) => {
  const response = await api.get(`/timeline/${restaurantId}/daily`, {
    params: { start_date: startDate, end_date: endDate }
  })
  return response.data
}

export const computeDailySnapshot = async (restaurantId: string, targetDate: string) => {
  const response = await api.post(`/timeline/${restaurantId}/compute-snapshot`, null, {
    params: { target_date: targetDate }
  })
  return response.data
}

export const getWeeklySummary = async (restaurantId: string, weeks: number = 4) => {
  const response = await api.get(`/timeline/${restaurantId}/weekly`, {
    params: { weeks }
  })
  return response.data
}

export const getMonthlyTrends = async (restaurantId: string, months: number = 6) => {
  const response = await api.get(`/timeline/${restaurantId}/monthly`, {
    params: { months }
  })
  return response.data
}

export const getSeasonalAnalysis = async (restaurantId: string) => {
  const response = await api.get(`/timeline/${restaurantId}/seasonal`)
  return response.data
}

export const getDayOfWeekAnalysis = async (restaurantId: string, weeks: number = 12) => {
  const response = await api.get(`/timeline/${restaurantId}/day-of-week`, {
    params: { weeks }
  })
  return response.data
}

export const getKpiSummary = async (restaurantId: string, periodDays: number = 30) => {
  const response = await api.get(`/timeline/${restaurantId}/kpi`, {
    params: { period_days: periodDays }
  })
  return response.data
}


// ==========================================
// POS Integrations
// ==========================================

export const getSupportedPlatforms = async () => {
  const response = await api.get('/pos-integrations/platforms')
  return response.data
}

export const getPosIntegrations = async (restaurantId: string) => {
  const response = await api.get(`/pos-integrations/${restaurantId}`)
  return response.data
}

export const createPosIntegration = async (restaurantId: string, data: {
  platform: string
  api_key?: string
  merchant_id?: string
  location_id?: string
}) => {
  const response = await api.post(`/pos-integrations/${restaurantId}`, data)
  return response.data
}

export const verifyPosIntegration = async (restaurantId: string, integrationId: string) => {
  const response = await api.post(`/pos-integrations/${restaurantId}/integrations/${integrationId}/verify`)
  return response.data
}

export const triggerPosSync = async (restaurantId: string, integrationId: string, syncType: string = 'all') => {
  const response = await api.post(`/pos-integrations/${restaurantId}/integrations/${integrationId}/sync`, null, {
    params: { sync_type: syncType }
  })
  return response.data
}

export const removePosIntegration = async (restaurantId: string, integrationId: string) => {
  const response = await api.delete(`/pos-integrations/${restaurantId}/integrations/${integrationId}`)
  return response.data
}


// ==========================================
// NCR BSP Integration (Aloha POS)
// ==========================================

export const getNcrCatalog = async (restaurantId: string) => {
  const response = await api.get(`/pos-integrations/${restaurantId}/ncr/catalog`)
  return response.data
}

export const getNcrTlogs = async (restaurantId: string, fromDate?: string, toDate?: string) => {
  const params: Record<string, string> = {}
  if (fromDate) params.from_date = fromDate
  if (toDate) params.to_date = toDate
  const response = await api.get(`/pos-integrations/${restaurantId}/ncr/tlogs`, { params })
  return response.data
}

export const getNcrOrders = async (restaurantId: string) => {
  const response = await api.get(`/pos-integrations/${restaurantId}/ncr/orders`)
  return response.data
}

export const pushOrderToNcr = async (restaurantId: string, orderData: Record<string, unknown>) => {
  const response = await api.post(`/pos-integrations/${restaurantId}/ncr/push-order`, orderData)
  return response.data
}

export const verifyNcrConnection = async (restaurantId: string) => {
  const response = await api.get(`/pos-integrations/${restaurantId}/ncr/verify`)
  return response.data
}


// ==========================================
// Payroll
// ==========================================

export const getPayrollEmployees = async (restaurantId: string, department?: string) => {
  const params: Record<string, unknown> = {}
  if (department) params.department = department
  const response = await api.get(`/payroll/${restaurantId}/employees`, { params })
  return response.data
}

export const createPayrollEmployee = async (restaurantId: string, data: Record<string, unknown>) => {
  const response = await api.post(`/payroll/${restaurantId}/employees`, data)
  return response.data
}

export const getPayRuns = async (restaurantId: string) => {
  const response = await api.get(`/payroll/${restaurantId}/pay-runs`)
  return response.data
}

export const runPayroll = async (restaurantId: string, data: { period_start: string; period_end: string }) => {
  const response = await api.post(`/payroll/${restaurantId}/pay-runs`, data)
  return response.data
}

export const getExpenses = async (restaurantId: string, category?: string) => {
  const params: Record<string, unknown> = {}
  if (category) params.category = category
  const response = await api.get(`/payroll/${restaurantId}/expenses`, { params })
  return response.data
}

export const createExpense = async (restaurantId: string, data: Record<string, unknown>) => {
  const response = await api.post(`/payroll/${restaurantId}/expenses`, data)
  return response.data
}

export const importTipsFromS3 = async (restaurantId: string) => {
  const response = await api.post(`/payroll/${restaurantId}/tips/import-s3`)
  return response.data
}

export const exportPaychecksToS3 = async (restaurantId: string, payRunId?: string) => {
  const response = await api.post(`/payroll/${restaurantId}/paychecks/export-s3`, null, {
    params: payRunId ? { pay_run_id: payRunId } : {}
  })
  return response.data
}

export const importExpensesFromS3 = async (restaurantId: string) => {
  const response = await api.post(`/payroll/${restaurantId}/expenses/import-s3`)
  return response.data
}

export const exportExpensesToS3 = async (restaurantId: string) => {
  const response = await api.post(`/payroll/${restaurantId}/expenses/export-s3`)
  return response.data
}

export const importSalesFromS3 = async (restaurantId: string) => {
  const response = await api.post(`/payroll/${restaurantId}/sales/import-s3`)
  return response.data
}

export const exportSalesToS3 = async (restaurantId: string) => {
  const response = await api.post(`/payroll/${restaurantId}/sales/export-s3`)
  return response.data
}


export default api
