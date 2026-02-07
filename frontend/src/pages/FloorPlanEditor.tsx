import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getFloorPlans, createFloorPlan, addTable,
  batchUpdateTables, deleteTable,
} from '../services/api'
import {
  LayoutGrid, Plus, Trash2, Move,
  Users, Accessibility, Save, RefreshCw, ChevronDown
} from 'lucide-react'

interface FloorTable {
  id: string
  table_number: string
  x: number
  y: number
  width: number
  height: number
  shape: string
  capacity: number
  section: string
  status: string
  is_accessible: boolean
  assigned_server: string | null
}

interface FloorPlan {
  id: string
  name: string
  width: number
  height: number
  zones: string
  is_active: boolean
  tables: FloorTable[]
}

const ZONE_COLORS: Record<string, string> = {
  dining: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300',
  bar: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300',
  patio: 'bg-green-100 dark:bg-green-900/30 border-green-300',
  kitchen: 'bg-red-100 dark:bg-red-900/30 border-red-300',
  storage: 'bg-gray-100 dark:bg-gray-900/30 border-gray-300',
  bathrooms: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300',
  waiting: 'bg-teal-100 dark:bg-teal-900/30 border-teal-300',
  private_dining: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300',
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  reserved: 'bg-yellow-500',
  cleaning: 'bg-blue-500',
}

export default function FloorPlanEditor() {
  const { restaurantId } = useAuth()
  const [plans, setPlans] = useState<FloorPlan[]>([])
  const [activePlan, setActivePlan] = useState<FloorPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [dragTable, setDragTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showAddTable, setShowAddTable] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, { x: number; y: number }>>(new Map())
  const canvasRef = useRef<HTMLDivElement>(null)

  const [newTable, setNewTable] = useState({
    table_number: '',
    capacity: 4,
    shape: 'rectangle',
    section: 'dining',
    is_accessible: false,
  })

  useEffect(() => {
    if (restaurantId) loadPlans()
  }, [restaurantId])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const data = await getFloorPlans(restaurantId!)
      setPlans(data.floor_plans || [])
      if (data.floor_plans?.length > 0) {
        setActivePlan(data.floor_plans[0])
      }
    } catch (err) {
      console.error('Failed to load floor plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async (preset?: string) => {
    try {
      await createFloorPlan(restaurantId!, {
        name: preset ? `${preset.charAt(0).toUpperCase() + preset.slice(1)} Layout` : 'New Floor Plan',
        preset,
      })
      await loadPlans()
      setShowPresets(false)
    } catch (err) {
      console.error('Failed to create floor plan:', err)
    }
  }

  const handleAddTable = async () => {
    if (!activePlan || !newTable.table_number) return
    try {
      await addTable(activePlan.id, {
        table_number: newTable.table_number,
        x: 50,
        y: 50,
        shape: newTable.shape,
        capacity: newTable.capacity,
        section: newTable.section,
      })
      await loadPlans()
      setShowAddTable(false)
      setNewTable({ table_number: '', capacity: 4, shape: 'rectangle', section: 'dining', is_accessible: false })
    } catch (err) {
      console.error('Failed to add table:', err)
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    try {
      await deleteTable(tableId)
      await loadPlans()
    } catch (err) {
      console.error('Failed to delete table:', err)
    }
  }

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!canvasRef.current) return
    const table = activePlan?.tables.find(t => t.id === tableId)
    if (!table) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = (activePlan?.width || 800) / rect.width
    const scaleY = (activePlan?.height || 600) / rect.height

    setDragOffset({
      x: (e.clientX - rect.left) * scaleX - table.x,
      y: (e.clientY - rect.top) * scaleY - table.y,
    })
    setDragTable(tableId)
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragTable || !canvasRef.current || !activePlan) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = (activePlan.width || 800) / rect.width
    const scaleY = (activePlan.height || 600) / rect.height

    const newX = Math.max(0, Math.min(activePlan.width - 60, (e.clientX - rect.left) * scaleX - dragOffset.x))
    const newY = Math.max(0, Math.min(activePlan.height - 60, (e.clientY - rect.top) * scaleY - dragOffset.y))

    setActivePlan(prev => {
      if (!prev) return prev
      return {
        ...prev,
        tables: prev.tables.map(t =>
          t.id === dragTable ? { ...t, x: newX, y: newY } : t
        ),
      }
    })

    setPendingUpdates(prev => new Map(prev).set(dragTable, { x: newX, y: newY }))
  }, [dragTable, dragOffset, activePlan])

  const handleMouseUp = () => {
    setDragTable(null)
  }

  const savePendingUpdates = async () => {
    if (!activePlan || pendingUpdates.size === 0) return
    try {
      const updates = Array.from(pendingUpdates.entries()).map(([id, pos]) => ({
        table_id: id,
        x: Math.round(pos.x),
        y: Math.round(pos.y),
      }))
      await batchUpdateTables(activePlan.id, updates)
      setPendingUpdates(new Map())
    } catch (err) {
      console.error('Failed to save positions:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-7 h-7 text-blue-500" />
            Floor Plan Editor
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Drag-and-drop table layout designer
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingUpdates.size > 0 && (
            <button
              onClick={savePendingUpdates}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              Save ({pendingUpdates.size})
            </button>
          )}
          <button
            onClick={() => setShowAddTable(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={!activePlan}
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
          <div className="relative">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              New Layout <ChevronDown className="w-4 h-4" />
            </button>
            {showPresets && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-3 z-10 w-48">
                {['small', 'medium', 'large'].map(size => (
                  <button
                    key={size}
                    onClick={() => handleCreatePlan(size)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm capitalize"
                  >
                    {size} Restaurant
                  </button>
                ))}
                <button
                  onClick={() => handleCreatePlan()}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  Custom (Blank)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Tabs */}
      {plans.length > 0 && (
        <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => {
                setActivePlan(plan)
                setPendingUpdates(new Map())
              }}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                activePlan?.id === plan.id
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {plan.name}
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      {activePlan ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
          <div
            ref={canvasRef}
            className="relative bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600"
            style={{ aspectRatio: `${activePlan.width} / ${activePlan.height}` }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Zone labels */}
            {(() => {
              try {
                const zones = JSON.parse(activePlan.zones || '[]')
                return zones.map((zone: { name: string; type: string }, i: number) => (
                  <div
                    key={i}
                    className="absolute top-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                    style={{ left: `${(i * 100 / Math.max(zones.length, 1))}%`, paddingLeft: 8 }}
                  >
                    {zone.name}
                  </div>
                ))
              } catch { return null }
            })()}

            {/* Tables */}
            {activePlan.tables.map(table => {
              const xPct = (table.x / activePlan.width) * 100
              const yPct = (table.y / activePlan.height) * 100
              const wPct = (table.width / activePlan.width) * 100
              const hPct = (table.height / activePlan.height) * 100

              return (
                <div
                  key={table.id}
                  className={`absolute cursor-move border-2 flex flex-col items-center justify-center text-xs font-bold transition-shadow
                    ${dragTable === table.id ? 'shadow-xl ring-2 ring-blue-400 z-20' : 'shadow-md hover:shadow-lg z-10'}
                    ${table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'}
                    ${ZONE_COLORS[table.section] || 'bg-white dark:bg-gray-700 border-gray-300'}`}
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    width: `${wPct}%`,
                    height: `${hPct}%`,
                    minWidth: 40,
                    minHeight: 40,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, table.id)}
                >
                  <span className="text-gray-800 dark:text-gray-100">{table.table_number}</span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    <Users className="w-3 h-3" /> {table.capacity}
                  </span>
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${STATUS_COLORS[table.status] || 'bg-gray-400'}`} />
                  {table.is_accessible && (
                    <Accessibility className="absolute -bottom-1 -right-1 w-3 h-3 text-blue-600" />
                  )}
                </div>
              )
            })}

            {/* Empty state */}
            {activePlan.tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Move className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Add tables to get started</p>
                </div>
              </div>
            )}
          </div>

          {/* Table List */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {activePlan.tables.map(table => (
              <div key={table.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                <div>
                  <span className="font-medium">{table.table_number}</span>
                  <span className="text-gray-500 ml-1">({table.capacity})</span>
                </div>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-12 text-center">
          <LayoutGrid className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Floor Plans Yet</h3>
          <p className="text-gray-500 mb-4">Create a floor plan to start designing your restaurant layout.</p>
          <button
            onClick={() => handleCreatePlan('medium')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Default Layout
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="capitalize text-gray-600 dark:text-gray-400">{status}</span>
            </div>
          ))}
          <div className="border-l dark:border-gray-600 pl-4 flex items-center gap-1.5">
            <Accessibility className="w-3 h-3 text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">ADA Accessible</span>
          </div>
        </div>
      </div>

      {/* Add Table Modal */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Add Table</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Table Number</label>
                <input
                  type="text"
                  value={newTable.table_number}
                  onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., T1, B3, P2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || 2 })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    min={1}
                    max={20}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Shape</label>
                  <select
                    value={newTable.shape}
                    onChange={(e) => setNewTable({ ...newTable, shape: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Section</label>
                <select
                  value={newTable.section}
                  onChange={(e) => setNewTable({ ...newTable, section: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="dining">Dining</option>
                  <option value="bar">Bar</option>
                  <option value="patio">Patio</option>
                  <option value="private_dining">Private Dining</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTable.is_accessible}
                  onChange={(e) => setNewTable({ ...newTable, is_accessible: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">ADA Accessible</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddTable(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTable}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!newTable.table_number}
              >
                Add Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
