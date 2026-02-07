import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, Wifi, WifiOff, UtensilsCrossed, DollarSign, ChefHat, Sparkles, Package } from 'lucide-react'
import { getDishes, getIngredients, checkApiHealth } from '../services/api'

// Category emoji mapping - Mediterranean themed
const categoryEmojis: Record<string, string> = {
  'Appetizer': '🫒',
  'Salad': '🥗',
  'Soup': '🍲',
  'Entree - Seafood': '🐟',
  'Entree - Meat': '🥩',
  'Entree - Vegetarian': '🥬',
  'Main': '🍽️',
  'Seafood': '🦐',
  'Vegetarian': '🥙',
  'Dessert': '🍯',
  'Cocktail': '🍸',
  'Beverage': '☕',
}

// Category gradient mapping
const categoryGradients: Record<string, string> = {
  'Appetizer': 'from-green-400 to-emerald-500',
  'Salad': 'from-lime-400 to-green-500',
  'Soup': 'from-amber-400 to-yellow-500',
  'Entree - Seafood': 'from-cyan-400 to-blue-500',
  'Entree - Meat': 'from-red-400 to-rose-500',
  'Entree - Vegetarian': 'from-green-400 to-teal-500',
  'Main': 'from-orange-400 to-red-500',
  'Seafood': 'from-blue-400 to-cyan-500',
  'Vegetarian': 'from-emerald-400 to-green-500',
  'Dessert': 'from-pink-400 to-rose-500',
  'Cocktail': 'from-purple-400 to-pink-500',
  'Beverage': 'from-amber-400 to-orange-500',
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

// Mykonos Mediterranean Restaurant ingredients
const demoIngredients: AvailableIngredient[] = [
  { id: '1', name: 'Lamb Shoulder', unit: 'lbs' },
  { id: '2', name: 'Lamb Chops', unit: 'lbs' },
  { id: '3', name: 'Ground Lamb', unit: 'lbs' },
  { id: '4', name: 'Chicken Thighs', unit: 'lbs' },
  { id: '5', name: 'Branzino', unit: 'lbs' },
  { id: '6', name: 'Shrimp (Jumbo)', unit: 'lbs' },
  { id: '7', name: 'Octopus', unit: 'lbs' },
  { id: '8', name: 'Feta Cheese', unit: 'lbs' },
  { id: '9', name: 'Greek Yogurt', unit: 'lbs' },
  { id: '10', name: 'Halloumi', unit: 'lbs' },
  { id: '11', name: 'Tomatoes (Roma)', unit: 'lbs' },
  { id: '12', name: 'Cucumbers', unit: 'lbs' },
  { id: '13', name: 'Eggplant', unit: 'lbs' },
  { id: '14', name: 'Fresh Spinach', unit: 'lbs' },
  { id: '15', name: 'Phyllo Dough', unit: 'lbs' },
  { id: '16', name: 'Chickpeas', unit: 'lbs' },
  { id: '17', name: 'Tahini', unit: 'lbs' },
  { id: '18', name: 'Olive Oil (EV)', unit: 'liters' },
  { id: '19', name: 'Lemons', unit: 'units' },
  { id: '20', name: 'Fresh Oregano', unit: 'lbs' },
  { id: '21', name: 'Fresh Dill', unit: 'lbs' },
  { id: '22', name: 'Fresh Mint', unit: 'lbs' },
  { id: '23', name: 'Orzo Pasta', unit: 'lbs' },
  { id: '24', name: 'Honey', unit: 'lbs' },
  { id: '25', name: 'Walnuts', unit: 'lbs' },
  { id: '26', name: 'Pistachios', unit: 'lbs' },
  { id: '27', name: 'Red Onions', unit: 'lbs' },
  { id: '28', name: 'Garlic', unit: 'lbs' },
  { id: '29', name: 'Kalamata Olives', unit: 'lbs' },
  { id: '30', name: 'Pine Nuts', unit: 'lbs' },
]

// Mykonos Mediterranean Restaurant menu
const demoDishes: Dish[] = [
  // Appetizers (Meze)
  {
    id: '1',
    name: 'Classic Hummus',
    category: 'Appetizer',
    price: 12.00,
    is_active: true,
    recipe: [
      { id: '1', ingredient_id: '16', ingredient_name: 'Chickpeas', quantity: 1.0, unit: 'lbs' },
      { id: '2', ingredient_id: '17', ingredient_name: 'Tahini', quantity: 0.25, unit: 'lbs' },
      { id: '3', ingredient_id: '28', ingredient_name: 'Garlic', quantity: 0.125, unit: 'lbs' },
      { id: '4', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.125, unit: 'liters' },
    ]
  },
  {
    id: '2',
    name: 'Spanakopita',
    category: 'Appetizer',
    price: 14.00,
    is_active: true,
    recipe: [
      { id: '5', ingredient_id: '14', ingredient_name: 'Fresh Spinach', quantity: 1.5, unit: 'lbs' },
      { id: '6', ingredient_id: '8', ingredient_name: 'Feta Cheese', quantity: 0.5, unit: 'lbs' },
      { id: '7', ingredient_id: '15', ingredient_name: 'Phyllo Dough', quantity: 0.75, unit: 'lbs' },
      { id: '8', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.2, unit: 'liters' },
    ]
  },
  {
    id: '3',
    name: 'Saganaki',
    category: 'Appetizer',
    price: 16.00,
    is_active: true,
    recipe: [
      { id: '9', ingredient_id: '10', ingredient_name: 'Halloumi', quantity: 0.5, unit: 'lbs' },
      { id: '10', ingredient_id: '19', ingredient_name: 'Lemons', quantity: 2, unit: 'units' },
    ]
  },
  {
    id: '4',
    name: 'Grilled Octopus',
    category: 'Appetizer',
    price: 22.00,
    is_active: true,
    recipe: [
      { id: '11', ingredient_id: '7', ingredient_name: 'Octopus', quantity: 0.75, unit: 'lbs' },
      { id: '12', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.1, unit: 'liters' },
      { id: '13', ingredient_id: '20', ingredient_name: 'Fresh Oregano', quantity: 0.05, unit: 'lbs' },
    ]
  },
  // Salads
  {
    id: '5',
    name: 'Greek Salad (Horiatiki)',
    category: 'Salad',
    price: 14.00,
    is_active: true,
    recipe: [
      { id: '14', ingredient_id: '11', ingredient_name: 'Tomatoes (Roma)', quantity: 0.4, unit: 'lbs' },
      { id: '15', ingredient_id: '12', ingredient_name: 'Cucumbers', quantity: 0.3, unit: 'lbs' },
      { id: '16', ingredient_id: '27', ingredient_name: 'Red Onions', quantity: 0.15, unit: 'lbs' },
      { id: '17', ingredient_id: '8', ingredient_name: 'Feta Cheese', quantity: 0.25, unit: 'lbs' },
      { id: '18', ingredient_id: '29', ingredient_name: 'Kalamata Olives', quantity: 0.1, unit: 'lbs' },
    ]
  },
  // Seafood Entrees
  {
    id: '6',
    name: 'Grilled Branzino',
    category: 'Entree - Seafood',
    price: 34.00,
    is_active: true,
    recipe: [
      { id: '19', ingredient_id: '5', ingredient_name: 'Branzino', quantity: 1.5, unit: 'lbs' },
      { id: '20', ingredient_id: '19', ingredient_name: 'Lemons', quantity: 2, unit: 'units' },
      { id: '21', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.1, unit: 'liters' },
      { id: '22', ingredient_id: '20', ingredient_name: 'Fresh Oregano', quantity: 0.05, unit: 'lbs' },
      { id: '23', ingredient_id: '21', ingredient_name: 'Fresh Dill', quantity: 0.05, unit: 'lbs' },
    ]
  },
  {
    id: '7',
    name: 'Shrimp Saganaki',
    category: 'Entree - Seafood',
    price: 32.00,
    is_active: true,
    recipe: [
      { id: '24', ingredient_id: '6', ingredient_name: 'Shrimp (Jumbo)', quantity: 0.5, unit: 'lbs' },
      { id: '25', ingredient_id: '11', ingredient_name: 'Tomatoes (Roma)', quantity: 0.3, unit: 'lbs' },
      { id: '26', ingredient_id: '8', ingredient_name: 'Feta Cheese', quantity: 0.2, unit: 'lbs' },
    ]
  },
  // Meat Entrees
  {
    id: '8',
    name: 'Lamb Souvlaki',
    category: 'Entree - Meat',
    price: 28.00,
    is_active: true,
    recipe: [
      { id: '27', ingredient_id: '2', ingredient_name: 'Lamb Chops', quantity: 1.25, unit: 'lbs' },
      { id: '28', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.15, unit: 'liters' },
      { id: '29', ingredient_id: '9', ingredient_name: 'Greek Yogurt', quantity: 0.5, unit: 'lbs' },
      { id: '30', ingredient_id: '20', ingredient_name: 'Fresh Oregano', quantity: 0.05, unit: 'lbs' },
    ]
  },
  {
    id: '9',
    name: 'Moussaka',
    category: 'Entree - Meat',
    price: 26.00,
    is_active: true,
    recipe: [
      { id: '31', ingredient_id: '13', ingredient_name: 'Eggplant', quantity: 2.0, unit: 'lbs' },
      { id: '32', ingredient_id: '3', ingredient_name: 'Ground Lamb', quantity: 1.0, unit: 'lbs' },
      { id: '33', ingredient_id: '11', ingredient_name: 'Tomatoes (Roma)', quantity: 0.5, unit: 'lbs' },
      { id: '34', ingredient_id: '9', ingredient_name: 'Greek Yogurt', quantity: 0.25, unit: 'lbs' },
    ]
  },
  {
    id: '10',
    name: 'Chicken Souvlaki',
    category: 'Entree - Meat',
    price: 23.00,
    is_active: true,
    recipe: [
      { id: '35', ingredient_id: '4', ingredient_name: 'Chicken Thighs', quantity: 1.0, unit: 'lbs' },
      { id: '36', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.1, unit: 'liters' },
      { id: '37', ingredient_id: '9', ingredient_name: 'Greek Yogurt', quantity: 0.3, unit: 'lbs' },
    ]
  },
  // Desserts
  {
    id: '11',
    name: 'Baklava',
    category: 'Dessert',
    price: 10.00,
    is_active: true,
    recipe: [
      { id: '38', ingredient_id: '15', ingredient_name: 'Phyllo Dough', quantity: 1.0, unit: 'lbs' },
      { id: '39', ingredient_id: '25', ingredient_name: 'Walnuts', quantity: 0.5, unit: 'lbs' },
      { id: '40', ingredient_id: '26', ingredient_name: 'Pistachios', quantity: 0.25, unit: 'lbs' },
      { id: '41', ingredient_id: '24', ingredient_name: 'Honey', quantity: 0.75, unit: 'lbs' },
    ]
  },
  {
    id: '12',
    name: 'Greek Yogurt with Honey',
    category: 'Dessert',
    price: 9.00,
    is_active: true,
    recipe: [
      { id: '42', ingredient_id: '9', ingredient_name: 'Greek Yogurt', quantity: 0.5, unit: 'lbs' },
      { id: '43', ingredient_id: '24', ingredient_name: 'Honey', quantity: 0.1, unit: 'lbs' },
      { id: '44', ingredient_id: '25', ingredient_name: 'Walnuts', quantity: 0.1, unit: 'lbs' },
    ]
  },
]

const categories = ['Appetizer', 'Salad', 'Soup', 'Entree - Seafood', 'Entree - Meat', 'Entree - Vegetarian', 'Dessert', 'Cocktail']

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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-red-600 rounded-xl flex items-center justify-center">
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
      <div className="border border-red-200 dark:border-red-900 rounded-2xl p-6 bg-gradient-to-r from-red-50 via-indigo-50 to-purple-50 dark:from-red-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-black dark:text-white mb-2">How This Feeds the AI Model</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Recipe quantities are multiplied by predicted dish sales to forecast ingredient demand.
              For example, if we predict <span className="font-semibold text-red-600 dark:text-red-400">50 Lamb Souvlaki</span> will be sold tomorrow, the model calculates:
              <span className="font-mono text-black dark:text-white mx-1">50 × 1.25 lbs = 62.5 lbs</span> of Lamb Chops needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
