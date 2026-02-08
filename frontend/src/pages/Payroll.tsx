import { useState, useMemo, useEffect } from 'react'
import {
  Banknote, Users, DollarSign, Clock, AlertTriangle, Receipt,
  Check, Plug, Search, Download, FileText,
  Plus, Upload,
  Cloud, CloudOff, TrendingUp
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCuisineTemplate } from '../data/cuisineTemplates'
import {
  getEmployees,
  getPayRuns,
  getExpenses,
} from '../services/payroll'
import {
  checkApiHealth,
  importTipsFromS3,
  exportPaychecksToS3,
  importExpensesFromS3,
  exportExpensesToS3,
  importSalesFromS3,
  exportSalesToS3,
} from '../services/api'

// ==========================================
// Types
// ==========================================

type EmploymentType = 'full_time' | 'part_time'
type CompensationType = 'hourly' | 'salary'

interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string
  employmentType: EmploymentType
  compensationType: CompensationType
  hourlyRate?: number
  annualSalary?: number
  hoursThisPeriod: number
  overtimeHours: number
  tipsThisPeriod: number
  status: 'active' | 'on_leave' | 'terminated'
  startDate: string
}

interface PayRunRecord {
  id: string
  periodStart: string
  periodEnd: string
  runDate: string
  totalGross: number
  totalNet: number
  totalTaxes: number
  totalTips: number
  employeeCount: number
  status: 'completed' | 'processing' | 'pending'
}

interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  status: 'approved' | 'pending' | 'rejected'
  vendor?: string
}

interface PayrollIntegration {
  id: string
  name: string
  description: string
  icon: string
  color: string
  status: 'connected' | 'disconnected'
  features: string[]
  apiKeyConfigured: boolean
  lastSyncedAt?: string
}

// ==========================================
// Demo Data
// ==========================================

const EXPENSE_CATEGORIES = [
  'Food & Beverage', 'Labor', 'Rent & Utilities', 'Equipment',
  'Marketing', 'Insurance', 'Supplies', 'Other'
]

const payrollProviders: PayrollIntegration[] = [
  {
    id: 'adp', name: 'ADP Workforce Now',
    description: 'Enterprise payroll, HR, and benefits platform',
    icon: 'ADP', color: 'from-red-500 to-red-700', status: 'disconnected',
    features: ['Automated tax filing', 'Direct deposit', 'Benefits admin', 'Time tracking sync'],
    apiKeyConfigured: false,
  },
  {
    id: 'gusto', name: 'Gusto',
    description: 'Modern payroll and HR for small businesses',
    icon: 'GS', color: 'from-green-500 to-emerald-600', status: 'connected',
    features: ['Full-service payroll', 'Health insurance', 'Workers comp', 'PTO tracking'],
    apiKeyConfigured: true, lastSyncedAt: '2026-02-06T14:30:00Z',
  },
  {
    id: 'paychex', name: 'Paychex Flex',
    description: 'Payroll and HR solutions for restaurants',
    icon: 'PX', color: 'from-blue-500 to-blue-700', status: 'disconnected',
    features: ['Payroll processing', 'Tax administration', 'Employee screening', '401(k) plans'],
    apiKeyConfigured: false,
  },
  {
    id: 'square_payroll', name: 'Square Payroll',
    description: 'Payroll built for Square POS users',
    icon: 'SQ', color: 'from-neutral-700 to-neutral-900', status: 'disconnected',
    features: ['POS integration', 'Tip importing', 'Automatic tax filing', 'Contractor payments'],
    apiKeyConfigured: false,
  },
  {
    id: 'toast_payroll', name: 'Toast Payroll',
    description: 'Restaurant-specific payroll + POS',
    icon: 'TP', color: 'from-orange-500 to-orange-700', status: 'disconnected',
    features: ['Tip pooling', 'POS sync', 'Labor compliance', 'New hire onboarding'],
    apiKeyConfigured: false,
  },
  {
    id: 'quickbooks', name: 'QuickBooks Payroll',
    description: 'Payroll integrated with QuickBooks accounting',
    icon: 'QB', color: 'from-emerald-500 to-green-700', status: 'disconnected',
    features: ['Same-day direct deposit', 'Auto tax calculations', 'Accounting sync', '1099 e-file'],
    apiKeyConfigured: false,
  },
]

function buildDemoEmployees(template: ReturnType<typeof getCuisineTemplate>, restaurantName: string): Employee[] {
  const employees: Employee[] = []
  const users = template.demoUsers
  const servers = template.serverNames
  const rKey = restaurantName.split(' ')[0].toLowerCase()

  employees.push({
    id: 'emp-001', name: users.restaurant_admin.name,
    email: users.restaurant_admin.email, role: 'Owner / Admin',
    department: 'Management', employmentType: 'full_time',
    compensationType: 'salary', annualSalary: 72000,
    hoursThisPeriod: 80, overtimeHours: 0, tipsThisPeriod: 0,
    status: 'active', startDate: '2023-03-15',
  })

  employees.push({
    id: 'emp-002', name: users.manager.name,
    email: users.manager.email, role: 'General Manager',
    department: 'Management', employmentType: 'full_time',
    compensationType: 'salary', annualSalary: 58000,
    hoursThisPeriod: 82, overtimeHours: 2, tipsThisPeriod: 0,
    status: 'active', startDate: '2023-06-01',
  })

  servers.forEach((name, i) => {
    employees.push({
      id: `emp-${100 + i}`, name,
      email: `${name.split(' ')[0].toLowerCase()}@${rKey}.com`,
      role: i === 0 ? 'Head Server' : 'Server',
      department: 'Front of House',
      employmentType: i === 0 ? 'full_time' : 'part_time',
      compensationType: 'hourly', hourlyRate: 12.50 + (i * 0.75),
      hoursThisPeriod: i === 0 ? 76 : 32 + (i * 4),
      overtimeHours: i === 0 ? 4 : 0,
      tipsThisPeriod: i === 0 ? 385 : 150 + (i * 45),
      status: 'active', startDate: `2024-0${Math.min(i + 1, 9)}-15`,
    })
  })

  employees.push(
    {
      id: 'emp-200', name: 'Carlos Rivera',
      email: `carlos@${rKey}.com`, role: 'Line Cook',
      department: 'Back of House', employmentType: 'full_time',
      compensationType: 'hourly', hourlyRate: 18.50,
      hoursThisPeriod: 80, overtimeHours: 8, tipsThisPeriod: 0,
      status: 'active', startDate: '2023-09-01',
    },
    {
      id: 'emp-201', name: 'Sam Johnson',
      email: `sam@${rKey}.com`, role: 'Prep Cook',
      department: 'Back of House', employmentType: 'full_time',
      compensationType: 'hourly', hourlyRate: 15.00,
      hoursThisPeriod: 78, overtimeHours: 0, tipsThisPeriod: 0,
      status: 'active', startDate: '2024-01-10',
    },
    {
      id: 'emp-202', name: 'Jordan Lee',
      email: `jordan@${rKey}.com`, role: 'Dishwasher',
      department: 'Back of House', employmentType: 'part_time',
      compensationType: 'hourly', hourlyRate: 11.00,
      hoursThisPeriod: 30, overtimeHours: 0, tipsThisPeriod: 0,
      status: 'active', startDate: '2024-07-20',
    },
  )

  return employees
}

const demoPayRuns: PayRunRecord[] = [
  { id: 'pr-6', periodStart: '2026-01-20', periodEnd: '2026-02-02', runDate: '2026-02-03', totalGross: 24850, totalNet: 19383, totalTaxes: 5467, totalTips: 1820, employeeCount: 10, status: 'completed' },
  { id: 'pr-5', periodStart: '2026-01-06', periodEnd: '2026-01-19', runDate: '2026-01-20', totalGross: 24200, totalNet: 18876, totalTaxes: 5324, totalTips: 1690, employeeCount: 10, status: 'completed' },
  { id: 'pr-4', periodStart: '2025-12-23', periodEnd: '2026-01-05', runDate: '2026-01-06', totalGross: 26100, totalNet: 20358, totalTaxes: 5742, totalTips: 2150, employeeCount: 10, status: 'completed' },
  { id: 'pr-3', periodStart: '2025-12-09', periodEnd: '2025-12-22', runDate: '2025-12-23', totalGross: 23900, totalNet: 18642, totalTaxes: 5258, totalTips: 1580, employeeCount: 9, status: 'completed' },
  { id: 'pr-2', periodStart: '2025-11-25', periodEnd: '2025-12-08', runDate: '2025-12-09', totalGross: 25400, totalNet: 19812, totalTaxes: 5588, totalTips: 1950, employeeCount: 10, status: 'completed' },
  { id: 'pr-1', periodStart: '2025-11-11', periodEnd: '2025-11-24', runDate: '2025-11-25', totalGross: 23500, totalNet: 18330, totalTaxes: 5170, totalTips: 1480, employeeCount: 9, status: 'completed' },
]

const demoExpenses: Expense[] = [
  { id: 'ex-1', date: '2026-02-06', category: 'Food & Beverage', description: 'Weekly produce delivery - Sysco', amount: 2340.00, status: 'approved', vendor: 'Sysco' },
  { id: 'ex-2', date: '2026-02-05', category: 'Labor', description: 'Uniform cleaning service', amount: 185.00, status: 'approved', vendor: 'CleanPro' },
  { id: 'ex-3', date: '2026-02-04', category: 'Rent & Utilities', description: 'Monthly electric bill', amount: 1850.00, status: 'approved', vendor: 'Georgia Power' },
  { id: 'ex-4', date: '2026-02-04', category: 'Equipment', description: 'Replacement blender motor', amount: 275.00, status: 'approved', vendor: 'Restaurant Supply Co' },
  { id: 'ex-5', date: '2026-02-03', category: 'Food & Beverage', description: 'Specialty meat order', amount: 1560.00, status: 'approved', vendor: 'Local Farms' },
  { id: 'ex-6', date: '2026-02-03', category: 'Marketing', description: 'Instagram promoted posts', amount: 350.00, status: 'pending', vendor: 'Meta Ads' },
  { id: 'ex-7', date: '2026-02-02', category: 'Insurance', description: 'Monthly liability premium', amount: 890.00, status: 'approved', vendor: 'StateFarm' },
  { id: 'ex-8', date: '2026-02-01', category: 'Rent & Utilities', description: 'Monthly rent payment', amount: 6500.00, status: 'approved', vendor: 'Property Mgmt' },
  { id: 'ex-9', date: '2026-02-01', category: 'Supplies', description: 'Cleaning supplies restock', amount: 420.00, status: 'approved', vendor: 'CleanSource' },
  { id: 'ex-10', date: '2026-01-31', category: 'Food & Beverage', description: 'Wine inventory restock', amount: 3200.00, status: 'approved', vendor: 'Wine Direct' },
  { id: 'ex-11', date: '2026-01-30', category: 'Equipment', description: 'New POS terminal', amount: 650.00, status: 'pending', vendor: 'Square' },
  { id: 'ex-12', date: '2026-01-29', category: 'Marketing', description: 'Menu design and printing', amount: 480.00, status: 'approved', vendor: 'DesignHub' },
  { id: 'ex-13', date: '2026-01-28', category: 'Supplies', description: 'Takeout containers and bags', amount: 310.00, status: 'approved', vendor: 'EcoPack' },
  { id: 'ex-14', date: '2026-01-27', category: 'Other', description: 'Pest control quarterly service', amount: 225.00, status: 'approved', vendor: 'Terminix' },
  { id: 'ex-15', date: '2026-01-26', category: 'Labor', description: 'Staff training program', amount: 600.00, status: 'approved', vendor: 'RestaurantU' },
]

// ==========================================
// Helper functions
// ==========================================

const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function calcGross(emp: Employee): number {
  if (emp.compensationType === 'salary' && emp.annualSalary) return emp.annualSalary / 26
  if (emp.hourlyRate) {
    const regular = Math.min(emp.hoursThisPeriod, 80) * emp.hourlyRate
    const ot = emp.overtimeHours * emp.hourlyRate * 1.5
    return regular + ot
  }
  return 0
}

// ==========================================
// Component
// ==========================================

const tabs = [
  { id: 'roster' as const, label: 'Employees', icon: Users },
  { id: 'current' as const, label: 'Current Period', icon: DollarSign },
  { id: 'history' as const, label: 'Pay History', icon: Clock },
  { id: 'expenses' as const, label: 'Expenses', icon: Receipt },
  { id: 'integrations' as const, label: 'Integrations', icon: Plug },
]

export default function Payroll() {
  const { cuisineType, restaurantName, restaurantId } = useAuth()
  const template = useMemo(() => getCuisineTemplate(cuisineType || 'mediterranean'), [cuisineType])
  
  // State
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payRuns, setPayRuns] = useState<PayRunRecord[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['id']>('roster')
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [integrations, setIntegrations] = useState<PayrollIntegration[]>(payrollProviders)
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null)
  const [configForm, setConfigForm] = useState({ apiKey: '', webhookUrl: '' })
  const [toast, setToast] = useState<string | null>(null)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({ category: 'Food & Beverage', description: '', amount: '', date: '2026-02-07', vendor: '' })
  const [apiConnected, setApiConnected] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // Load data from API
  useEffect(() => {
    loadAllData()
  }, [restaurantId])

  const loadAllData = async () => {
    try {
      const connected = await checkApiHealth()
      setApiConnected(connected)

      if (connected && restaurantId) {
        await Promise.all([
          loadEmployees(),
          loadPayRuns(),
          loadExpenses(),
        ])
      } else {
        // Fallback to demo data
        loadDemoData()
      }
    } catch (error) {
      console.error('Failed to load payroll data:', error)
      loadDemoData()
    }
  }

  const loadEmployees = async () => {
    if (!restaurantId) return
    try {
      const data = await getEmployees(restaurantId)
      setEmployees(data.map((e: any) => ({
        id: e.id,
        name: e.name,
        email: e.email || '',
        role: e.role,
        department: e.department,
        employmentType: e.employment_type,
        compensationType: e.compensation_type,
        hourlyRate: e.hourly_rate || 0,
        annualSalary: e.annual_salary || 0,
        hoursThisPeriod: 0, // Would come from time tracking
        overtimeHours: 0,
        tipsThisPeriod: 0,
        status: e.status,
        startDate: e.start_date || '',
      })))
    } catch (error) {
      console.error('Failed to load employees:', error)
      loadDemoData()
    }
  }

  const loadPayRuns = async () => {
    if (!restaurantId) return
    try {
      const data = await getPayRuns(restaurantId, 10)
      setPayRuns(data.map((run: any) => ({
        id: run.id,
        periodStart: run.period_start,
        periodEnd: run.period_end,
        runDate: run.run_date,
        totalGross: run.total_gross,
        totalNet: run.total_net,
        totalTaxes: run.total_taxes,
        totalTips: run.total_tips,
        employeeCount: run.employee_count,
        status: run.status,
      })))
    } catch (error) {
      console.error('Failed to load pay runs:', error)
    }
  }

  const loadExpenses = async () => {
    if (!restaurantId) return
    try {
      const data = await getExpenses(restaurantId, undefined, 50)
      setExpenses(data.map((exp: any) => ({
        id: exp.id,
        date: exp.date,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        vendor: exp.vendor || '',
        status: exp.status,
      })))
    } catch (error) {
      console.error('Failed to load expenses:', error)
    }
  }

  const loadDemoData = () => {
    setEmployees(buildDemoEmployees(template, restaurantName))
    setPayRuns(demoPayRuns)
    setExpenses(demoExpenses)
  }

  // Filtered employees
  const filteredEmployees = employees.filter(e => {
    if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase()) && !e.role.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (departmentFilter !== 'all' && e.department !== departmentFilter) return false
    return true
  })

  // Period summary calculations
  const periodSummary = useMemo(() => {
    const active = employees.filter(e => e.status === 'active')
    const totalGross = active.reduce((s, e) => s + calcGross(e), 0)
    const totalHours = active.reduce((s, e) => s + e.hoursThisPeriod, 0)
    const totalOT = active.reduce((s, e) => s + e.overtimeHours, 0)
    const totalTips = active.reduce((s, e) => s + e.tipsThisPeriod, 0)
    const totalTaxes = totalGross * 0.22
    return { totalGross, totalHours, totalOT, totalTips, totalTaxes, totalNet: totalGross - totalTaxes, count: active.length }
  }, [employees])

  // Expense summary
  const expenseSummary = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const byCategory: Record<string, number> = {}
    expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount })
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
    return { total, topCategory: topCategory?.[0] || 'N/A', topAmount: topCategory?.[1] || 0, byCategory }
  }, [expenses])

  const exportCSV = () => {
    const headers = ['Name', 'Role', 'Department', 'Type', 'Hours', 'OT Hours', 'Tips', 'Gross Pay', 'Taxes', 'Net Pay']
    const rows = employees.filter(e => e.status === 'active').map(e => {
      const gross = calcGross(e)
      const taxes = gross * 0.22
      return [e.name, e.role, e.department, e.employmentType, e.hoursThisPeriod, e.overtimeHours, e.tipsThisPeriod.toFixed(2), gross.toFixed(2), taxes.toFixed(2), (gross - taxes).toFixed(2)]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Payroll data exported as CSV')
  }

  const runPayroll = () => {
    const newRun: PayRunRecord = {
      id: `pr-${payRuns.length + 1}`,
      periodStart: '2026-02-03',
      periodEnd: '2026-02-16',
      runDate: '2026-02-07',
      totalGross: periodSummary.totalGross,
      totalNet: periodSummary.totalNet,
      totalTaxes: periodSummary.totalTaxes,
      totalTips: periodSummary.totalTips,
      employeeCount: periodSummary.count,
      status: 'processing',
    }
    setPayRuns([newRun, ...payRuns])
    showToast('Payroll run initiated - processing...')
  }

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount) return
    const expense: Expense = {
      id: `ex-${expenses.length + 1}`,
      date: newExpense.date,
      category: newExpense.category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      status: 'pending',
      vendor: newExpense.vendor || undefined,
    }
    setExpenses([expense, ...expenses])
    setNewExpense({ category: 'Food & Beverage', description: '', amount: '', date: '2026-02-07', vendor: '' })
    setShowAddExpense(false)
    showToast('Expense added')
  }

  // S3 import/export handlers with demo fallback
  const handleS3Action = async (action: string, type: 'import' | 'export') => {
    if (!apiConnected || !restaurantId) {
      // Demo mode: generate local CSV downloads for exports, show sample data for imports
      if (type === 'export') {
        let csv = ''
        let filename = ''
        if (action === 'paychecks') {
          const headers = ['Employee', 'Role', 'Gross', 'Taxes', 'Net', 'Tips']
          const rows = employees.filter(e => e.status === 'active').map(e => {
            const gross = calcGross(e)
            const taxes = gross * 0.22
            return [e.name, e.role, gross.toFixed(2), taxes.toFixed(2), (gross - taxes).toFixed(2), e.tipsThisPeriod.toFixed(2)]
          })
          csv = [headers, ...rows].map(r => r.join(',')).join('\n')
          filename = `paychecks-${new Date().toISOString().split('T')[0]}.csv`
        } else if (action === 'expenses') {
          const headers = ['Date', 'Category', 'Description', 'Vendor', 'Amount', 'Status']
          const rows = expenses.map(e => [e.date, e.category, e.description, e.vendor || '', e.amount.toFixed(2), e.status])
          csv = [headers, ...rows].map(r => r.join(',')).join('\n')
          filename = `expenses-${new Date().toISOString().split('T')[0]}.csv`
        } else if (action === 'sales') {
          const headers = ['Period', 'Gross', 'Net', 'Taxes', 'Tips', 'Employees']
          const rows = payRuns.map(r => [
            `${r.periodStart} to ${r.periodEnd}`, r.totalGross.toFixed(2), r.totalNet.toFixed(2),
            r.totalTaxes.toFixed(2), r.totalTips.toFixed(2), r.employeeCount.toString(),
          ])
          csv = [headers, ...rows].map(r => r.join(',')).join('\n')
          filename = `sales-${new Date().toISOString().split('T')[0]}.csv`
        }
        if (csv) {
          const blob = new Blob([csv], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.click()
          URL.revokeObjectURL(url)
          showToast(`Exported ${action} locally (demo mode)`)
        }
      } else {
        showToast(`Loaded demo ${action} data (S3 unavailable)`)
      }
      return
    }

    // Backend connected: call actual S3 API endpoints
    try {
      if (type === 'import') {
        if (action === 'tips') await importTipsFromS3(restaurantId)
        else if (action === 'expenses') await importExpensesFromS3(restaurantId)
        else if (action === 'sales') await importSalesFromS3(restaurantId)
        showToast(`Imported ${action} from storage`)
        loadAllData()
      } else {
        if (action === 'paychecks') await exportPaychecksToS3(restaurantId)
        else if (action === 'expenses') await exportExpensesToS3(restaurantId)
        else if (action === 'sales') await exportSalesToS3(restaurantId)
        showToast(`Exported ${action} to storage`)
      }
    } catch (error: any) {
      // Backend returns local fallback data even when S3 is disabled
      const msg = error?.response?.data?.detail || error?.message || 'Operation completed with local storage'
      showToast(msg.includes('local') ? msg : `${action} saved to local storage (S3 not configured)`)
    }
  }

  const connectIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'connected' as const, apiKeyConfigured: true, lastSyncedAt: new Date().toISOString() } : i
    ))
    setExpandedIntegration(null)
    setConfigForm({ apiKey: '', webhookUrl: '' })
    showToast('Integration connected')
  }

  const disconnectIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'disconnected' as const, apiKeyConfigured: false, lastSyncedAt: undefined } : i
    ))
    showToast('Integration disconnected')
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2 animate-pulse">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white">Payroll</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Manage compensation, tips, expenses & integrations</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
            <Users className="w-3 h-3" />
            <span>{employees.filter(e => e.status === 'active').length} Active</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-700 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ==================== EMPLOYEE ROSTER ==================== */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'Management', 'Front of House', 'Back of House'].map(dept => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    departmentFilter === dept
                      ? 'bg-red-500 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {dept === 'all' ? 'All' : dept}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Type</th>
                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Rate / Salary</th>
                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Hours</th>
                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">OT</th>
                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Tips</th>
                    <th className="text-center px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-black dark:text-white">{emp.name}</p>
                            <p className="text-xs text-neutral-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{emp.role}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          emp.employmentType === 'full_time'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {emp.employmentType === 'full_time' ? 'Full-Time' : 'Part-Time'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-black dark:text-white">
                        {emp.compensationType === 'salary'
                          ? `$${(emp.annualSalary || 0).toLocaleString()}/yr`
                          : `$${emp.hourlyRate?.toFixed(2)}/hr`}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">{emp.hoursThisPeriod}h</td>
                      <td className="px-4 py-3 text-right">
                        <span className={emp.overtimeHours > 0 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-neutral-400'}>
                          {emp.overtimeHours}h
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">
                        {emp.tipsThisPeriod > 0 ? fmtCurrency(emp.tipsThisPeriod) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${
                            emp.status === 'active' ? 'bg-green-500' : emp.status === 'on_leave' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs text-neutral-500 capitalize">{emp.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs text-neutral-500">
              <span>{filteredEmployees.length} employees</span>
              <span>{employees.filter(e => e.employmentType === 'full_time').length} FT / {employees.filter(e => e.employmentType === 'part_time').length} PT</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CURRENT PAY PERIOD ==================== */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Gross', value: fmtCurrency(periodSummary.totalGross), icon: DollarSign, color: 'from-green-400 to-emerald-500', sub: 'Jan 20 - Feb 2, 2026' },
              { label: 'Total Hours', value: `${periodSummary.totalHours}h`, icon: Clock, color: 'from-blue-400 to-cyan-500', sub: `${periodSummary.count} employees` },
              { label: 'Overtime Hours', value: `${periodSummary.totalOT}h`, icon: AlertTriangle, color: 'from-amber-400 to-orange-500', sub: '1.5x rate applied' },
              { label: 'Estimated Taxes', value: fmtCurrency(periodSummary.totalTaxes), icon: Receipt, color: 'from-red-400 to-rose-500', sub: '22% effective rate' },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">{card.label}</p>
                    <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-black dark:text-white">{card.value}</p>
                  <p className="text-xs text-neutral-400 mt-1">{card.sub}</p>
                </div>
              )
            })}
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h3 className="font-semibold text-black dark:text-white text-sm">Employee Breakdown</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-neutral-400">Total Tips: {fmtCurrency(periodSummary.totalTips)}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-2.5 font-semibold text-neutral-600 dark:text-neutral-300">Name</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-neutral-600 dark:text-neutral-300">Regular</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-neutral-600 dark:text-neutral-300">OT</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-neutral-600 dark:text-neutral-300">Tips</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-neutral-600 dark:text-neutral-300">Gross</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-neutral-600 dark:text-neutral-300">Taxes</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-neutral-600 dark:text-neutral-300">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.filter(e => e.status === 'active').map(emp => {
                    const gross = calcGross(emp)
                    const taxes = gross * 0.22
                    return (
                      <tr key={emp.id} className="border-b border-neutral-100 dark:border-neutral-700/50">
                        <td className="px-4 py-2.5 font-medium text-black dark:text-white">{emp.name}</td>
                        <td className="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{emp.hoursThisPeriod}h</td>
                        <td className="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{emp.overtimeHours}h</td>
                        <td className="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{emp.tipsThisPeriod > 0 ? fmtCurrency(emp.tipsThisPeriod) : '-'}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-black dark:text-white">{fmtCurrency(gross)}</td>
                        <td className="px-4 py-2.5 text-right text-red-600 dark:text-red-400">-{fmtCurrency(taxes)}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-green-600 dark:text-green-400">{fmtCurrency(gross - taxes)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-50 dark:bg-neutral-800/50 font-semibold">
                    <td className="px-4 py-2.5 text-black dark:text-white">Total</td>
                    <td className="px-4 py-2.5 text-right text-black dark:text-white">{periodSummary.totalHours}h</td>
                    <td className="px-4 py-2.5 text-right text-black dark:text-white">{periodSummary.totalOT}h</td>
                    <td className="px-4 py-2.5 text-right text-black dark:text-white">{fmtCurrency(periodSummary.totalTips)}</td>
                    <td className="px-4 py-2.5 text-right text-black dark:text-white">{fmtCurrency(periodSummary.totalGross)}</td>
                    <td className="px-4 py-2.5 text-right text-red-600 dark:text-red-400">-{fmtCurrency(periodSummary.totalTaxes)}</td>
                    <td className="px-4 py-2.5 text-right text-green-600 dark:text-green-400">{fmtCurrency(periodSummary.totalNet)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={exportCSV} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button onClick={() => handleS3Action('paychecks', 'export')} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all">
              <Cloud className="w-4 h-4" />
              <span>{apiConnected ? 'Export to S3' : 'Export CSV'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== PAY HISTORY ==================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-black dark:text-white">Pay Run History</h3>
            <button onClick={runPayroll} className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-500/30">
              <Banknote className="w-4 h-4" />
              <span>Run Payroll</span>
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Pay Period</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Run Date</th>
                    <th className="text-center px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Employees</th>
                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Gross</th>
                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Tips</th>
                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Taxes</th>
                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Net</th>
                    <th className="text-center px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payRuns.map(run => (
                    <tr key={run.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                      <td className="px-4 py-3 text-black dark:text-white font-medium">{fmtDate(run.periodStart)} - {fmtDate(run.periodEnd)}</td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{fmtDate(run.runDate)}</td>
                      <td className="px-4 py-3 text-center text-neutral-600 dark:text-neutral-300">{run.employeeCount}</td>
                      <td className="px-4 py-3 text-right font-medium text-black dark:text-white">{fmtCurrency(run.totalGross)}</td>
                      <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">{fmtCurrency(run.totalTips)}</td>
                      <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">-{fmtCurrency(run.totalTaxes)}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">{fmtCurrency(run.totalNet)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          run.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          run.status === 'processing' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EXPENSES ==================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-500 font-medium">Total Expenses</p>
                <Receipt className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{fmtCurrency(expenseSummary.total)}</p>
              <p className="text-xs text-neutral-400 mt-1">This month</p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-500 font-medium">Top Category</p>
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{expenseSummary.topCategory}</p>
              <p className="text-xs text-neutral-400 mt-1">{fmtCurrency(expenseSummary.topAmount)}</p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-500 font-medium">Pending Approval</p>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{expenses.filter(e => e.status === 'pending').length}</p>
              <p className="text-xs text-neutral-400 mt-1">{fmtCurrency(expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0))}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowAddExpense(!showAddExpense)} className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-500/30">
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => handleS3Action('expenses', 'import')} className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
              </button>
              <button onClick={() => handleS3Action('expenses', 'export')} className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                <Cloud className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Add Expense Form */}
          {showAddExpense && (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">New Expense</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} className="px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="text" placeholder="Description" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} className="px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white" />
                <input type="number" placeholder="Amount" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} className="px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white" />
                <input type="text" placeholder="Vendor (optional)" value={newExpense.vendor} onChange={e => setNewExpense({ ...newExpense, vendor: e.target.value })} className="px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white" />
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <button onClick={addExpense} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium">Save</button>
                <button onClick={() => setShowAddExpense(false)} className="px-4 py-2 text-neutral-500 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* Expenses Table */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Description</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Vendor</th>
                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Amount</th>
                    <th className="text-center px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                      <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-300">{fmtDate(exp.date)}</td>
                      <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">{exp.category}</span></td>
                      <td className="px-4 py-2.5 text-black dark:text-white">{exp.description}</td>
                      <td className="px-4 py-2.5 text-neutral-500">{exp.vendor || '-'}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-black dark:text-white">{fmtCurrency(exp.amount)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          exp.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          exp.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== INTEGRATIONS ==================== */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <h3 className="font-semibold text-black dark:text-white">Payroll Providers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map(integ => (
              <div key={integ.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${integ.color} rounded-xl flex items-center justify-center text-white text-xs font-bold`}>
                      {integ.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-black dark:text-white text-sm">{integ.name}</p>
                      <p className="text-xs text-neutral-400">{integ.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {integ.features.map((f, i) => (
                    <span key={i} className="flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>{f}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-700">
                  {integ.status === 'connected' ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 font-medium">
                          <Check className="w-3 h-3" />
                          <span>Connected</span>
                        </span>
                        {integ.lastSyncedAt && (
                          <p className="text-[10px] text-neutral-400 mt-0.5">Last synced: {new Date(integ.lastSyncedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                      <button onClick={() => disconnectIntegration(integ.id)} className="text-xs text-red-500 hover:underline">Disconnect</button>
                    </div>
                  ) : expandedIntegration === integ.id ? (
                    <div className="space-y-2">
                      <input type="text" placeholder="API Key" value={configForm.apiKey} onChange={e => setConfigForm({ ...configForm, apiKey: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs bg-white dark:bg-neutral-900 text-black dark:text-white" />
                      <input type="text" placeholder="Webhook URL" value={configForm.webhookUrl || `https://api.wdym86.com/webhooks/payroll/${integ.id}`} onChange={e => setConfigForm({ ...configForm, webhookUrl: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs bg-white dark:bg-neutral-900 text-black dark:text-white" />
                      <div className="flex space-x-2">
                        <button onClick={() => connectIntegration(integ.id)} className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-medium">Save & Connect</button>
                        <button onClick={() => setExpandedIntegration(null)} className="px-3 py-1.5 text-xs text-neutral-500">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setExpandedIntegration(integ.id); setConfigForm({ apiKey: '', webhookUrl: '' }) }} className="w-full py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* AWS S3 Section */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-black dark:text-white">AWS S3 Storage</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Import & export payroll data via Amazon S3</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Tips', desc: 'Import tip data from POS exports', icon: DollarSign },
                { label: 'Paychecks', desc: 'Export paycheck CSVs to S3', icon: FileText },
                { label: 'Sales Data', desc: 'Import daily sales reports', icon: TrendingUp },
                { label: 'Expenses', desc: 'Sync expense records', icon: Receipt },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-black dark:text-white">{item.label}</span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-2">{item.desc}</p>
                    <div className="flex space-x-1">
                      <button onClick={() => handleS3Action(item.label.toLowerCase(), 'import')} className="flex-1 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30">Import</button>
                      <button onClick={() => handleS3Action(item.label.toLowerCase(), 'export')} className="flex-1 py-1 text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30">Export</button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className={`flex items-center space-x-2 text-xs ${apiConnected ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {apiConnected ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
              {apiConnected ? (
                <span>Backend connected. S3 operations will use cloud storage if configured, or local <code className="bg-green-200/50 dark:bg-green-800/30 px-1 rounded">uploads/</code> folder as fallback.</span>
              ) : (
                <span>Demo mode. Export buttons download CSV files locally. Connect the backend and set <code className="bg-amber-200/50 dark:bg-amber-800/30 px-1 rounded">S3_ENABLED=true</code> + <code className="bg-amber-200/50 dark:bg-amber-800/30 px-1 rounded">S3_BUCKET_NAME</code> in <code className="bg-amber-200/50 dark:bg-amber-800/30 px-1 rounded">.env</code> for cloud storage.</span>
              )}
            </div>
          </div>

          {/* Webhook Section */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center space-x-2 mb-3">
              <Plug className="w-4 h-4 text-neutral-500" />
              <h4 className="font-semibold text-black dark:text-white text-sm">Custom Webhook</h4>
            </div>
            <p className="text-xs text-neutral-400 mb-3">Configure webhooks for custom payroll integrations. Events: <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded">payroll.run.completed</code>, <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded">employee.created</code>, <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded">expense.created</code></p>
            <div className="flex items-center space-x-2">
              <input type="text" placeholder="https://your-system.com/webhooks/payroll" className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-900 text-black dark:text-white" />
              <button onClick={() => showToast('Webhook test sent')} className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600">Test</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
