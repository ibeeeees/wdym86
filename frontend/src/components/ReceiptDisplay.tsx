/**
 * Receipt Display Component
 * 
 * Shows generated receipt after payment completion.
 * Implements 26.md receipt display specification.
 */

import { X, Printer, Download, Check as CheckIcon } from 'lucide-react'

interface ReceiptItem {
  name: string
  quantity: number
  price: number
  modifiers: string[]
  special_instructions: string | null
  total: number
}

interface ReceiptData {
  receipt_number: string
  check_name: string
  check_number: string
  order_type: string
  items: ReceiptItem[]
  subtotal: number
  tax: number
  tip: number | null
  total: number
  final_total: number
  payment_method: string
  date: string
  restaurant_name?: string
  restaurant_address?: string
}

interface ReceiptDisplayProps {
  isOpen: boolean
  onClose: () => void
  receipt: ReceiptData | null
}

export default function ReceiptDisplay({
  isOpen,
  onClose,
  receipt,
}: ReceiptDisplayProps) {
  if (!isOpen || !receipt) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // TODO: Implement PDF download
    alert('PDF download coming soon!')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2 text-green-600">
            <CheckIcon className="w-6 h-6" />
            <h2 className="text-lg font-bold">Payment Complete!</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Receipt Paper Effect */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 font-mono text-sm">
            {/* Restaurant Info */}
            {receipt.restaurant_name && (
              <div className="text-center mb-4 border-b border-dashed border-neutral-300 dark:border-neutral-600 pb-4">
                <div className="font-bold text-lg mb-1">{receipt.restaurant_name}</div>
                {receipt.restaurant_address && (
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    {receipt.restaurant_address}
                  </div>
                )}
              </div>
            )}

            {/* Receipt Header */}
            <div className="text-center mb-4">
              <div className="font-bold text-lg mb-1">RECEIPT</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                {receipt.receipt_number}
              </div>
            </div>

            {/* Check Info */}
            <div className="mb-4 text-xs space-y-1 border-b border-dashed border-neutral-300 dark:border-neutral-600 pb-4">
              <div className="flex justify-between">
                <span>Check:</span>
                <span>{receipt.check_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Name:</span>
                <span>{receipt.check_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="uppercase">{receipt.order_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(receipt.date).toLocaleString()}</span>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4 space-y-2">
              {receipt.items.map((item, idx) => (
                <div key={idx} className="border-b border-dotted border-neutral-200 dark:border-neutral-700 pb-2">
                  <div className="flex justify-between">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 ml-4">
                      + {item.modifiers.join(', ')}
                    </div>
                  )}
                  {item.special_instructions && (
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 ml-4">
                      Note: {item.special_instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${receipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${receipt.tax.toFixed(2)}</span>
              </div>
              {receipt.tip !== null && receipt.tip > 0 && (
                <div className="flex justify-between">
                  <span>Tip:</span>
                  <span>${receipt.tip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-neutral-300 dark:border-neutral-600 pt-2 mt-2">
                <span>TOTAL:</span>
                <span>${receipt.final_total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="text-center text-xs border-t border-dashed border-neutral-300 dark:border-neutral-600 pt-4 mb-4">
              <div className="uppercase">
                PAID: {receipt.payment_method.replace('_', ' ')}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-neutral-600 dark:text-neutral-400">
              <div>Thank you for your business!</div>
              <div className="mt-2">Have a great day!</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
