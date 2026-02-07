/**
 * Payment Confirmation Dialog
 * 
 * Shows confirmation before processing payment.
 * Implements 26.md payment confirmation workflow.
 */

import { useState } from 'react'
import { X, DollarSign, CreditCard, Banknote } from 'lucide-react'
import { Check, CheckItem } from '../services/checks'

interface PaymentConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (paymentMethod: 'credit_card' | 'cash') => void
  check: Check | null
  items: CheckItem[]
}

export default function PaymentConfirmation({
  isOpen,
  onClose,
  onConfirm,
  check,
  items,
}: PaymentConfirmationProps) {
  const [selectedMethod, setSelectedMethod] = useState<'credit_card' | 'cash'>('credit_card')

  if (!isOpen || !check) return null

  const handleConfirm = () => {
    onConfirm(selectedMethod)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Confirm Payment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Check Info */}
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              {check.check_number}
            </div>
            <div className="text-lg font-semibold mb-1">{check.check_name}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {items.length} items
            </div>
          </div>

          {/* Items List */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium">{item.quantity}x</span>{' '}
                  {item.name}
                </div>
                <div className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Subtotal:</span>
              <span>${check.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Tax:</span>
              <span>${check.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-red-600">
              <span>Total:</span>
              <span>${check.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Payment Method:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedMethod('credit_card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMethod === 'credit_card'
                    ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                }`}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Credit Card</div>
              </button>

              <button
                onClick={() => setSelectedMethod('cash')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMethod === 'cash'
                    ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Banknote className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Cash</div>
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Confirm before proceeding:</strong> This action will{' '}
              {selectedMethod === 'credit_card' ? 'charge the customer\'s card' : 'record a cash payment'}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  )
}
