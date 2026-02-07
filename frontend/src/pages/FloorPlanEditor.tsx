import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getFloorPlans, createFloorPlan, addTable,
  batchUpdateTables, deleteTable, updateTable, checkApiHealth,
} from '../services/api'
import { getCuisineTemplate } from '../data/cuisineTemplates'
import {
  LayoutGrid, Plus, Trash2, Move, Users, Accessibility,
  Save, RefreshCw, ChevronDown, X, Wifi, WifiOff,
  Circle, Square, RectangleHorizontal,
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

const STATUS_BORDER: Record<string, string> = {
  available: 'border-green-400',
  occupied: 'border-red-400',
  reserved: 'border-yellow-400',
  cleaning: 'border-blue-400',
}

const STATUS_ORDER = ['available', 'occupied', 'reserved', 'cleaning']

const CACHE_KEY = 'demo-floor-plan'

function generateDemoTables(serverNames: string[]): FloorTable[] {
  const tables: FloorTable[] = []
  const statuses = ['available', 'occupied', 'reserved', 'cleaning']

  // Dining section - 6 tables in a 3x2 grid
  for (let i = 0; i < 6; i++) {
    const col = i % 3
    const row = Math.floor(i / 3)
    tables.push({
      id: `demo-t${i + 1}`,
      table_number: `D${i + 1}`,
      x: 80 + col * 160,
      y: 80 + row * 160,
      width: 100,
      height: 70,
      shape: i === 2 || i === 5 ? 'circle' : 'rectangle',
      capacity: i === 2 || i === 5 ? 2 : 4,
      section: 'dining',
      status: statuses[i % 4],
      is_accessible: i === 0,
      assigned_server: serverNames[i % serverNames.length] || null,
    })
  }

  // Bar section - 3 tables along the top-right
  for (let i = 0; i < 3; i++) {
    tables.push({
      id: `demo-b${i + 1}`,
      table_number: `B${i + 1}`,
      x: 560 + i * 80,
      y: 60,
      width: 60,
      height: 60,
      shape: 'circle',
      capacity: 2,
      section: 'bar',
      status: statuses[(i + 1) % 4],
      is_accessible: false,
      assigned_server: serverNames[(i + 1) % serverNames.length] || null,
    })
  }

  // Patio section - 3 tables along the bottom
  for (let i = 0; i < 3; i++) {
    tables.push({
      id: `demo-p${i + 1}`,
      table_number: `P${i + 1}`,
      x: 80 + i * 200,
      y: 440,
      width: 120,
      height: 80,
      shape: 'rectangle',
      capacity: 6,
      section: 'patio',
      status: statuses[(i + 2) % 4],
      is_accessible: i === 0,
      assigned_server: serverNames[(i + 2) % serverNames.length] || null,
    })
  }

  // Private dining - 2 larger tables on the right
  for (let i = 0; i < 2; i++) {
    tables.push({
      id: `demo-vip${i + 1}`,
      table_number: `VIP${i + 1}`,
      x: 600,
      y: 200 + i * 160,
      width: 140,
      height: 100,
      shape: 'rectangle',
      capacity: 8,
      section: 'private_dining',
      status: i === 0 ? 'reserved' : 'available',
      is_accessible: false,
      assigned_server: serverNames[0] || null,
    })
  }

  return tables
}

function generateDemoPlan(serverNames: string[]): FloorPlan {
  return {
    id: 'demo-plan-1',
    name: 'Main Floor',
    width: 800,
    height: 600,
    zones: JSON.stringify([
      { name: 'Dining Room', type: 'dining' },
      { name: 'Bar', type: 'bar' },
      { name: 'Patio', type: 'patio' },
      { name: 'Private Dining', type: 'private_dining' },
    ]),
    is_active: true,
    tables: generateDemoTables(serverNames),
  }
}

function loadCachedDemo(): FloorPlan | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function cacheDemo(plan: FloorPlan) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(plan))
  } catch { /* ignore */ }
}

export default function FloorPlanEditor() {
  const { restaurantId, restaurantKey } = useAuth()
  const template = getCuisineTemplate(restaurantKey)
  const serverNames = template.serverNames

  const [plans, setPlans] = useState<FloorPlan[]>([])
  const [activePlan, setActivePlan] = useState<FloorPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiConnected, setApiConnected] = useState(false)
  const [dragTable, setDragTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showAddTable, setShowAddTable] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  const [newTable, setNewTable] = useState({
    table_number: '',
    capacity: 4,
    shape: 'rectangle',
    section: 'dining',
    is_accessible: false,
  })

  useEffect(() => {
    loadData()
  }, [restaurantId])

  const loadData = async () => {
    // Try cached demo first for instant load
    const cached = loadCachedDemo()
    if (cached) {
      setPlans([cached])
      setActivePlan(cached)
      setLoading(false)
    }

    const connected = await checkApiHealth()
    setApiConnected(connected)

    if (connected && restaurantId) {
      try {
        const data = await getFloorPlans(restaurantId)
        if (data.floor_plans?.length > 0) {
          setPlans(data.floor_plans)
          setActivePlan(data.floor_plans[0])
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Failed to load floor plans:', err)
      }
    }

    // Demo mode
    if (!cached) {
      const demoPlan = generateDemoPlan(serverNames)
      cacheDemo(demoPlan)
      setPlans([demoPlan])
      setActivePlan(demoPlan)
    }
    setLoading(false)
  }

  const updateActivePlan = (updatedPlan: FloorPlan) => {
    setActivePlan(updatedPlan)
    setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p))
    if (!apiConnected) cacheDemo(updatedPlan)
  }

  const handleCreatePlan = async (preset?: string) => {
    if (apiConnected) {
      try {
        await createFloorPlan(restaurantId!, {
          name: preset ? `${preset.charAt(0).toUpperCase() + preset.slice(1)} Layout` : 'New Floor Plan',
          preset,
        })
        await loadData()
        setShowPresets(false)
      } catch (err) {
        console.error('Failed to create floor plan:', err)
      }
    } else {
      const demoPlan = generateDemoPlan(serverNames)
      demoPlan.id = `demo-plan-${Date.now()}`
      demoPlan.name = preset ? `${preset.charAt(0).toUpperCase() + preset.slice(1)} Layout` : 'New Floor Plan'
      setPlans(prev => [...prev, demoPlan])
      setActivePlan(demoPlan)
      cacheDemo(demoPlan)
      setShowPresets(false)
    }
  }

  const handleAddTable = async () => {
    if (!activePlan || !newTable.table_number) return

    if (apiConnected) {
      try {
        await addTable(activePlan.id, {
          table_number: newTable.table_number,
          x: 50,
          y: 50,
          shape: newTable.shape,
          capacity: newTable.capacity,
          section: newTable.section,
        })
        await loadData()
      } catch (err) {
        console.error('Failed to add table:', err)
      }
    } else {
      const demoTable: FloorTable = {
        id: `demo-new-${Date.now()}`,
        table_number: newTable.table_number,
        x: 350,
        y: 250,
        width: newTable.shape === 'circle' ? 70 : newTable.shape === 'square' ? 80 : 100,
        height: newTable.shape === 'circle' ? 70 : 70,
        shape: newTable.shape,
        capacity: newTable.capacity,
        section: newTable.section,
        status: 'available',
        is_accessible: newTable.is_accessible,
        assigned_server: null,
      }
      const updated = { ...activePlan, tables: [...activePlan.tables, demoTable] }
      updateActivePlan(updated)
    }

    setShowAddTable(false)
    setNewTable({ table_number: '', capacity: 4, shape: 'rectangle', section: 'dining', is_accessible: false })
  }

  const handleDeleteTable = async (tableId: string) => {
    if (apiConnected) {
      try {
        await deleteTable(tableId)
        await loadData()
      } catch (err) {
        console.error('Failed to delete table:', err)
      }
    } else if (activePlan) {
      const updated = { ...activePlan, tables: activePlan.tables.filter(t => t.id !== tableId) }
      updateActivePlan(updated)
    }
    if (selectedTable?.id === tableId) setSelectedTable(null)
  }

  const handleTableUpdate = (tableId: string, updates: Partial<FloorTable>) => {
    if (!activePlan) return
    const updatedTables = activePlan.tables.map(t =>
      t.id === tableId ? { ...t, ...updates } : t
    )
    const updatedPlan = { ...activePlan, tables: updatedTables }
    updateActivePlan(updatedPlan)

    // Also update selected table if it's the one being edited
    if (selectedTable?.id === tableId) {
      setSelectedTable({ ...selectedTable, ...updates })
    }

    if (apiConnected) {
      updateTable(tableId, updates).catch(err =>
        console.error('Failed to update table:', err)
      )
    }
  }

  const cycleStatus = (tableId: string) => {
    const table = activePlan?.tables.find(t => t.id === tableId)
    if (!table) return
    const idx = STATUS_ORDER.indexOf(table.status)
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
    handleTableUpdate(tableId, { status: next })
  }

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!canvasRef.current) return
    const table = activePlan?.tables.find(t => t.id === tableId)
    if (!table) return

    mouseDownPos.current = { x: e.clientX, y: e.clientY }
    isDragging.current = false

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

    // Check if we've moved enough to count as drag
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x)
      const dy = Math.abs(e.clientY - mouseDownPos.current.y)
      if (dx > 5 || dy > 5) {
        isDragging.current = true
      } else {
        return
      }
    }

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

  const handleMouseUp = (_e: React.MouseEvent, tableId?: string) => {
    if (tableId && !isDragging.current) {
      // This was a click, not a drag — open edit panel
      const table = activePlan?.tables.find(t => t.id === tableId)
      if (table) setSelectedTable({ ...table })
    }
    setDragTable(null)
    mouseDownPos.current = null
    isDragging.current = false
  }

  const handleContextMenu = (e: React.MouseEvent, tableId: string) => {
    e.preventDefault()
    cycleStatus(tableId)
  }

  const savePendingUpdates = async () => {
    if (!activePlan || pendingUpdates.size === 0) return
    if (apiConnected) {
      try {
        const updates = Array.from(pendingUpdates.entries()).map(([id, pos]) => ({
          table_id: id,
          x: Math.round(pos.x),
          y: Math.round(pos.y),
        }))
        await batchUpdateTables(activePlan.id, updates)
      } catch (err) {
        console.error('Failed to save positions:', err)
      }
    } else {
      cacheDemo(activePlan)
    }
    setPendingUpdates(new Map())
  }

  // Section stats
  const sectionStats = activePlan ? (() => {
    const stats: Record<string, { total: number; occupied: number; capacity: number }> = {}
    for (const t of activePlan.tables) {
      if (!stats[t.section]) stats[t.section] = { total: 0, occupied: 0, capacity: 0 }
      stats[t.section].total++
      stats[t.section].capacity += t.capacity
      if (t.status === 'occupied') stats[t.section].occupied++
    }
    return stats
  })() : {}

  // Auto-suggest next table number
  const suggestTableNumber = () => {
    if (!activePlan) return 'T1'
    const existing = activePlan.tables.map(t => t.table_number)
    for (let i = 1; i <= 99; i++) {
      const num = `T${i}`
      if (!existing.includes(num)) return num
    }
    return `T${activePlan.tables.length + 1}`
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
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            Drag tables to arrange. Click to edit. Right-click to change status.
            {apiConnected ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                <Wifi className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                <WifiOff className="w-3 h-3" /> Demo
              </span>
            )}
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
            onClick={() => {
              setNewTable(prev => ({ ...prev, table_number: suggestTableNumber() }))
              setShowAddTable(true)
            }}
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
      {plans.length > 1 && (
        <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => {
                setActivePlan(plan)
                setPendingUpdates(new Map())
                setSelectedTable(null)
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

      {/* Canvas + Edit Panel */}
      {activePlan ? (
        <div className="flex gap-4">
          {/* Canvas */}
          <div className={`flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 transition-all ${selectedTable ? 'w-2/3' : 'w-full'}`}>
            <div
              ref={canvasRef}
              className="relative bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600"
              style={{
                aspectRatio: `${activePlan.width} / ${activePlan.height}`,
                backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={() => { setDragTable(null); mouseDownPos.current = null; isDragging.current = false }}
              onMouseLeave={() => { setDragTable(null); mouseDownPos.current = null; isDragging.current = false }}
            >
              {/* Zone labels */}
              {(() => {
                try {
                  const zones = JSON.parse(activePlan.zones || '[]')
                  return zones.map((zone: { name: string; type: string }, i: number) => (
                    <div
                      key={i}
                      className="absolute text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
                      style={{ left: `${(i * 100 / Math.max(zones.length, 1)) + 2}%`, top: 8 }}
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
                const isSelected = selectedTable?.id === table.id

                return (
                  <div
                    key={table.id}
                    className={`absolute cursor-move border-2 flex flex-col items-center justify-center text-xs font-bold transition-all
                      ${dragTable === table.id ? 'shadow-xl ring-2 ring-blue-400 z-20' : isSelected ? 'shadow-xl ring-2 ring-blue-500 z-20' : 'shadow-md hover:shadow-lg z-10'}
                      ${table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'}
                      ${STATUS_BORDER[table.status] || 'border-gray-300'}
                      ${ZONE_COLORS[table.section] || 'bg-white dark:bg-gray-700 border-gray-300'}`}
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      width: `${wPct}%`,
                      height: `${hPct}%`,
                      minWidth: 44,
                      minHeight: 44,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, table.id)}
                    onMouseUp={(e) => handleMouseUp(e, table.id)}
                    onContextMenu={(e) => handleContextMenu(e, table.id)}
                  >
                    <span className="text-gray-800 dark:text-gray-100 text-sm">{table.table_number}</span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                      <Users className="w-3 h-3" /> {table.capacity}
                    </span>
                    {table.assigned_server && (
                      <span className="text-[9px] text-gray-400 truncate max-w-full px-1">
                        {table.assigned_server.split(' ')[0]}
                      </span>
                    )}
                    <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${STATUS_COLORS[table.status] || 'bg-gray-400'}`} />
                    {table.is_accessible && (
                      <Accessibility className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-blue-600" />
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

            {/* Section Stats */}
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(sectionStats).map(([section, stats]) => (
                <div key={section} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${ZONE_COLORS[section] || 'bg-gray-100'}`}>
                  <span className="capitalize">{section.replace('_', ' ')}</span>
                  <span className="text-gray-500">
                    {stats.occupied}/{stats.total} occupied
                  </span>
                  <span className="text-gray-400">
                    ({stats.capacity} seats)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Side Panel */}
          {selectedTable && (
            <div className="w-80 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5 space-y-4 h-fit sticky top-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Table {selectedTable.table_number}
                </h3>
                <button onClick={() => setSelectedTable(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Status</label>
                <div className="flex gap-2">
                  {STATUS_ORDER.map(s => (
                    <button
                      key={s}
                      onClick={() => handleTableUpdate(selectedTable.id, { status: s })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                        selectedTable.status === s
                          ? `${STATUS_COLORS[s]} text-white`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:opacity-80'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Server Assignment */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Assigned Server</label>
                <select
                  value={selectedTable.assigned_server || ''}
                  onChange={(e) => handleTableUpdate(selectedTable.id, { assigned_server: e.target.value || null })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                >
                  <option value="">Unassigned</option>
                  {serverNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Table Number */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Table Number</label>
                <input
                  type="text"
                  value={selectedTable.table_number}
                  onChange={(e) => handleTableUpdate(selectedTable.id, { table_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Capacity</label>
                <input
                  type="number"
                  value={selectedTable.capacity}
                  onChange={(e) => handleTableUpdate(selectedTable.id, { capacity: parseInt(e.target.value) || 2 })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  min={1}
                  max={20}
                />
              </div>

              {/* Shape */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Shape</label>
                <div className="flex gap-2">
                  {[
                    { value: 'rectangle', icon: RectangleHorizontal, label: 'Rect' },
                    { value: 'circle', icon: Circle, label: 'Circle' },
                    { value: 'square', icon: Square, label: 'Square' },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => {
                        const dims = value === 'circle' ? { width: 70, height: 70 }
                          : value === 'square' ? { width: 80, height: 80 }
                          : { width: 100, height: 70 }
                        handleTableUpdate(selectedTable.id, { shape: value, ...dims })
                      }}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition ${
                        selectedTable.shape === value
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Width</label>
                  <input
                    type="number"
                    value={selectedTable.width}
                    onChange={(e) => handleTableUpdate(selectedTable.id, { width: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                    min={40}
                    max={300}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Height</label>
                  <input
                    type="number"
                    value={selectedTable.height}
                    onChange={(e) => handleTableUpdate(selectedTable.id, { height: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                    min={40}
                    max={300}
                  />
                </div>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Section</label>
                <select
                  value={selectedTable.section}
                  onChange={(e) => handleTableUpdate(selectedTable.id, { section: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                >
                  <option value="dining">Dining</option>
                  <option value="bar">Bar</option>
                  <option value="patio">Patio</option>
                  <option value="private_dining">Private Dining</option>
                </select>
              </div>

              {/* Accessible */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTable.is_accessible}
                  onChange={(e) => handleTableUpdate(selectedTable.id, { is_accessible: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">ADA Accessible</span>
              </label>

              {/* Delete */}
              <button
                onClick={() => handleDeleteTable(selectedTable.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete Table
              </button>
            </div>
          )}
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
