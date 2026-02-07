// Cuisine Template Data Module
// Provides complete demo data for 6 cuisine types

export interface DemoIngredient {
  id: string; name: string; category: string; current_inventory: number; unit: string;
  risk_level: string; days_of_cover: number; stockout_prob: number; trend: number;
}

export interface DishIngredient {
  id: string; name: string; unit: string;
}

export interface RecipeIngredient {
  id: string; ingredient_id: string; ingredient_name: string; quantity: number; unit: string;
}

export interface DemoDish {
  id: string; name: string; category: string; price: number; is_active: boolean;
  recipe: RecipeIngredient[]; orders_today: number; orders_7d: number; orders_30d: number;
  trend: number; popularity_rank: number; daily_orders: number[]; revenue_7d: number;
}

export interface DemoMenuItem {
  id: string; name: string; price: number; category: string; popular?: boolean;
}

export interface SupplierPricing {
  ingredient: string; price: number; unit: string;
}

export interface DemoSupplier {
  id: string; name: string; lead_time_days: number; min_order_quantity: number;
  reliability_score: number; shipping_cost: number; ingredients?: string[];
  pricing?: SupplierPricing[];
}

export interface OrderHistoryItem {
  id: string; supplier: string; items: number; total: number;
  status: 'Delivered' | 'In Transit' | 'Processing'; date: string;
}

export interface TopDish {
  name: string; orders: number; trend: number;
}

export interface DeliveryOrder {
  platform: string; label: string; labelColor: string; status: string;
  customer: string; total: number; items: string; color: string;
}

export interface SmartSuggestion {
  ingredient: string; supplier: string; qty: string; cost: string; urgency: string;
}

export interface TakeoutOrder {
  id: string; customerName: string; phone: string; pickupTime: string;
  items: { name: string; quantity: number }[]; total: number;
  status: 'pending' | 'preparing' | 'ready' | 'picked_up'; createdAt: string;
}

export interface DeliveryPlatformOrder {
  id: string; platform: string; platformId: string; customerName: string;
  items: { name: string; quantity: number; price: number }[]; total: number;
  status: 'received' | 'preparing' | 'ready' | 'picked_up'; createdAt: string;
}

export interface DemoUser {
  name: string; email: string; restaurant: string;
  restaurantKey?: string; managerId?: string;
}

export interface RestaurantSettings {
  name: string; address: string; phone: string; email: string;
}

export interface CuisineTemplate {
  key: string;
  label: string;
  flag: string;
  restaurantName: string;
  country: string;
  genre: string;
  ingredients: DemoIngredient[];
  dishIngredients: DishIngredient[];
  dishes: DemoDish[];
  menuItems: DemoMenuItem[];
  suppliers: DemoSupplier[];
  orderHistory: OrderHistoryItem[];
  serverNames: string[];
  customerNames: string[];
  topDishesToday: TopDish[];
  dailyBriefing: string;
  deliveryOrders: DeliveryOrder[];
  smartSuggestions: SmartSuggestion[];
  takeoutOrders: TakeoutOrder[];
  deliveryPlatformOrders: DeliveryPlatformOrder[];
  chatIngredientKeywords: string[];
  initialChatMessage: string;
  restaurantSettings: RestaurantSettings;
  demoUsers: Record<string, DemoUser>;
  posCategories: string[];
}

// ============================================================
// MEDITERRANEAN (Mykonos Mediterranean) - Exact copy of current data
// ============================================================
const mediterranean: CuisineTemplate = {
  key: 'mediterranean',
  label: 'Mediterranean',
  flag: 'GR',
  restaurantName: 'Mykonos Mediterranean',
  country: 'Greece',
  genre: 'full_service',
  ingredients: [
    { id: '1', name: 'Lamb Shoulder', category: 'meat', current_inventory: 45, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.15, trend: 8 },
    { id: '2', name: 'Lamb Chops', category: 'meat', current_inventory: 18, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.42, trend: -15 },
    { id: '3', name: 'Chicken Thighs', category: 'meat', current_inventory: 65, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 3 },
    { id: '4', name: 'Branzino (Sea Bass)', category: 'meat', current_inventory: 12, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.68, trend: -22 },
    { id: '5', name: 'Octopus', category: 'meat', current_inventory: 25, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.18, trend: 5 },
    { id: '6', name: 'Shrimp (Jumbo)', category: 'meat', current_inventory: 35, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.08, trend: 2 },
    { id: '7', name: 'Feta Cheese', category: 'dairy', current_inventory: 28, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.22, trend: -8 },
    { id: '8', name: 'Halloumi Cheese', category: 'dairy', current_inventory: 15, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.38, trend: -12 },
    { id: '9', name: 'Greek Yogurt', category: 'dairy', current_inventory: 45, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.06, trend: 0 },
    { id: '10', name: 'Tomatoes (Roma)', category: 'produce', current_inventory: 85, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.03, trend: 5 },
    { id: '11', name: 'Cucumbers', category: 'produce', current_inventory: 60, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 9, stockout_prob: 0.04, trend: 2 },
    { id: '12', name: 'Red Onions', category: 'produce', current_inventory: 70, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
    { id: '13', name: 'Eggplant', category: 'produce', current_inventory: 32, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.14, trend: -5 },
    { id: '14', name: 'Bell Peppers (Red)', category: 'produce', current_inventory: 40, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.07, trend: 3 },
    { id: '15', name: 'Fresh Spinach', category: 'produce', current_inventory: 22, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.28, trend: -10 },
    { id: '16', name: 'Lemons', category: 'produce', current_inventory: 55, unit: 'units', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 4 },
    { id: '17', name: 'Orzo Pasta', category: 'dry', current_inventory: 80, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 15, stockout_prob: 0.01, trend: 0 },
    { id: '18', name: 'Arborio Rice', category: 'dry', current_inventory: 65, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
    { id: '19', name: 'Phyllo Dough', category: 'dry', current_inventory: 18, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.19, trend: -7 },
    { id: '20', name: 'Chickpeas (Dried)', category: 'dry', current_inventory: 50, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 20, stockout_prob: 0.01, trend: 2 },
    { id: '21', name: 'Olive Oil (Extra Virgin)', category: 'dry', current_inventory: 12, unit: 'liters', risk_level: 'CRITICAL', days_of_cover: 2, stockout_prob: 0.55, trend: -18 },
    { id: '22', name: 'Tahini', category: 'dry', current_inventory: 8, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.35, trend: -10 },
    { id: '23', name: 'Fresh Oregano', category: 'produce', current_inventory: 5, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.20, trend: 0 },
    { id: '24', name: 'Fresh Dill', category: 'produce', current_inventory: 4, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 3, stockout_prob: 0.25, trend: -5 },
    { id: '25', name: 'Fresh Mint', category: 'produce', current_inventory: 6, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 5, stockout_prob: 0.12, trend: 2 },
    { id: '26', name: 'Ouzo', category: 'dry', current_inventory: 8, unit: 'bottles', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.04, trend: 5 },
    { id: '27', name: 'Metaxa', category: 'dry', current_inventory: 5, unit: 'bottles', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.15, trend: 0 },
    { id: '28', name: 'Prosecco', category: 'dry', current_inventory: 18, unit: 'bottles', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.08, trend: 8 },
    { id: '29', name: 'Pomegranate Juice', category: 'dry', current_inventory: 10, unit: 'liters', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.10, trend: 3 },
    { id: '30', name: 'Honey', category: 'dry', current_inventory: 12, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 14, stockout_prob: 0.02, trend: 0 },
  ],
  dishIngredients: [
    { id: '1', name: 'Lamb Shoulder', unit: 'lbs' }, { id: '2', name: 'Lamb Chops', unit: 'lbs' },
    { id: '3', name: 'Ground Lamb', unit: 'lbs' }, { id: '4', name: 'Chicken Thighs', unit: 'lbs' },
    { id: '5', name: 'Branzino', unit: 'lbs' }, { id: '6', name: 'Shrimp (Jumbo)', unit: 'lbs' },
    { id: '7', name: 'Octopus', unit: 'lbs' }, { id: '8', name: 'Feta Cheese', unit: 'lbs' },
    { id: '9', name: 'Greek Yogurt', unit: 'lbs' }, { id: '10', name: 'Halloumi', unit: 'lbs' },
    { id: '11', name: 'Tomatoes (Roma)', unit: 'lbs' }, { id: '12', name: 'Cucumbers', unit: 'lbs' },
    { id: '13', name: 'Eggplant', unit: 'lbs' }, { id: '14', name: 'Fresh Spinach', unit: 'lbs' },
    { id: '15', name: 'Phyllo Dough', unit: 'lbs' }, { id: '16', name: 'Chickpeas', unit: 'lbs' },
    { id: '17', name: 'Tahini', unit: 'lbs' }, { id: '18', name: 'Olive Oil (EV)', unit: 'liters' },
    { id: '19', name: 'Lemons', unit: 'units' }, { id: '20', name: 'Fresh Oregano', unit: 'lbs' },
    { id: '21', name: 'Fresh Dill', unit: 'lbs' }, { id: '22', name: 'Fresh Mint', unit: 'lbs' },
    { id: '23', name: 'Orzo Pasta', unit: 'lbs' }, { id: '24', name: 'Honey', unit: 'lbs' },
    { id: '25', name: 'Walnuts', unit: 'lbs' }, { id: '26', name: 'Pistachios', unit: 'lbs' },
    { id: '27', name: 'Red Onions', unit: 'lbs' }, { id: '28', name: 'Garlic', unit: 'lbs' },
    { id: '29', name: 'Kalamata Olives', unit: 'lbs' }, { id: '30', name: 'Pine Nuts', unit: 'lbs' },
  ],
  dishes: [
    {
      id: '1', name: 'Classic Hummus', category: 'Appetizer', price: 12.00, is_active: true,
      recipe: [
        { id: '1', ingredient_id: '16', ingredient_name: 'Chickpeas', quantity: 1.0, unit: 'lbs' },
        { id: '2', ingredient_id: '17', ingredient_name: 'Tahini', quantity: 0.25, unit: 'lbs' },
        { id: '3', ingredient_id: '28', ingredient_name: 'Garlic', quantity: 0.125, unit: 'lbs' },
        { id: '4', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.125, unit: 'liters' },
      ],
      orders_today: 22, orders_7d: 145, orders_30d: 580, trend: 5.2, popularity_rank: 4,
      daily_orders: [18, 20, 19, 22, 24, 26, 16], revenue_7d: 1740,
    },
    {
      id: '2', name: 'Spanakopita', category: 'Appetizer', price: 14.00, is_active: true,
      recipe: [
        { id: '5', ingredient_id: '14', ingredient_name: 'Fresh Spinach', quantity: 1.5, unit: 'lbs' },
        { id: '6', ingredient_id: '8', ingredient_name: 'Feta Cheese', quantity: 0.5, unit: 'lbs' },
        { id: '7', ingredient_id: '15', ingredient_name: 'Phyllo Dough', quantity: 0.75, unit: 'lbs' },
        { id: '8', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.2, unit: 'liters' },
      ],
      orders_today: 15, orders_7d: 98, orders_30d: 400, trend: -3.1, popularity_rank: 8,
      daily_orders: [15, 14, 13, 14, 15, 16, 11], revenue_7d: 1372,
    },
    {
      id: '3', name: 'Saganaki', category: 'Appetizer', price: 16.00, is_active: true,
      recipe: [
        { id: '9', ingredient_id: '10', ingredient_name: 'Halloumi', quantity: 0.5, unit: 'lbs' },
        { id: '10', ingredient_id: '19', ingredient_name: 'Lemons', quantity: 2, unit: 'units' },
      ],
      orders_today: 18, orders_7d: 120, orders_30d: 470, trend: 8.5, popularity_rank: 6,
      daily_orders: [14, 16, 17, 18, 20, 22, 13], revenue_7d: 1920,
    },
    {
      id: '4', name: 'Grilled Octopus', category: 'Appetizer', price: 22.00, is_active: true,
      recipe: [
        { id: '11', ingredient_id: '7', ingredient_name: 'Octopus', quantity: 0.75, unit: 'lbs' },
        { id: '12', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.1, unit: 'liters' },
        { id: '13', ingredient_id: '20', ingredient_name: 'Fresh Oregano', quantity: 0.05, unit: 'lbs' },
      ],
      orders_today: 14, orders_7d: 88, orders_30d: 360, trend: 2.0, popularity_rank: 9,
      daily_orders: [11, 12, 13, 14, 14, 15, 9], revenue_7d: 1936,
    },
    {
      id: '5', name: 'Greek Salad (Horiatiki)', category: 'Salad', price: 14.00, is_active: true,
      recipe: [
        { id: '14', ingredient_id: '11', ingredient_name: 'Tomatoes (Roma)', quantity: 0.4, unit: 'lbs' },
        { id: '15', ingredient_id: '12', ingredient_name: 'Cucumbers', quantity: 0.3, unit: 'lbs' },
        { id: '16', ingredient_id: '27', ingredient_name: 'Red Onions', quantity: 0.15, unit: 'lbs' },
        { id: '17', ingredient_id: '8', ingredient_name: 'Feta Cheese', quantity: 0.25, unit: 'lbs' },
        { id: '18', ingredient_id: '29', ingredient_name: 'Kalamata Olives', quantity: 0.1, unit: 'lbs' },
      ],
      orders_today: 28, orders_7d: 175, orders_30d: 720, trend: 6.8, popularity_rank: 2,
      daily_orders: [22, 24, 25, 26, 28, 30, 20], revenue_7d: 2450,
    },
    {
      id: '6', name: 'Grilled Branzino', category: 'Entree - Seafood', price: 34.00, is_active: true,
      recipe: [
        { id: '19', ingredient_id: '5', ingredient_name: 'Branzino', quantity: 1.5, unit: 'lbs' },
        { id: '20', ingredient_id: '19', ingredient_name: 'Lemons', quantity: 2, unit: 'units' },
        { id: '21', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.1, unit: 'liters' },
        { id: '22', ingredient_id: '20', ingredient_name: 'Fresh Oregano', quantity: 0.05, unit: 'lbs' },
        { id: '23', ingredient_id: '21', ingredient_name: 'Fresh Dill', quantity: 0.05, unit: 'lbs' },
      ],
      orders_today: 20, orders_7d: 130, orders_30d: 510, trend: -5.2, popularity_rank: 5,
      daily_orders: [20, 19, 18, 20, 22, 21, 10], revenue_7d: 4420,
    },
    {
      id: '7', name: 'Shrimp Saganaki', category: 'Entree - Seafood', price: 32.00, is_active: true,
      recipe: [
        { id: '24', ingredient_id: '6', ingredient_name: 'Shrimp (Jumbo)', quantity: 0.5, unit: 'lbs' },
        { id: '25', ingredient_id: '11', ingredient_name: 'Tomatoes (Roma)', quantity: 0.3, unit: 'lbs' },
        { id: '26', ingredient_id: '8', ingredient_name: 'Feta Cheese', quantity: 0.2, unit: 'lbs' },
      ],
      orders_today: 16, orders_7d: 105, orders_30d: 430, trend: 12.3, popularity_rank: 7,
      daily_orders: [12, 14, 15, 16, 18, 19, 11], revenue_7d: 3360,
    },
    {
      id: '8', name: 'Lamb Souvlaki', category: 'Entree - Meat', price: 28.00, is_active: true,
      recipe: [
        { id: '27', ingredient_id: '2', ingredient_name: 'Lamb Chops', quantity: 1.25, unit: 'lbs' },
        { id: '28', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.15, unit: 'liters' },
        { id: '29', ingredient_id: '9', ingredient_name: 'Greek Yogurt', quantity: 0.5, unit: 'lbs' },
        { id: '30', ingredient_id: '20', ingredient_name: 'Fresh Oregano', quantity: 0.05, unit: 'lbs' },
      ],
      orders_today: 32, orders_7d: 195, orders_30d: 780, trend: 11.4, popularity_rank: 1,
      daily_orders: [24, 26, 28, 30, 32, 35, 20], revenue_7d: 5460,
    },
    {
      id: '9', name: 'Moussaka', category: 'Entree - Meat', price: 26.00, is_active: true,
      recipe: [
        { id: '31', ingredient_id: '13', ingredient_name: 'Eggplant', quantity: 2.0, unit: 'lbs' },
        { id: '32', ingredient_id: '3', ingredient_name: 'Ground Lamb', quantity: 1.0, unit: 'lbs' },
        { id: '33', ingredient_id: '11', ingredient_name: 'Tomatoes (Roma)', quantity: 0.5, unit: 'lbs' },
        { id: '34', ingredient_id: '9', ingredient_name: 'Greek Yogurt', quantity: 0.25, unit: 'lbs' },
      ],
      orders_today: 19, orders_7d: 135, orders_30d: 550, trend: -1.5, popularity_rank: 3,
      daily_orders: [18, 19, 20, 19, 22, 24, 13], revenue_7d: 3510,
    },
    {
      id: '10', name: 'Chicken Souvlaki', category: 'Entree - Meat', price: 23.00, is_active: true,
      recipe: [
        { id: '35', ingredient_id: '4', ingredient_name: 'Chicken Thighs', quantity: 1.0, unit: 'lbs' },
        { id: '36', ingredient_id: '18', ingredient_name: 'Olive Oil (EV)', quantity: 0.1, unit: 'liters' },
        { id: '37', ingredient_id: '9', ingredient_name: 'Greek Yogurt', quantity: 0.3, unit: 'lbs' },
      ],
      orders_today: 12, orders_7d: 82, orders_30d: 340, trend: -7.8, popularity_rank: 10,
      daily_orders: [13, 12, 11, 12, 14, 13, 7], revenue_7d: 1886,
    },
    {
      id: '11', name: 'Baklava', category: 'Dessert', price: 10.00, is_active: true,
      recipe: [
        { id: '38', ingredient_id: '15', ingredient_name: 'Phyllo Dough', quantity: 1.0, unit: 'lbs' },
        { id: '39', ingredient_id: '25', ingredient_name: 'Walnuts', quantity: 0.5, unit: 'lbs' },
        { id: '40', ingredient_id: '26', ingredient_name: 'Pistachios', quantity: 0.25, unit: 'lbs' },
        { id: '41', ingredient_id: '24', ingredient_name: 'Honey', quantity: 0.75, unit: 'lbs' },
      ],
      orders_today: 25, orders_7d: 160, orders_30d: 640, trend: 9.1, popularity_rank: 11,
      daily_orders: [20, 22, 23, 24, 26, 28, 17], revenue_7d: 1600,
    },
    {
      id: '12', name: 'Greek Yogurt with Honey', category: 'Dessert', price: 9.00, is_active: true,
      recipe: [
        { id: '42', ingredient_id: '9', ingredient_name: 'Greek Yogurt', quantity: 0.5, unit: 'lbs' },
        { id: '43', ingredient_id: '24', ingredient_name: 'Honey', quantity: 0.1, unit: 'lbs' },
        { id: '44', ingredient_id: '25', ingredient_name: 'Walnuts', quantity: 0.1, unit: 'lbs' },
      ],
      orders_today: 10, orders_7d: 68, orders_30d: 280, trend: -2.4, popularity_rank: 12,
      daily_orders: [9, 10, 10, 10, 12, 11, 6], revenue_7d: 612,
    },
  ],
  menuItems: [
    { id: '1', name: 'Classic Hummus', price: 12.00, category: 'Mezze', popular: true },
    { id: '2', name: 'Spanakopita', price: 14.00, category: 'Mezze' },
    { id: '3', name: 'Saganaki', price: 16.00, category: 'Mezze', popular: true },
    { id: '4', name: 'Grilled Octopus', price: 24.00, category: 'Mezze', popular: true },
    { id: '5', name: 'Dolmades', price: 13.00, category: 'Mezze' },
    { id: '6', name: 'Tzatziki & Pita', price: 10.00, category: 'Mezze' },
    { id: '7', name: 'Greek Salad', price: 14.00, category: 'Salads', popular: true },
    { id: '8', name: 'Quinoa Bowl', price: 16.00, category: 'Salads' },
    { id: '9', name: 'Fattoush', price: 13.00, category: 'Salads' },
    { id: '10', name: 'Grilled Branzino', price: 34.00, category: 'Seafood', popular: true },
    { id: '11', name: 'Shrimp Saganaki', price: 29.00, category: 'Seafood', popular: true },
    { id: '12', name: 'Grilled Salmon', price: 32.00, category: 'Seafood' },
    { id: '13', name: 'Seafood Platter', price: 48.00, category: 'Seafood' },
    { id: '14', name: 'Lamb Souvlaki', price: 28.00, category: 'Mains', popular: true },
    { id: '15', name: 'Moussaka', price: 26.00, category: 'Mains', popular: true },
    { id: '16', name: 'Chicken Souvlaki', price: 22.00, category: 'Mains' },
    { id: '17', name: 'Beef Kofta', price: 24.00, category: 'Mains' },
    { id: '18', name: 'Stuffed Peppers', price: 21.00, category: 'Mains' },
    { id: '19', name: 'Imam Bayildi', price: 19.00, category: 'Mains' },
    { id: '20', name: 'Mykonos Sunset', price: 14.00, category: 'Drinks', popular: true },
    { id: '21', name: 'Greek Wine', price: 12.00, category: 'Drinks' },
    { id: '22', name: 'Ouzo', price: 9.00, category: 'Drinks' },
    { id: '23', name: 'Greek Coffee', price: 5.00, category: 'Drinks' },
    { id: '24', name: 'Fresh Lemonade', price: 6.00, category: 'Drinks' },
    { id: '25', name: 'Baklava', price: 10.00, category: 'Desserts', popular: true },
    { id: '26', name: 'Yogurt & Honey', price: 8.00, category: 'Desserts' },
    { id: '27', name: 'Loukoumades', price: 9.00, category: 'Desserts', popular: true },
    { id: '28', name: 'Galaktoboureko', price: 11.00, category: 'Desserts' },
  ],
  posCategories: ['Mezze', 'Salads', 'Seafood', 'Mains', 'Drinks', 'Desserts'],
  suppliers: [
    { id: '1', name: 'Aegean Imports', lead_time_days: 2, min_order_quantity: 50, reliability_score: 0.98, shipping_cost: 45, ingredients: ['Kalamata Olives', 'Feta Cheese', 'Greek Yogurt', 'Olive Oil'], pricing: [{ ingredient: 'Olive Oil', price: 18.50, unit: 'L' }, { ingredient: 'Feta Cheese', price: 12.00, unit: 'lb' }, { ingredient: 'Kalamata Olives', price: 8.50, unit: 'lb' }, { ingredient: 'Greek Yogurt', price: 6.00, unit: 'lb' }] },
    { id: '2', name: 'Athens Fresh Market', lead_time_days: 1, min_order_quantity: 25, reliability_score: 0.95, shipping_cost: 25, ingredients: ['Fresh Spinach', 'Tomatoes', 'Cucumbers', 'Red Onions', 'Eggplant'], pricing: [{ ingredient: 'Fresh Spinach', price: 3.50, unit: 'lb' }, { ingredient: 'Tomatoes', price: 2.80, unit: 'lb' }, { ingredient: 'Cucumbers', price: 1.90, unit: 'lb' }, { ingredient: 'Red Onions', price: 1.50, unit: 'lb' }, { ingredient: 'Eggplant', price: 2.20, unit: 'lb' }, { ingredient: 'Olive Oil', price: 20.00, unit: 'L' }, { ingredient: 'Feta Cheese', price: 13.50, unit: 'lb' }] },
    { id: '3', name: 'Mediterranean Seafood Co', lead_time_days: 1, min_order_quantity: 30, reliability_score: 0.94, shipping_cost: 55, ingredients: ['Branzino', 'Octopus', 'Shrimp', 'Salmon'], pricing: [{ ingredient: 'Branzino', price: 22.00, unit: 'lb' }, { ingredient: 'Shrimp', price: 18.00, unit: 'lb' }, { ingredient: 'Octopus', price: 28.00, unit: 'lb' }, { ingredient: 'Salmon', price: 16.50, unit: 'lb' }] },
    { id: '4', name: 'Hellenic Farms', lead_time_days: 2, min_order_quantity: 40, reliability_score: 0.97, shipping_cost: 35, ingredients: ['Lamb Leg', 'Chicken Thighs', 'Ground Lamb'], pricing: [{ ingredient: 'Lamb Leg', price: 14.00, unit: 'lb' }, { ingredient: 'Chicken Thighs', price: 5.50, unit: 'lb' }, { ingredient: 'Ground Lamb', price: 12.00, unit: 'lb' }, { ingredient: 'Olive Oil', price: 19.00, unit: 'L' }] },
    { id: '5', name: 'Santorini Spirits', lead_time_days: 3, min_order_quantity: 24, reliability_score: 0.92, shipping_cost: 0, ingredients: ['Ouzo', 'Metaxa', 'Assyrtiko Wine', 'Retsina'], pricing: [{ ingredient: 'Ouzo', price: 22.00, unit: 'btl' }, { ingredient: 'Assyrtiko Wine', price: 18.00, unit: 'btl' }, { ingredient: 'Retsina', price: 12.00, unit: 'btl' }] },
    { id: '6', name: 'Mykonos Pantry', lead_time_days: 2, min_order_quantity: 50, reliability_score: 0.96, shipping_cost: 20, ingredients: ['Phyllo Dough', 'Tahini', 'Arborio Rice', 'Greek Honey'], pricing: [{ ingredient: 'Phyllo Dough', price: 8.00, unit: 'lb' }, { ingredient: 'Tahini', price: 9.50, unit: 'lb' }, { ingredient: 'Greek Honey', price: 15.00, unit: 'lb' }, { ingredient: 'Feta Cheese', price: 11.50, unit: 'lb' }] },
  ],
  orderHistory: [
    { id: 'PO-001', supplier: 'Aegean Imports', items: 4, total: 485.00, status: 'Delivered', date: 'Feb 5, 2026' },
    { id: 'PO-002', supplier: 'Mediterranean Seafood Co', items: 3, total: 820.00, status: 'Delivered', date: 'Feb 4, 2026' },
    { id: 'PO-003', supplier: 'Athens Fresh Market', items: 5, total: 215.00, status: 'In Transit', date: 'Feb 6, 2026' },
    { id: 'PO-004', supplier: 'Hellenic Farms', items: 2, total: 560.00, status: 'Processing', date: 'Feb 7, 2026' },
    { id: 'PO-005', supplier: 'Mykonos Pantry', items: 3, total: 340.00, status: 'Delivered', date: 'Feb 3, 2026' },
  ],
  serverNames: ['Elena D.', 'Nikos S.', 'Sofia B.'],
  customerNames: ['Maria K.', 'Petros A.', 'Anna S.', 'Nikos P.', 'Elena S.', 'Dimitri T.'],
  topDishesToday: [
    { name: 'Lamb Souvlaki', orders: 32, trend: 11.4 },
    { name: 'Greek Salad', orders: 28, trend: 6.8 },
    { name: 'Baklava', orders: 25, trend: 9.1 },
    { name: 'Classic Hummus', orders: 22, trend: 5.2 },
    { name: 'Grilled Branzino', orders: 20, trend: -5.2 },
  ],
  dailyBriefing: `Kalimera! Here's your inventory briefing for Mykonos Mediterranean:

**Priority Items:**
- **Branzino (Sea Bass)** is at CRITICAL risk with only 1 day of cover. Order from Mediterranean Seafood Co. immediately.
- **Olive Oil (Extra Virgin)** is running low - essential for tonight's service. Contact Aegean Imports.
- **Lamb Chops** and **Halloumi Cheese** show URGENT risk. Weekend dinner reservations are 40% above average.

**Menu Insights:**
- **Lamb Souvlaki** is your #1 seller (195 orders/wk, +11.4%) — driving high Lamb Chops demand (243.8 lbs/wk projected).
- **Shrimp Saganaki** is trending up fast (+12.3%) — consider promoting as a special.
- **Chicken Souvlaki** is declining (-7.8%) and **Grilled Branzino** is down (-5.2%). Consider refreshing plating or running a lunch special to boost orders.

**Today's Outlook:**
- 4 items need immediate attention
- Friday evening: Expecting 180+ covers (Grilled Branzino, Lamb Souvlaki popular)
- Mezze platters trending up 25% this week

**Recommendation:** Place urgent orders before 2 PM for same-day delivery. Feature Shrimp Saganaki and Moussaka to reduce lamb dependency tonight.`,
  deliveryOrders: [
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Preparing', customer: 'Maria K.', total: 86.50, items: 'Lamb Souvlaki, Greek Salad', color: 'from-red-500 to-red-600' },
    { platform: 'Uber Eats', label: 'UE', labelColor: 'bg-green-500 text-white', status: 'Confirmed', customer: 'Nikos P.', total: 124.75, items: 'Mezze Platter, Grilled Branzino', color: 'from-green-500 to-emerald-600' },
    { platform: 'Grubhub', label: 'GH', labelColor: 'bg-orange-500 text-white', status: 'Out for Delivery', customer: 'Elena S.', total: 78.90, items: 'Moussaka, Baklava x2', color: 'from-orange-500 to-red-500' },
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Pending', customer: 'Dimitri T.', total: 145.25, items: 'Seafood Paella, Wine', color: 'from-red-500 to-red-600' },
  ],
  smartSuggestions: [
    { ingredient: 'Olive Oil', supplier: 'Aegean Imports', qty: '10 L', cost: '$185.00', urgency: 'critical' },
    { ingredient: 'Feta Cheese', supplier: 'Mykonos Pantry', qty: '15 lb', cost: '$172.50', urgency: 'urgent' },
    { ingredient: 'Lamb Leg', supplier: 'Hellenic Farms', qty: '20 lb', cost: '$280.00', urgency: 'normal' },
  ],
  takeoutOrders: [
    { id: 'TO-001', customerName: 'Maria K.', phone: '(555) 123-4567', pickupTime: '15 min', items: [{ name: 'Lamb Souvlaki', quantity: 2 }, { name: 'Greek Salad', quantity: 1 }], total: 70.00, status: 'preparing', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'TO-002', customerName: 'Petros A.', phone: '(555) 234-5678', pickupTime: '30 min', items: [{ name: 'Moussaka', quantity: 1 }, { name: 'Baklava', quantity: 2 }], total: 46.00, status: 'pending', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'TO-003', customerName: 'Anna S.', phone: '(555) 345-6789', pickupTime: '45 min', items: [{ name: 'Seafood Platter', quantity: 1 }], total: 48.00, status: 'ready', createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
  ],
  deliveryPlatformOrders: [
    { id: 'DEL-001', platform: 'doordash', platformId: 'DD-MYK91E', customerName: 'Nikos P.', items: [{ name: 'Grilled Branzino', quantity: 1, price: 34.00 }, { name: 'Greek Salad', quantity: 1, price: 14.00 }], total: 56.11, status: 'preparing', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'DEL-002', platform: 'uber_eats', platformId: 'UE-MYK82F', customerName: 'Elena S.', items: [{ name: 'Lamb Souvlaki', quantity: 2, price: 56.00 }], total: 65.45, status: 'received', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'DEL-003', platform: 'grubhub', platformId: 'GH-MYK93A', customerName: 'Sophia M.', items: [{ name: 'Moussaka', quantity: 2, price: 52.00 }], total: 63.27, status: 'ready', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'DEL-004', platform: 'doordash', platformId: 'DD-MYK04B', customerName: 'Costa V.', items: [{ name: 'Grilled Octopus', quantity: 1, price: 24.00 }, { name: 'Shrimp Saganaki', quantity: 1, price: 29.00 }], total: 62.57, status: 'picked_up', createdAt: new Date(Date.now() - 35 * 60000).toISOString() },
  ],
  chatIngredientKeywords: [
    'lamb', 'lamb leg', 'ground lamb', 'chicken', 'chicken thighs',
    'branzino', 'octopus', 'shrimp', 'feta', 'feta cheese', 'halloumi',
    'greek yogurt', 'yogurt', 'tomatoes', 'cucumbers', 'red onions',
    'eggplant', 'bell peppers', 'spinach', 'lemons', 'orzo', 'arborio rice',
    'phyllo', 'phyllo dough', 'chickpeas', 'olive oil', 'tahini',
    'oregano', 'dill', 'mint', 'ouzo', 'metaxa', 'wine', 'pomegranate', 'honey',
  ],
  initialChatMessage: "Kalimera! I'm your AI assistant for Mykonos Mediterranean Restaurant. I can help with:\n\n- **Inventory** - Stock levels, forecasts, reorder recommendations\n- **AI Agents** - Risk assessment, optimization decisions\n- **Menu** - Dishes, recipes, pricing\n- **Orders** - POS, delivery platforms\n- **Payments** - Including Solana Pay crypto\n- **Suppliers** - Lead times, reliability\n\nWhat would you like to know?",
  restaurantSettings: {
    name: 'Mykonos Mediterranean',
    address: '456 Mediterranean Ave, Athens, GA 30602',
    phone: '(706) 555-0142',
    email: 'info@mykonosathens.com',
  },
  demoUsers: {
    restaurant_admin: { name: 'Yiannis Papadopoulos', email: 'admin@mykonos.com', restaurant: 'Mykonos Mediterranean', restaurantKey: 'REST-MYK2026-ATHNS' },
    manager: { name: 'Elena Dimitriou', email: 'elena@mykonos.com', restaurant: 'Mykonos Mediterranean', managerId: 'MGR-ELENA26-MYKNS' },
    pos_user: { name: 'Nikos Server', email: 'nikos@mykonos.com', restaurant: 'Mykonos Mediterranean' },
  },
}

// ============================================================
// JAPANESE (Sakura Japanese Kitchen)
// ============================================================
const japanese: CuisineTemplate = {
  key: 'japanese',
  label: 'Japanese',
  flag: 'JP',
  restaurantName: 'Sakura Japanese Kitchen',
  country: 'Japan',
  genre: 'full_service',
  ingredients: [
    { id: '1', name: 'Sushi-Grade Tuna', category: 'meat', current_inventory: 15, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.62, trend: -20 },
    { id: '2', name: 'Sushi-Grade Salmon', category: 'meat', current_inventory: 22, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.40, trend: -12 },
    { id: '3', name: 'Yellowtail (Hamachi)', category: 'meat', current_inventory: 10, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.38, trend: -8 },
    { id: '4', name: 'Wagyu Beef', category: 'meat', current_inventory: 8, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.20, trend: 5 },
    { id: '5', name: 'Chicken Thighs', category: 'meat', current_inventory: 45, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.06, trend: 3 },
    { id: '6', name: 'Pork Belly', category: 'meat', current_inventory: 30, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.08, trend: 2 },
    { id: '7', name: 'Shrimp (Ebi)', category: 'meat', current_inventory: 25, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.18, trend: -5 },
    { id: '8', name: 'Sushi Rice', category: 'dry', current_inventory: 80, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.03, trend: 0 },
    { id: '9', name: 'Nori Sheets', category: 'dry', current_inventory: 200, unit: 'sheets', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 2 },
    { id: '10', name: 'Soy Sauce', category: 'dry', current_inventory: 15, unit: 'liters', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
    { id: '11', name: 'Mirin', category: 'dry', current_inventory: 8, unit: 'liters', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.15, trend: -3 },
    { id: '12', name: 'Rice Vinegar', category: 'dry', current_inventory: 10, unit: 'liters', risk_level: 'SAFE', days_of_cover: 9, stockout_prob: 0.04, trend: 0 },
    { id: '13', name: 'Miso Paste', category: 'dry', current_inventory: 12, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.06, trend: 2 },
    { id: '14', name: 'Dashi Stock', category: 'dry', current_inventory: 6, unit: 'liters', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.42, trend: -15 },
    { id: '15', name: 'Wasabi', category: 'produce', current_inventory: 3, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.18, trend: 0 },
    { id: '16', name: 'Pickled Ginger', category: 'produce', current_inventory: 8, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.04, trend: 0 },
    { id: '17', name: 'Avocado', category: 'produce', current_inventory: 35, unit: 'units', risk_level: 'MONITOR', days_of_cover: 3, stockout_prob: 0.22, trend: -8 },
    { id: '18', name: 'Edamame', category: 'produce', current_inventory: 20, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.07, trend: 4 },
    { id: '19', name: 'Shiitake Mushrooms', category: 'produce', current_inventory: 12, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.20, trend: -5 },
    { id: '20', name: 'Daikon Radish', category: 'produce', current_inventory: 15, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.09, trend: 0 },
    { id: '21', name: 'Green Onions', category: 'produce', current_inventory: 10, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 5, stockout_prob: 0.12, trend: 2 },
    { id: '22', name: 'Tofu (Silken)', category: 'dairy', current_inventory: 30, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.06, trend: 0 },
    { id: '23', name: 'Panko Breadcrumbs', category: 'dry', current_inventory: 25, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 15, stockout_prob: 0.01, trend: 0 },
    { id: '24', name: 'Sesame Oil', category: 'dry', current_inventory: 5, unit: 'liters', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.19, trend: -7 },
    { id: '25', name: 'Sake', category: 'dry', current_inventory: 12, unit: 'bottles', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 5 },
    { id: '26', name: 'Japanese Whisky', category: 'dry', current_inventory: 6, unit: 'bottles', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.04, trend: 3 },
    { id: '27', name: 'Ramen Noodles', category: 'dry', current_inventory: 40, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 9, stockout_prob: 0.04, trend: 2 },
    { id: '28', name: 'Tempura Flour', category: 'dry', current_inventory: 20, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
    { id: '29', name: 'Cucumber', category: 'produce', current_inventory: 25, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.08, trend: 2 },
    { id: '30', name: 'Matcha Powder', category: 'dry', current_inventory: 3, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 14, stockout_prob: 0.02, trend: 8 },
  ],
  dishIngredients: [
    { id: '1', name: 'Sushi-Grade Tuna', unit: 'lbs' }, { id: '2', name: 'Sushi-Grade Salmon', unit: 'lbs' },
    { id: '3', name: 'Yellowtail', unit: 'lbs' }, { id: '4', name: 'Wagyu Beef', unit: 'lbs' },
    { id: '5', name: 'Chicken Thighs', unit: 'lbs' }, { id: '6', name: 'Pork Belly', unit: 'lbs' },
    { id: '7', name: 'Shrimp (Ebi)', unit: 'lbs' }, { id: '8', name: 'Sushi Rice', unit: 'lbs' },
    { id: '9', name: 'Nori Sheets', unit: 'sheets' }, { id: '10', name: 'Soy Sauce', unit: 'liters' },
    { id: '11', name: 'Mirin', unit: 'liters' }, { id: '12', name: 'Rice Vinegar', unit: 'liters' },
    { id: '13', name: 'Miso Paste', unit: 'lbs' }, { id: '14', name: 'Dashi Stock', unit: 'liters' },
    { id: '15', name: 'Wasabi', unit: 'lbs' }, { id: '16', name: 'Pickled Ginger', unit: 'lbs' },
    { id: '17', name: 'Avocado', unit: 'units' }, { id: '18', name: 'Edamame', unit: 'lbs' },
    { id: '19', name: 'Shiitake Mushrooms', unit: 'lbs' }, { id: '20', name: 'Daikon Radish', unit: 'lbs' },
    { id: '21', name: 'Green Onions', unit: 'lbs' }, { id: '22', name: 'Tofu (Silken)', unit: 'lbs' },
    { id: '23', name: 'Panko Breadcrumbs', unit: 'lbs' }, { id: '24', name: 'Sesame Oil', unit: 'liters' },
    { id: '25', name: 'Ramen Noodles', unit: 'lbs' }, { id: '26', name: 'Tempura Flour', unit: 'lbs' },
    { id: '27', name: 'Cucumber', unit: 'lbs' }, { id: '28', name: 'Sesame Seeds', unit: 'lbs' },
    { id: '29', name: 'Sake', unit: 'bottles' }, { id: '30', name: 'Matcha Powder', unit: 'lbs' },
  ],
  dishes: [
    {
      id: '1', name: 'Salmon Nigiri (5pc)', category: 'Appetizer', price: 16.00, is_active: true,
      recipe: [
        { id: '1', ingredient_id: '2', ingredient_name: 'Sushi-Grade Salmon', quantity: 0.4, unit: 'lbs' },
        { id: '2', ingredient_id: '8', ingredient_name: 'Sushi Rice', quantity: 0.3, unit: 'lbs' },
        { id: '3', ingredient_id: '15', ingredient_name: 'Wasabi', quantity: 0.02, unit: 'lbs' },
      ],
      orders_today: 30, orders_7d: 190, orders_30d: 760, trend: 8.5, popularity_rank: 1,
      daily_orders: [24, 26, 28, 30, 32, 34, 16], revenue_7d: 3040,
    },
    {
      id: '2', name: 'Edamame', category: 'Appetizer', price: 8.00, is_active: true,
      recipe: [
        { id: '4', ingredient_id: '18', ingredient_name: 'Edamame', quantity: 0.5, unit: 'lbs' },
        { id: '5', ingredient_id: '24', ingredient_name: 'Sesame Oil', quantity: 0.02, unit: 'liters' },
      ],
      orders_today: 22, orders_7d: 145, orders_30d: 580, trend: 3.2, popularity_rank: 5,
      daily_orders: [18, 20, 21, 22, 24, 25, 15], revenue_7d: 1160,
    },
    {
      id: '3', name: 'Miso Soup', category: 'Appetizer', price: 6.00, is_active: true,
      recipe: [
        { id: '6', ingredient_id: '13', ingredient_name: 'Miso Paste', quantity: 0.15, unit: 'lbs' },
        { id: '7', ingredient_id: '14', ingredient_name: 'Dashi Stock', quantity: 0.3, unit: 'liters' },
        { id: '8', ingredient_id: '22', ingredient_name: 'Tofu (Silken)', quantity: 0.2, unit: 'lbs' },
      ],
      orders_today: 25, orders_7d: 160, orders_30d: 640, trend: 2.0, popularity_rank: 4,
      daily_orders: [20, 22, 23, 24, 26, 28, 17], revenue_7d: 960,
    },
    {
      id: '4', name: 'Tuna Tataki', category: 'Appetizer', price: 18.00, is_active: true,
      recipe: [
        { id: '9', ingredient_id: '1', ingredient_name: 'Sushi-Grade Tuna', quantity: 0.5, unit: 'lbs' },
        { id: '10', ingredient_id: '10', ingredient_name: 'Soy Sauce', quantity: 0.05, unit: 'liters' },
        { id: '11', ingredient_id: '24', ingredient_name: 'Sesame Oil', quantity: 0.02, unit: 'liters' },
      ],
      orders_today: 18, orders_7d: 115, orders_30d: 460, trend: 6.8, popularity_rank: 6,
      daily_orders: [14, 16, 17, 18, 20, 21, 9], revenue_7d: 2070,
    },
    {
      id: '5', name: 'Dragon Roll', category: 'Entree - Seafood', price: 22.00, is_active: true,
      recipe: [
        { id: '12', ingredient_id: '7', ingredient_name: 'Shrimp (Ebi)', quantity: 0.3, unit: 'lbs' },
        { id: '13', ingredient_id: '17', ingredient_name: 'Avocado', quantity: 1, unit: 'units' },
        { id: '14', ingredient_id: '8', ingredient_name: 'Sushi Rice', quantity: 0.4, unit: 'lbs' },
        { id: '15', ingredient_id: '9', ingredient_name: 'Nori Sheets', quantity: 2, unit: 'sheets' },
      ],
      orders_today: 20, orders_7d: 135, orders_30d: 540, trend: 11.2, popularity_rank: 3,
      daily_orders: [16, 18, 19, 20, 22, 24, 16], revenue_7d: 2970,
    },
    {
      id: '6', name: 'Tonkotsu Ramen', category: 'Entree - Meat', price: 19.00, is_active: true,
      recipe: [
        { id: '16', ingredient_id: '6', ingredient_name: 'Pork Belly', quantity: 0.5, unit: 'lbs' },
        { id: '17', ingredient_id: '25', ingredient_name: 'Ramen Noodles', quantity: 0.4, unit: 'lbs' },
        { id: '18', ingredient_id: '14', ingredient_name: 'Dashi Stock', quantity: 0.5, unit: 'liters' },
        { id: '19', ingredient_id: '21', ingredient_name: 'Green Onions', quantity: 0.05, unit: 'lbs' },
      ],
      orders_today: 28, orders_7d: 180, orders_30d: 720, trend: 9.4, popularity_rank: 2,
      daily_orders: [22, 24, 26, 28, 30, 32, 18], revenue_7d: 3420,
    },
    {
      id: '7', name: 'Chicken Teriyaki', category: 'Entree - Meat', price: 21.00, is_active: true,
      recipe: [
        { id: '20', ingredient_id: '5', ingredient_name: 'Chicken Thighs', quantity: 0.75, unit: 'lbs' },
        { id: '21', ingredient_id: '10', ingredient_name: 'Soy Sauce', quantity: 0.05, unit: 'liters' },
        { id: '22', ingredient_id: '11', ingredient_name: 'Mirin', quantity: 0.05, unit: 'liters' },
        { id: '23', ingredient_id: '8', ingredient_name: 'Sushi Rice', quantity: 0.4, unit: 'lbs' },
      ],
      orders_today: 15, orders_7d: 100, orders_30d: 400, trend: -3.5, popularity_rank: 7,
      daily_orders: [14, 15, 14, 15, 16, 18, 8], revenue_7d: 2100,
    },
    {
      id: '8', name: 'Wagyu Tataki', category: 'Entree - Meat', price: 38.00, is_active: true,
      recipe: [
        { id: '24', ingredient_id: '4', ingredient_name: 'Wagyu Beef', quantity: 0.5, unit: 'lbs' },
        { id: '25', ingredient_id: '10', ingredient_name: 'Soy Sauce', quantity: 0.03, unit: 'liters' },
        { id: '26', ingredient_id: '21', ingredient_name: 'Green Onions', quantity: 0.03, unit: 'lbs' },
      ],
      orders_today: 10, orders_7d: 65, orders_30d: 260, trend: 5.0, popularity_rank: 9,
      daily_orders: [8, 9, 10, 10, 12, 12, 4], revenue_7d: 2470,
    },
    {
      id: '9', name: 'Shrimp Tempura', category: 'Entree - Seafood', price: 20.00, is_active: true,
      recipe: [
        { id: '27', ingredient_id: '7', ingredient_name: 'Shrimp (Ebi)', quantity: 0.5, unit: 'lbs' },
        { id: '28', ingredient_id: '26', ingredient_name: 'Tempura Flour', quantity: 0.3, unit: 'lbs' },
        { id: '29', ingredient_id: '14', ingredient_name: 'Dashi Stock', quantity: 0.15, unit: 'liters' },
      ],
      orders_today: 16, orders_7d: 108, orders_30d: 430, trend: -1.5, popularity_rank: 8,
      daily_orders: [14, 15, 16, 16, 18, 19, 10], revenue_7d: 2160,
    },
    {
      id: '10', name: 'Spicy Tuna Roll', category: 'Entree - Seafood', price: 16.00, is_active: true,
      recipe: [
        { id: '30', ingredient_id: '1', ingredient_name: 'Sushi-Grade Tuna', quantity: 0.3, unit: 'lbs' },
        { id: '31', ingredient_id: '8', ingredient_name: 'Sushi Rice', quantity: 0.35, unit: 'lbs' },
        { id: '32', ingredient_id: '9', ingredient_name: 'Nori Sheets', quantity: 2, unit: 'sheets' },
      ],
      orders_today: 14, orders_7d: 90, orders_30d: 360, trend: -5.2, popularity_rank: 10,
      daily_orders: [12, 13, 13, 14, 15, 16, 7], revenue_7d: 1440,
    },
    {
      id: '11', name: 'Matcha Mochi', category: 'Dessert', price: 10.00, is_active: true,
      recipe: [
        { id: '33', ingredient_id: '30', ingredient_name: 'Matcha Powder', quantity: 0.05, unit: 'lbs' },
        { id: '34', ingredient_id: '8', ingredient_name: 'Sushi Rice', quantity: 0.2, unit: 'lbs' },
      ],
      orders_today: 12, orders_7d: 78, orders_30d: 310, trend: 12.0, popularity_rank: 11,
      daily_orders: [10, 11, 11, 12, 13, 14, 7], revenue_7d: 780,
    },
    {
      id: '12', name: 'Tempura Ice Cream', category: 'Dessert', price: 11.00, is_active: true,
      recipe: [
        { id: '35', ingredient_id: '26', ingredient_name: 'Tempura Flour', quantity: 0.15, unit: 'lbs' },
        { id: '36', ingredient_id: '23', ingredient_name: 'Panko Breadcrumbs', quantity: 0.1, unit: 'lbs' },
      ],
      orders_today: 8, orders_7d: 52, orders_30d: 210, trend: -2.4, popularity_rank: 12,
      daily_orders: [7, 7, 8, 8, 9, 9, 4], revenue_7d: 572,
    },
  ],
  menuItems: [
    { id: '1', name: 'Edamame', price: 8.00, category: 'Starters', popular: true },
    { id: '2', name: 'Miso Soup', price: 6.00, category: 'Starters' },
    { id: '3', name: 'Gyoza (6pc)', price: 12.00, category: 'Starters', popular: true },
    { id: '4', name: 'Tuna Tataki', price: 18.00, category: 'Starters', popular: true },
    { id: '5', name: 'Agedashi Tofu', price: 10.00, category: 'Starters' },
    { id: '6', name: 'Takoyaki', price: 11.00, category: 'Starters' },
    { id: '7', name: 'Salmon Nigiri', price: 16.00, category: 'Sushi', popular: true },
    { id: '8', name: 'Tuna Nigiri', price: 18.00, category: 'Sushi', popular: true },
    { id: '9', name: 'Dragon Roll', price: 22.00, category: 'Sushi', popular: true },
    { id: '10', name: 'Spicy Tuna Roll', price: 16.00, category: 'Sushi' },
    { id: '11', name: 'Rainbow Roll', price: 24.00, category: 'Sushi' },
    { id: '12', name: 'California Roll', price: 14.00, category: 'Sushi' },
    { id: '13', name: 'Tonkotsu Ramen', price: 19.00, category: 'Mains', popular: true },
    { id: '14', name: 'Chicken Teriyaki', price: 21.00, category: 'Mains' },
    { id: '15', name: 'Wagyu Tataki', price: 38.00, category: 'Mains', popular: true },
    { id: '16', name: 'Shrimp Tempura', price: 20.00, category: 'Mains' },
    { id: '17', name: 'Katsu Curry', price: 18.00, category: 'Mains' },
    { id: '18', name: 'Salmon Teriyaki', price: 24.00, category: 'Mains' },
    { id: '19', name: 'Udon Noodles', price: 16.00, category: 'Mains' },
    { id: '20', name: 'Sake Flight', price: 22.00, category: 'Drinks', popular: true },
    { id: '21', name: 'Japanese Beer', price: 8.00, category: 'Drinks' },
    { id: '22', name: 'Whisky Highball', price: 14.00, category: 'Drinks' },
    { id: '23', name: 'Matcha Latte', price: 6.00, category: 'Drinks' },
    { id: '24', name: 'Ramune Soda', price: 5.00, category: 'Drinks' },
    { id: '25', name: 'Matcha Mochi', price: 10.00, category: 'Desserts', popular: true },
    { id: '26', name: 'Tempura Ice Cream', price: 11.00, category: 'Desserts' },
    { id: '27', name: 'Dorayaki', price: 9.00, category: 'Desserts', popular: true },
    { id: '28', name: 'Black Sesame Pudding', price: 8.00, category: 'Desserts' },
  ],
  posCategories: ['Starters', 'Sushi', 'Mains', 'Drinks', 'Desserts'],
  suppliers: [
    { id: '1', name: 'Tokyo Fish Market', lead_time_days: 1, min_order_quantity: 20, reliability_score: 0.98, shipping_cost: 65, ingredients: ['Sushi-Grade Tuna', 'Sushi-Grade Salmon', 'Yellowtail', 'Shrimp'], pricing: [{ ingredient: 'Sushi-Grade Tuna', price: 32.00, unit: 'lb' }, { ingredient: 'Sushi-Grade Salmon', price: 24.00, unit: 'lb' }, { ingredient: 'Yellowtail', price: 28.00, unit: 'lb' }, { ingredient: 'Shrimp', price: 18.00, unit: 'lb' }] },
    { id: '2', name: 'Nippon Premium Meats', lead_time_days: 3, min_order_quantity: 10, reliability_score: 0.96, shipping_cost: 45, ingredients: ['Wagyu Beef', 'Pork Belly', 'Chicken Thighs'], pricing: [{ ingredient: 'Wagyu Beef', price: 85.00, unit: 'lb' }, { ingredient: 'Pork Belly', price: 8.50, unit: 'lb' }, { ingredient: 'Chicken Thighs', price: 5.50, unit: 'lb' }] },
    { id: '3', name: 'Asian Pantry Co', lead_time_days: 2, min_order_quantity: 50, reliability_score: 0.95, shipping_cost: 25, ingredients: ['Sushi Rice', 'Nori', 'Soy Sauce', 'Mirin', 'Miso'], pricing: [{ ingredient: 'Sushi Rice', price: 2.50, unit: 'lb' }, { ingredient: 'Nori Sheets', price: 0.15, unit: 'sheet' }, { ingredient: 'Soy Sauce', price: 8.00, unit: 'L' }, { ingredient: 'Miso Paste', price: 6.50, unit: 'lb' }] },
    { id: '4', name: 'Garden Fresh Produce', lead_time_days: 1, min_order_quantity: 25, reliability_score: 0.94, shipping_cost: 20, ingredients: ['Avocado', 'Shiitake', 'Daikon', 'Green Onions', 'Edamame'], pricing: [{ ingredient: 'Avocado', price: 1.50, unit: 'unit' }, { ingredient: 'Shiitake Mushrooms', price: 12.00, unit: 'lb' }, { ingredient: 'Edamame', price: 4.00, unit: 'lb' }] },
    { id: '5', name: 'Sakura Spirits', lead_time_days: 3, min_order_quantity: 12, reliability_score: 0.93, shipping_cost: 0, ingredients: ['Sake', 'Japanese Whisky', 'Japanese Beer', 'Plum Wine'], pricing: [{ ingredient: 'Sake', price: 25.00, unit: 'btl' }, { ingredient: 'Japanese Whisky', price: 55.00, unit: 'btl' }, { ingredient: 'Japanese Beer', price: 3.50, unit: 'btl' }] },
    { id: '6', name: 'Wasabi & Co', lead_time_days: 2, min_order_quantity: 30, reliability_score: 0.97, shipping_cost: 30, ingredients: ['Wasabi', 'Pickled Ginger', 'Dashi Stock', 'Rice Vinegar'], pricing: [{ ingredient: 'Wasabi', price: 45.00, unit: 'lb' }, { ingredient: 'Pickled Ginger', price: 8.00, unit: 'lb' }, { ingredient: 'Dashi Stock', price: 12.00, unit: 'L' }] },
  ],
  orderHistory: [
    { id: 'PO-001', supplier: 'Tokyo Fish Market', items: 4, total: 680.00, status: 'Delivered', date: 'Feb 5, 2026' },
    { id: 'PO-002', supplier: 'Asian Pantry Co', items: 5, total: 315.00, status: 'Delivered', date: 'Feb 4, 2026' },
    { id: 'PO-003', supplier: 'Garden Fresh Produce', items: 4, total: 185.00, status: 'In Transit', date: 'Feb 6, 2026' },
    { id: 'PO-004', supplier: 'Nippon Premium Meats', items: 3, total: 920.00, status: 'Processing', date: 'Feb 7, 2026' },
    { id: 'PO-005', supplier: 'Wasabi & Co', items: 3, total: 245.00, status: 'Delivered', date: 'Feb 3, 2026' },
  ],
  serverNames: ['Yuki T.', 'Kenji M.', 'Aiko S.'],
  customerNames: ['Tanaka H.', 'Sato K.', 'Yamamoto R.', 'Suzuki N.', 'Watanabe A.', 'Kimura Y.'],
  topDishesToday: [
    { name: 'Salmon Nigiri', orders: 30, trend: 8.5 },
    { name: 'Tonkotsu Ramen', orders: 28, trend: 9.4 },
    { name: 'Miso Soup', orders: 25, trend: 2.0 },
    { name: 'Edamame', orders: 22, trend: 3.2 },
    { name: 'Dragon Roll', orders: 20, trend: 11.2 },
  ],
  dailyBriefing: `Konnichiwa! Here's your inventory briefing for Sakura Japanese Kitchen:

**Priority Items:**
- **Sushi-Grade Tuna** is at CRITICAL risk with only 1 day of cover. Order from Tokyo Fish Market immediately.
- **Dashi Stock** is running low at URGENT — essential for miso soup and ramen tonight. Contact Wasabi & Co.
- **Sushi-Grade Salmon** and **Yellowtail** show URGENT risk. Weekend omakase reservations are strong.

**Menu Insights:**
- **Salmon Nigiri** is your #1 seller (190 orders/wk, +8.5%) — driving salmon demand.
- **Tonkotsu Ramen** is #2 (180/wk, +9.4%) — pork belly and dashi usage is high.
- **Dragon Roll** trending up fast (+11.2%) — avocado needs monitoring.

**Today's Outlook:**
- 3 items need immediate attention
- Friday evening: Expecting 150+ covers, sushi bar fully booked
- Ramen specials trending up 20% this week

**Recommendation:** Place urgent fish order before noon for same-day delivery. Feature Chicken Teriyaki to reduce pressure on fish stocks tonight.`,
  deliveryOrders: [
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Preparing', customer: 'Tanaka H.', total: 72.00, items: 'Dragon Roll, Tonkotsu Ramen', color: 'from-red-500 to-red-600' },
    { platform: 'Uber Eats', label: 'UE', labelColor: 'bg-green-500 text-white', status: 'Confirmed', customer: 'Sato K.', total: 98.50, items: 'Wagyu Tataki, Salmon Nigiri x2', color: 'from-green-500 to-emerald-600' },
    { platform: 'Grubhub', label: 'GH', labelColor: 'bg-orange-500 text-white', status: 'Out for Delivery', customer: 'Suzuki N.', total: 58.00, items: 'Chicken Teriyaki, Miso Soup', color: 'from-orange-500 to-red-500' },
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Pending', customer: 'Kimura Y.', total: 115.00, items: 'Omakase Set, Sake Flight', color: 'from-red-500 to-red-600' },
  ],
  smartSuggestions: [
    { ingredient: 'Sushi-Grade Tuna', supplier: 'Tokyo Fish Market', qty: '15 lb', cost: '$480.00', urgency: 'critical' },
    { ingredient: 'Dashi Stock', supplier: 'Wasabi & Co', qty: '10 L', cost: '$120.00', urgency: 'urgent' },
    { ingredient: 'Sushi-Grade Salmon', supplier: 'Tokyo Fish Market', qty: '20 lb', cost: '$480.00', urgency: 'normal' },
  ],
  takeoutOrders: [
    { id: 'TO-001', customerName: 'Tanaka H.', phone: '(555) 123-4567', pickupTime: '15 min', items: [{ name: 'Dragon Roll', quantity: 2 }, { name: 'Miso Soup', quantity: 2 }], total: 56.00, status: 'preparing', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'TO-002', customerName: 'Sato K.', phone: '(555) 234-5678', pickupTime: '30 min', items: [{ name: 'Tonkotsu Ramen', quantity: 2 }, { name: 'Gyoza', quantity: 1 }], total: 50.00, status: 'pending', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'TO-003', customerName: 'Yamamoto R.', phone: '(555) 345-6789', pickupTime: '45 min', items: [{ name: 'Salmon Nigiri', quantity: 3 }], total: 48.00, status: 'ready', createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
  ],
  deliveryPlatformOrders: [
    { id: 'DEL-001', platform: 'doordash', platformId: 'DD-SKR91E', customerName: 'Suzuki N.', items: [{ name: 'Tonkotsu Ramen', quantity: 1, price: 19.00 }, { name: 'Gyoza', quantity: 1, price: 12.00 }], total: 36.22, status: 'preparing', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'DEL-002', platform: 'uber_eats', platformId: 'UE-SKR82F', customerName: 'Watanabe A.', items: [{ name: 'Dragon Roll', quantity: 2, price: 44.00 }], total: 51.45, status: 'received', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'DEL-003', platform: 'grubhub', platformId: 'GH-SKR93A', customerName: 'Kimura Y.', items: [{ name: 'Wagyu Tataki', quantity: 1, price: 38.00 }], total: 45.27, status: 'ready', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'DEL-004', platform: 'doordash', platformId: 'DD-SKR04B', customerName: 'Tanaka H.', items: [{ name: 'Salmon Nigiri', quantity: 2, price: 32.00 }, { name: 'Shrimp Tempura', quantity: 1, price: 20.00 }], total: 61.57, status: 'picked_up', createdAt: new Date(Date.now() - 35 * 60000).toISOString() },
  ],
  chatIngredientKeywords: [
    'tuna', 'salmon', 'yellowtail', 'hamachi', 'wagyu', 'chicken',
    'pork belly', 'shrimp', 'ebi', 'sushi rice', 'nori', 'soy sauce',
    'mirin', 'rice vinegar', 'miso', 'dashi', 'wasabi', 'ginger',
    'avocado', 'edamame', 'shiitake', 'daikon', 'tofu', 'sesame',
    'ramen', 'tempura', 'panko', 'sake', 'matcha', 'cucumber',
  ],
  initialChatMessage: "Konnichiwa! I'm your AI assistant for Sakura Japanese Kitchen. I can help with:\n\n- **Inventory** - Stock levels, forecasts, reorder recommendations\n- **AI Agents** - Risk assessment, optimization decisions\n- **Menu** - Sushi, ramen, dishes, recipes, pricing\n- **Orders** - POS, delivery platforms\n- **Payments** - Including Solana Pay crypto\n- **Suppliers** - Lead times, reliability\n\nWhat would you like to know?",
  restaurantSettings: {
    name: 'Sakura Japanese Kitchen',
    address: '789 Sakura Lane, Athens, GA 30601',
    phone: '(706) 555-0198',
    email: 'info@sakurakitchen.com',
  },
  demoUsers: {
    restaurant_admin: { name: 'Takeshi Yamada', email: 'admin@sakura.com', restaurant: 'Sakura Japanese Kitchen', restaurantKey: 'REST-SKR2026-ATHNS' },
    manager: { name: 'Yuki Tanaka', email: 'yuki@sakura.com', restaurant: 'Sakura Japanese Kitchen', managerId: 'MGR-YUKI26-SAKRA' },
    pos_user: { name: 'Kenji Server', email: 'kenji@sakura.com', restaurant: 'Sakura Japanese Kitchen' },
  },
}

// ============================================================
// Template registry and exports
// ============================================================
const templates: Record<string, CuisineTemplate> = {
  mediterranean,
  japanese,
}

export const CUISINE_OPTIONS: { key: string; label: string; flag: string; restaurantName: string }[] = [
  { key: 'mediterranean', label: 'Mediterranean', flag: 'GR', restaurantName: 'Mykonos Mediterranean' },
  { key: 'japanese', label: 'Japanese', flag: 'JP', restaurantName: 'Sakura Japanese Kitchen' },
  { key: 'mexican', label: 'Mexican', flag: 'MX', restaurantName: 'Casa del Sol' },
  { key: 'indian', label: 'Indian', flag: 'IN', restaurantName: 'Spice Route' },
  { key: 'italian', label: 'Italian', flag: 'IT', restaurantName: 'Trattoria Bella' },
  { key: 'american_bbq', label: 'Southern BBQ', flag: 'US', restaurantName: 'Magnolia Smokehouse' },
]

export function getCuisineTemplate(key: string): CuisineTemplate {
  return templates[key] || templates.mediterranean
}
