import { useState, useEffect } from 'react'
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign,
  Smartphone, X, Check, Clock, Users,
  Wifi, WifiOff, Receipt, Banknote, Sparkles, UtensilsCrossed, Coffee, IceCream,
  Utensils, Package as PackageIcon, Truck, ChefHat, Bell
} from 'lucide-react'
import { checkApiHealth } from '../services/api'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  popular?: boolean
}

interface OrderItem extends MenuItem {
  quantity: number
  modifiers?: string[]
  specialInstructions?: string
}

interface Order {
  items: OrderItem[]
  subtotal: number
  tax: number
  tip: number
  total: number
  tableNumber?: number
  orderType: 'dine_in' | 'takeout' | 'delivery'
}

interface TableInfo {
  id: number
  capacity: number
  status: 'available' | 'occupied' | 'cleaning'
  server?: string
  orderId?: string
}

interface TakeoutOrder {
  id: string
  customerName: string
  phone: string
  pickupTime: string
  items: { name: string; quantity: number }[]
  total: number
  status: 'pending' | 'preparing' | 'ready' | 'picked_up'
  createdAt: string
}

interface DeliveryPlatformOrder {
  id: string
  platform: string
  platformId: string
  customerName: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: 'received' | 'preparing' | 'ready' | 'picked_up'
  createdAt: string
}

// Category icon mapping (no emojis)
const categoryIcons: Record<string, { icon: any; gradient: string }> = {
  'All': { icon: Sparkles, gradient: 'from-neutral-500 to-neutral-600' },
  'Mezze': { icon: UtensilsCrossed, gradient: 'from-amber-400 to-orange-500' },
  'Salads': { icon: UtensilsCrossed, gradient: 'from-green-400 to-emerald-500' },
  'Seafood': { icon: UtensilsCrossed, gradient: 'from-cyan-400 to-blue-500' },
  'Mains': { icon: UtensilsCrossed, gradient: 'from-red-500 to-rose-600' },
  'Drinks': { icon: Coffee, gradient: 'from-purple-400 to-pink-500' },
  'Desserts': { icon: IceCream, gradient: 'from-yellow-400 to-orange-500' },
}

// Menu item category first-letter badges
const getCategoryBadge = (category: string) => {
  const map: Record<string, { letter: string; gradient: string }> = {
    'Mezze': { letter: 'MZ', gradient: 'from-amber-400 to-orange-500' },
    'Salads': { letter: 'SL', gradient: 'from-green-400 to-emerald-500' },
    'Seafood': { letter: 'SF', gradient: 'from-cyan-400 to-blue-500' },
    'Mains': { letter: 'MN', gradient: 'from-red-500 to-rose-600' },
    'Drinks': { letter: 'DK', gradient: 'from-purple-400 to-pink-500' },
    'Desserts': { letter: 'DS', gradient: 'from-yellow-400 to-orange-500' },
  }
  return map[category] || { letter: '?', gradient: 'from-neutral-400 to-neutral-500' }
}

// Mykonos Mediterranean Menu
const demoMenuItems: MenuItem[] = [
  { id: '1', name: 'Classic Hummus', price: 12.00, category: 'Mezze', popular: true },
  { id: '2', name: 'Spanakopita', price: 14.00, category: 'Mezze' },
  { id: '3', name: 'Saganaki', price: 16.00, category: 'Mezze', popular: true },
  { id: '4', name: 'Grilled Octopus', price: 24.00, category: 'Mezze', popular: true },
  { id: '5', name: 'Dolmades', price: 13.00, category: 'Mezze' },
  { id: '6', name: 'Tzatziki & Pita', price: 10.00, category: 'Mezze' },
  { id: '7', name: 'Greek Salad', price: 14.00, category: 'Salads', popular: true },
  { id: '8', name: 'Quinoa Bowl', price: 16.00, category: 'Salads' },
  { id: '9', name: 'Fattoush', price: 13.00, category: 'Salads' },
  { id: '10', name: 'Grilled Branzino', price: 34.00, category: 'Seafood', popular: true },
  { id: '11', name: 'Shrimp Saganaki', price: 29.00, category: 'Seafood', popular: true },
  { id: '12', name: 'Grilled Salmon', price: 32.00, category: 'Seafood' },
  { id: '13', name: 'Seafood Platter', price: 48.00, category: 'Seafood' },
  { id: '14', name: 'Lamb Souvlaki', price: 28.00, category: 'Mains', popular: true },
  { id: '15', name: 'Moussaka', price: 26.00, category: 'Mains', popular: true },
  { id: '16', name: 'Chicken Souvlaki', price: 22.00, category: 'Mains' },
  { id: '17', name: 'Beef Kofta', price: 24.00, category: 'Mains' },
  { id: '18', name: 'Stuffed Peppers', price: 21.00, category: 'Mains' },
  { id: '19', name: 'Imam Bayildi', price: 19.00, category: 'Mains' },
  { id: '20', name: 'Mykonos Sunset', price: 14.00, category: 'Drinks', popular: true },
  { id: '21', name: 'Greek Wine', price: 12.00, category: 'Drinks' },
  { id: '22', name: 'Ouzo', price: 9.00, category: 'Drinks' },
  { id: '23', name: 'Greek Coffee', price: 5.00, category: 'Drinks' },
  { id: '24', name: 'Fresh Lemonade', price: 6.00, category: 'Drinks' },
  { id: '25', name: 'Baklava', price: 10.00, category: 'Desserts', popular: true },
  { id: '26', name: 'Yogurt & Honey', price: 8.00, category: 'Desserts' },
  { id: '27', name: 'Loukoumades', price: 9.00, category: 'Desserts', popular: true },
  { id: '28', name: 'Galaktoboureko', price: 11.00, category: 'Desserts' },
]

const demoServers = ['Elena D.', 'Nikos S.', 'Sofia B.']

const demoTables: TableInfo[] = [
  { id: 1, capacity: 2, status: 'available' },
  { id: 2, capacity: 4, status: 'occupied', server: 'Elena D.' },
  { id: 3, capacity: 4, status: 'available' },
  { id: 4, capacity: 6, status: 'occupied', server: 'Nikos S.' },
  { id: 5, capacity: 2, status: 'cleaning' },
  { id: 6, capacity: 4, status: 'available' },
  { id: 7, capacity: 8, status: 'occupied', server: 'Sofia B.' },
  { id: 8, capacity: 6, status: 'available' },
]

const demoTakeoutOrders: TakeoutOrder[] = [
  { id: 'TO-001', customerName: 'Maria K.', phone: '(555) 123-4567', pickupTime: '15 min', items: [{ name: 'Lamb Souvlaki', quantity: 2 }, { name: 'Greek Salad', quantity: 1 }], total: 70.00, status: 'preparing', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: 'TO-002', customerName: 'Petros A.', phone: '(555) 234-5678', pickupTime: '30 min', items: [{ name: 'Moussaka', quantity: 1 }, { name: 'Baklava', quantity: 2 }], total: 46.00, status: 'pending', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'TO-003', customerName: 'Anna S.', phone: '(555) 345-6789', pickupTime: '45 min', items: [{ name: 'Seafood Platter', quantity: 1 }], total: 48.00, status: 'ready', createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
]

const demoDeliveryOrders: DeliveryPlatformOrder[] = [
  { id: 'DEL-001', platform: 'doordash', platformId: 'DD-MYK91E', customerName: 'Nikos P.', items: [{ name: 'Grilled Branzino', quantity: 1, price: 34.00 }, { name: 'Greek Salad', quantity: 1, price: 14.00 }], total: 56.11, status: 'preparing', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: 'DEL-002', platform: 'uber_eats', platformId: 'UE-MYK82F', customerName: 'Elena S.', items: [{ name: 'Lamb Souvlaki', quantity: 2, price: 56.00 }], total: 65.45, status: 'received', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'DEL-003', platform: 'grubhub', platformId: 'GH-MYK93A', customerName: 'Sophia M.', items: [{ name: 'Moussaka', quantity: 2, price: 52.00 }], total: 63.27, status: 'ready', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 'DEL-004', platform: 'doordash', platformId: 'DD-MYK04B', customerName: 'Costa V.', items: [{ name: 'Grilled Octopus', quantity: 1, price: 24.00 }, { name: 'Shrimp Saganaki', quantity: 1, price: 29.00 }], total: 62.57, status: 'picked_up', createdAt: new Date(Date.now() - 35 * 60000).toISOString() },
]

const platformBranding: Record<string, { label: string; gradient: string; textColor: string }> = {
  doordash: { label: 'DD', gradient: 'from-red-500 to-red-600', textColor: 'text-white' },
  uber_eats: { label: 'UE', gradient: 'from-green-500 to-emerald-600', textColor: 'text-white' },
  grubhub: { label: 'GH', gradient: 'from-orange-500 to-red-500', textColor: 'text-white' },
  postmates: { label: 'PM', gradient: 'from-gray-700 to-black', textColor: 'text-white' },
  seamless: { label: 'SM', gradient: 'from-blue-500 to-blue-700', textColor: 'text-white' },
}

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit', icon: CreditCard, color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  { id: 'cash', name: 'Cash', icon: Banknote, color: 'bg-gradient-to-br from-green-500 to-emerald-600' },
  { id: 'apple_pay', name: 'Apple Pay', icon: Smartphone, color: 'bg-gradient-to-br from-gray-800 to-black' },
  { id: 'google_pay', name: 'Google Pay', icon: Smartphone, color: 'bg-gradient-to-br from-blue-500 to-green-500' },
  { id: 'paypal', name: 'PayPal', icon: CreditCard, color: 'bg-gradient-to-br from-blue-600 to-blue-800' },
  { id: 'venmo', name: 'Venmo', icon: Smartphone, color: 'bg-gradient-to-br from-cyan-400 to-blue-500' },
  { id: 'cash_app', name: 'Cash App', icon: DollarSign, color: 'bg-gradient-to-br from-emerald-400 to-green-600' },
  { id: 'klarna', name: 'Klarna', icon: Clock, color: 'bg-gradient-to-br from-pink-400 to-pink-600' },
]

const tipOptions = [
  { label: '15%', percentage: 15 },
  { label: '18%', percentage: 18 },
  { label: '20%', percentage: 20 },
  { label: '25%', percentage: 25 },
]

type OrderTab = 'dine_in' | 'takeout' | 'delivery'

export default function POS() {
  const [menuItems] = useState<MenuItem[]>(demoMenuItems)
  const [order, setOrder] = useState<Order>({
    items: [],
    subtotal: 0,
    tax: 0,
    tip: 0,
    total: 0,
    orderType: 'dine_in'
  })
  const [activeTab, setActiveTab] = useState<OrderTab>('dine_in')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showPayment, setShowPayment] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [tipPercentage, setTipPercentage] = useState<number | null>(null)
  const [customTip, setCustomTip] = useState('')
  const [processing, setProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [cashReceived, setCashReceived] = useState('')

  // Dine-in state
  const [tables, setTables] = useState<TableInfo[]>(demoTables)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [selectedServer, setSelectedServer] = useState('')

  // Takeout state
  const [takeoutOrders, setTakeoutOrders] = useState<TakeoutOrder[]>(demoTakeoutOrders)
  const [takeoutCustomerName, setTakeoutCustomerName] = useState('')
  const [takeoutPhone, setTakeoutPhone] = useState('')
  const [takeoutPickupTime, setTakeoutPickupTime] = useState('30')
  const [showSmsSent, setShowSmsSent] = useState(false)

  // Delivery state
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryPlatformOrder[]>(demoDeliveryOrders)
  const [deliveryPlatformFilter, setDeliveryPlatformFilter] = useState<string>('all')

  useEffect(() => {
    checkApiHealth().then(setApiConnected)
  }, [])

  const categories = ['All', ...new Set(menuItems.map(item => item.category))]

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory)

  const addToOrder = (item: MenuItem) => {
    setOrder(prev => {
      const existingItem = prev.items.find(i => i.id === item.id)
      let newItems: OrderItem[]
      if (existingItem) {
        newItems = prev.items.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      } else {
        newItems = [...prev.items, { ...item, quantity: 1 }]
      }
      return calculateTotals({ ...prev, items: newItems })
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setOrder(prev => {
      const newItems = prev.items
        .map(item => item.id === itemId ? { ...item, quantity: item.quantity + delta } : item)
        .filter(item => item.quantity > 0)
      return calculateTotals({ ...prev, items: newItems })
    })
  }

  const removeItem = (itemId: string) => {
    setOrder(prev => {
      const newItems = prev.items.filter(item => item.id !== itemId)
      return calculateTotals({ ...prev, items: newItems })
    })
  }

  const calculateTotals = (currentOrder: Order): Order => {
    const subtotal = currentOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.08
    const tip = tipPercentage ? subtotal * (tipPercentage / 100) : parseFloat(customTip) || 0
    const total = subtotal + tax + tip
    return {
      ...currentOrder,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      tip: Math.round(tip * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  }

  useEffect(() => {
    setOrder(prev => calculateTotals(prev))
  }, [tipPercentage, customTip])

  const handlePayment = async () => {
    if (!selectedPayment) return
    setProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setProcessing(false)
    setPaymentComplete(true)

    // If dine-in, free the table
    if (activeTab === 'dine_in' && selectedTable) {
      setTables(prev => prev.map(t => t.id === selectedTable ? { ...t, status: 'cleaning' as const } : t))
      setTimeout(() => {
        setTables(prev => prev.map(t => t.id === selectedTable ? { ...t, status: 'available' as const, server: undefined } : t))
      }, 5000)
    }

    setTimeout(() => {
      setPaymentComplete(false)
      setShowPayment(false)
      setOrder({ items: [], subtotal: 0, tax: 0, tip: 0, total: 0, orderType: 'dine_in' })
      setSelectedPayment(null)
      setTipPercentage(null)
      setCustomTip('')
      setCashReceived('')
      setSelectedTable(null)
      setSelectedServer('')
    }, 2000)
  }

  const clearOrder = () => {
    setOrder({ items: [], subtotal: 0, tax: 0, tip: 0, total: 0, orderType: 'dine_in' })
    setTipPercentage(null)
    setCustomTip('')
  }

  const handleSelectTable = (tableId: number) => {
    const table = tables.find(t => t.id === tableId)
    if (table?.status === 'available') {
      setSelectedTable(tableId)
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'occupied' as const, server: selectedServer || demoServers[0] } : t))
    } else if (table?.status === 'occupied') {
      setSelectedTable(tableId)
    }
  }

  const handleTakeoutSubmit = () => {
    if (!takeoutCustomerName || order.items.length === 0) return
    const newOrder: TakeoutOrder = {
      id: `TO-${Date.now().toString().slice(-3)}`,
      customerName: takeoutCustomerName,
      phone: takeoutPhone,
      pickupTime: `${takeoutPickupTime} min`,
      items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
      total: order.total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    setTakeoutOrders(prev => [newOrder, ...prev])
    setShowSmsSent(true)
    setTimeout(() => setShowSmsSent(false), 3000)
    clearOrder()
    setTakeoutCustomerName('')
    setTakeoutPhone('')
  }

  const updateTakeoutStatus = (id: string, status: TakeoutOrder['status']) => {
    setTakeoutOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const updateDeliveryStatus = (id: string, status: DeliveryPlatformOrder['status']) => {
    setDeliveryOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const changeAmount = selectedPayment === 'cash' && cashReceived
    ? parseFloat(cashReceived) - order.total : 0

  const getTableColor = (status: TableInfo['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
      case 'occupied': return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
      case 'cleaning': return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400'
    }
  }

  const filteredDeliveryOrders = deliveryPlatformFilter === 'all'
    ? deliveryOrders
    : deliveryOrders.filter(o => o.platform === deliveryPlatformFilter)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white">Point of Sale</h1>
            <div className="flex items-center space-x-2">
              {apiConnected !== null && (
                <span className={`flex items-center space-x-1 text-xs ${
                  apiConnected ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{apiConnected ? 'Online' : 'Demo Mode'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Order Type Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-1">
          {([
            { key: 'dine_in' as OrderTab, label: 'Dine-In', icon: Utensils },
            { key: 'takeout' as OrderTab, label: 'Takeout', icon: PackageIcon },
            { key: 'delivery' as OrderTab, label: 'Delivery', icon: Truck },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setOrder(prev => ({ ...prev, orderType: key })) }}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium capitalize rounded-lg transition-all ${
                activeTab === key
                  ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SMS Toast */}
      {showSmsSent && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-right">
          <Bell className="w-4 h-4" />
          <span className="text-sm font-medium">SMS notification sent to customer</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Side */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'dine_in' && (
            <>
              {/* Table Floor Plan */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Table Floor Plan</h3>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> <span className="text-neutral-500">Available</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> <span className="text-neutral-500">Occupied</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-yellow-500 rounded-full" /> <span className="text-neutral-500">Cleaning</span></span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {tables.map(table => (
                    <button
                      key={table.id}
                      onClick={() => handleSelectTable(table.id)}
                      className={`p-4 rounded-xl border-2 transition-all min-h-[80px] flex flex-col items-center justify-center ${getTableColor(table.status)} ${
                        selectedTable === table.id ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-neutral-900 scale-105' : 'hover:scale-[1.02]'
                      }`}
                    >
                      <span className="text-lg font-bold">T{table.id}</span>
                      <span className="text-xs mt-1">{table.capacity} seats</span>
                      {table.server && <span className="text-[10px] mt-0.5 opacity-75">{table.server}</span>}
                    </button>
                  ))}
                </div>
                {/* Server Assignment */}
                <div className="mt-3 flex items-center space-x-3">
                  <Users className="w-4 h-4 text-neutral-400" />
                  <select
                    value={selectedServer}
                    onChange={e => setSelectedServer(e.target.value)}
                    className="px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-black dark:text-white"
                  >
                    <option value="">Assign Server</option>
                    {demoServers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
                {categories.map(category => {
                  const style = categoryIcons[category] || categoryIcons['All']
                  const CategoryIcon = style.icon
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === category
                          ? `bg-gradient-to-r ${style.gradient} text-white shadow-lg`
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:scale-[1.02]'
                      }`}
                    >
                      <CategoryIcon className="w-4 h-4" />
                      <span>{category}</span>
                    </button>
                  )
                })}
              </div>

              {/* Menu Grid */}
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredItems.map(item => {
                    const badge = getCategoryBadge(item.category)
                    return (
                      <button
                        key={item.id}
                        onClick={() => addToOrder(item)}
                        className="group relative p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-200 text-left hover:scale-[1.02] min-h-[120px]"
                      >
                        {item.popular && (
                          <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                            HOT
                          </div>
                        )}
                        <div className={`w-full h-16 bg-gradient-to-br ${badge.gradient} rounded-lg mb-3 flex items-center justify-center text-2xl font-bold text-white group-hover:scale-110 transition-transform`}>
                          {badge.letter}
                        </div>
                        <p className="font-semibold text-sm text-black dark:text-white truncate">{item.name}</p>
                        <p className="text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">${item.price.toFixed(2)}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'takeout' && (
            <>
              {/* Customer Info */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-4 flex-shrink-0">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center space-x-2">
                  <PackageIcon className="w-4 h-4" />
                  <span>Takeout Order</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={takeoutCustomerName}
                    onChange={e => setTakeoutCustomerName(e.target.value)}
                    className="px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={takeoutPhone}
                    onChange={e => setTakeoutPhone(e.target.value)}
                    className="px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                  />
                  <select
                    value={takeoutPickupTime}
                    onChange={e => setTakeoutPickupTime(e.target.value)}
                    className="px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                  >
                    <option value="15">15 min pickup</option>
                    <option value="30">30 min pickup</option>
                    <option value="45">45 min pickup</option>
                    <option value="60">60 min pickup</option>
                  </select>
                </div>
              </div>

              {/* Category Tabs + Menu */}
              <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
                {categories.map(category => {
                  const style = categoryIcons[category] || categoryIcons['All']
                  const CategoryIcon = style.icon
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === category
                          ? `bg-gradient-to-r ${style.gradient} text-white shadow-lg`
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:scale-[1.02]'
                      }`}
                    >
                      <CategoryIcon className="w-4 h-4" />
                      <span>{category}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex-1 flex gap-4 min-h-0">
                {/* Menu Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredItems.map(item => {
                      const badge = getCategoryBadge(item.category)
                      return (
                        <button
                          key={item.id}
                          onClick={() => addToOrder(item)}
                          className="group relative p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg transition-all text-left hover:scale-[1.02]"
                        >
                          {item.popular && (
                            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg">HOT</div>
                          )}
                          <div className={`w-full h-14 bg-gradient-to-br ${badge.gradient} rounded-lg mb-2 flex items-center justify-center text-xl font-bold text-white group-hover:scale-110 transition-transform`}>
                            {badge.letter}
                          </div>
                          <p className="font-semibold text-sm text-black dark:text-white truncate">{item.name}</p>
                          <p className="text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">${item.price.toFixed(2)}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Takeout Order Queue */}
                <div className="w-72 flex flex-col min-h-0">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Pickup Queue</span>
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs rounded-full">{takeoutOrders.length}</span>
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {takeoutOrders.map(to => (
                      <div key={to.id} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-black dark:text-white">{to.customerName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            to.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            to.status === 'preparing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            to.status === 'picked_up' ? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>{to.status.replace('_', ' ')}</span>
                        </div>
                        <p className="text-xs text-neutral-500">{to.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-neutral-400">{to.pickupTime}</span>
                          <span className="text-sm font-mono font-bold text-black dark:text-white">${to.total.toFixed(2)}</span>
                        </div>
                        {to.status === 'pending' && (
                          <button onClick={() => updateTakeoutStatus(to.id, 'preparing')} className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1">
                            <ChefHat className="w-3 h-3" /><span>Start Preparing</span>
                          </button>
                        )}
                        {to.status === 'preparing' && (
                          <button onClick={() => updateTakeoutStatus(to.id, 'ready')} className="w-full mt-2 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1">
                            <Check className="w-3 h-3" /><span>Ready for Pickup</span>
                          </button>
                        )}
                        {to.status === 'ready' && (
                          <button onClick={() => updateTakeoutStatus(to.id, 'picked_up')} className="w-full mt-2 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1">
                            <PackageIcon className="w-3 h-3" /><span>Picked Up</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'delivery' && (
            <>
              {/* Platform Filters */}
              <div className="flex items-center space-x-2 mb-4 flex-shrink-0">
                <button
                  onClick={() => setDeliveryPlatformFilter('all')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    deliveryPlatformFilter === 'all' ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >All Platforms</button>
                {Object.entries(platformBranding).slice(0, 4).map(([key, brand]) => (
                  <button
                    key={key}
                    onClick={() => setDeliveryPlatformFilter(deliveryPlatformFilter === key ? 'all' : key)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      deliveryPlatformFilter === key
                        ? `bg-gradient-to-r ${brand.gradient} text-white shadow-lg`
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <span className={`w-6 h-6 bg-gradient-to-br ${brand.gradient} rounded-md flex items-center justify-center text-[10px] font-bold text-white`}>{brand.label}</span>
                    <span className="capitalize">{key.replace('_', ' ')}</span>
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                  </button>
                ))}
              </div>

              {/* Connection Status */}
              <div className="flex items-center space-x-4 mb-4 flex-shrink-0">
                {['DoorDash', 'Uber Eats', 'Grubhub'].map(name => (
                  <span key={name} className="flex items-center space-x-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>{name} Connected</span>
                  </span>
                ))}
                <span className="flex items-center space-x-1.5 text-xs text-neutral-400">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Postmates Disconnected</span>
                </span>
              </div>

              {/* Delivery Orders Grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {filteredDeliveryOrders.map(delOrder => {
                    const brand = platformBranding[delOrder.platform] || platformBranding.doordash
                    return (
                      <div key={delOrder.id} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                        <div className={`px-4 py-2.5 bg-gradient-to-r ${brand.gradient} flex items-center justify-between`}>
                          <div className="flex items-center space-x-2">
                            <span className="w-7 h-7 bg-white/20 rounded-md flex items-center justify-center text-xs font-bold text-white">{brand.label}</span>
                            <div>
                              <p className="text-white font-semibold text-sm">{delOrder.platformId}</p>
                              <p className="text-white/70 text-xs">{delOrder.customerName}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white capitalize`}>{delOrder.status.replace('_', ' ')}</span>
                        </div>
                        <div className="p-4">
                          <div className="space-y-1 mb-3">
                            {delOrder.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-neutral-600 dark:text-neutral-400">{item.quantity}x {item.name}</span>
                                <span className="text-neutral-500">${item.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-700">
                            <span className="text-lg font-bold text-black dark:text-white">${delOrder.total.toFixed(2)}</span>
                            <div className="flex space-x-2">
                              {delOrder.status === 'received' && (
                                <>
                                  <button onClick={() => updateDeliveryStatus(delOrder.id, 'preparing')} className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1">
                                    <Check className="w-3 h-3" /><span>Accept</span>
                                  </button>
                                  <button onClick={() => setDeliveryOrders(prev => prev.filter(o => o.id !== delOrder.id))} className="px-3 py-2 border border-red-200 dark:border-red-800 text-red-500 text-xs font-semibold rounded-lg">
                                    <X className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              {delOrder.status === 'preparing' && (
                                <button onClick={() => updateDeliveryStatus(delOrder.id, 'ready')} className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1">
                                  <PackageIcon className="w-3 h-3" /><span>Ready</span>
                                </button>
                              )}
                              {delOrder.status === 'ready' && (
                                <button onClick={() => updateDeliveryStatus(delOrder.id, 'picked_up')} className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1">
                                  <Truck className="w-3 h-3" /><span>Picked Up</span>
                                </button>
                              )}
                              {delOrder.status === 'picked_up' && (
                                <span className="text-xs text-neutral-400 flex items-center space-x-1"><Check className="w-3 h-3" /><span>Complete</span></span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Side - Order Panel (shown for dine_in and takeout) */}
        {activeTab !== 'delivery' && (
          <div className="w-96 flex flex-col bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden flex-shrink-0">
            {/* Order Header */}
            <div className="p-4 bg-gradient-to-r from-red-500 to-red-700 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold">Current Order</h2>
                    <p className="text-xs text-red-200">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      {selectedTable && activeTab === 'dine_in' ? ` · Table ${selectedTable}` : ''}
                    </p>
                  </div>
                </div>
                {order.items.length > 0 && (
                  <button onClick={clearOrder} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {order.items.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="font-medium">No items yet</p>
                  <p className="text-sm mt-1">Tap menu items to add</p>
                </div>
              ) : (
                order.items.map(item => {
                  const badge = getCategoryBadge(item.category)
                  return (
                    <div key={item.id} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-600 hover:border-red-200 dark:hover:border-red-800 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${badge.gradient} rounded-lg flex items-center justify-center text-[10px] font-bold text-white`}>{badge.letter}</div>
                        <div>
                          <p className="font-medium text-sm text-black dark:text-white">{item.name}</p>
                          <p className="text-xs text-neutral-500">${item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 bg-neutral-200 dark:bg-neutral-600 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-500 flex items-center justify-center transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-black dark:text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="w-10 h-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center justify-center transition-colors ml-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Order Totals */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 space-y-2 flex-shrink-0">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="text-black dark:text-white font-mono">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Tax (8%)</span>
                <span className="text-black dark:text-white font-mono">${order.tax.toFixed(2)}</span>
              </div>
              {order.tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Tip</span>
                  <span className="text-green-600 dark:text-green-400 font-mono">+${order.tip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-black dark:text-white">Total</span>
                <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent font-mono">${order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay / Submit Button */}
            <div className="p-4 flex-shrink-0">
              {activeTab === 'takeout' ? (
                <div className="space-y-2">
                  <button
                    onClick={handleTakeoutSubmit}
                    disabled={order.items.length === 0 || !takeoutCustomerName}
                    className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-all"
                  >
                    <PackageIcon className="w-6 h-6" />
                    <span>Send to Kitchen</span>
                  </button>
                  <button
                    onClick={() => setShowPayment(true)}
                    disabled={order.items.length === 0}
                    className="w-full py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-all"
                  >
                    <CreditCard className="w-6 h-6" />
                    <span>Pay ${order.total.toFixed(2)}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPayment(true)}
                  disabled={order.items.length === 0}
                  className="w-full py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center space-x-3 transition-all"
                >
                  <CreditCard className="w-6 h-6" />
                  <span>Pay ${order.total.toFixed(2)}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {paymentComplete ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Payment Successful!</h2>
                <p className="text-neutral-500">Thank you for your order</p>
                <div className="mt-6 inline-flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Receipt sent to customer</span>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5 bg-gradient-to-r from-red-500 to-red-700 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Complete Payment</h2>
                      <p className="text-red-200 text-sm">Select your preferred method</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tip Selection */}
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Add a tip</p>
                  <div className="grid grid-cols-5 gap-2">
                    {tipOptions.map(tip => (
                      <button
                        key={tip.percentage}
                        onClick={() => { setTipPercentage(tip.percentage); setCustomTip('') }}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                          tipPercentage === tip.percentage
                            ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30 scale-105'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:scale-105'
                        }`}
                      >{tip.label}</button>
                    ))}
                    <input
                      type="number"
                      placeholder="$"
                      value={customTip}
                      onChange={e => { setCustomTip(e.target.value); setTipPercentage(null) }}
                      className="py-3 px-2 rounded-xl text-sm font-bold bg-neutral-100 dark:bg-neutral-700 text-black dark:text-white text-center focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="p-5">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Payment method</p>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center space-x-3 ${
                          selectedPayment === method.id
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/30 scale-[1.02] shadow-lg'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-red-300 dark:hover:border-red-700 hover:scale-[1.02]'
                        }`}
                      >
                        <div className={`w-11 h-11 ${method.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <method.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-black dark:text-white">{method.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Input with Quick Amounts */}
                {selectedPayment === 'cash' && (
                  <div className="px-5 pb-5">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <label className="text-sm font-medium text-green-700 dark:text-green-400">Cash Received</label>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">$</span>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value)}
                          placeholder={order.total.toFixed(2)}
                          className="flex-1 text-3xl font-mono font-bold bg-transparent text-black dark:text-white border-0 focus:ring-0 p-0"
                        />
                      </div>
                      {/* Quick amount buttons */}
                      <div className="flex space-x-2 mt-3">
                        {[20, 50, 100].map(amt => (
                          <button
                            key={amt}
                            onClick={() => setCashReceived(amt.toString())}
                            className="flex-1 py-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg text-sm font-bold hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                          >${amt}</button>
                        ))}
                      </div>
                      {changeAmount > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 dark:text-green-400 font-medium">Change Due</span>
                            <span className="text-2xl font-mono font-bold text-green-600 dark:text-green-400">${changeAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total & Pay */}
                <div className="p-5 bg-neutral-50 dark:bg-neutral-900">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">Total Amount</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent font-mono">${order.total.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={!selectedPayment || processing || (selectedPayment === 'cash' && parseFloat(cashReceived || '0') < order.total)}
                    className="w-full py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center space-x-3 transition-all"
                  >
                    {processing ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-6 h-6" />
                        <span>Complete Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
