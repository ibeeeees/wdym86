import { useState, useEffect } from 'react'
import { X, CreditCard, Banknote, Check, AlertCircle, Loader2 } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import api from '../services/api'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo')

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  order: {
    subtotal: number
    tax: number
    tip: number
    total: number
    items: any[]
  }
  onPaymentComplete: (transactionId: string, method: 'card' | 'cash') => void
  restaurantId: string
  orderId?: string
}

// Card Payment Component (uses Stripe Elements)
function CardPaymentForm({ 
  amount, 
  orderId, 
  onSuccess, 
  onError 
}: { 
  amount: number
  orderId: string
  onSuccess: (transactionId: string) => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      onError('Stripe not initialized')
      return
    }

    setProcessing(true)

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.href,
        },
      })

      if (error) {
        onError(error.message || 'Payment failed')
        setProcessing(false)
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm with backend
        await api.post('/pos-payments/confirm-card-payment', {
          payment_intent_id: paymentIntent.id,
          payment_method_id: paymentIntent.payment_method
        })

        onSuccess(paymentIntent.id)
      } else {
        onError('Payment confirmation failed')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      onError(error.response?.data?.detail || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay ${amount.toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  )
}

// Cash Payment Component
function CashPayment({ 
  amount, 
  onConfirm,
  onError 
}: { 
  amount: number
  onConfirm: (received: number, change: number) => void
  onError: (error: string) => void
}) {
  const [cashReceived, setCashReceived] = useState('')
  const [processing, setProcessing] = useState(false)

  const receivedAmount = parseFloat(cashReceived) || 0
  const changeAmount = Math.max(0, receivedAmount - amount)
  const isValid = receivedAmount >= amount

  const quickAmounts = [
    amount,
    Math.ceil(amount),
    Math.ceil(amount / 10) * 10,
    Math.ceil(amount / 20) * 20,
    Math.ceil(amount / 50) * 50,
    Math.ceil(amount / 100) * 100,
  ].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b)

  const handleConfirm = () => {
    if (!isValid) {
      onError('Insufficient payment amount')
      return
    }

    setProcessing(true)
    onConfirm(receivedAmount, changeAmount)
  }

  return (
    <div className="space-y-4">
      {/* Amount Due */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
        <div className="text-sm text-green-600 dark:text-green-400 mb-1">Amount Due</div>
        <div className="text-3xl font-bold font-mono text-green-700 dark:text-green-300">
          ${amount.toFixed(2)}
        </div>
      </div>

      {/* Cash Received Input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Cash Received
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-neutral-400">$</span>
          <input
            type="number"
            step="0.01"
            value={cashReceived}
            onChange={(e) => setCashReceived(e.target.value)}
            placeholder="0.00"
            className="w-full pl-10 pr-4 py-4 text-2xl font-mono font-bold border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-neutral-800 text-black dark:text-white"
            autoFocus
          />
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {quickAmounts.slice(0, 6).map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => setCashReceived(amt.toString())}
            className="py-2 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg font-medium text-sm transition-colors"
          >
            ${amt.toFixed(0)}
          </button>
        ))}
      </div>

      {/* Change Display */}
      {receivedAmount > 0 && (
        <div className={`p-4 rounded-xl border-2 ${
          isValid 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className={`font-medium ${
              isValid ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {isValid ? 'Change Due' : 'Insufficient Payment'}
            </span>
            <span className={`text-2xl font-mono font-bold ${
              isValid ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isValid ? `$${changeAmount.toFixed(2)}` : `-$${(amount - receivedAmount).toFixed(2)}`}
            </span>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!isValid || processing}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            <span>Confirm Cash Payment</span>
          </>
        )}
      </button>
    </div>
  )
}

// Main Payment Modal
export default function PaymentModal({
  isOpen,
  onClose,
  order,
  onPaymentComplete,
  restaurantId,
  orderId
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Create payment intent when modal opens and card is selected
  useEffect(() => {
    if (isOpen && paymentMethod === 'card' && !clientSecret) {
      createPaymentIntent()
    }
  }, [isOpen, paymentMethod])

  const createPaymentIntent = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/pos-payments/create-payment', {
        order_id: orderId || `ORDER-${Date.now()}`,
        amount: order.total,
        payment_method: 'card',
        description: `POS Order - ${order.items.length} items`
      })

      setClientSecret(response.data.client_secret)
    } catch (err: any) {
      console.error('Failed to create payment intent:', err)
      setError(err.response?.data?.detail || 'Failed to initialize payment')
    } finally {
      setLoading(false)
    }
  }

  const handleCardPaymentSuccess = (transactionId: string) => {
    setSuccess(true)
    setTimeout(() => {
      onPaymentComplete(transactionId, 'card')
      handleClose()
    }, 1500)
  }

  const handleCashPaymentConfirm = async (received: number, change: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/pos-payments/process-cash', {
        order_id: orderId || `ORDER-${Date.now()}`,
        amount_received: received,
        change_given: change
      })

      setSuccess(true)
      setTimeout(() => {
        onPaymentComplete(response.data.transaction_id, 'cash')
        handleClose()
      }, 1500)
    } catch (err: any) {
      console.error('Cash payment failed:', err)
      setError(err.response?.data?.detail || 'Cash payment processing failed')
      setLoading(false)
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleClose = () => {
    setClientSecret(null)
    setError(null)
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-black dark:text-white">Complete Payment</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success State */}
        {success && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Payment Successful!</h3>
            <p className="text-neutral-600 dark:text-neutral-400">Processing order...</p>
          </div>
        )}

        {/* Payment Form */}
        {!success && (
          <>
            {/* Order Summary */}
            <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                  <span className="font-mono font-medium">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Tax</span>
                  <span className="font-mono font-medium">${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Tip</span>
                  <span className="font-mono font-medium">${order.tip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-300 dark:border-neutral-700">
                  <span className="font-bold text-black dark:text-white">Total</span>
                  <span className="font-mono font-bold text-xl text-black dark:text-white">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-6">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                >
                  <CreditCard className={`w-8 h-8 ${
                    paymentMethod === 'card' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'
                  }`} />
                  <span className="font-medium">Card</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                    paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                >
                  <Banknote className={`w-8 h-8 ${
                    paymentMethod === 'cash' ? 'text-green-600 dark:text-green-400' : 'text-neutral-400'
                  }`} />
                  <span className="font-medium">Cash</span>
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              )}

              {/* Payment Forms */}
              {loading && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Initializing payment...
                  </p>
                </div>
              )}

              {!loading && paymentMethod === 'card' && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CardPaymentForm
                    amount={order.total}
                    orderId={orderId || `ORDER-${Date.now()}`}
                    onSuccess={handleCardPaymentSuccess}
                    onError={handleError}
                  />
                </Elements>
              )}

              {!loading && paymentMethod === 'cash' && (
                <CashPayment
                  amount={order.total}
                  onConfirm={handleCashPaymentConfirm}
                  onError={handleError}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
