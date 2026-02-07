/**
 * POS Page - Redesigned with Check-First Workflow
 * 
 * Implements 26.md specification:
 * 1. Order type selection first
 * 2. Show check list for selected type
 * 3. Menu items only shown in check modal
 * 4. Check-based ordering system
 */

import { useState, useEffect } from 'react'
import {
  Users, Receipt, Truck, Plus, ChevronRight, Sparkles,
  UtensilsCrossed, Coffee, IceCream
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCuisineTemplate } from '../data/cuisineTemplates'
import CheckList from '../components/CheckList'
import CheckModal from '../components/CheckModal'
import PaymentModal from '../components/PaymentModal'
import PaymentConfirmation from '../components/PaymentConfirmation'
import ReceiptDisplay from '../components/ReceiptDisplay'
import { createCheck, getCheckItems, finalizeCheck, Check, CheckItem } from '../services/checks'
import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_your_key'
)

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  popular?: boolean
}

type OrderType = 'dine_in' | 'takeout' | 'delivery'

export default function POS() {
  const { user } = useAuth()
  
  // State Management
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | null>(null)
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null)
  const [showCheckModal, setShowCheckModal] = useState(false)
  const [showNewCheckDialog, setShowNewCheckDialog] = useState(false)
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [currentCheck, setCurrentCheck] = useState<Check | null>(null)
  const [currentCheckItems, setCurrentCheckItems] = useState<CheckItem[]>([])
  const [receiptData, setReceiptData] = useState<any>(null)
  const [newCheckName, setNewCheckName] = useState('')
  const [creating, setCreating] = useState(false)

  // Get restaurant info
  const restaurantId = localStorage.getItem('restaurant_id') || 'demo_restaurant'
  const cuisineType = localStorage.getItem('cuisine_type') || 'mediterranean'

  // Load menu items on mount
  useEffect(() => {
    const template = getCuisineTemplate(cuisineType)
    setMenuItems(template.menuItems || [])
  }, [cuisineType])

  // ==========================================
  // Handlers
  // ==========================================

  const handleOrderTypeSelect = (type: OrderType) => {
    console.log('📋 Order type selected:', type)
    setSelectedOrderType(type)
    // Reset other states
    setSelectedCheckId(null)
    setShowCheckModal(false)
  }

  const handleNewCheck = () => {
    console.log('➕ New check button clicked')
    setShowNewCheckDialog(true)
    setNewCheckName('')
  }

  const handleCreateCheck = async () => {
    if (!selectedOrderType || !newCheckName.trim()) {
      alert('Please enter a check name')
      return
    }

    try {
      setCreating(true)
      
      const checkData = await createCheck({
        order_type: selectedOrderType,
        check_name: newCheckName.trim(),
        restaurant_id: restaurantId,
      })

      console.log('✅ Check created:', checkData)
      
      // Open the new check immediately
      setSelectedCheckId(checkData.check_id)
      setShowCheckModal(true)
      setShowNewCheckDialog(false)
      setNewCheckName('')
    } catch (err) {
      console.error('❌ Failed to create check:', err)
      alert(err instanceof Error ? err.message : 'Failed to create check')
    } finally {
      setCreating(false)
    }
  }

  const handleCheckClick = (check: Check) => {
    console.log('🔍 Check clicked:', check)
    setSelectedCheckId(check.check_id)
    setCurrentCheck(check)
    setShowCheckModal(true)
  }

  const handleCheckUpdated = () => {
    console.log('🔄 Check updated, refreshing list')
    // Force CheckList to refresh by closing and reopening modal
    // The CheckList component will auto-refresh
  }

  const handleEnterPayment = async (checkId: string) => {
    console.log('💳 Enter payment for check:', checkId)
    
    try {
      // Load check data and items
      const items = await getCheckItems(checkId)
      setSelectedCheckId(checkId)
      setCurrentCheckItems(items)
      
      // Show payment confirmation first
      setShowPaymentConfirmation(true)
    } catch (err) {
      console.error('❌ Failed to load check for payment:', err)
      alert('Failed to load check details')
    }
  }

  const handlePaymentConfirm = (paymentMethod: 'credit_card' | 'cash') => {
    console.log('✅ Payment confirmed with method:', paymentMethod)
    setShowPaymentConfirmation(false)
    
    if (paymentMethod === 'credit_card') {
      // Show Stripe payment modal
      setShowPaymentModal(true)
    } else {
      // Handle cash payment
      handleCashPayment()
    }
  }

  const handleCashPayment = async () => {
    if (!selectedCheckId) return

    try {
      // Get tip amount from user
      const tipStr = prompt('Enter tip amount (or 0 for no tip):')
      if (tipStr === null) return // User cancelled
      
      const tipAmount = parseFloat(tipStr) || 0

      // Finalize check
      await finalizeCheck(selectedCheckId, tipAmount)
      
      // Show receipt (would need to fetch receipt from backend)
      alert('Cash payment processed successfully!')
      
      // Reset and return to check list
      setSelectedCheckId(null)
      setSelectedOrderType(null)
    } catch (err) {
      console.error('❌ Cash payment failed:', err)
      alert('Failed to process cash payment')
    }
  }

  const handlePaymentSuccess = async (paymentId: string) => {
    console.log('✅ Payment successful:', paymentId)
    setShowPaymentModal(false)
    
    // TODO: Generate and show receipt
    alert('Payment successful! Receipt generation coming soon.')
    
    // Reset and return to check list
    setSelectedCheckId(null)
    setSelectedOrderType(null)
  }

  // ==========================================
  // Render Order Type Selection
  // ==========================================

  if (!selectedOrderType) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Point of Sale
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Select an order type to get started
            </p>
          </div>

          {/* Order Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dine-In */}
            <button
              onClick={() => handleOrderTypeSelect('dine_in')}
              className="group relative p-8 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl transition-all"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:scale-110 transition-transform">
                  <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                    Dine-In
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    Table service orders
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Takeout */}
            <button
              onClick={() => handleOrderTypeSelect('takeout')}
              className="group relative p-8 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-xl transition-all"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full group-hover:scale-110 transition-transform">
                  <Receipt className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                    Takeout
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    Customer pickup orders
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Delivery */}
            <button
              onClick={() => handleOrderTypeSelect('delivery')}
              className="group relative p-8 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-orange-500 dark:hover:border-orange-400 hover:shadow-xl transition-all"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full group-hover:scale-110 transition-transform">
                  <Truck className="w-12 h-12 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                    Delivery
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    Delivery orders
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // Render Check List View
  // ==========================================

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              {selectedOrderType === 'dine_in' && 'Dine-In Orders'}
              {selectedOrderType === 'takeout' && 'Takeout Orders'}
              {selectedOrderType === 'delivery' && 'Delivery Orders'}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Manage checks and orders
            </p>
          </div>
          <button
            onClick={() => setSelectedOrderType(null)}
            className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            ← Change Order Type
          </button>
        </div>

        {/* Check List */}
        <CheckList
          restaurantId={restaurantId}
          orderType={selectedOrderType}
          onCheckClick={handleCheckClick}
          onNewCheck={handleNewCheck}
        />
      </div>

      {/* Check Modal */}
      {showCheckModal && selectedCheckId && (
        <CheckModal
          checkId={selectedCheckId}
          isOpen={showCheckModal}
          onClose={() => {
            setShowCheckModal(false)
            setSelectedCheckId(null)
          }}
          onCheckUpdated={handleCheckUpdated}
          onEnterPayment={handleEnterPayment}
          restaurantId={restaurantId}
          menuItems={menuItems}
        />
      )}

      {/* New Check Dialog */}
      {showNewCheckDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Check</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Check Name {selectedOrderType === 'dine_in' ? '(e.g., Table 5)' : '(e.g., John Doe)'}
              </label>
              <input
                type="text"
                value={newCheckName}
                onChange={(e) => setNewCheckName(e.target.value)}
                placeholder={selectedOrderType === 'dine_in' ? 'Table 5' : 'Customer Name'}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-red-500"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCreateCheck()
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewCheckDialog(false)}
                className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCheck}
                disabled={creating || !newCheckName.trim()}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {creating ? 'Creating...' : 'Create Check'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation */}
      {showPaymentConfirmation && currentCheck && (
        <PaymentConfirmation
          isOpen={showPaymentConfirmation}
          onClose={() => setShowPaymentConfirmation(false)}
          onConfirm={handlePaymentConfirm}
          check={currentCheck}
          items={currentCheckItems}
        />
      )}

      {/* Payment Modal (Stripe) */}
      {showPaymentModal && selectedCheckId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          checkId={selectedCheckId}
          restaurantId={restaurantId}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Display */}
      {showReceipt && receiptData && (
        <ReceiptDisplay
          isOpen={showReceipt}
          onClose={() => {
            setShowReceipt(false)
            setReceiptData(null)
          }}
          receipt={receiptData}
        />
      )}
    </div>
  )
}
