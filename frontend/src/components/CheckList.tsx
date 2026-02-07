/**
 * CheckList Component
 * 
 * Displays list of checks for a specific order type.
 * Used in POS page to show active checks before displaying menu.
 * Implements 26.md check-first workflow.
 */

import { useEffect, useState } from 'react'
import { Check, getCheckList } from '../services/checks'
import { Receipt, Clock, Users, ChevronRight, Plus } from 'lucide-react'

interface CheckListProps {
  restaurantId: string
  orderType: 'dine_in' | 'takeout' | 'delivery'
  onCheckClick: (check: Check) => void
  onNewCheck: () => void
}

export default function CheckList({
  restaurantId,
  orderType,
  onCheckClick,
  onNewCheck,
}: CheckListProps) {
  const [checks, setChecks] = useState<Check[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load checks when component mounts or order type changes
  useEffect(() => {
    loadChecks()
  }, [restaurantId, orderType])

  const loadChecks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCheckList(restaurantId, orderType, 'active')
      setChecks(data)
    } catch (err) {
      console.error('Failed to load checks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load checks')
    } finally {
      setLoading(false)
    }
  }

  // Get icon based on order type
  const getOrderTypeIcon = () => {
    switch (orderType) {
      case 'dine_in':
        return <Users className="w-5 h-5" />
      case 'takeout':
        return <Receipt className="w-5 h-5" />
      case 'delivery':
        return <Clock className="w-5 h-5" />
    }
  }

  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      paid: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      finalized: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
    return badges[status as keyof typeof badges] || badges.active
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-sm">
          {error}
        </p>
        <p className="mt-2 text-xs text-red-700/80 dark:text-red-200/80">
          If this keeps happening, the backend may be down. Start it on port <span className="font-mono">8001</span> and refresh.
        </p>
        <button
          onClick={loadChecks}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with New Check Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getOrderTypeIcon()}
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Active Checks ({checks.length})
          </h2>
        </div>
        <button
          onClick={onNewCheck}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Check
        </button>
      </div>

      {/* Check List */}
      {checks.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600">
          <Receipt className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">
            No active checks
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
            Create a new check to get started
          </p>
          <button
            onClick={onNewCheck}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create First Check
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checks.map((check) => (
            <button
              key={check.check_id}
              onClick={() => onCheckClick(check)}
              className="group relative p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg transition-all text-left"
            >
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(
                    check.status
                  )}`}
                >
                  {check.status}
                </span>
              </div>

              {/* Check Number & Name */}
              <div className="mb-3">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {check.check_number}
                </div>
                <div className="text-lg font-semibold text-neutral-900 dark:text-white pr-20">
                  {check.check_name}
                </div>
              </div>

              {/* Check Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Items:
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {check.item_count}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Total:
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    ${check.total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimeAgo(check.created_at)}</span>
                </div>
              </div>

              {/* Arrow Icon */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-red-600" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadChecks}
          className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Refresh checks
        </button>
      </div>
    </div>
  )
}
