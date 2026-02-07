import { useState, useEffect } from 'react'
import { Wallet, QrCode, ArrowRightLeft, CheckCircle2, XCircle, Clock, DollarSign, Coins, Copy, ExternalLink } from 'lucide-react'

interface PaymentRequest {
  payment_id: string
  reference: string
  amount_usd: number
  amount_sol: number
  sol_price: number
  recipient: string
  label: string
  message: string
  memo: string
  payment_url: string
  qr_data: string
  expires_at: string
  network: string
}

interface PaymentStatus {
  payment_id: string
  status: string
  amount_sol: number
  amount_usd: number
  created_at: string
  expires_at: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SolanaPay() {
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'convert'>('create')
  const [solPrice, setSolPrice] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<PaymentStatus[]>([])
  const [currentPayment, setCurrentPayment] = useState<PaymentRequest | null>(null)

  // Form state
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [message, setMessage] = useState('')

  // Converter state
  const [convertAmount, setConvertAmount] = useState('')
  const [convertDirection, setConvertDirection] = useState<'usd_to_sol' | 'sol_to_usd'>('usd_to_sol')
  const [convertResult, setConvertResult] = useState<number | null>(null)

  useEffect(() => {
    fetchSolPrice()
    fetchPayments()
  }, [])

  const fetchSolPrice = async () => {
    try {
      const res = await fetch(`${API_URL}/solana-pay/price`)
      const data = await res.json()
      setSolPrice(data.sol_usd)
    } catch {
      setSolPrice(95.50) // Fallback demo price
    }
  }

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_URL}/solana-pay/payments`)
      const data = await res.json()
      setPayments(data.payments || [])
    } catch {
      // Demo data
      setPayments([])
    }
  }

  const createPayment = async () => {
    if (!amount || !label) return

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/solana-pay/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_usd: parseFloat(amount),
          label,
          message: message || `Payment for ${label}`,
          expires_in_minutes: 30
        })
      })
      const data = await res.json()
      setCurrentPayment(data)
      fetchPayments()
    } catch (err) {
      console.error('Failed to create payment:', err)
    } finally {
      setLoading(false)
    }
  }

  const convertCurrency = async () => {
    if (!convertAmount) return

    try {
      const res = await fetch(`${API_URL}/solana-pay/convert?amount=${convertAmount}&direction=${convertDirection}`, {
        method: 'POST'
      })
      const data = await res.json()
      setConvertResult(data.output.amount)
    } catch {
      // Local calculation
      const amt = parseFloat(convertAmount)
      if (convertDirection === 'usd_to_sol') {
        setConvertResult(amt / solPrice)
      } else {
        setConvertResult(amt * solPrice)
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'expired':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'expired':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span>Solana Pay</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Accept cryptocurrency payments with Solana Pay
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 px-4 py-2 rounded-xl">
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">SOL Price</p>
                <p className="font-bold text-black dark:text-white">${solPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-neutral-200 dark:border-neutral-700">
        {[
          { id: 'create', label: 'Create Payment', icon: QrCode },
          { id: 'history', label: 'Payment History', icon: Clock },
          { id: 'convert', label: 'Convert', icon: ArrowRightLeft }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Create Payment Tab */}
      {activeTab === 'create' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Payment Form */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-bold text-black dark:text-white mb-4">Create Payment Request</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Amount (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-black dark:text-white"
                  />
                </div>
                {amount && (
                  <p className="text-sm text-neutral-500 mt-1">
                    ≈ {(parseFloat(amount) / solPrice).toFixed(6)} SOL
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Order #1234"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Payment for your order at Mykonos Mediterranean"
                  rows={3}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-black dark:text-white resize-none"
                />
              </div>

              <button
                onClick={createPayment}
                disabled={loading || !amount || !label}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>Generate QR Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            {currentPayment ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-black dark:text-white">Payment QR Code</h2>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full">
                    {currentPayment.network}
                  </span>
                </div>

                {/* Simulated QR Code */}
                <div className="bg-white p-6 rounded-xl flex items-center justify-center">
                  <div className="w-48 h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg flex items-center justify-center border-4 border-purple-500">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-neutral-400 mx-auto mb-2" />
                      <p className="text-xs text-neutral-500">Scan with Solana wallet</p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                    <span className="text-sm text-neutral-500">Amount</span>
                    <div className="text-right">
                      <p className="font-bold text-black dark:text-white">{currentPayment.amount_sol} SOL</p>
                      <p className="text-sm text-neutral-500">${currentPayment.amount_usd}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                    <span className="text-sm text-neutral-500">Reference</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs text-black dark:text-white">{currentPayment.reference.slice(0, 8)}...</code>
                      <button
                        onClick={() => copyToClipboard(currentPayment.reference)}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                      >
                        <Copy className="w-4 h-4 text-neutral-500" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                    <span className="text-sm text-neutral-500">Expires</span>
                    <span className="text-sm text-black dark:text-white">
                      {new Date(currentPayment.expires_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(currentPayment.payment_url)}
                  className="w-full py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg flex items-center justify-center space-x-2 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Copy Payment Link</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center py-12">
                <div>
                  <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-10 h-10 text-neutral-400" />
                  </div>
                  <h3 className="font-semibold text-black dark:text-white mb-2">No Payment Created</h3>
                  <p className="text-sm text-neutral-500">
                    Fill out the form to generate a Solana Pay QR code
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="font-bold text-black dark:text-white">Payment History</h2>
          </div>
          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-500">No payments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {payments.map(payment => (
                <div key={payment.payment_id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium text-black dark:text-white">
                        {payment.amount_sol} SOL
                      </p>
                      <p className="text-sm text-neutral-500">
                        ${payment.amount_usd}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Convert Tab */}
      {activeTab === 'convert' && (
        <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-lg font-bold text-black dark:text-white mb-4 text-center">Currency Converter</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={convertAmount}
                onChange={(e) => {
                  setConvertAmount(e.target.value)
                  setConvertResult(null)
                }}
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-black dark:text-white"
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setConvertDirection(d => d === 'usd_to_sol' ? 'sol_to_usd' : 'usd_to_sol')
                  setConvertResult(null)
                }}
                className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all"
              >
                <ArrowRightLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            <div className="text-center py-4">
              <p className="text-sm text-neutral-500 mb-2">
                {convertDirection === 'usd_to_sol' ? 'USD → SOL' : 'SOL → USD'}
              </p>
              <p className="text-3xl font-bold text-black dark:text-white">
                {convertResult !== null ? (
                  <>
                    {convertDirection === 'usd_to_sol' ? (
                      <>{convertResult.toFixed(6)} SOL</>
                    ) : (
                      <>${convertResult.toFixed(2)}</>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </p>
              <p className="text-sm text-neutral-500 mt-2">
                1 SOL = ${solPrice.toFixed(2)}
              </p>
            </div>

            <button
              onClick={convertCurrency}
              disabled={!convertAmount}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              Convert
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
