import { useState, useEffect } from 'react'
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign,
  Smartphone, X, Check, Clock, Users,
  Wifi, WifiOff, Receipt, Banknote, Sparkles, UtensilsCrossed, Coffee, IceCream
} from 'lucide-react'
import { checkApiHealth } from '../services/api'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  emoji?: string
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

// Demo menu items with emojis for visual appeal
const demoMenuItems: MenuItem[] = [
  // Appetizers
  { id: '1', name: 'Caesar Salad', price: 12.99, category: 'Appetizers', emoji: '🥗' },
  { id: '2', name: 'Soup of the Day', price: 8.99, category: 'Appetizers', emoji: '🍜' },
  { id: '3', name: 'Bruschetta', price: 10.99, category: 'Appetizers', emoji: '🍞', popular: true },
  { id: '4', name: 'Wings (8pc)', price: 14.99, category: 'Appetizers', emoji: '🍗', popular: true },
  { id: '19', name: 'Mozzarella Sticks', price: 9.99, category: 'Appetizers', emoji: '🧀' },
  { id: '20', name: 'Spring Rolls', price: 8.99, category: 'Appetizers', emoji: '🥟' },
  // Mains
  { id: '5', name: 'Grilled Salmon', price: 28.99, category: 'Mains', emoji: '🐟', popular: true },
  { id: '6', name: 'Ribeye Steak', price: 34.99, category: 'Mains', emoji: '🥩', popular: true },
  { id: '7', name: 'Chicken Parmesan', price: 22.99, category: 'Mains', emoji: '🍗' },
  { id: '8', name: 'Pasta Primavera', price: 18.99, category: 'Mains', emoji: '🍝' },
  { id: '9', name: 'Fish & Chips', price: 19.99, category: 'Mains', emoji: '🐠' },
  { id: '10', name: 'Burger & Fries', price: 16.99, category: 'Mains', emoji: '🍔', popular: true },
  { id: '21', name: 'Tacos (3pc)', price: 14.99, category: 'Mains', emoji: '🌮' },
  { id: '22', name: 'Margherita Pizza', price: 17.99, category: 'Mains', emoji: '🍕', popular: true },
  // Drinks
  { id: '11', name: 'Soft Drink', price: 3.49, category: 'Drinks', emoji: '🥤' },
  { id: '12', name: 'Iced Tea', price: 3.49, category: 'Drinks', emoji: '🧊' },
  { id: '13', name: 'Coffee', price: 3.99, category: 'Drinks', emoji: '☕', popular: true },
  { id: '14', name: 'Beer', price: 6.99, category: 'Drinks', emoji: '🍺' },
  { id: '15', name: 'Wine Glass', price: 9.99, category: 'Drinks', emoji: '🍷' },
  { id: '23', name: 'Cocktail', price: 11.99, category: 'Drinks', emoji: '🍹' },
  { id: '24', name: 'Fresh Juice', price: 5.99, category: 'Drinks', emoji: '🧃' },
  // Desserts
  { id: '16', name: 'Cheesecake', price: 8.99, category: 'Desserts', emoji: '🍰', popular: true },
  { id: '17', name: 'Chocolate Lava Cake', price: 9.99, category: 'Desserts', emoji: '🍫', popular: true },
  { id: '18', name: 'Ice Cream', price: 5.99, category: 'Desserts', emoji: '🍨' },
  { id: '25', name: 'Apple Pie', price: 7.99, category: 'Desserts', emoji: '🥧' },
  { id: '26', name: 'Tiramisu', price: 8.99, category: 'Desserts', emoji: '🧁' },
]

// Category styling
const categoryStyles: Record<string, { bg: string; icon: any; gradient: string }> = {
  'All': { bg: 'bg-neutral-100 dark:bg-neutral-800', icon: Sparkles, gradient: 'from-neutral-500 to-neutral-600' },
  'Appetizers': { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: UtensilsCrossed, gradient: 'from-orange-400 to-red-500' },
  'Mains': { bg: 'bg-red-50 dark:bg-red-900/20', icon: UtensilsCrossed, gradient: 'from-red-500 to-pink-500' },
  'Drinks': { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Coffee, gradient: 'from-blue-400 to-cyan-500' },
  'Desserts': { bg: 'bg-pink-50 dark:bg-pink-900/20', icon: IceCream, gradient: 'from-pink-400 to-red-600' },
}

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit', icon: CreditCard, color: 'bg-gradient-to-br from-blue-500 to-blue-600', emoji: '💳' },
  { id: 'cash', name: 'Cash', icon: Banknote, color: 'bg-gradient-to-br from-green-500 to-emerald-600', emoji: '💵' },
  { id: 'apple_pay', name: 'Apple Pay', icon: Smartphone, color: 'bg-gradient-to-br from-gray-800 to-black', emoji: '' },
  { id: 'google_pay', name: 'Google Pay', icon: Smartphone, color: 'bg-gradient-to-br from-blue-500 to-green-500', emoji: '🔵' },
  { id: 'paypal', name: 'PayPal', icon: CreditCard, color: 'bg-gradient-to-br from-blue-600 to-red-800', emoji: '🅿️' },
  { id: 'venmo', name: 'Venmo', icon: Smartphone, color: 'bg-gradient-to-br from-cyan-400 to-blue-500', emoji: '💙' },
  { id: 'cash_app', name: 'Cash App', icon: DollarSign, color: 'bg-gradient-to-br from-emerald-400 to-green-600', emoji: '💚' },
  { id: 'klarna', name: 'Klarna', icon: Clock, color: 'bg-gradient-to-br from-pink-400 to-pink-600', emoji: '🛒' },
]

const tipOptions = [
  { label: '15%', percentage: 15 },
  { label: '18%', percentage: 18 },
  { label: '20%', percentage: 20 },
  { label: '25%', percentage: 25 },
]

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
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showPayment, setShowPayment] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [tipPercentage, setTipPercentage] = useState<number | null>(null)
  const [customTip, setCustomTip] = useState('')
  const [processing, setProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [tableNumber, setTableNumber] = useState<string>('')
  const [cashReceived, setCashReceived] = useState('')

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
    const tax = subtotal * 0.08 // 8% tax
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

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500))

    setProcessing(false)
    setPaymentComplete(true)

    // Reset after showing success
    setTimeout(() => {
      setPaymentComplete(false)
      setShowPayment(false)
      setOrder({
        items: [],
        subtotal: 0,
        tax: 0,
        tip: 0,
        total: 0,
        orderType: 'dine_in'
      })
      setSelectedPayment(null)
      setTipPercentage(null)
      setCustomTip('')
      setTableNumber('')
      setCashReceived('')
    }, 2000)
  }

  const clearOrder = () => {
    setOrder({
      items: [],
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0,
      orderType: 'dine_in'
    })
    setTipPercentage(null)
    setCustomTip('')
  }

  const changeAmount = selectedPayment === 'cash' && cashReceived
    ? parseFloat(cashReceived) - order.total
    : 0

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left Side - Menu */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">Point of Sale</h1>
              <div className="flex items-center space-x-2">
                {apiConnected !== null && (
                  <span className={`flex items-center space-x-1 text-xs ${
                    apiConnected
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span>{apiConnected ? 'Online' : 'Demo Mode'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div className="flex rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-1">
            {['dine_in', 'takeout', 'delivery'].map((type) => (
              <button
                key={type}
                onClick={() => setOrder({ ...order, orderType: type as Order['orderType'] })}
                className={`px-4 py-2 text-xs font-medium capitalize rounded-lg transition-all ${
                  order.orderType === type
                    ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {type === 'dine_in' ? '🍽️ Dine In' : type === 'takeout' ? '🥡 Takeout' : '🚗 Delivery'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => {
            const style = categoryStyles[category] || categoryStyles['All']
            const CategoryIcon = style.icon
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? `bg-gradient-to-r ${style.gradient} text-white shadow-lg`
                    : `${style.bg} text-neutral-600 dark:text-neutral-400 hover:scale-[1.02]`
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
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToOrder(item)}
                className="group relative p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-200 text-left hover:scale-[1.02]"
              >
                {item.popular && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                    HOT
                  </div>
                )}
                <div className="w-full h-16 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-800 rounded-lg mb-3 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {item.emoji}
                </div>
                <p className="font-semibold text-sm text-black dark:text-white truncate">{item.name}</p>
                <p className="text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">${item.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Order */}
      <div className="w-96 flex flex-col bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden">
        {/* Order Header */}
        <div className="p-4 bg-gradient-to-r from-red-500 to-red-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold">Current Order</h2>
                <p className="text-xs text-red-200">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                </p>
              </div>
            </div>
            {order.items.length > 0 && (
              <button
                onClick={clearOrder}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {order.orderType === 'dine_in' && (
            <div className="mt-3 flex items-center space-x-2">
              <Users className="w-4 h-4 text-red-200" />
              <input
                type="text"
                placeholder="Table #"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-white/20 backdrop-blur-sm border-0 rounded-lg text-white placeholder-red-200 focus:ring-2 focus:ring-white/50"
              />
            </div>
          )}
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
            order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-600 hover:border-red-200 dark:hover:border-red-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{(demoMenuItems.find(m => m.id === item.id)?.emoji) || '🍽️'}</span>
                  <div>
                    <p className="font-medium text-sm text-black dark:text-white">{item.name}</p>
                    <p className="text-xs text-neutral-500">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-7 h-7 bg-neutral-200 dark:bg-neutral-600 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-500 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-bold text-black dark:text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-7 h-7 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center justify-center transition-colors ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Totals */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900 space-y-2">
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

        {/* Pay Button */}
        <div className="p-4">
          <button
            onClick={() => setShowPayment(true)}
            disabled={order.items.length === 0}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center space-x-3 transition-all"
          >
            <CreditCard className="w-6 h-6" />
            <span>Pay ${order.total.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {paymentComplete ? (
              // Success State
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
                {/* Header */}
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
                  <button
                    onClick={() => setShowPayment(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
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
                        onClick={() => { setTipPercentage(tip.percentage); setCustomTip(''); }}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                          tipPercentage === tip.percentage
                            ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30 scale-105'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:scale-105'
                        }`}
                      >
                        {tip.label}
                      </button>
                    ))}
                    <input
                      type="number"
                      placeholder="$"
                      value={customTip}
                      onChange={(e) => { setCustomTip(e.target.value); setTipPercentage(null); }}
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
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-violet-300 dark:hover:border-red-700 hover:scale-[1.02]'
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

                {/* Cash Input */}
                {selectedPayment === 'cash' && (
                  <div className="px-5 pb-5">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <label className="text-sm font-medium text-green-700 dark:text-green-400">Cash Received</label>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">$</span>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder={order.total.toFixed(2)}
                          className="flex-1 text-3xl font-mono font-bold bg-transparent text-black dark:text-white border-0 focus:ring-0 p-0"
                        />
                      </div>
                      {changeAmount > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 dark:text-green-400 font-medium">Change Due</span>
                            <span className="text-2xl font-mono font-bold text-green-600 dark:text-green-400">
                              ${changeAmount.toFixed(2)}
                            </span>
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
                    <span className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent font-mono">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={!selectedPayment || processing || (selectedPayment === 'cash' && parseFloat(cashReceived || '0') < order.total)}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center space-x-3 transition-all"
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
