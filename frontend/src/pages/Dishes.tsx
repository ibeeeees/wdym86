import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { getDishes, getIngredients, checkApiHealth } from '../services/api'

interface RecipeIngredient {
  id: string
  ingredient_id: string
  ingredient_name: string
  quantity: number
  unit: string
}

interface Dish {
  id: string
  name: string
  category: string
  price: number
  is_active: boolean
  recipe: RecipeIngredient[]
}

interface AvailableIngredient {
  id: string
  name: string
  unit: string
}

const demoIngredients: AvailableIngredient[] = [
  { id: '1', name: 'Chicken Breast', unit: 'lbs' },
  { id: '2', name: 'Ground Beef', unit: 'lbs' },
  { id: '3', name: 'Romaine Lettuce', unit: 'oz' },
  { id: '4', name: 'Tomatoes', unit: 'oz' },
  { id: '5', name: 'Salmon Fillet', unit: 'lbs' },
  { id: '6', name: 'Cheese Blend', unit: 'oz' },
  { id: '7', name: 'Avocados', unit: 'units' },
  { id: '8', name: 'Flour', unit: 'oz' },
  { id: '9', name: 'Rice', unit: 'oz' },
  { id: '10', name: 'Olive Oil', unit: 'tbsp' },
]

const demoDishes: Dish[] = [
  {
    id: '1',
    name: 'Grilled Chicken Salad',
    category: 'Main',
    price: 14.99,
    is_active: true,
    recipe: [
      { id: '1', ingredient_id: '1', ingredient_name: 'Chicken Breast', quantity: 0.5, unit: 'lbs' },
      { id: '2', ingredient_id: '3', ingredient_name: 'Romaine Lettuce', quantity: 4, unit: 'oz' },
      { id: '3', ingredient_id: '4', ingredient_name: 'Tomatoes', quantity: 2, unit: 'oz' },
      { id: '4', ingredient_id: '6', ingredient_name: 'Cheese Blend', quantity: 1, unit: 'oz' },
    ]
  },
  {
    id: '2',
    name: 'Beef Tacos',
    category: 'Main',
    price: 12.99,
    is_active: true,
    recipe: [
      { id: '5', ingredient_id: '2', ingredient_name: 'Ground Beef', quantity: 0.33, unit: 'lbs' },
      { id: '6', ingredient_id: '6', ingredient_name: 'Cheese Blend', quantity: 2, unit: 'oz' },
      { id: '7', ingredient_id: '4', ingredient_name: 'Tomatoes', quantity: 1.5, unit: 'oz' },
    ]
  },
  {
    id: '3',
    name: 'Salmon Bowl',
    category: 'Main',
    price: 18.99,
    is_active: true,
    recipe: [
      { id: '8', ingredient_id: '5', ingredient_name: 'Salmon Fillet', quantity: 0.4, unit: 'lbs' },
      { id: '9', ingredient_id: '9', ingredient_name: 'Rice', quantity: 6, unit: 'oz' },
      { id: '10', ingredient_id: '7', ingredient_name: 'Avocados', quantity: 0.5, unit: 'units' },
    ]
  },
  {
    id: '4',
    name: 'Guacamole & Chips',
    category: 'Appetizer',
    price: 8.99,
    is_active: true,
    recipe: [
      { id: '11', ingredient_id: '7', ingredient_name: 'Avocados', quantity: 1.5, unit: 'units' },
      { id: '12', ingredient_id: '4', ingredient_name: 'Tomatoes', quantity: 1, unit: 'oz' },
    ]
  },
]

const categories = ['Appetizer', 'Main', 'Side', 'Dessert', 'Beverage']

export default function Dishes() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [availableIngredients, setAvailableIngredients] = useState<AvailableIngredient[]>(demoIngredients)
  const [loading, setLoading] = useState(true)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [expandedDish, setExpandedDish] = useState<string | null>(null)
  const [showAddDish, setShowAddDish] = useState(false)
  const [newDish, setNewDish] = useState({ name: '', category: 'Main', price: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setError(null)
      try {
        const connected = await checkApiHealth()
        setApiConnected(connected)

        if (connected) {
          const restaurantId = localStorage.getItem('restaurantId') || 'demo-restaurant'

          // Fetch dishes
          try {
            const dishesData = await getDishes(restaurantId)
            if (dishesData && dishesData.length > 0) {
              setDishes(dishesData.map((d: any) => ({
                ...d,
                is_active: d.is_active ?? true,
                recipe: d.recipe || []
              })))
            } else {
              setDishes(demoDishes)
            }
          } catch {
            setDishes(demoDishes)
          }

          // Fetch ingredients for recipe editing
          try {
            const ingredientsData = await getIngredients(restaurantId)
            if (ingredientsData && ingredientsData.length > 0) {
              setAvailableIngredients(ingredientsData.map((i: any) => ({
                id: i.id,
                name: i.name,
                unit: i.unit
              })))
            }
          } catch {
            // Keep demo ingredients
          }
        } else {
          setDishes(demoDishes)
        }
      } catch (err) {
        setDishes(demoDishes)
        setApiConnected(false)
        setError('Could not connect to server. Using demo data.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleAddDish = () => {
    if (!newDish.name || !newDish.price) return
    const dish: Dish = {
      id: Date.now().toString(),
      name: newDish.name,
      category: newDish.category,
      price: parseFloat(newDish.price),
      is_active: true,
      recipe: []
    }
    setDishes([...dishes, dish])
    setNewDish({ name: '', category: 'Main', price: '' })
    setShowAddDish(false)
    setExpandedDish(dish.id)
  }

  const handleDeleteDish = (id: string) => {
    setDishes(dishes.filter(d => d.id !== id))
  }

  const handleToggleActive = (id: string) => {
    setDishes(dishes.map(d => d.id === id ? { ...d, is_active: !d.is_active } : d))
  }

  const handleAddIngredient = (dishId: string, ingredientId: string) => {
    const ingredient = availableIngredients.find(i => i.id === ingredientId)
    if (!ingredient) return

    setDishes(dishes.map(d => {
      if (d.id !== dishId) return d
      if (d.recipe.some(r => r.ingredient_id === ingredientId)) return d
      return {
        ...d,
        recipe: [...d.recipe, {
          id: Date.now().toString(),
          ingredient_id: ingredientId,
          ingredient_name: ingredient.name,
          quantity: 1,
          unit: ingredient.unit
        }]
      }
    }))
  }

  const handleUpdateQuantity = (dishId: string, recipeId: string, quantity: number) => {
    setDishes(dishes.map(d => {
      if (d.id !== dishId) return d
      return {
        ...d,
        recipe: d.recipe.map(r => r.id === recipeId ? { ...r, quantity } : r)
      }
    }))
  }

  const handleRemoveIngredient = (dishId: string, recipeId: string) => {
    setDishes(dishes.map(d => {
      if (d.id !== dishId) return d
      return { ...d, recipe: d.recipe.filter(r => r.id !== recipeId) }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
          <p className="text-sm text-neutral-500 mt-2">Loading dishes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-black dark:text-white">Menu & Recipes</h1>
            {apiConnected !== null && (
              <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                apiConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{apiConnected ? 'Live' : 'Demo'}</span>
              </span>
            )}
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Define dishes and ingredient quantities for demand forecasting
          </p>
        </div>
        <button
          onClick={() => setShowAddDish(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dish</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Add Dish Form */}
      {showAddDish && (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-800">
          <h3 className="font-medium text-black dark:text-white mb-4">New Dish</h3>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Dish name"
              value={newDish.name}
              onChange={e => setNewDish({ ...newDish, name: e.target.value })}
              className="px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 text-black dark:text-white"
            />
            <select
              value={newDish.category}
              onChange={e => setNewDish({ ...newDish, category: e.target.value })}
              className="px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 text-black dark:text-white"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="number"
              placeholder="Price"
              value={newDish.price}
              onChange={e => setNewDish({ ...newDish, price: e.target.value })}
              className="px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 text-black dark:text-white"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button onClick={() => setShowAddDish(false)} className="px-4 py-2 text-sm text-neutral-500">
              Cancel
            </button>
            <button onClick={handleAddDish} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium">
              Add Dish
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Dishes</p>
          <p className="text-2xl font-semibold text-black dark:text-white">{dishes.length}</p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Active</p>
          <p className="text-2xl font-semibold text-green-600">{dishes.filter(d => d.is_active).length}</p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Avg Ingredients</p>
          <p className="text-2xl font-semibold text-black dark:text-white font-mono">
            {(dishes.reduce((sum, d) => sum + d.recipe.length, 0) / dishes.length || 0).toFixed(1)}
          </p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Avg Price</p>
          <p className="text-2xl font-semibold text-black dark:text-white font-mono">
            ${(dishes.reduce((sum, d) => sum + d.price, 0) / dishes.length || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Dishes List */}
      <div className="space-y-3">
        {dishes.map(dish => (
          <div key={dish.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              onClick={() => setExpandedDish(expandedDish === dish.id ? null : dish.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${dish.is_active ? 'bg-green-500' : 'bg-neutral-300'}`} />
                <div>
                  <h3 className="font-medium text-black dark:text-white">{dish.name}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {dish.category} · ${dish.price.toFixed(2)} · {dish.recipe.length} ingredients
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={e => { e.stopPropagation(); handleToggleActive(dish.id) }}
                  className={`px-3 py-1 text-xs rounded-full ${
                    dish.is_active
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
                  }`}
                >
                  {dish.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteDish(dish.id) }}
                  className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedDish === dish.id ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
              </div>
            </div>

            {expandedDish === dish.id && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-900/50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Recipe Ingredients</h4>
                  <select
                    onChange={e => { handleAddIngredient(dish.id, e.target.value); e.target.value = '' }}
                    className="text-sm px-3 py-1.5 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white"
                    defaultValue=""
                  >
                    <option value="" disabled>+ Add ingredient</option>
                    {availableIngredients.filter(i => !dish.recipe.some(r => r.ingredient_id === i.id)).map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>

                {dish.recipe.length === 0 ? (
                  <p className="text-sm text-neutral-400 py-4 text-center">No ingredients added yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-neutral-500 dark:text-neutral-400">
                        <th className="pb-2 font-medium">Ingredient</th>
                        <th className="pb-2 font-medium">Qty per Dish</th>
                        <th className="pb-2 font-medium">Unit</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {dish.recipe.map(r => (
                        <tr key={r.id}>
                          <td className="py-2 text-black dark:text-white">{r.ingredient_name}</td>
                          <td className="py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={r.quantity}
                              onChange={e => handleUpdateQuantity(dish.id, r.id, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-neutral-200 dark:border-neutral-600 rounded text-center font-mono bg-white dark:bg-neutral-700 text-black dark:text-white"
                            />
                          </td>
                          <td className="py-2 text-neutral-500 dark:text-neutral-400">{r.unit}</td>
                          <td className="py-2 text-right">
                            <button onClick={() => handleRemoveIngredient(dish.id, r.id)} className="text-neutral-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Model Info */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-neutral-50 dark:bg-neutral-800">
        <h2 className="text-sm font-medium text-black dark:text-white mb-2">How This Feeds the Model</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Recipe quantities are multiplied by predicted dish sales to forecast ingredient demand.
          For example, if we predict 50 Salmon Bowls will be sold tomorrow, the model calculates:
          50 × 0.4 lbs = 20 lbs of Salmon needed.
        </p>
      </div>
    </div>
  )
}
