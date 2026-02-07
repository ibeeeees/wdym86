import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, Wifi, WifiOff, UtensilsCrossed, DollarSign, ChefHat, Sparkles, Package } from 'lucide-react'
import { getDishes, getIngredients, checkApiHealth } from '../services/api'

// Category emoji mapping
const categoryEmojis: Record<string, string> = {
  'Appetizer': '🥗',
  'Main': '🍽️',
  'Side': '🍟',
  'Dessert': '🍰',
  'Beverage': '🥤',
}

// Category gradient mapping
const categoryGradients: Record<string, string> = {
  'Appetizer': 'from-green-400 to-emerald-500',
  'Main': 'from-orange-400 to-red-500',
  'Side': 'from-yellow-400 to-amber-500',
  'Dessert': 'from-pink-400 to-rose-500',
  'Beverage': 'from-blue-400 to-cyan-500',
}

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
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30 animate-pulse">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm text-neutral-500 mt-4 font-medium">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-black dark:text-white">Menu & Recipes</h1>
              {apiConnected !== null && (
                <span className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                  apiConnected
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400'
                }`}>
                  {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{apiConnected ? 'Live' : 'Demo'}</span>
                </span>
              )}
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              Define dishes and ingredient quantities for AI forecasting
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddDish(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dish</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Add Dish Form */}
      {showAddDish && (
        <div className="border border-orange-200 dark:border-orange-900 rounded-2xl p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-black dark:text-white">Create New Dish</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Dish name"
              value={newDish.name}
              onChange={e => setNewDish({ ...newDish, name: e.target.value })}
              className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <select
              value={newDish.category}
              onChange={e => setNewDish({ ...newDish, category: e.target.value })}
              className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
            >
              {categories.map(c => <option key={c} value={c}>{categoryEmojis[c]} {c}</option>)}
            </select>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="number"
                placeholder="Price"
                value={newDish.price}
                onChange={e => setNewDish({ ...newDish, price: e.target.value })}
                className="w-full pl-9 pr-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button onClick={() => setShowAddDish(false)} className="px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium">
              Cancel
            </button>
            <button onClick={handleAddDish} className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/30 hover:scale-105 transition-all">
              Create Dish
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Total Dishes</p>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white">{dishes.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Active</p>
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{dishes.filter(d => d.is_active).length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Avg Ingredients</p>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white font-mono">
            {(dishes.reduce((sum, d) => sum + d.recipe.length, 0) / dishes.length || 0).toFixed(1)}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Avg Price</p>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white font-mono">
            ${(dishes.reduce((sum, d) => sum + d.price, 0) / dishes.length || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Dishes List */}
      <div className="space-y-3">
        {dishes.map(dish => (
          <div key={dish.id} className="border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 hover:shadow-lg transition-all">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              onClick={() => setExpandedDish(expandedDish === dish.id ? null : dish.id)}
            >
              <div className="flex items-center space-x-4">
                {/* Category Emoji Badge */}
                <div className={`w-12 h-12 bg-gradient-to-br ${categoryGradients[dish.category] || 'from-neutral-400 to-neutral-500'} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                  {categoryEmojis[dish.category] || '🍽️'}
                </div>
                <div>
                  <h3 className="font-semibold text-black dark:text-white">{dish.name}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded-full text-xs">{dish.category}</span>
                    <span className="font-mono font-medium text-green-600 dark:text-green-400">${dish.price.toFixed(2)}</span>
                    <span>·</span>
                    <span>{dish.recipe.length} ingredients</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={e => { e.stopPropagation(); handleToggleActive(dish.id) }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                    dish.is_active
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {dish.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteDish(dish.id) }}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className={`p-2 rounded-xl transition-transform ${expandedDish === dish.id ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                </div>
              </div>
            </div>

            {expandedDish === dish.id && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 p-5 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900/50 dark:to-neutral-800">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span>Recipe Ingredients</span>
                  </h4>
                  <select
                    onChange={e => { handleAddIngredient(dish.id, e.target.value); e.target.value = '' }}
                    className="text-sm px-4 py-2 border border-neutral-200 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    defaultValue=""
                  >
                    <option value="" disabled>+ Add ingredient</option>
                    {availableIngredients.filter(i => !dish.recipe.some(r => r.ingredient_id === i.id)).map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>

                {dish.recipe.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-2xl mx-auto flex items-center justify-center mb-3">
                      <Package className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-sm text-neutral-400">No ingredients added yet</p>
                    <p className="text-xs text-neutral-400 mt-1">Add ingredients to track demand</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dish.recipe.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
                        <span className="font-medium text-black dark:text-white">{r.ingredient_name}</span>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            step="0.01"
                            value={r.quantity}
                            onChange={e => handleUpdateQuantity(dish.id, r.id, parseFloat(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg text-center font-mono font-bold bg-neutral-50 dark:bg-neutral-700 text-black dark:text-white"
                          />
                          <span className="text-sm text-neutral-500 dark:text-neutral-400 w-12">{r.unit}</span>
                          <button onClick={() => handleRemoveIngredient(dish.id, r.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Model Info */}
      <div className="border border-violet-200 dark:border-violet-900 rounded-2xl p-6 bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-black dark:text-white mb-2">How This Feeds the AI Model</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Recipe quantities are multiplied by predicted dish sales to forecast ingredient demand.
              For example, if we predict <span className="font-semibold text-violet-600 dark:text-violet-400">50 Salmon Bowls</span> will be sold tomorrow, the model calculates:
              <span className="font-mono text-black dark:text-white mx-1">50 × 0.4 lbs = 20 lbs</span> of Salmon needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
