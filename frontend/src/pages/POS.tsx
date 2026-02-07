import { useState, useEffect } from 'react'
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign,
  Smartphone, X, Check, Clock, Users, ChefHat,
  Wifi, WifiOff, Receipt, Banknote
} from 'lucide-react'
import { checkApiHealth } from '../services/api'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  image?: string
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

// Demo menu items
const demoMenuItems: MenuItem[] = [
  // Appetizers
  { id: '1', name: 'Caesar Salad', price: 12.99, category: 'Appetizers' },
  { id: '2', name: 'Soup of the Day', price: 8.99, category: 'Appetizers' },
  { id: '3', name: 'Bruschetta', price: 10.99, category: 'Appetizers' },
  { id: '4', name: 'Wings (8pc)', price: 14.99, category: 'Appetizers' },
  // Mains
  { id: '5', name: 'Grilled Salmon', price: 28.99, category: 'Mains' },
  { id: '6', name: 'Ribeye Steak', price: 34.99, category: 'Mains' },
  { id: '7', name: 'Chicken Parmesan', price: 22.99, category: 'Mains' },
  { id: '8', name: 'Pasta Primavera', price: 18.99, category: 'Mains' },
  { id: '9', name: 'Fish & Chips', price: 19.99, category: 'Mains' },
  { id: '10', name: 'Burger & Fries', price: 16.99, category: 'Mains' },
  // Drinks
  { id: '11', name: 'Soft Drink', price: 3.49, category: 'Drinks' },
  { id: '12', name: 'Iced Tea', price: 3.49, category: 'Drinks' },
  { id: '13', name: 'Coffee', price: 3.99, category: 'Drinks' },
  { id: '14', name: 'Beer', price: 6.99, category: 'Drinks' },
  { id: '15', name: 'Wine Glass', price: 9.99, category: 'Drinks' },
  // Desserts
  { id: '16', name: 'Cheesecake', price: 8.99, category: 'Desserts' },
  { id: '17', name: 'Chocolate Lava Cake', price: 9.99, category: 'Desserts' },
  { id: '18', name: 'Ice Cream', price: 5.99, category: 'Desserts' },
]

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'cash', name: 'Cash', icon: Banknote, color: 'bg-green-500' },
  { id: 'apple_pay', name: 'Apple Pay', icon: Smartphone, color: 'bg-gray-800' },
  { id: 'google_pay', name: 'Google Pay', icon: Smartphone, color: 'bg-blue-600' },
  { id: 'paypal', name: 'PayPal', icon: CreditCard, color: 'bg-indigo-500' },
  { id: 'venmo', name: 'Venmo', icon: Smartphone, color: 'bg-cyan-500' },
  { id: 'cash_app', name: 'Cash App', icon: DollarSign, color: 'bg-emerald-500' },
  { id: 'klarna', name: 'Klarna', icon: Clock, color: 'bg-pink-500' },
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
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-black dark:text-white">Point of Sale</h1>
            {apiConnected !== null && (
              <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                apiConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{apiConnected ? 'Online' : 'Offline'}</span>
              </span>
            )}
          </div>

          {/* Order Type */}
          <div className="flex rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
            {['dine_in', 'takeout', 'delivery'].map((type) => (
              <button
                key={type}
                onClick={() => setOrder({ ...order, orderType: type as Order['orderType'] })}
                className={`px-3 py-1.5 text-xs font-medium capitalize ${
                  order.orderType === type
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToOrder(item)}
                className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-black dark:hover:border-white transition-colors text-left"
              >
                <div className="w-full h-16 bg-neutral-100 dark:bg-neutral-700 rounded-lg mb-2 flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="font-medium text-sm text-black dark:text-white truncate">{item.name}</p>
                <p className="text-sm text-green-600 dark:text-green-400 font-mono">${item.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Order */}
      <div className="w-96 flex flex-col bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
        {/* Order Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-black dark:text-white" />
              <h2 className="font-semibold text-black dark:text-white">Current Order</h2>
              <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded-full text-xs text-neutral-600 dark:text-neutral-400">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>
            {order.items.length > 0 && (
              <button
                onClick={clearOrder}
                className="text-red-500 hover:text-red-600 text-sm"
              >
                Clear
              </button>
            )}
          </div>

          {order.orderType === 'dine_in' && (
            <div className="mt-3 flex items-center space-x-2">
              <Users className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Table #"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-700 border-0 rounded-lg text-black dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {order.items.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No items in order</p>
              <p className="text-sm">Tap menu items to add</p>
            </div>
          ) : (
            order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm text-black dark:text-white">{item.name}</p>
                  <p className="text-xs text-neutral-500">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 bg-neutral-200 dark:bg-neutral-600 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-mono text-black dark:text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 bg-neutral-200 dark:bg-neutral-600 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Totals */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
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
              <span className="text-green-600 dark:text-green-400 font-mono">${order.tip.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-black dark:text-white">Total</span>
            <span className="text-black dark:text-white font-mono">${order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay Button */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setShowPayment(true)}
            disabled={order.items.length === 0}
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-5 h-5" />
            <span>Pay ${order.total.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            {paymentComplete ? (
              // Success State
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Payment Successful!</h2>
                <p className="text-neutral-500">Transaction complete</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black dark:text-white">Select Payment Method</h2>
                  <button
                    onClick={() => setShowPayment(false)}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                  >
                    <X className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>

                {/* Tip Selection */}
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-500 mb-3">Add Tip</p>
                  <div className="grid grid-cols-5 gap-2">
                    {tipOptions.map(tip => (
                      <button
                        key={tip.percentage}
                        onClick={() => { setTipPercentage(tip.percentage); setCustomTip(''); }}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          tipPercentage === tip.percentage
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {tip.label}
                      </button>
                    ))}
                    <input
                      type="number"
                      placeholder="Custom"
                      value={customTip}
                      onChange={(e) => { setCustomTip(e.target.value); setTipPercentage(null); }}
                      className="py-2 px-2 rounded-lg text-sm bg-neutral-100 dark:bg-neutral-700 text-black dark:text-white text-center"
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedPayment === method.id
                            ? 'border-black dark:border-white bg-neutral-50 dark:bg-neutral-700'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center mb-2`}>
                          <method.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-sm font-medium text-black dark:text-white">{method.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Input */}
                {selectedPayment === 'cash' && (
                  <div className="px-4 pb-4">
                    <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-4">
                      <label className="text-sm text-neutral-500 dark:text-neutral-400">Cash Received</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg text-black dark:text-white">$</span>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder={order.total.toFixed(2)}
                          className="flex-1 text-2xl font-mono bg-transparent text-black dark:text-white border-0 focus:ring-0 p-0"
                        />
                      </div>
                      {changeAmount > 0 && (
                        <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Change Due</span>
                            <span className="text-lg font-mono text-green-600 dark:text-green-400">
                              ${changeAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total & Pay */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between mb-4">
                    <span className="text-neutral-600 dark:text-neutral-400">Total Amount</span>
                    <span className="text-2xl font-semibold text-black dark:text-white font-mono">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={!selectedPayment || processing || (selectedPayment === 'cash' && parseFloat(cashReceived || '0') < order.total)}
                    className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Receipt className="w-5 h-5" />
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
