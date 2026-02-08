import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// ==========================================
// Types
// ==========================================

export type OrderType = 'dine_in' | 'takeout' | 'delivery'

export interface SentOrderItem {
  id: string
  name: string
  quantity: number
  price: number
  modifiers: string[]
  special_instructions: string | null
}

export interface DemoSentOrder {
  sent_order_id: string
  check_id: string
  check_name: string
  check_number: string
  order_type: OrderType
  items: SentOrderItem[]
  item_count: number
  sent_at: string
  status: 'pending' | 'in_progress' | 'completed'
  completed_at: string | null
}

export interface DailyStats {
  totalSales: number
  totalOrders: number
  ordersByType: Record<OrderType, { count: number; revenue: number }>
  paymentMethodBreakdown: Record<string, { count: number; total: number }>
  checksFinalized: number
  checksVoided: number
}

export interface EndOfDayReport {
  operatingDate: string
  operatingDateDisplay: string
  stats: DailyStats
  generatedAt: string
}

interface POSContextType {
  operatingDate: string
  operatingDateDisplay: string
  isOperatingDayOpen: boolean
  dailyStats: DailyStats
  recordSale: (amount: number, orderType: OrderType, paymentMethod: string) => void
  recordVoid: () => void
  endOfDay: () => EndOfDayReport
  resetDay: () => void
  endOfDayReport: EndOfDayReport | null
  showEndOfDayModal: boolean
  setShowEndOfDayModal: (v: boolean) => void
  // Demo BOHPOS order tracking
  demoSentOrders: DemoSentOrder[]
  addDemoSentOrder: (order: DemoSentOrder) => void
  bumpDemoOrder: (sentOrderId: string) => void
  updateDemoOrderStatus: (sentOrderId: string, status: 'pending' | 'in_progress' | 'completed') => void
  clearDemoOrders: () => void
}

// ==========================================
// Helpers
// ==========================================

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function createEmptyStats(): DailyStats {
  return {
    totalSales: 0,
    totalOrders: 0,
    ordersByType: {
      dine_in: { count: 0, revenue: 0 },
      takeout: { count: 0, revenue: 0 },
      delivery: { count: 0, revenue: 0 },
    },
    paymentMethodBreakdown: {},
    checksFinalized: 0,
    checksVoided: 0,
  }
}

// ==========================================
// Context
// ==========================================

const POSContext = createContext<POSContextType | undefined>(undefined)

export function POSProvider({ children }: { children: ReactNode }) {
  const [operatingDate, setOperatingDate] = useState<string>(() => {
    return localStorage.getItem('pos_operatingDate') || getTodayStr()
  })
  const [isOperatingDayOpen, setIsOperatingDayOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('pos_dayOpen')
    return saved !== 'false'
  })
  const [dailyStats, setDailyStats] = useState<DailyStats>(createEmptyStats)
  const [endOfDayReport, setEndOfDayReport] = useState<EndOfDayReport | null>(null)
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false)
  const [demoSentOrders, setDemoSentOrders] = useState<DemoSentOrder[]>([])

  const operatingDateDisplay = formatDateDisplay(operatingDate)

  const recordSale = useCallback((amount: number, orderType: OrderType, paymentMethod: string) => {
    setDailyStats(prev => {
      const updated = { ...prev }
      updated.totalSales = prev.totalSales + amount
      updated.totalOrders = prev.totalOrders + 1
      updated.checksFinalized = prev.checksFinalized + 1
      updated.ordersByType = {
        ...prev.ordersByType,
        [orderType]: {
          count: prev.ordersByType[orderType].count + 1,
          revenue: prev.ordersByType[orderType].revenue + amount,
        },
      }
      const pmKey = paymentMethod
      const existing = prev.paymentMethodBreakdown[pmKey] || { count: 0, total: 0 }
      updated.paymentMethodBreakdown = {
        ...prev.paymentMethodBreakdown,
        [pmKey]: { count: existing.count + 1, total: existing.total + amount },
      }
      return updated
    })
  }, [])

  const recordVoid = useCallback(() => {
    setDailyStats(prev => ({
      ...prev,
      checksVoided: prev.checksVoided + 1,
    }))
  }, [])

  const endOfDay = useCallback((): EndOfDayReport => {
    const report: EndOfDayReport = {
      operatingDate,
      operatingDateDisplay,
      stats: { ...dailyStats },
      generatedAt: new Date().toISOString(),
    }
    setEndOfDayReport(report)
    setIsOperatingDayOpen(false)
    localStorage.setItem('pos_dayOpen', 'false')
    return report
  }, [operatingDate, operatingDateDisplay, dailyStats])

  const resetDay = useCallback(() => {
    const newDate = getTodayStr()
    setOperatingDate(newDate)
    setIsOperatingDayOpen(true)
    setDailyStats(createEmptyStats())
    setEndOfDayReport(null)
    setShowEndOfDayModal(false)
    setDemoSentOrders([])
    localStorage.setItem('pos_operatingDate', newDate)
    localStorage.setItem('pos_dayOpen', 'true')
  }, [])

  const addDemoSentOrder = useCallback((order: DemoSentOrder) => {
    setDemoSentOrders(prev => [...prev, order])
  }, [])

  const bumpDemoOrder = useCallback((sentOrderId: string) => {
    setDemoSentOrders(prev =>
      prev.map(o =>
        o.sent_order_id === sentOrderId
          ? { ...o, status: 'completed' as const, completed_at: new Date().toISOString() }
          : o
      )
    )
  }, [])

  const updateDemoOrderStatus = useCallback((sentOrderId: string, status: 'pending' | 'in_progress' | 'completed') => {
    setDemoSentOrders(prev =>
      prev.map(o =>
        o.sent_order_id === sentOrderId
          ? { ...o, status, completed_at: status === 'completed' ? new Date().toISOString() : o.completed_at }
          : o
      )
    )
  }, [])

  const clearDemoOrders = useCallback(() => {
    setDemoSentOrders([])
  }, [])

  return (
    <POSContext.Provider value={{
      operatingDate,
      operatingDateDisplay,
      isOperatingDayOpen,
      dailyStats,
      recordSale,
      recordVoid,
      endOfDay,
      resetDay,
      endOfDayReport,
      showEndOfDayModal,
      setShowEndOfDayModal,
      demoSentOrders,
      addDemoSentOrder,
      bumpDemoOrder,
      updateDemoOrderStatus,
      clearDemoOrders,
    }}>
      {children}
    </POSContext.Provider>
  )
}

export function usePOS() {
  const context = useContext(POSContext)
  if (!context) throw new Error('usePOS must be used within POSProvider')
  return context
}
