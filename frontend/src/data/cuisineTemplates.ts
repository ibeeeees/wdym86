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
    restaurant_admin: { name: 'Ibe Mohammed Ali', email: 'admin@mykonos.com', restaurant: 'Mykonos Mediterranean', restaurantKey: 'REST-MYK2026-ATHNS' },
    manager: { name: 'Carter Tierney', email: 'manager@mykonos.com', restaurant: 'Mykonos Mediterranean', managerId: 'MGR-CART26-MYKNS' },
    pos_user: { name: 'Shaw Tesafye', email: 'pos@mykonos.com', restaurant: 'Mykonos Mediterranean' },
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
    address: '789 Sakura Lane, San Francisco, CA 94102',
    phone: '(415) 555-0198',
    email: 'info@sakurakitchensf.com',
  },
  demoUsers: {
    restaurant_admin: { name: 'Ibe Mohammed Ali', email: 'admin@sakura.com', restaurant: 'Sakura Japanese Kitchen', restaurantKey: 'REST-SKR2026-SANFR' },
    manager: { name: 'Carter Tierney', email: 'manager@sakura.com', restaurant: 'Sakura Japanese Kitchen', managerId: 'MGR-CART26-SAKRA' },
    pos_user: { name: 'Shaw Tesafye', email: 'pos@sakura.com', restaurant: 'Sakura Japanese Kitchen' },
  },
}

// ============================================================
// MEXICAN (Casa del Sol)
// ============================================================
const mexican: CuisineTemplate = {
  key: 'mexican',
  label: 'Mexican',
  flag: 'MX',
  restaurantName: 'Casa del Sol',
  country: 'Mexico',
  genre: 'full_service',
  ingredients: [
    { id: '1', name: 'Carne Asada (Flank)', category: 'meat', current_inventory: 35, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.18, trend: 6 },
    { id: '2', name: 'Carnitas (Pork Shoulder)', category: 'meat', current_inventory: 28, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.40, trend: -14 },
    { id: '3', name: 'Al Pastor (Marinated Pork)', category: 'meat', current_inventory: 20, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.38, trend: -10 },
    { id: '4', name: 'Chorizo', category: 'meat', current_inventory: 18, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.16, trend: 3 },
    { id: '5', name: 'Chicken Thighs', category: 'meat', current_inventory: 55, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 2 },
    { id: '6', name: 'Shrimp (Large)', category: 'meat', current_inventory: 14, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.65, trend: -22 },
    { id: '7', name: 'Birria Beef (Chuck)', category: 'meat', current_inventory: 22, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.32, trend: -8 },
    { id: '8', name: 'Queso Fresco', category: 'dairy', current_inventory: 20, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.20, trend: -6 },
    { id: '9', name: 'Crema Mexicana', category: 'dairy', current_inventory: 12, unit: 'liters', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.30, trend: -9 },
    { id: '10', name: 'Oaxaca Cheese', category: 'dairy', current_inventory: 15, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.17, trend: -4 },
    { id: '11', name: 'Avocados', category: 'produce', current_inventory: 8, unit: 'cases', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.70, trend: -25 },
    { id: '12', name: 'Tomatillos', category: 'produce', current_inventory: 30, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.08, trend: 3 },
    { id: '13', name: 'Jalapenos', category: 'produce', current_inventory: 25, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.06, trend: 2 },
    { id: '14', name: 'Serrano Peppers', category: 'produce', current_inventory: 15, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 0 },
    { id: '15', name: 'Cilantro', category: 'produce', current_inventory: 10, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 3, stockout_prob: 0.22, trend: -7 },
    { id: '16', name: 'Limes', category: 'produce', current_inventory: 65, unit: 'units', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.07, trend: 4 },
    { id: '17', name: 'White Onions', category: 'produce', current_inventory: 50, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.03, trend: 0 },
    { id: '18', name: 'Roma Tomatoes', category: 'produce', current_inventory: 60, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.04, trend: 2 },
    { id: '19', name: 'Poblano Peppers', category: 'produce', current_inventory: 18, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.09, trend: 5 },
    { id: '20', name: 'Corn Tortillas', category: 'dry', current_inventory: 10, unit: 'cases', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.58, trend: -20 },
    { id: '21', name: 'Flour Tortillas', category: 'dry', current_inventory: 45, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.06, trend: 2 },
    { id: '22', name: 'Black Beans', category: 'dry', current_inventory: 40, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
    { id: '23', name: 'Pinto Beans', category: 'dry', current_inventory: 35, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.03, trend: 0 },
    { id: '24', name: 'Mexican Rice', category: 'dry', current_inventory: 55, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 14, stockout_prob: 0.01, trend: 0 },
    { id: '25', name: 'Chipotle Peppers (Canned)', category: 'dry', current_inventory: 20, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 9, stockout_prob: 0.04, trend: 3 },
    { id: '26', name: 'Ancho Chiles (Dried)', category: 'dry', current_inventory: 12, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.06, trend: 0 },
    { id: '27', name: 'Mexican Chocolate', category: 'dry', current_inventory: 8, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.05, trend: 5 },
    { id: '28', name: 'Masa Harina', category: 'dry', current_inventory: 30, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 11, stockout_prob: 0.03, trend: 0 },
    { id: '29', name: 'Tequila Reposado', category: 'dry', current_inventory: 10, unit: 'bottles', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.08, trend: 6 },
    { id: '30', name: 'Mezcal', category: 'dry', current_inventory: 6, unit: 'bottles', risk_level: 'SAFE', days_of_cover: 9, stockout_prob: 0.05, trend: 8 },
  ],
  dishIngredients: [
    { id: '1', name: 'Carne Asada', unit: 'lbs' }, { id: '2', name: 'Carnitas', unit: 'lbs' },
    { id: '3', name: 'Al Pastor', unit: 'lbs' }, { id: '4', name: 'Chorizo', unit: 'lbs' },
    { id: '5', name: 'Chicken Thighs', unit: 'lbs' }, { id: '6', name: 'Shrimp', unit: 'lbs' },
    { id: '7', name: 'Birria Beef', unit: 'lbs' }, { id: '8', name: 'Queso Fresco', unit: 'lbs' },
    { id: '9', name: 'Crema Mexicana', unit: 'liters' }, { id: '10', name: 'Oaxaca Cheese', unit: 'lbs' },
    { id: '11', name: 'Avocados', unit: 'units' }, { id: '12', name: 'Tomatillos', unit: 'lbs' },
    { id: '13', name: 'Jalapenos', unit: 'lbs' }, { id: '14', name: 'Serrano Peppers', unit: 'lbs' },
    { id: '15', name: 'Cilantro', unit: 'lbs' }, { id: '16', name: 'Limes', unit: 'units' },
    { id: '17', name: 'White Onions', unit: 'lbs' }, { id: '18', name: 'Roma Tomatoes', unit: 'lbs' },
    { id: '19', name: 'Poblano Peppers', unit: 'lbs' }, { id: '20', name: 'Corn Tortillas', unit: 'units' },
    { id: '21', name: 'Flour Tortillas', unit: 'units' }, { id: '22', name: 'Black Beans', unit: 'lbs' },
    { id: '23', name: 'Pinto Beans', unit: 'lbs' }, { id: '24', name: 'Mexican Rice', unit: 'lbs' },
    { id: '25', name: 'Chipotle Peppers', unit: 'lbs' }, { id: '26', name: 'Ancho Chiles', unit: 'lbs' },
    { id: '27', name: 'Mexican Chocolate', unit: 'lbs' }, { id: '28', name: 'Masa Harina', unit: 'lbs' },
    { id: '29', name: 'Hominy (Pozole)', unit: 'lbs' }, { id: '30', name: 'Cotija Cheese', unit: 'lbs' },
  ],
  dishes: [
    { id: '1', name: 'Tacos al Pastor', category: 'Entree - Tacos', price: 16.00, is_active: true, recipe: [{ id: '1', ingredient_id: '3', ingredient_name: 'Al Pastor', quantity: 0.5, unit: 'lbs' }, { id: '2', ingredient_id: '20', ingredient_name: 'Corn Tortillas', quantity: 3, unit: 'units' }, { id: '3', ingredient_id: '15', ingredient_name: 'Cilantro', quantity: 0.05, unit: 'lbs' }, { id: '4', ingredient_id: '17', ingredient_name: 'White Onions', quantity: 0.1, unit: 'lbs' }, { id: '5', ingredient_id: '16', ingredient_name: 'Limes', quantity: 1, unit: 'units' }], orders_today: 35, orders_7d: 210, orders_30d: 840, trend: 12.5, popularity_rank: 1, daily_orders: [26, 28, 30, 32, 35, 38, 21], revenue_7d: 3360 },
    { id: '2', name: 'Carnitas Burrito', category: 'Entree - Burritos', price: 18.00, is_active: true, recipe: [{ id: '6', ingredient_id: '2', ingredient_name: 'Carnitas', quantity: 0.75, unit: 'lbs' }, { id: '7', ingredient_id: '21', ingredient_name: 'Flour Tortillas', quantity: 1, unit: 'units' }, { id: '8', ingredient_id: '24', ingredient_name: 'Mexican Rice', quantity: 0.3, unit: 'lbs' }, { id: '9', ingredient_id: '22', ingredient_name: 'Black Beans', quantity: 0.25, unit: 'lbs' }, { id: '10', ingredient_id: '9', ingredient_name: 'Crema Mexicana', quantity: 0.05, unit: 'liters' }], orders_today: 28, orders_7d: 175, orders_30d: 700, trend: 8.3, popularity_rank: 2, daily_orders: [22, 24, 25, 26, 28, 30, 20], revenue_7d: 3150 },
    { id: '3', name: 'Enchiladas Rojas', category: 'Entree - Platos Fuertes', price: 20.00, is_active: true, recipe: [{ id: '11', ingredient_id: '5', ingredient_name: 'Chicken Thighs', quantity: 0.5, unit: 'lbs' }, { id: '12', ingredient_id: '20', ingredient_name: 'Corn Tortillas', quantity: 3, unit: 'units' }, { id: '13', ingredient_id: '26', ingredient_name: 'Ancho Chiles', quantity: 0.1, unit: 'lbs' }, { id: '14', ingredient_id: '8', ingredient_name: 'Queso Fresco', quantity: 0.2, unit: 'lbs' }, { id: '15', ingredient_id: '9', ingredient_name: 'Crema Mexicana', quantity: 0.05, unit: 'liters' }], orders_today: 22, orders_7d: 140, orders_30d: 560, trend: 4.2, popularity_rank: 4, daily_orders: [18, 19, 20, 21, 22, 24, 16], revenue_7d: 2800 },
    { id: '4', name: 'Mole Poblano', category: 'Entree - Platos Fuertes', price: 26.00, is_active: true, recipe: [{ id: '16', ingredient_id: '5', ingredient_name: 'Chicken Thighs', quantity: 0.75, unit: 'lbs' }, { id: '17', ingredient_id: '26', ingredient_name: 'Ancho Chiles', quantity: 0.15, unit: 'lbs' }, { id: '18', ingredient_id: '27', ingredient_name: 'Mexican Chocolate', quantity: 0.1, unit: 'lbs' }, { id: '19', ingredient_id: '24', ingredient_name: 'Mexican Rice', quantity: 0.3, unit: 'lbs' }], orders_today: 15, orders_7d: 95, orders_30d: 380, trend: 3.5, popularity_rank: 7, daily_orders: [12, 13, 14, 14, 16, 18, 8], revenue_7d: 2470 },
    { id: '5', name: 'Chile Relleno', category: 'Entree - Platos Fuertes', price: 22.00, is_active: true, recipe: [{ id: '20', ingredient_id: '19', ingredient_name: 'Poblano Peppers', quantity: 0.5, unit: 'lbs' }, { id: '21', ingredient_id: '10', ingredient_name: 'Oaxaca Cheese', quantity: 0.3, unit: 'lbs' }, { id: '22', ingredient_id: '18', ingredient_name: 'Roma Tomatoes', quantity: 0.3, unit: 'lbs' }, { id: '23', ingredient_id: '9', ingredient_name: 'Crema Mexicana', quantity: 0.05, unit: 'liters' }], orders_today: 14, orders_7d: 88, orders_30d: 350, trend: -2.1, popularity_rank: 8, daily_orders: [12, 13, 13, 14, 14, 15, 7], revenue_7d: 1936 },
    { id: '6', name: 'Ceviche', category: 'Appetizer', price: 18.00, is_active: true, recipe: [{ id: '24', ingredient_id: '6', ingredient_name: 'Shrimp', quantity: 0.5, unit: 'lbs' }, { id: '25', ingredient_id: '16', ingredient_name: 'Limes', quantity: 3, unit: 'units' }, { id: '26', ingredient_id: '15', ingredient_name: 'Cilantro', quantity: 0.05, unit: 'lbs' }, { id: '27', ingredient_id: '14', ingredient_name: 'Serrano Peppers', quantity: 0.05, unit: 'lbs' }, { id: '28', ingredient_id: '17', ingredient_name: 'White Onions', quantity: 0.1, unit: 'lbs' }], orders_today: 18, orders_7d: 115, orders_30d: 460, trend: 6.8, popularity_rank: 6, daily_orders: [14, 16, 17, 18, 20, 21, 9], revenue_7d: 2070 },
    { id: '7', name: 'Guacamole & Chips', category: 'Appetizer', price: 14.00, is_active: true, recipe: [{ id: '29', ingredient_id: '11', ingredient_name: 'Avocados', quantity: 3, unit: 'units' }, { id: '30', ingredient_id: '16', ingredient_name: 'Limes', quantity: 2, unit: 'units' }, { id: '31', ingredient_id: '15', ingredient_name: 'Cilantro', quantity: 0.05, unit: 'lbs' }, { id: '32', ingredient_id: '13', ingredient_name: 'Jalapenos', quantity: 0.05, unit: 'lbs' }, { id: '33', ingredient_id: '17', ingredient_name: 'White Onions', quantity: 0.1, unit: 'lbs' }], orders_today: 30, orders_7d: 185, orders_30d: 740, trend: 9.8, popularity_rank: 3, daily_orders: [24, 26, 27, 28, 30, 32, 18], revenue_7d: 2590 },
    { id: '8', name: 'Quesadilla', category: 'Entree - Tacos', price: 15.00, is_active: true, recipe: [{ id: '34', ingredient_id: '10', ingredient_name: 'Oaxaca Cheese', quantity: 0.3, unit: 'lbs' }, { id: '35', ingredient_id: '21', ingredient_name: 'Flour Tortillas', quantity: 2, unit: 'units' }, { id: '36', ingredient_id: '4', ingredient_name: 'Chorizo', quantity: 0.25, unit: 'lbs' }, { id: '37', ingredient_id: '9', ingredient_name: 'Crema Mexicana', quantity: 0.03, unit: 'liters' }], orders_today: 20, orders_7d: 130, orders_30d: 520, trend: 5.0, popularity_rank: 5, daily_orders: [16, 18, 19, 20, 22, 24, 11], revenue_7d: 1950 },
    { id: '9', name: 'Pozole Rojo', category: 'Entree - Platos Fuertes', price: 19.00, is_active: true, recipe: [{ id: '38', ingredient_id: '2', ingredient_name: 'Carnitas', quantity: 0.5, unit: 'lbs' }, { id: '39', ingredient_id: '29', ingredient_name: 'Hominy (Pozole)', quantity: 0.4, unit: 'lbs' }, { id: '40', ingredient_id: '26', ingredient_name: 'Ancho Chiles', quantity: 0.1, unit: 'lbs' }, { id: '41', ingredient_id: '15', ingredient_name: 'Cilantro', quantity: 0.05, unit: 'lbs' }, { id: '42', ingredient_id: '16', ingredient_name: 'Limes', quantity: 1, unit: 'units' }], orders_today: 12, orders_7d: 78, orders_30d: 310, trend: -4.5, popularity_rank: 9, daily_orders: [11, 11, 12, 12, 13, 13, 6], revenue_7d: 1482 },
    { id: '10', name: 'Birria Tacos', category: 'Entree - Tacos', price: 19.00, is_active: true, recipe: [{ id: '43', ingredient_id: '7', ingredient_name: 'Birria Beef', quantity: 0.5, unit: 'lbs' }, { id: '44', ingredient_id: '20', ingredient_name: 'Corn Tortillas', quantity: 3, unit: 'units' }, { id: '45', ingredient_id: '15', ingredient_name: 'Cilantro', quantity: 0.05, unit: 'lbs' }, { id: '46', ingredient_id: '17', ingredient_name: 'White Onions', quantity: 0.1, unit: 'lbs' }, { id: '47', ingredient_id: '16', ingredient_name: 'Limes', quantity: 1, unit: 'units' }], orders_today: 24, orders_7d: 155, orders_30d: 620, trend: 15.2, popularity_rank: 10, daily_orders: [18, 20, 22, 24, 26, 28, 17], revenue_7d: 2945 },
    { id: '11', name: 'Churros', category: 'Dessert', price: 10.00, is_active: true, recipe: [{ id: '48', ingredient_id: '28', ingredient_name: 'Masa Harina', quantity: 0.3, unit: 'lbs' }, { id: '49', ingredient_id: '27', ingredient_name: 'Mexican Chocolate', quantity: 0.1, unit: 'lbs' }], orders_today: 20, orders_7d: 125, orders_30d: 500, trend: 7.5, popularity_rank: 11, daily_orders: [16, 17, 18, 19, 20, 22, 13], revenue_7d: 1250 },
    { id: '12', name: 'Tres Leches', category: 'Dessert', price: 12.00, is_active: true, recipe: [{ id: '50', ingredient_id: '9', ingredient_name: 'Crema Mexicana', quantity: 0.15, unit: 'liters' }, { id: '51', ingredient_id: '15', ingredient_name: 'Cilantro', quantity: 0.01, unit: 'lbs' }, { id: '52', ingredient_id: '30', ingredient_name: 'Cotija Cheese', quantity: 0.05, unit: 'lbs' }], orders_today: 14, orders_7d: 90, orders_30d: 360, trend: 2.8, popularity_rank: 12, daily_orders: [12, 12, 13, 13, 14, 16, 10], revenue_7d: 1080 },
  ],
  menuItems: [
    { id: '1', name: 'Guacamole & Chips', price: 14.00, category: 'Antojitos', popular: true }, { id: '2', name: 'Ceviche', price: 18.00, category: 'Antojitos', popular: true }, { id: '3', name: 'Queso Fundido', price: 13.00, category: 'Antojitos' }, { id: '4', name: 'Elote (Street Corn)', price: 8.00, category: 'Antojitos' }, { id: '5', name: 'Sopa de Tortilla', price: 10.00, category: 'Antojitos' },
    { id: '6', name: 'Tacos al Pastor', price: 16.00, category: 'Tacos', popular: true }, { id: '7', name: 'Birria Tacos', price: 19.00, category: 'Tacos', popular: true }, { id: '8', name: 'Carne Asada Tacos', price: 17.00, category: 'Tacos' }, { id: '9', name: 'Fish Tacos', price: 16.00, category: 'Tacos' }, { id: '10', name: 'Quesadilla', price: 15.00, category: 'Tacos', popular: true },
    { id: '11', name: 'Carnitas Burrito', price: 18.00, category: 'Platos Fuertes', popular: true }, { id: '12', name: 'Enchiladas Rojas', price: 20.00, category: 'Platos Fuertes', popular: true }, { id: '13', name: 'Mole Poblano', price: 26.00, category: 'Platos Fuertes' }, { id: '14', name: 'Chile Relleno', price: 22.00, category: 'Platos Fuertes' }, { id: '15', name: 'Pozole Rojo', price: 19.00, category: 'Platos Fuertes' }, { id: '16', name: 'Camarones a la Diabla', price: 24.00, category: 'Platos Fuertes' }, { id: '17', name: 'Fajitas Mixtas', price: 28.00, category: 'Platos Fuertes' }, { id: '18', name: 'Tamales (3pc)', price: 15.00, category: 'Platos Fuertes' },
    { id: '19', name: 'Margarita Clasica', price: 14.00, category: 'Bebidas', popular: true }, { id: '20', name: 'Paloma', price: 13.00, category: 'Bebidas' }, { id: '21', name: 'Mezcal Flight', price: 22.00, category: 'Bebidas' }, { id: '22', name: 'Horchata', price: 6.00, category: 'Bebidas' }, { id: '23', name: 'Agua de Jamaica', price: 5.00, category: 'Bebidas' }, { id: '24', name: 'Mexican Beer', price: 7.00, category: 'Bebidas' },
    { id: '25', name: 'Churros', price: 10.00, category: 'Postres', popular: true }, { id: '26', name: 'Tres Leches', price: 12.00, category: 'Postres', popular: true }, { id: '27', name: 'Flan', price: 9.00, category: 'Postres' }, { id: '28', name: 'Sopapillas', price: 8.00, category: 'Postres' },
  ],
  posCategories: ['Antojitos', 'Tacos', 'Platos Fuertes', 'Bebidas', 'Postres'],
  suppliers: [
    { id: '1', name: 'Mercado del Sol Imports', lead_time_days: 2, min_order_quantity: 50, reliability_score: 0.97, shipping_cost: 40, ingredients: ['Ancho Chiles', 'Chipotle Peppers', 'Mexican Chocolate', 'Masa Harina', 'Corn Tortillas'], pricing: [{ ingredient: 'Ancho Chiles', price: 12.00, unit: 'lb' }, { ingredient: 'Chipotle Peppers', price: 8.50, unit: 'lb' }, { ingredient: 'Mexican Chocolate', price: 14.00, unit: 'lb' }, { ingredient: 'Masa Harina', price: 2.80, unit: 'lb' }, { ingredient: 'Corn Tortillas', price: 18.00, unit: 'case' }] },
    { id: '2', name: 'Rancho Fresco Produce', lead_time_days: 1, min_order_quantity: 25, reliability_score: 0.95, shipping_cost: 20, ingredients: ['Avocados', 'Tomatillos', 'Jalapenos', 'Serranos', 'Cilantro', 'Limes', 'Poblanos'], pricing: [{ ingredient: 'Avocados', price: 42.00, unit: 'case' }, { ingredient: 'Tomatillos', price: 2.50, unit: 'lb' }, { ingredient: 'Jalapenos', price: 1.80, unit: 'lb' }, { ingredient: 'Cilantro', price: 3.50, unit: 'lb' }, { ingredient: 'Limes', price: 0.25, unit: 'unit' }, { ingredient: 'Poblanos', price: 3.00, unit: 'lb' }] },
    { id: '3', name: 'Carniceria El Toro', lead_time_days: 1, min_order_quantity: 30, reliability_score: 0.96, shipping_cost: 35, ingredients: ['Carne Asada', 'Carnitas', 'Al Pastor', 'Chorizo', 'Birria Beef'], pricing: [{ ingredient: 'Carne Asada', price: 9.50, unit: 'lb' }, { ingredient: 'Carnitas', price: 7.00, unit: 'lb' }, { ingredient: 'Al Pastor', price: 8.00, unit: 'lb' }, { ingredient: 'Chorizo', price: 6.50, unit: 'lb' }, { ingredient: 'Birria Beef', price: 10.00, unit: 'lb' }] },
    { id: '4', name: 'Costa Mariscos', lead_time_days: 1, min_order_quantity: 20, reliability_score: 0.94, shipping_cost: 50, ingredients: ['Shrimp', 'Tilapia', 'Mahi-Mahi'], pricing: [{ ingredient: 'Shrimp (Large)', price: 16.00, unit: 'lb' }, { ingredient: 'Tilapia', price: 8.50, unit: 'lb' }, { ingredient: 'Mahi-Mahi', price: 14.00, unit: 'lb' }] },
    { id: '5', name: 'Tequila & Spirits MX', lead_time_days: 3, min_order_quantity: 12, reliability_score: 0.93, shipping_cost: 0, ingredients: ['Tequila Reposado', 'Mezcal', 'Mexican Beer', 'Tamarind Syrup'], pricing: [{ ingredient: 'Tequila Reposado', price: 35.00, unit: 'btl' }, { ingredient: 'Mezcal', price: 48.00, unit: 'btl' }, { ingredient: 'Mexican Beer', price: 2.50, unit: 'btl' }] },
    { id: '6', name: 'Queseria La Abuela', lead_time_days: 2, min_order_quantity: 20, reliability_score: 0.96, shipping_cost: 25, ingredients: ['Queso Fresco', 'Oaxaca Cheese', 'Crema Mexicana', 'Cotija Cheese'], pricing: [{ ingredient: 'Queso Fresco', price: 6.50, unit: 'lb' }, { ingredient: 'Oaxaca Cheese', price: 8.00, unit: 'lb' }, { ingredient: 'Crema Mexicana', price: 5.50, unit: 'L' }, { ingredient: 'Cotija Cheese', price: 9.00, unit: 'lb' }] },
  ],
  orderHistory: [
    { id: 'PO-001', supplier: 'Carniceria El Toro', items: 5, total: 625.00, status: 'Delivered', date: 'Feb 5, 2026' },
    { id: 'PO-002', supplier: 'Costa Mariscos', items: 3, total: 480.00, status: 'Delivered', date: 'Feb 4, 2026' },
    { id: 'PO-003', supplier: 'Rancho Fresco Produce', items: 6, total: 310.00, status: 'In Transit', date: 'Feb 6, 2026' },
    { id: 'PO-004', supplier: 'Mercado del Sol Imports', items: 4, total: 420.00, status: 'Processing', date: 'Feb 7, 2026' },
    { id: 'PO-005', supplier: 'Queseria La Abuela', items: 4, total: 275.00, status: 'Delivered', date: 'Feb 3, 2026' },
  ],
  serverNames: ['Rosa M.', 'Javier L.', 'Lucia P.'],
  customerNames: ['Alejandro G.', 'Valentina R.', 'Diego H.', 'Sofia C.', 'Mateo L.', 'Camila F.'],
  topDishesToday: [
    { name: 'Tacos al Pastor', orders: 35, trend: 12.5 }, { name: 'Guacamole & Chips', orders: 30, trend: 9.8 }, { name: 'Carnitas Burrito', orders: 28, trend: 8.3 }, { name: 'Birria Tacos', orders: 24, trend: 15.2 }, { name: 'Enchiladas Rojas', orders: 22, trend: 4.2 },
  ],
  dailyBriefing: `Hola! Here's your inventory briefing for Casa del Sol:\n\n**Priority Items:**\n- **Avocados** are at CRITICAL risk with only 1 day of cover remaining. Guacamole is your #3 seller and drives 185 orders per week. Order from Rancho Fresco Produce immediately.\n- **Corn Tortillas** are CRITICAL at 1 day of cover. They're essential for Tacos al Pastor, Birria Tacos, and Enchiladas. Contact Mercado del Sol Imports for emergency restock.\n- **Shrimp (Large)** is CRITICAL with 1 day of cover. Ceviche orders are trending up +6.8% and weekend demand will spike.\n- **Carnitas** and **Al Pastor** show URGENT risk. Weekend taco demand is projected 35% above weekday average.\n\n**Menu Insights:**\n- **Tacos al Pastor** is your #1 seller (210 orders/wk, +12.5%) driving heavy Al Pastor and Corn Tortilla demand.\n- **Birria Tacos** are surging (+15.2%) consider featuring as a weekend special.\n- **Guacamole & Chips** remains a top appetizer (185/wk, +9.8%) avocado supply is the bottleneck.\n\n**Today's Outlook:**\n- 5 items need immediate attention\n- Friday evening: Expecting 200+ covers\n- Margarita specials driving lime usage up 15% this week\n\n**Recommendation:** Place urgent orders before 1 PM for same-day delivery. Feature Mole Poblano and Chile Relleno as specials to diversify demand away from tacos.`,
  deliveryOrders: [
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Preparing', customer: 'Alejandro G.', total: 68.50, items: 'Tacos al Pastor, Guacamole & Chips', color: 'from-red-500 to-red-600' },
    { platform: 'Uber Eats', label: 'UE', labelColor: 'bg-green-500 text-white', status: 'Confirmed', customer: 'Valentina R.', total: 112.00, items: 'Birria Tacos x2, Carnitas Burrito, Margarita', color: 'from-green-500 to-emerald-600' },
    { platform: 'Grubhub', label: 'GH', labelColor: 'bg-orange-500 text-white', status: 'Out for Delivery', customer: 'Sofia C.', total: 74.90, items: 'Mole Poblano, Churros x2', color: 'from-orange-500 to-red-500' },
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Pending', customer: 'Mateo L.', total: 135.50, items: 'Fajitas Mixtas, Enchiladas Rojas, Tres Leches', color: 'from-red-500 to-red-600' },
  ],
  smartSuggestions: [
    { ingredient: 'Avocados', supplier: 'Rancho Fresco Produce', qty: '5 cases', cost: '$210.00', urgency: 'critical' },
    { ingredient: 'Corn Tortillas', supplier: 'Mercado del Sol Imports', qty: '8 cases', cost: '$144.00', urgency: 'urgent' },
    { ingredient: 'Carnitas', supplier: 'Carniceria El Toro', qty: '25 lb', cost: '$175.00', urgency: 'normal' },
  ],
  takeoutOrders: [
    { id: 'TO-001', customerName: 'Alejandro G.', phone: '(555) 123-4567', pickupTime: '15 min', items: [{ name: 'Tacos al Pastor', quantity: 3 }, { name: 'Guacamole & Chips', quantity: 1 }], total: 62.00, status: 'preparing', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'TO-002', customerName: 'Diego H.', phone: '(555) 234-5678', pickupTime: '30 min', items: [{ name: 'Carnitas Burrito', quantity: 2 }, { name: 'Churros', quantity: 1 }], total: 46.00, status: 'pending', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'TO-003', customerName: 'Camila F.', phone: '(555) 345-6789', pickupTime: '45 min', items: [{ name: 'Birria Tacos', quantity: 2 }, { name: 'Tres Leches', quantity: 1 }], total: 50.00, status: 'ready', createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
  ],
  deliveryPlatformOrders: [
    { id: 'DEL-001', platform: 'doordash', platformId: 'DD-CDS91E', customerName: 'Valentina R.', items: [{ name: 'Enchiladas Rojas', quantity: 1, price: 20.00 }, { name: 'Guacamole & Chips', quantity: 1, price: 14.00 }], total: 39.72, status: 'preparing', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'DEL-002', platform: 'uber_eats', platformId: 'UE-CDS82F', customerName: 'Sofia C.', items: [{ name: 'Tacos al Pastor', quantity: 2, price: 32.00 }, { name: 'Birria Tacos', quantity: 1, price: 19.00 }], total: 59.45, status: 'received', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'DEL-003', platform: 'grubhub', platformId: 'GH-CDS93A', customerName: 'Mateo L.', items: [{ name: 'Mole Poblano', quantity: 1, price: 26.00 }, { name: 'Tres Leches', quantity: 1, price: 12.00 }], total: 44.87, status: 'ready', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'DEL-004', platform: 'doordash', platformId: 'DD-CDS04B', customerName: 'Diego H.', items: [{ name: 'Carnitas Burrito', quantity: 2, price: 36.00 }, { name: 'Ceviche', quantity: 1, price: 18.00 }], total: 63.57, status: 'picked_up', createdAt: new Date(Date.now() - 35 * 60000).toISOString() },
  ],
  chatIngredientKeywords: ['carne asada', 'carnitas', 'al pastor', 'chorizo', 'birria', 'chicken', 'shrimp', 'queso fresco', 'oaxaca cheese', 'crema', 'avocado', 'tomatillo', 'jalapeno', 'serrano', 'cilantro', 'lime', 'onion', 'tomato', 'poblano', 'corn tortilla', 'flour tortilla', 'black beans', 'pinto beans', 'rice', 'chipotle', 'ancho chile', 'mole', 'masa', 'cotija', 'tequila', 'mezcal'],
  initialChatMessage: "Hola! I'm your AI assistant for Casa del Sol Mexican Restaurant. I can help with:\n\n- **Inventory** - Stock levels, forecasts, reorder recommendations\n- **AI Agents** - Risk assessment, optimization decisions\n- **Menu** - Tacos, burritos, platos fuertes, recipes, pricing\n- **Orders** - POS, delivery platforms\n- **Payments** - Including Solana Pay crypto\n- **Suppliers** - Lead times, reliability\n\nWhat would you like to know?",
  restaurantSettings: { name: 'Casa del Sol', address: '321 Sol Avenue, Austin, TX 78701', phone: '(512) 555-0187', email: 'info@casadelsolaustin.com' },
  demoUsers: {
    restaurant_admin: { name: 'Ibe Mohammed Ali', email: 'admin@casadelsol.com', restaurant: 'Casa del Sol', restaurantKey: 'REST-CDS2026-AUSTN' },
    manager: { name: 'Carter Tierney', email: 'manager@casadelsol.com', restaurant: 'Casa del Sol', managerId: 'MGR-CART26-CDSOL' },
    pos_user: { name: 'Shaw Tesafye', email: 'pos@casadelsol.com', restaurant: 'Casa del Sol' },
  },
}

// ============================================================
// INDIAN (Spice Route)
// ============================================================
const indian: CuisineTemplate = {
  key: 'indian',
  label: 'Indian',
  flag: 'IN',
  restaurantName: 'Spice Route',
  country: 'India',
  genre: 'full_service',
  ingredients: [
    { id: '1', name: 'Chicken Breast (Boneless)', category: 'meat', current_inventory: 55, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.06, trend: 4 },
    { id: '2', name: 'Chicken Thighs (Tikka Cut)', category: 'meat', current_inventory: 40, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.18, trend: -6 },
    { id: '3', name: 'Lamb Shoulder', category: 'meat', current_inventory: 18, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.42, trend: -14 },
    { id: '4', name: 'Lamb Keema (Ground)', category: 'meat', current_inventory: 12, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.65, trend: -20 },
    { id: '5', name: 'Jumbo Shrimp', category: 'meat', current_inventory: 22, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.20, trend: -5 },
    { id: '6', name: 'Paneer', category: 'dairy', current_inventory: 15, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.40, trend: -12 },
    { id: '7', name: 'Yogurt (Full Fat)', category: 'dairy', current_inventory: 35, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.08, trend: 2 },
    { id: '8', name: 'Ghee', category: 'dairy', current_inventory: 10, unit: 'liters', risk_level: 'CRITICAL', days_of_cover: 2, stockout_prob: 0.55, trend: -18 },
    { id: '9', name: 'Heavy Cream', category: 'dairy', current_inventory: 18, unit: 'liters', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.19, trend: -7 },
    { id: '10', name: 'Tomatoes (Roma)', category: 'produce', current_inventory: 80, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 9, stockout_prob: 0.04, trend: 3 },
    { id: '11', name: 'Fresh Spinach', category: 'produce', current_inventory: 20, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.30, trend: -10 },
    { id: '12', name: 'Fresh Ginger', category: 'produce', current_inventory: 12, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.15, trend: -3 },
    { id: '13', name: 'Garlic', category: 'produce', current_inventory: 15, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.07, trend: 0 },
    { id: '14', name: 'Green Chiles', category: 'produce', current_inventory: 8, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.22, trend: -5 },
    { id: '15', name: 'Fresh Cilantro', category: 'produce', current_inventory: 6, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 5, stockout_prob: 0.12, trend: 2 },
    { id: '16', name: 'Red Onions', category: 'produce', current_inventory: 70, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
    { id: '17', name: 'Potatoes', category: 'produce', current_inventory: 50, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.03, trend: 2 },
    { id: '18', name: 'Basmati Rice', category: 'dry', current_inventory: 85, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 14, stockout_prob: 0.01, trend: 0 },
    { id: '19', name: 'Naan Flour (Atta)', category: 'dry', current_inventory: 60, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.03, trend: 2 },
    { id: '20', name: 'Chickpeas (Dried)', category: 'dry', current_inventory: 45, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 18, stockout_prob: 0.01, trend: 0 },
    { id: '21', name: 'Red Lentils (Masoor Dal)', category: 'dry', current_inventory: 40, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 15, stockout_prob: 0.02, trend: 0 },
    { id: '22', name: 'Garam Masala', category: 'dry', current_inventory: 5, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.35, trend: -10 },
    { id: '23', name: 'Turmeric Powder', category: 'dry', current_inventory: 8, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.03, trend: 0 },
    { id: '24', name: 'Cumin Seeds', category: 'dry', current_inventory: 6, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.04, trend: 2 },
    { id: '25', name: 'Saffron', category: 'dry', current_inventory: 0.3, unit: 'oz', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.70, trend: -25 },
    { id: '26', name: 'Coconut Milk', category: 'dry', current_inventory: 24, unit: 'cans', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 3 },
    { id: '27', name: 'Tamarind Paste', category: 'dry', current_inventory: 5, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 14, stockout_prob: 0.02, trend: 0 },
    { id: '28', name: 'Mustard Seeds', category: 'dry', current_inventory: 4, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 16, stockout_prob: 0.02, trend: 0 },
    { id: '29', name: 'Cardamom Pods', category: 'dry', current_inventory: 3, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.16, trend: -4 },
    { id: '30', name: 'Mango Pulp', category: 'dry', current_inventory: 15, unit: 'cans', risk_level: 'SAFE', days_of_cover: 9, stockout_prob: 0.04, trend: 5 },
  ],
  dishIngredients: [
    { id: '1', name: 'Chicken Breast', unit: 'lbs' }, { id: '2', name: 'Chicken Thighs (Tikka)', unit: 'lbs' },
    { id: '3', name: 'Lamb Shoulder', unit: 'lbs' }, { id: '4', name: 'Lamb Keema', unit: 'lbs' },
    { id: '5', name: 'Jumbo Shrimp', unit: 'lbs' }, { id: '6', name: 'Paneer', unit: 'lbs' },
    { id: '7', name: 'Yogurt', unit: 'lbs' }, { id: '8', name: 'Ghee', unit: 'liters' },
    { id: '9', name: 'Heavy Cream', unit: 'liters' }, { id: '10', name: 'Tomatoes (Roma)', unit: 'lbs' },
    { id: '11', name: 'Fresh Spinach', unit: 'lbs' }, { id: '12', name: 'Fresh Ginger', unit: 'lbs' },
    { id: '13', name: 'Garlic', unit: 'lbs' }, { id: '14', name: 'Green Chiles', unit: 'lbs' },
    { id: '15', name: 'Fresh Cilantro', unit: 'lbs' }, { id: '16', name: 'Red Onions', unit: 'lbs' },
    { id: '17', name: 'Potatoes', unit: 'lbs' }, { id: '18', name: 'Basmati Rice', unit: 'lbs' },
    { id: '19', name: 'Naan Flour', unit: 'lbs' }, { id: '20', name: 'Chickpeas', unit: 'lbs' },
    { id: '21', name: 'Red Lentils', unit: 'lbs' }, { id: '22', name: 'Garam Masala', unit: 'lbs' },
    { id: '23', name: 'Turmeric', unit: 'lbs' }, { id: '24', name: 'Cumin Seeds', unit: 'lbs' },
    { id: '25', name: 'Saffron', unit: 'oz' }, { id: '26', name: 'Coconut Milk', unit: 'cans' },
    { id: '27', name: 'Tamarind Paste', unit: 'lbs' }, { id: '28', name: 'Cardamom Pods', unit: 'lbs' },
    { id: '29', name: 'Mango Pulp', unit: 'cans' }, { id: '30', name: 'Mustard Seeds', unit: 'lbs' },
  ],
  dishes: [
    { id: '1', name: 'Butter Chicken', category: 'Entree - Curry', price: 22.00, is_active: true, recipe: [{ id: '1', ingredient_id: '1', ingredient_name: 'Chicken Breast', quantity: 1.0, unit: 'lbs' }, { id: '2', ingredient_id: '10', ingredient_name: 'Tomatoes (Roma)', quantity: 0.5, unit: 'lbs' }, { id: '3', ingredient_id: '8', ingredient_name: 'Ghee', quantity: 0.1, unit: 'liters' }, { id: '4', ingredient_id: '9', ingredient_name: 'Heavy Cream', quantity: 0.15, unit: 'liters' }, { id: '5', ingredient_id: '22', ingredient_name: 'Garam Masala', quantity: 0.02, unit: 'lbs' }], orders_today: 35, orders_7d: 210, orders_30d: 840, trend: 12.5, popularity_rank: 1, daily_orders: [26, 28, 30, 32, 35, 38, 21], revenue_7d: 4620 },
    { id: '2', name: 'Lamb Biryani', category: 'Entree - Rice', price: 26.00, is_active: true, recipe: [{ id: '6', ingredient_id: '3', ingredient_name: 'Lamb Shoulder', quantity: 0.75, unit: 'lbs' }, { id: '7', ingredient_id: '18', ingredient_name: 'Basmati Rice', quantity: 0.6, unit: 'lbs' }, { id: '8', ingredient_id: '25', ingredient_name: 'Saffron', quantity: 0.01, unit: 'oz' }, { id: '9', ingredient_id: '8', ingredient_name: 'Ghee', quantity: 0.08, unit: 'liters' }, { id: '10', ingredient_id: '28', ingredient_name: 'Cardamom Pods', quantity: 0.01, unit: 'lbs' }], orders_today: 28, orders_7d: 175, orders_30d: 700, trend: 8.2, popularity_rank: 2, daily_orders: [22, 24, 25, 26, 28, 30, 20], revenue_7d: 4550 },
    { id: '3', name: 'Palak Paneer', category: 'Entree - Vegetarian', price: 18.00, is_active: true, recipe: [{ id: '11', ingredient_id: '6', ingredient_name: 'Paneer', quantity: 0.5, unit: 'lbs' }, { id: '12', ingredient_id: '11', ingredient_name: 'Fresh Spinach', quantity: 1.0, unit: 'lbs' }, { id: '13', ingredient_id: '8', ingredient_name: 'Ghee', quantity: 0.05, unit: 'liters' }, { id: '14', ingredient_id: '12', ingredient_name: 'Fresh Ginger', quantity: 0.05, unit: 'lbs' }], orders_today: 22, orders_7d: 140, orders_30d: 560, trend: 5.8, popularity_rank: 4, daily_orders: [18, 19, 20, 21, 22, 25, 15], revenue_7d: 2520 },
    { id: '4', name: 'Chicken Tikka Masala', category: 'Entree - Curry', price: 21.00, is_active: true, recipe: [{ id: '15', ingredient_id: '2', ingredient_name: 'Chicken Thighs (Tikka)', quantity: 0.75, unit: 'lbs' }, { id: '16', ingredient_id: '7', ingredient_name: 'Yogurt', quantity: 0.25, unit: 'lbs' }, { id: '17', ingredient_id: '10', ingredient_name: 'Tomatoes (Roma)', quantity: 0.4, unit: 'lbs' }, { id: '18', ingredient_id: '9', ingredient_name: 'Heavy Cream', quantity: 0.1, unit: 'liters' }, { id: '19', ingredient_id: '22', ingredient_name: 'Garam Masala', quantity: 0.02, unit: 'lbs' }], orders_today: 25, orders_7d: 160, orders_30d: 640, trend: 6.4, popularity_rank: 3, daily_orders: [20, 22, 23, 24, 25, 28, 18], revenue_7d: 3360 },
    { id: '5', name: 'Vegetable Samosas', category: 'Appetizer', price: 10.00, is_active: true, recipe: [{ id: '20', ingredient_id: '17', ingredient_name: 'Potatoes', quantity: 0.5, unit: 'lbs' }, { id: '21', ingredient_id: '19', ingredient_name: 'Naan Flour', quantity: 0.3, unit: 'lbs' }, { id: '22', ingredient_id: '24', ingredient_name: 'Cumin Seeds', quantity: 0.01, unit: 'lbs' }, { id: '23', ingredient_id: '14', ingredient_name: 'Green Chiles', quantity: 0.03, unit: 'lbs' }], orders_today: 20, orders_7d: 130, orders_30d: 520, trend: 4.5, popularity_rank: 5, daily_orders: [16, 18, 19, 20, 22, 22, 13], revenue_7d: 1300 },
    { id: '6', name: 'Dal Makhani', category: 'Entree - Vegetarian', price: 16.00, is_active: true, recipe: [{ id: '24', ingredient_id: '21', ingredient_name: 'Red Lentils', quantity: 0.5, unit: 'lbs' }, { id: '25', ingredient_id: '8', ingredient_name: 'Ghee', quantity: 0.08, unit: 'liters' }, { id: '26', ingredient_id: '9', ingredient_name: 'Heavy Cream', quantity: 0.1, unit: 'liters' }, { id: '27', ingredient_id: '12', ingredient_name: 'Fresh Ginger', quantity: 0.03, unit: 'lbs' }], orders_today: 18, orders_7d: 115, orders_30d: 460, trend: 3.2, popularity_rank: 7, daily_orders: [14, 16, 17, 17, 18, 20, 13], revenue_7d: 1840 },
    { id: '7', name: 'Garlic Naan', category: 'Bread', price: 5.00, is_active: true, recipe: [{ id: '28', ingredient_id: '19', ingredient_name: 'Naan Flour', quantity: 0.25, unit: 'lbs' }, { id: '29', ingredient_id: '13', ingredient_name: 'Garlic', quantity: 0.03, unit: 'lbs' }, { id: '30', ingredient_id: '8', ingredient_name: 'Ghee', quantity: 0.02, unit: 'liters' }], orders_today: 45, orders_7d: 280, orders_30d: 1120, trend: 2.0, popularity_rank: 6, daily_orders: [36, 38, 40, 42, 45, 48, 31], revenue_7d: 1400 },
    { id: '8', name: 'Tandoori Chicken', category: 'Entree - Tandoor', price: 24.00, is_active: true, recipe: [{ id: '31', ingredient_id: '2', ingredient_name: 'Chicken Thighs (Tikka)', quantity: 1.25, unit: 'lbs' }, { id: '32', ingredient_id: '7', ingredient_name: 'Yogurt', quantity: 0.3, unit: 'lbs' }, { id: '33', ingredient_id: '23', ingredient_name: 'Turmeric', quantity: 0.01, unit: 'lbs' }, { id: '34', ingredient_id: '22', ingredient_name: 'Garam Masala', quantity: 0.02, unit: 'lbs' }], orders_today: 19, orders_7d: 125, orders_30d: 500, trend: -2.5, popularity_rank: 8, daily_orders: [17, 18, 18, 19, 20, 22, 11], revenue_7d: 3000 },
    { id: '9', name: 'Rogan Josh', category: 'Entree - Curry', price: 25.00, is_active: true, recipe: [{ id: '35', ingredient_id: '3', ingredient_name: 'Lamb Shoulder', quantity: 1.0, unit: 'lbs' }, { id: '36', ingredient_id: '7', ingredient_name: 'Yogurt', quantity: 0.2, unit: 'lbs' }, { id: '37', ingredient_id: '16', ingredient_name: 'Red Onions', quantity: 0.3, unit: 'lbs' }, { id: '38', ingredient_id: '22', ingredient_name: 'Garam Masala', quantity: 0.03, unit: 'lbs' }], orders_today: 14, orders_7d: 90, orders_30d: 360, trend: -4.8, popularity_rank: 9, daily_orders: [12, 13, 13, 14, 15, 16, 7], revenue_7d: 2250 },
    { id: '10', name: 'Chana Masala', category: 'Entree - Vegetarian', price: 16.00, is_active: true, recipe: [{ id: '39', ingredient_id: '20', ingredient_name: 'Chickpeas', quantity: 0.6, unit: 'lbs' }, { id: '40', ingredient_id: '10', ingredient_name: 'Tomatoes (Roma)', quantity: 0.4, unit: 'lbs' }, { id: '41', ingredient_id: '16', ingredient_name: 'Red Onions', quantity: 0.2, unit: 'lbs' }, { id: '42', ingredient_id: '24', ingredient_name: 'Cumin Seeds', quantity: 0.01, unit: 'lbs' }], orders_today: 12, orders_7d: 80, orders_30d: 320, trend: -6.2, popularity_rank: 10, daily_orders: [11, 12, 11, 12, 13, 14, 7], revenue_7d: 1280 },
    { id: '11', name: 'Gulab Jamun', category: 'Dessert', price: 8.00, is_active: true, recipe: [{ id: '43', ingredient_id: '19', ingredient_name: 'Naan Flour', quantity: 0.15, unit: 'lbs' }, { id: '44', ingredient_id: '8', ingredient_name: 'Ghee', quantity: 0.05, unit: 'liters' }, { id: '45', ingredient_id: '28', ingredient_name: 'Cardamom Pods', quantity: 0.005, unit: 'lbs' }], orders_today: 16, orders_7d: 105, orders_30d: 420, trend: 7.5, popularity_rank: 11, daily_orders: [13, 14, 15, 16, 17, 18, 12], revenue_7d: 840 },
    { id: '12', name: 'Mango Lassi', category: 'Drink', price: 6.00, is_active: true, recipe: [{ id: '46', ingredient_id: '7', ingredient_name: 'Yogurt', quantity: 0.4, unit: 'lbs' }, { id: '47', ingredient_id: '29', ingredient_name: 'Mango Pulp', quantity: 0.5, unit: 'cans' }, { id: '48', ingredient_id: '28', ingredient_name: 'Cardamom Pods', quantity: 0.003, unit: 'lbs' }], orders_today: 30, orders_7d: 190, orders_30d: 760, trend: 10.2, popularity_rank: 12, daily_orders: [24, 26, 27, 28, 30, 32, 23], revenue_7d: 1140 },
  ],
  menuItems: [
    { id: '1', name: 'Vegetable Samosas', price: 10.00, category: 'Starters', popular: true }, { id: '2', name: 'Onion Bhaji', price: 9.00, category: 'Starters' }, { id: '3', name: 'Chicken Pakora', price: 12.00, category: 'Starters', popular: true }, { id: '4', name: 'Papadum & Chutneys', price: 7.00, category: 'Starters' }, { id: '5', name: 'Aloo Tikki', price: 9.00, category: 'Starters' },
    { id: '6', name: 'Tandoori Chicken', price: 24.00, category: 'Tandoor', popular: true }, { id: '7', name: 'Seekh Kebab', price: 16.00, category: 'Tandoor' }, { id: '8', name: 'Tandoori Shrimp', price: 22.00, category: 'Tandoor', popular: true }, { id: '9', name: 'Paneer Tikka', price: 16.00, category: 'Tandoor' }, { id: '10', name: 'Lamb Chops', price: 28.00, category: 'Tandoor' },
    { id: '11', name: 'Butter Chicken', price: 22.00, category: 'Curries', popular: true }, { id: '12', name: 'Chicken Tikka Masala', price: 21.00, category: 'Curries', popular: true }, { id: '13', name: 'Rogan Josh', price: 25.00, category: 'Curries' }, { id: '14', name: 'Palak Paneer', price: 18.00, category: 'Curries', popular: true }, { id: '15', name: 'Dal Makhani', price: 16.00, category: 'Curries' }, { id: '16', name: 'Chana Masala', price: 16.00, category: 'Curries' }, { id: '17', name: 'Shrimp Vindaloo', price: 23.00, category: 'Curries' },
    { id: '18', name: 'Garlic Naan', price: 5.00, category: 'Breads & Rice', popular: true }, { id: '19', name: 'Plain Naan', price: 4.00, category: 'Breads & Rice' }, { id: '20', name: 'Lamb Biryani', price: 26.00, category: 'Breads & Rice', popular: true }, { id: '21', name: 'Chicken Biryani', price: 22.00, category: 'Breads & Rice' }, { id: '22', name: 'Jeera Rice', price: 6.00, category: 'Breads & Rice' },
    { id: '23', name: 'Mango Lassi', price: 6.00, category: 'Drinks', popular: true }, { id: '24', name: 'Masala Chai', price: 5.00, category: 'Drinks' }, { id: '25', name: 'Sweet Lassi', price: 5.00, category: 'Drinks' }, { id: '26', name: 'Indian Beer (Kingfisher)', price: 8.00, category: 'Drinks' },
    { id: '27', name: 'Gulab Jamun', price: 8.00, category: 'Desserts', popular: true }, { id: '28', name: 'Kheer (Rice Pudding)', price: 8.00, category: 'Desserts' },
  ],
  posCategories: ['Starters', 'Tandoor', 'Curries', 'Breads & Rice', 'Drinks', 'Desserts'],
  suppliers: [
    { id: '1', name: 'Bombay Spice Traders', lead_time_days: 2, min_order_quantity: 40, reliability_score: 0.98, shipping_cost: 35, ingredients: ['Garam Masala', 'Turmeric', 'Cumin Seeds', 'Cardamom', 'Saffron', 'Mustard Seeds'], pricing: [{ ingredient: 'Garam Masala', price: 14.00, unit: 'lb' }, { ingredient: 'Turmeric', price: 8.00, unit: 'lb' }, { ingredient: 'Cumin Seeds', price: 10.00, unit: 'lb' }, { ingredient: 'Saffron', price: 45.00, unit: 'oz' }, { ingredient: 'Cardamom Pods', price: 35.00, unit: 'lb' }, { ingredient: 'Mustard Seeds', price: 6.00, unit: 'lb' }] },
    { id: '2', name: 'Athens Fresh Market', lead_time_days: 1, min_order_quantity: 25, reliability_score: 0.95, shipping_cost: 20, ingredients: ['Tomatoes', 'Spinach', 'Ginger', 'Garlic', 'Green Chiles', 'Red Onions', 'Potatoes', 'Cilantro'], pricing: [{ ingredient: 'Tomatoes', price: 2.80, unit: 'lb' }, { ingredient: 'Spinach', price: 3.50, unit: 'lb' }, { ingredient: 'Ginger', price: 5.00, unit: 'lb' }, { ingredient: 'Garlic', price: 4.00, unit: 'lb' }, { ingredient: 'Green Chiles', price: 3.00, unit: 'lb' }, { ingredient: 'Red Onions', price: 1.50, unit: 'lb' }, { ingredient: 'Potatoes', price: 1.20, unit: 'lb' }] },
    { id: '3', name: 'Desi Dairy & Meats', lead_time_days: 1, min_order_quantity: 30, reliability_score: 0.96, shipping_cost: 40, ingredients: ['Chicken Breast', 'Chicken Thighs', 'Lamb Shoulder', 'Lamb Keema', 'Paneer', 'Yogurt', 'Ghee'], pricing: [{ ingredient: 'Chicken Breast', price: 5.50, unit: 'lb' }, { ingredient: 'Chicken Thighs', price: 4.50, unit: 'lb' }, { ingredient: 'Lamb Shoulder', price: 14.00, unit: 'lb' }, { ingredient: 'Lamb Keema', price: 12.00, unit: 'lb' }, { ingredient: 'Paneer', price: 8.00, unit: 'lb' }, { ingredient: 'Yogurt', price: 3.50, unit: 'lb' }, { ingredient: 'Ghee', price: 12.00, unit: 'L' }] },
    { id: '4', name: 'Coastal Seafood Co', lead_time_days: 1, min_order_quantity: 20, reliability_score: 0.94, shipping_cost: 50, ingredients: ['Jumbo Shrimp', 'Fish Fillets'], pricing: [{ ingredient: 'Jumbo Shrimp', price: 16.00, unit: 'lb' }, { ingredient: 'Fish Fillets', price: 12.00, unit: 'lb' }] },
    { id: '5', name: 'IndoPak Grocers', lead_time_days: 2, min_order_quantity: 50, reliability_score: 0.97, shipping_cost: 25, ingredients: ['Basmati Rice', 'Naan Flour', 'Chickpeas', 'Red Lentils', 'Coconut Milk', 'Tamarind Paste', 'Mango Pulp'], pricing: [{ ingredient: 'Basmati Rice', price: 2.00, unit: 'lb' }, { ingredient: 'Naan Flour', price: 1.50, unit: 'lb' }, { ingredient: 'Chickpeas', price: 2.20, unit: 'lb' }, { ingredient: 'Red Lentils', price: 2.50, unit: 'lb' }, { ingredient: 'Coconut Milk', price: 2.80, unit: 'can' }, { ingredient: 'Mango Pulp', price: 3.50, unit: 'can' }] },
    { id: '6', name: 'Southern Beverage Dist.', lead_time_days: 3, min_order_quantity: 24, reliability_score: 0.92, shipping_cost: 0, ingredients: ['Kingfisher Beer', 'Indian Wine', 'Mango Juice'], pricing: [{ ingredient: 'Kingfisher Beer', price: 3.00, unit: 'btl' }, { ingredient: 'Indian Wine', price: 14.00, unit: 'btl' }, { ingredient: 'Mango Juice', price: 4.50, unit: 'btl' }] },
  ],
  orderHistory: [
    { id: 'PO-001', supplier: 'Desi Dairy & Meats', items: 5, total: 620.00, status: 'Delivered', date: 'Feb 5, 2026' },
    { id: 'PO-002', supplier: 'Bombay Spice Traders', items: 4, total: 385.00, status: 'Delivered', date: 'Feb 4, 2026' },
    { id: 'PO-003', supplier: 'Athens Fresh Market', items: 6, total: 195.00, status: 'In Transit', date: 'Feb 6, 2026' },
    { id: 'PO-004', supplier: 'IndoPak Grocers', items: 5, total: 440.00, status: 'Processing', date: 'Feb 7, 2026' },
    { id: 'PO-005', supplier: 'Coastal Seafood Co', items: 2, total: 350.00, status: 'Delivered', date: 'Feb 3, 2026' },
  ],
  serverNames: ['Anita D.', 'Vikram S.', 'Meera P.'],
  customerNames: ['Arun K.', 'Sunita R.', 'Ravi M.', 'Deepa S.', 'Kiran P.', 'Neha G.'],
  topDishesToday: [
    { name: 'Butter Chicken', orders: 35, trend: 12.5 }, { name: 'Mango Lassi', orders: 30, trend: 10.2 }, { name: 'Lamb Biryani', orders: 28, trend: 8.2 }, { name: 'Chicken Tikka Masala', orders: 25, trend: 6.4 }, { name: 'Palak Paneer', orders: 22, trend: 5.8 },
  ],
  dailyBriefing: `Namaste! Here's your inventory briefing for Spice Route:\n\n**Priority Items:**\n- **Saffron** is at CRITICAL risk with only 1 day of cover. Order from Bombay Spice Traders immediately -- Lamb Biryani depends on it.\n- **Ghee** is running critically low -- essential for nearly every dish on the menu. Contact Desi Dairy & Meats.\n- **Lamb Keema** and **Paneer** show URGENT risk. Weekend dinner reservations are 35% above average.\n- **Garam Masala** is URGENT with 3 days of cover -- core spice blend used across all curries.\n\n**Menu Insights:**\n- **Butter Chicken** is your #1 seller (210 orders/wk, +12.5%) -- driving heavy cream and ghee demand.\n- **Mango Lassi** is trending up fast (+10.2%) -- consider promoting alongside curry combos.\n- **Chana Masala** is declining (-6.2%) and **Rogan Josh** is down (-4.8%). Consider a weekend lamb special.\n\n**Today's Outlook:**\n- 4 items need immediate attention\n- Friday evening: Expecting 170+ covers\n- Vegetarian dishes trending up 18% this week\n\n**Recommendation:** Place urgent orders before 2 PM for same-day delivery. Feature Dal Makhani and Chana Masala as specials to reduce pressure on lamb and paneer stocks tonight.`,
  deliveryOrders: [
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Preparing', customer: 'Arun K.', total: 74.00, items: 'Butter Chicken, Garlic Naan x2, Mango Lassi', color: 'from-red-500 to-red-600' },
    { platform: 'Uber Eats', label: 'UE', labelColor: 'bg-green-500 text-white', status: 'Confirmed', customer: 'Deepa S.', total: 112.50, items: 'Lamb Biryani, Tandoori Chicken, Samosas', color: 'from-green-500 to-emerald-600' },
    { platform: 'Grubhub', label: 'GH', labelColor: 'bg-orange-500 text-white', status: 'Out for Delivery', customer: 'Kiran P.', total: 65.00, items: 'Palak Paneer, Dal Makhani, Naan x3', color: 'from-orange-500 to-red-500' },
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Pending', customer: 'Neha G.', total: 138.00, items: 'Rogan Josh, Chicken Tikka Masala, Biryani', color: 'from-red-500 to-red-600' },
  ],
  smartSuggestions: [
    { ingredient: 'Ghee', supplier: 'Desi Dairy & Meats', qty: '12 L', cost: '$144.00', urgency: 'critical' },
    { ingredient: 'Garam Masala', supplier: 'Bombay Spice Traders', qty: '8 lb', cost: '$112.00', urgency: 'urgent' },
    { ingredient: 'Lamb Shoulder', supplier: 'Desi Dairy & Meats', qty: '25 lb', cost: '$350.00', urgency: 'normal' },
  ],
  takeoutOrders: [
    { id: 'TO-001', customerName: 'Arun K.', phone: '(555) 123-4567', pickupTime: '15 min', items: [{ name: 'Butter Chicken', quantity: 2 }, { name: 'Garlic Naan', quantity: 4 }], total: 64.00, status: 'preparing', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'TO-002', customerName: 'Sunita R.', phone: '(555) 234-5678', pickupTime: '30 min', items: [{ name: 'Lamb Biryani', quantity: 1 }, { name: 'Gulab Jamun', quantity: 2 }], total: 42.00, status: 'pending', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'TO-003', customerName: 'Ravi M.', phone: '(555) 345-6789', pickupTime: '45 min', items: [{ name: 'Tandoori Chicken', quantity: 1 }, { name: 'Mango Lassi', quantity: 2 }], total: 36.00, status: 'ready', createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
  ],
  deliveryPlatformOrders: [
    { id: 'DEL-001', platform: 'doordash', platformId: 'DD-SPR91E', customerName: 'Deepa S.', items: [{ name: 'Butter Chicken', quantity: 1, price: 22.00 }, { name: 'Garlic Naan', quantity: 2, price: 10.00 }], total: 37.44, status: 'preparing', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'DEL-002', platform: 'uber_eats', platformId: 'UE-SPR82F', customerName: 'Kiran P.', items: [{ name: 'Chicken Tikka Masala', quantity: 2, price: 42.00 }], total: 49.14, status: 'received', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'DEL-003', platform: 'grubhub', platformId: 'GH-SPR93A', customerName: 'Neha G.', items: [{ name: 'Lamb Biryani', quantity: 2, price: 52.00 }], total: 63.27, status: 'ready', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'DEL-004', platform: 'doordash', platformId: 'DD-SPR04B', customerName: 'Ravi M.', items: [{ name: 'Palak Paneer', quantity: 1, price: 18.00 }, { name: 'Dal Makhani', quantity: 1, price: 16.00 }], total: 40.18, status: 'picked_up', createdAt: new Date(Date.now() - 35 * 60000).toISOString() },
  ],
  chatIngredientKeywords: ['chicken', 'chicken tikka', 'lamb', 'lamb keema', 'shrimp', 'paneer', 'yogurt', 'ghee', 'cream', 'tomatoes', 'spinach', 'ginger', 'garlic', 'green chiles', 'cilantro', 'onions', 'basmati rice', 'rice', 'naan', 'chickpeas', 'lentils', 'dal', 'garam masala', 'turmeric', 'cumin', 'saffron', 'cardamom', 'coconut milk', 'tamarind', 'mango', 'mustard seeds', 'fenugreek'],
  initialChatMessage: "Namaste! I'm your AI assistant for Spice Route. I can help with:\n\n- **Inventory** - Stock levels, forecasts, reorder recommendations\n- **AI Agents** - Risk assessment, optimization decisions\n- **Menu** - Curries, tandoor dishes, recipes, pricing\n- **Orders** - POS, delivery platforms\n- **Payments** - Including Solana Pay crypto\n- **Suppliers** - Lead times, reliability\n\nWhat would you like to know?",
  restaurantSettings: { name: 'Spice Route', address: '890 Spice Lane, Chicago, IL 60601', phone: '(312) 555-0198', email: 'info@spiceroutechicago.com' },
  demoUsers: {
    restaurant_admin: { name: 'Ibe Mohammed Ali', email: 'admin@spiceroute.com', restaurant: 'Spice Route', restaurantKey: 'REST-SPR2026-CHCGO' },
    manager: { name: 'Carter Tierney', email: 'manager@spiceroute.com', restaurant: 'Spice Route', managerId: 'MGR-CART26-SPICE' },
    pos_user: { name: 'Shaw Tesafye', email: 'pos@spiceroute.com', restaurant: 'Spice Route' },
  },
}

// ============================================================
// ITALIAN (Trattoria Bella)
// ============================================================
const italian: CuisineTemplate = {
  key: 'italian',
  label: 'Italian',
  flag: 'IT',
  restaurantName: 'Trattoria Bella',
  country: 'Italy',
  genre: 'full_service',
  ingredients: [
    { id: '1', name: 'Prosciutto di Parma', category: 'meat', current_inventory: 18, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.40, trend: -14 },
    { id: '2', name: 'Pancetta', category: 'meat', current_inventory: 12, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.35, trend: -10 },
    { id: '3', name: 'Italian Sausage', category: 'meat', current_inventory: 25, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.18, trend: -6 },
    { id: '4', name: 'Veal Shank (Osso Buco)', category: 'meat', current_inventory: 8, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.65, trend: -22 },
    { id: '5', name: 'Chicken Breast', category: 'meat', current_inventory: 40, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.06, trend: 3 },
    { id: '6', name: 'Calamari', category: 'meat', current_inventory: 15, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.38, trend: -12 },
    { id: '7', name: 'Ground Beef', category: 'meat', current_inventory: 35, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.08, trend: 2 },
    { id: '8', name: 'Fresh Mozzarella', category: 'dairy', current_inventory: 10, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.60, trend: -20 },
    { id: '9', name: 'Parmigiano-Reggiano', category: 'dairy', current_inventory: 22, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.16, trend: -5 },
    { id: '10', name: 'Ricotta', category: 'dairy', current_inventory: 18, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.20, trend: -7 },
    { id: '11', name: 'Mascarpone', category: 'dairy', current_inventory: 8, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.32, trend: -9 },
    { id: '12', name: 'Heavy Cream', category: 'dairy', current_inventory: 12, unit: 'liters', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.19, trend: -4 },
    { id: '13', name: 'San Marzano Tomatoes', category: 'produce', current_inventory: 45, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.06, trend: 4 },
    { id: '14', name: 'Fresh Basil', category: 'produce', current_inventory: 5, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.58, trend: -18 },
    { id: '15', name: 'Garlic', category: 'produce', current_inventory: 20, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.03, trend: 0 },
    { id: '16', name: 'Fresh Lemons', category: 'produce', current_inventory: 40, unit: 'units', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 2 },
    { id: '17', name: 'Arugula', category: 'produce', current_inventory: 10, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 3, stockout_prob: 0.22, trend: -8 },
    { id: '18', name: 'Porcini Mushrooms', category: 'produce', current_inventory: 6, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.20, trend: -5 },
    { id: '19', name: 'Cherry Tomatoes', category: 'produce', current_inventory: 30, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.08, trend: 3 },
    { id: '20', name: 'Red Onions', category: 'produce', current_inventory: 55, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
    { id: '21', name: '00 Flour', category: 'dry', current_inventory: 80, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 14, stockout_prob: 0.01, trend: 0 },
    { id: '22', name: 'Fresh Pasta Sheets', category: 'dry', current_inventory: 20, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 3, stockout_prob: 0.24, trend: -8 },
    { id: '23', name: 'Arborio Rice', category: 'dry', current_inventory: 50, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
    { id: '24', name: 'Extra Virgin Olive Oil', category: 'dry', current_inventory: 10, unit: 'liters', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.18, trend: -6 },
    { id: '25', name: 'Balsamic Vinegar', category: 'dry', current_inventory: 6, unit: 'liters', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.04, trend: 0 },
    { id: '26', name: 'Pine Nuts', category: 'dry', current_inventory: 4, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.06, trend: 2 },
    { id: '27', name: 'Truffle Oil', category: 'dry', current_inventory: 3, unit: 'liters', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.04, trend: 5 },
    { id: '28', name: 'Chianti Wine', category: 'dry', current_inventory: 18, unit: 'bottles', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 6 },
    { id: '29', name: 'Prosecco', category: 'dry', current_inventory: 15, unit: 'bottles', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.07, trend: 8 },
    { id: '30', name: 'Espresso Beans', category: 'dry', current_inventory: 10, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.03, trend: 0 },
  ],
  dishIngredients: [
    { id: '1', name: 'Prosciutto di Parma', unit: 'lbs' }, { id: '2', name: 'Pancetta', unit: 'lbs' },
    { id: '3', name: 'Italian Sausage', unit: 'lbs' }, { id: '4', name: 'Veal Shank', unit: 'lbs' },
    { id: '5', name: 'Chicken Breast', unit: 'lbs' }, { id: '6', name: 'Calamari', unit: 'lbs' },
    { id: '7', name: 'Ground Beef', unit: 'lbs' }, { id: '8', name: 'Fresh Mozzarella', unit: 'lbs' },
    { id: '9', name: 'Parmigiano-Reggiano', unit: 'lbs' }, { id: '10', name: 'Ricotta', unit: 'lbs' },
    { id: '11', name: 'Mascarpone', unit: 'lbs' }, { id: '12', name: 'Heavy Cream', unit: 'liters' },
    { id: '13', name: 'San Marzano Tomatoes', unit: 'lbs' }, { id: '14', name: 'Fresh Basil', unit: 'lbs' },
    { id: '15', name: 'Garlic', unit: 'lbs' }, { id: '16', name: 'Fresh Lemons', unit: 'units' },
    { id: '17', name: 'Arugula', unit: 'lbs' }, { id: '18', name: 'Porcini Mushrooms', unit: 'lbs' },
    { id: '19', name: 'Cherry Tomatoes', unit: 'lbs' }, { id: '20', name: 'Red Onions', unit: 'lbs' },
    { id: '21', name: '00 Flour', unit: 'lbs' }, { id: '22', name: 'Fresh Pasta Sheets', unit: 'lbs' },
    { id: '23', name: 'Arborio Rice', unit: 'lbs' }, { id: '24', name: 'Extra Virgin Olive Oil', unit: 'liters' },
    { id: '25', name: 'Balsamic Vinegar', unit: 'liters' }, { id: '26', name: 'Pine Nuts', unit: 'lbs' },
    { id: '27', name: 'Truffle Oil', unit: 'liters' }, { id: '28', name: 'Eggs', unit: 'units' },
    { id: '29', name: 'Breadcrumbs', unit: 'lbs' }, { id: '30', name: 'Espresso Beans', unit: 'lbs' },
  ],
  dishes: [
    { id: '1', name: 'Bruschetta', category: 'Appetizer', price: 12.00, is_active: true, recipe: [{ id: '1', ingredient_id: '19', ingredient_name: 'Cherry Tomatoes', quantity: 0.3, unit: 'lbs' }, { id: '2', ingredient_id: '14', ingredient_name: 'Fresh Basil', quantity: 0.05, unit: 'lbs' }, { id: '3', ingredient_id: '15', ingredient_name: 'Garlic', quantity: 0.05, unit: 'lbs' }, { id: '4', ingredient_id: '24', ingredient_name: 'Extra Virgin Olive Oil', quantity: 0.05, unit: 'liters' }], orders_today: 24, orders_7d: 155, orders_30d: 620, trend: 6.5, popularity_rank: 4, daily_orders: [20, 22, 23, 24, 26, 28, 12], revenue_7d: 1860 },
    { id: '2', name: 'Caprese Salad', category: 'Appetizer', price: 14.00, is_active: true, recipe: [{ id: '5', ingredient_id: '8', ingredient_name: 'Fresh Mozzarella', quantity: 0.4, unit: 'lbs' }, { id: '6', ingredient_id: '13', ingredient_name: 'San Marzano Tomatoes', quantity: 0.3, unit: 'lbs' }, { id: '7', ingredient_id: '14', ingredient_name: 'Fresh Basil', quantity: 0.05, unit: 'lbs' }, { id: '8', ingredient_id: '25', ingredient_name: 'Balsamic Vinegar', quantity: 0.03, unit: 'liters' }], orders_today: 18, orders_7d: 120, orders_30d: 480, trend: 3.8, popularity_rank: 7, daily_orders: [15, 17, 18, 18, 20, 22, 10], revenue_7d: 1680 },
    { id: '3', name: 'Calamari Fritti', category: 'Appetizer', price: 16.00, is_active: true, recipe: [{ id: '9', ingredient_id: '6', ingredient_name: 'Calamari', quantity: 0.5, unit: 'lbs' }, { id: '10', ingredient_id: '21', ingredient_name: '00 Flour', quantity: 0.2, unit: 'lbs' }, { id: '11', ingredient_id: '16', ingredient_name: 'Fresh Lemons', quantity: 2, unit: 'units' }], orders_today: 20, orders_7d: 130, orders_30d: 520, trend: 8.2, popularity_rank: 6, daily_orders: [16, 18, 19, 20, 22, 24, 11], revenue_7d: 2080 },
    { id: '4', name: 'Margherita Pizza', category: 'Entree - Pizza', price: 18.00, is_active: true, recipe: [{ id: '12', ingredient_id: '21', ingredient_name: '00 Flour', quantity: 0.5, unit: 'lbs' }, { id: '13', ingredient_id: '13', ingredient_name: 'San Marzano Tomatoes', quantity: 0.4, unit: 'lbs' }, { id: '14', ingredient_id: '8', ingredient_name: 'Fresh Mozzarella', quantity: 0.5, unit: 'lbs' }, { id: '15', ingredient_id: '14', ingredient_name: 'Fresh Basil', quantity: 0.05, unit: 'lbs' }], orders_today: 35, orders_7d: 210, orders_30d: 840, trend: 12.1, popularity_rank: 1, daily_orders: [26, 28, 30, 32, 35, 38, 21], revenue_7d: 3780 },
    { id: '5', name: 'Spaghetti Carbonara', category: 'Entree - Pasta', price: 22.00, is_active: true, recipe: [{ id: '16', ingredient_id: '22', ingredient_name: 'Fresh Pasta Sheets', quantity: 0.5, unit: 'lbs' }, { id: '17', ingredient_id: '2', ingredient_name: 'Pancetta', quantity: 0.3, unit: 'lbs' }, { id: '18', ingredient_id: '9', ingredient_name: 'Parmigiano-Reggiano', quantity: 0.2, unit: 'lbs' }, { id: '19', ingredient_id: '28', ingredient_name: 'Eggs', quantity: 3, unit: 'units' }], orders_today: 30, orders_7d: 195, orders_30d: 780, trend: 9.8, popularity_rank: 2, daily_orders: [24, 26, 28, 30, 32, 35, 20], revenue_7d: 4290 },
    { id: '6', name: 'Lasagna Bolognese', category: 'Entree - Pasta', price: 24.00, is_active: true, recipe: [{ id: '20', ingredient_id: '22', ingredient_name: 'Fresh Pasta Sheets', quantity: 0.6, unit: 'lbs' }, { id: '21', ingredient_id: '7', ingredient_name: 'Ground Beef', quantity: 0.75, unit: 'lbs' }, { id: '22', ingredient_id: '13', ingredient_name: 'San Marzano Tomatoes', quantity: 0.5, unit: 'lbs' }, { id: '23', ingredient_id: '10', ingredient_name: 'Ricotta', quantity: 0.3, unit: 'lbs' }, { id: '24', ingredient_id: '8', ingredient_name: 'Fresh Mozzarella', quantity: 0.25, unit: 'lbs' }], orders_today: 22, orders_7d: 145, orders_30d: 580, trend: 5.4, popularity_rank: 5, daily_orders: [18, 20, 21, 22, 24, 26, 14], revenue_7d: 3480 },
    { id: '7', name: 'Risotto ai Funghi', category: 'Entree - Pasta', price: 26.00, is_active: true, recipe: [{ id: '25', ingredient_id: '23', ingredient_name: 'Arborio Rice', quantity: 0.4, unit: 'lbs' }, { id: '26', ingredient_id: '18', ingredient_name: 'Porcini Mushrooms', quantity: 0.3, unit: 'lbs' }, { id: '27', ingredient_id: '9', ingredient_name: 'Parmigiano-Reggiano', quantity: 0.15, unit: 'lbs' }, { id: '28', ingredient_id: '27', ingredient_name: 'Truffle Oil', quantity: 0.02, unit: 'liters' }], orders_today: 16, orders_7d: 105, orders_30d: 420, trend: 7.0, popularity_rank: 8, daily_orders: [13, 14, 15, 16, 18, 20, 9], revenue_7d: 2730 },
    { id: '8', name: 'Osso Buco', category: 'Entree - Meat', price: 38.00, is_active: true, recipe: [{ id: '29', ingredient_id: '4', ingredient_name: 'Veal Shank', quantity: 1.5, unit: 'lbs' }, { id: '30', ingredient_id: '13', ingredient_name: 'San Marzano Tomatoes', quantity: 0.4, unit: 'lbs' }, { id: '31', ingredient_id: '15', ingredient_name: 'Garlic', quantity: 0.1, unit: 'lbs' }, { id: '32', ingredient_id: '24', ingredient_name: 'Extra Virgin Olive Oil', quantity: 0.1, unit: 'liters' }], orders_today: 12, orders_7d: 78, orders_30d: 310, trend: 4.5, popularity_rank: 9, daily_orders: [10, 11, 11, 12, 14, 14, 6], revenue_7d: 2964 },
    { id: '9', name: 'Chicken Parmigiana', category: 'Entree - Meat', price: 24.00, is_active: true, recipe: [{ id: '33', ingredient_id: '5', ingredient_name: 'Chicken Breast', quantity: 0.75, unit: 'lbs' }, { id: '34', ingredient_id: '8', ingredient_name: 'Fresh Mozzarella', quantity: 0.3, unit: 'lbs' }, { id: '35', ingredient_id: '13', ingredient_name: 'San Marzano Tomatoes', quantity: 0.3, unit: 'lbs' }, { id: '36', ingredient_id: '29', ingredient_name: 'Breadcrumbs', quantity: 0.15, unit: 'lbs' }], orders_today: 25, orders_7d: 165, orders_30d: 660, trend: 10.2, popularity_rank: 3, daily_orders: [20, 22, 24, 25, 28, 30, 16], revenue_7d: 3960 },
    { id: '10', name: 'Gnocchi al Pesto', category: 'Entree - Pasta', price: 20.00, is_active: true, recipe: [{ id: '37', ingredient_id: '21', ingredient_name: '00 Flour', quantity: 0.3, unit: 'lbs' }, { id: '38', ingredient_id: '14', ingredient_name: 'Fresh Basil', quantity: 0.1, unit: 'lbs' }, { id: '39', ingredient_id: '26', ingredient_name: 'Pine Nuts', quantity: 0.08, unit: 'lbs' }, { id: '40', ingredient_id: '9', ingredient_name: 'Parmigiano-Reggiano', quantity: 0.15, unit: 'lbs' }], orders_today: 14, orders_7d: 92, orders_30d: 370, trend: -2.5, popularity_rank: 10, daily_orders: [14, 13, 13, 14, 15, 16, 7], revenue_7d: 1840 },
    { id: '11', name: 'Tiramisu', category: 'Dessert', price: 12.00, is_active: true, recipe: [{ id: '41', ingredient_id: '11', ingredient_name: 'Mascarpone', quantity: 0.3, unit: 'lbs' }, { id: '42', ingredient_id: '30', ingredient_name: 'Espresso Beans', quantity: 0.05, unit: 'lbs' }, { id: '43', ingredient_id: '28', ingredient_name: 'Eggs', quantity: 2, unit: 'units' }], orders_today: 28, orders_7d: 175, orders_30d: 700, trend: 11.5, popularity_rank: 11, daily_orders: [22, 24, 25, 26, 28, 32, 18], revenue_7d: 2100 },
    { id: '12', name: 'Panna Cotta', category: 'Dessert', price: 10.00, is_active: true, recipe: [{ id: '44', ingredient_id: '12', ingredient_name: 'Heavy Cream', quantity: 0.2, unit: 'liters' }, { id: '45', ingredient_id: '14', ingredient_name: 'Fresh Basil', quantity: 0.02, unit: 'lbs' }, { id: '46', ingredient_id: '25', ingredient_name: 'Balsamic Vinegar', quantity: 0.02, unit: 'liters' }], orders_today: 10, orders_7d: 65, orders_30d: 260, trend: -1.8, popularity_rank: 12, daily_orders: [9, 10, 9, 10, 11, 12, 4], revenue_7d: 650 },
  ],
  menuItems: [
    { id: '1', name: 'Bruschetta', price: 12.00, category: 'Antipasti', popular: true },
    { id: '2', name: 'Caprese Salad', price: 14.00, category: 'Antipasti', popular: true },
    { id: '3', name: 'Calamari Fritti', price: 16.00, category: 'Antipasti', popular: true },
    { id: '4', name: 'Prosciutto e Melone', price: 15.00, category: 'Antipasti' },
    { id: '5', name: 'Arancini', price: 13.00, category: 'Antipasti' },
    { id: '6', name: 'Spaghetti Carbonara', price: 22.00, category: 'Pasta', popular: true },
    { id: '7', name: 'Lasagna Bolognese', price: 24.00, category: 'Pasta', popular: true },
    { id: '8', name: 'Risotto ai Funghi', price: 26.00, category: 'Pasta', popular: true },
    { id: '9', name: 'Gnocchi al Pesto', price: 20.00, category: 'Pasta' },
    { id: '10', name: 'Fettuccine Alfredo', price: 21.00, category: 'Pasta' },
    { id: '11', name: 'Penne Arrabbiata', price: 19.00, category: 'Pasta' },
    { id: '12', name: 'Osso Buco', price: 38.00, category: 'Secondi', popular: true },
    { id: '13', name: 'Chicken Parmigiana', price: 24.00, category: 'Secondi', popular: true },
    { id: '14', name: 'Veal Marsala', price: 34.00, category: 'Secondi' },
    { id: '15', name: 'Branzino al Forno', price: 32.00, category: 'Secondi' },
    { id: '16', name: 'Saltimbocca alla Romana', price: 30.00, category: 'Secondi' },
    { id: '17', name: 'Margherita Pizza', price: 18.00, category: 'Pizza', popular: true },
    { id: '18', name: 'Quattro Formaggi', price: 20.00, category: 'Pizza' },
    { id: '19', name: 'Diavola Pizza', price: 21.00, category: 'Pizza' },
    { id: '20', name: 'Pizza Prosciutto', price: 22.00, category: 'Pizza' },
    { id: '21', name: 'Chianti (Glass)', price: 14.00, category: 'Bevande', popular: true },
    { id: '22', name: 'Prosecco', price: 12.00, category: 'Bevande' },
    { id: '23', name: 'Aperol Spritz', price: 13.00, category: 'Bevande' },
    { id: '24', name: 'Espresso', price: 4.00, category: 'Bevande' },
    { id: '25', name: 'Tiramisu', price: 12.00, category: 'Dolci', popular: true },
    { id: '26', name: 'Panna Cotta', price: 10.00, category: 'Dolci' },
    { id: '27', name: 'Cannoli', price: 11.00, category: 'Dolci', popular: true },
    { id: '28', name: 'Affogato', price: 9.00, category: 'Dolci' },
  ],
  posCategories: ['Antipasti', 'Pasta', 'Secondi', 'Pizza', 'Bevande', 'Dolci'],
  suppliers: [
    { id: '1', name: 'Bella Italia Imports', lead_time_days: 2, min_order_quantity: 50, reliability_score: 0.98, shipping_cost: 50, ingredients: ['Prosciutto di Parma', 'Pancetta', 'Parmigiano-Reggiano', 'San Marzano Tomatoes'], pricing: [{ ingredient: 'Prosciutto di Parma', price: 22.00, unit: 'lb' }, { ingredient: 'Pancetta', price: 14.00, unit: 'lb' }, { ingredient: 'Parmigiano-Reggiano', price: 18.00, unit: 'lb' }, { ingredient: 'San Marzano Tomatoes', price: 4.50, unit: 'lb' }] },
    { id: '2', name: 'Athens Fresh Produce', lead_time_days: 1, min_order_quantity: 25, reliability_score: 0.95, shipping_cost: 20, ingredients: ['Fresh Basil', 'Arugula', 'Cherry Tomatoes', 'Porcini Mushrooms', 'Red Onions', 'Garlic'], pricing: [{ ingredient: 'Fresh Basil', price: 8.00, unit: 'lb' }, { ingredient: 'Arugula', price: 5.00, unit: 'lb' }, { ingredient: 'Cherry Tomatoes', price: 3.50, unit: 'lb' }, { ingredient: 'Porcini Mushrooms', price: 28.00, unit: 'lb' }, { ingredient: 'Garlic', price: 2.50, unit: 'lb' }] },
    { id: '3', name: 'Coastal Seafood Co', lead_time_days: 1, min_order_quantity: 20, reliability_score: 0.94, shipping_cost: 55, ingredients: ['Calamari', 'Branzino', 'Shrimp'], pricing: [{ ingredient: 'Calamari', price: 12.00, unit: 'lb' }, { ingredient: 'Branzino', price: 24.00, unit: 'lb' }, { ingredient: 'Shrimp', price: 18.00, unit: 'lb' }] },
    { id: '4', name: 'Tuscany Farms', lead_time_days: 2, min_order_quantity: 40, reliability_score: 0.97, shipping_cost: 35, ingredients: ['Veal Shank', 'Chicken Breast', 'Ground Beef', 'Italian Sausage'], pricing: [{ ingredient: 'Veal Shank', price: 16.00, unit: 'lb' }, { ingredient: 'Chicken Breast', price: 6.50, unit: 'lb' }, { ingredient: 'Ground Beef', price: 8.00, unit: 'lb' }, { ingredient: 'Italian Sausage', price: 9.50, unit: 'lb' }] },
    { id: '5', name: 'Vino e Spiriti', lead_time_days: 3, min_order_quantity: 24, reliability_score: 0.93, shipping_cost: 0, ingredients: ['Chianti Wine', 'Prosecco', 'Aperol', 'Limoncello'], pricing: [{ ingredient: 'Chianti Wine', price: 16.00, unit: 'btl' }, { ingredient: 'Prosecco', price: 14.00, unit: 'btl' }, { ingredient: 'Aperol', price: 22.00, unit: 'btl' }] },
    { id: '6', name: 'La Dispensa', lead_time_days: 2, min_order_quantity: 50, reliability_score: 0.96, shipping_cost: 25, ingredients: ['Fresh Mozzarella', 'Ricotta', 'Mascarpone', '00 Flour', 'Arborio Rice', 'Truffle Oil'], pricing: [{ ingredient: 'Fresh Mozzarella', price: 10.00, unit: 'lb' }, { ingredient: 'Ricotta', price: 6.00, unit: 'lb' }, { ingredient: 'Mascarpone', price: 9.00, unit: 'lb' }, { ingredient: '00 Flour', price: 2.00, unit: 'lb' }, { ingredient: 'Truffle Oil', price: 45.00, unit: 'L' }] },
  ],
  orderHistory: [
    { id: 'PO-001', supplier: 'Bella Italia Imports', items: 4, total: 520.00, status: 'Delivered', date: 'Feb 5, 2026' },
    { id: 'PO-002', supplier: 'Coastal Seafood Co', items: 3, total: 680.00, status: 'Delivered', date: 'Feb 4, 2026' },
    { id: 'PO-003', supplier: 'Athens Fresh Produce', items: 5, total: 245.00, status: 'In Transit', date: 'Feb 6, 2026' },
    { id: 'PO-004', supplier: 'Tuscany Farms', items: 3, total: 480.00, status: 'Processing', date: 'Feb 7, 2026' },
    { id: 'PO-005', supplier: 'La Dispensa', items: 4, total: 390.00, status: 'Delivered', date: 'Feb 3, 2026' },
  ],
  serverNames: ['Alessia V.', 'Marco T.', 'Francesca L.'],
  customerNames: ['Roberto B.', 'Chiara M.', 'Giovanni P.', 'Valentina R.', 'Alessandro D.', 'Sofia C.'],
  topDishesToday: [
    { name: 'Margherita Pizza', orders: 35, trend: 12.1 },
    { name: 'Spaghetti Carbonara', orders: 30, trend: 9.8 },
    { name: 'Tiramisu', orders: 28, trend: 11.5 },
    { name: 'Chicken Parmigiana', orders: 25, trend: 10.2 },
    { name: 'Bruschetta', orders: 24, trend: 6.5 },
  ],
  dailyBriefing: `Buongiorno! Here's your inventory briefing for Trattoria Bella:

**Priority Items:**
- **Veal Shank (Osso Buco)** is at CRITICAL risk with only 1 day of cover. Order from Tuscany Farms immediately.
- **Fresh Mozzarella** is CRITICAL - essential for Margherita Pizza and Caprese tonight. Contact La Dispensa.
- **Fresh Basil** is CRITICAL at 1 day of cover - needed across most dishes. Rush order from Athens Fresh Produce.
- **Prosciutto di Parma**, **Pancetta**, **Calamari**, and **Mascarpone** show URGENT risk. Weekend reservations are 35% above average.

**Menu Insights:**
- **Margherita Pizza** is your #1 seller (210 orders/wk, +12.1%) - driving high mozzarella and basil demand.
- **Spaghetti Carbonara** is #2 (195/wk, +9.8%) - pancetta supply is critical for this dish.
- **Tiramisu** trending up fast (+11.5%) - mascarpone needs restocking urgently.
- **Gnocchi al Pesto** declining slightly (-2.5%) - consider a lunch special to boost orders.

**Today's Outlook:**
- 6 items need immediate attention (3 CRITICAL, 4 URGENT)
- Friday evening: Expecting 170+ covers (Carbonara and Pizza will dominate)
- Dessert orders trending up 18% this week

**Recommendation:** Place urgent orders before 2 PM for same-day delivery. Feature Chicken Parmigiana and Risotto ai Funghi to ease pressure on mozzarella and pancetta tonight.`,
  deliveryOrders: [
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Preparing', customer: 'Roberto B.', total: 78.00, items: 'Margherita Pizza, Spaghetti Carbonara', color: 'from-red-500 to-red-600' },
    { platform: 'Uber Eats', label: 'UE', labelColor: 'bg-green-500 text-white', status: 'Confirmed', customer: 'Chiara M.', total: 112.50, items: 'Osso Buco, Caprese Salad, Tiramisu', color: 'from-green-500 to-emerald-600' },
    { platform: 'Grubhub', label: 'GH', labelColor: 'bg-orange-500 text-white', status: 'Out for Delivery', customer: 'Giovanni P.', total: 64.00, items: 'Lasagna Bolognese, Panna Cotta x2', color: 'from-orange-500 to-red-500' },
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Pending', customer: 'Alessandro D.', total: 135.75, items: 'Chicken Parmigiana x2, Chianti', color: 'from-red-500 to-red-600' },
  ],
  smartSuggestions: [
    { ingredient: 'Fresh Mozzarella', supplier: 'La Dispensa', qty: '20 lb', cost: '$200.00', urgency: 'critical' },
    { ingredient: 'Veal Shank', supplier: 'Tuscany Farms', qty: '15 lb', cost: '$240.00', urgency: 'urgent' },
    { ingredient: 'Fresh Basil', supplier: 'Athens Fresh Produce', qty: '10 lb', cost: '$80.00', urgency: 'critical' },
  ],
  takeoutOrders: [
    { id: 'TO-001', customerName: 'Roberto B.', phone: '(555) 123-4567', pickupTime: '15 min', items: [{ name: 'Margherita Pizza', quantity: 2 }, { name: 'Tiramisu', quantity: 2 }], total: 60.00, status: 'preparing', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'TO-002', customerName: 'Valentina R.', phone: '(555) 234-5678', pickupTime: '30 min', items: [{ name: 'Spaghetti Carbonara', quantity: 1 }, { name: 'Bruschetta', quantity: 1 }], total: 34.00, status: 'pending', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'TO-003', customerName: 'Sofia C.', phone: '(555) 345-6789', pickupTime: '45 min', items: [{ name: 'Lasagna Bolognese', quantity: 2 }], total: 48.00, status: 'ready', createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
  ],
  deliveryPlatformOrders: [
    { id: 'DEL-001', platform: 'doordash', platformId: 'DD-TRB91E', customerName: 'Giovanni P.', items: [{ name: 'Chicken Parmigiana', quantity: 1, price: 24.00 }, { name: 'Bruschetta', quantity: 1, price: 12.00 }], total: 42.11, status: 'preparing', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'DEL-002', platform: 'uber_eats', platformId: 'UE-TRB82F', customerName: 'Chiara M.', items: [{ name: 'Margherita Pizza', quantity: 2, price: 36.00 }], total: 42.45, status: 'received', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'DEL-003', platform: 'grubhub', platformId: 'GH-TRB93A', customerName: 'Alessandro D.', items: [{ name: 'Osso Buco', quantity: 1, price: 38.00 }], total: 45.27, status: 'ready', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'DEL-004', platform: 'doordash', platformId: 'DD-TRB04B', customerName: 'Valentina R.', items: [{ name: 'Risotto ai Funghi', quantity: 1, price: 26.00 }, { name: 'Tiramisu', quantity: 1, price: 12.00 }], total: 44.87, status: 'picked_up', createdAt: new Date(Date.now() - 35 * 60000).toISOString() },
  ],
  chatIngredientKeywords: [
    'prosciutto', 'pancetta', 'italian sausage', 'veal', 'veal shank',
    'chicken', 'calamari', 'ground beef', 'mozzarella', 'fresh mozzarella',
    'parmigiano', 'parmesan', 'ricotta', 'mascarpone', 'heavy cream',
    'san marzano', 'tomatoes', 'basil', 'garlic', 'arugula', 'porcini',
    'mushrooms', '00 flour', 'pasta', 'arborio rice', 'olive oil',
    'balsamic', 'pine nuts', 'truffle oil', 'espresso',
  ],
  initialChatMessage: "Buongiorno! I'm your AI assistant for Trattoria Bella. I can help with:\n\n- **Inventory** - Stock levels, forecasts, reorder recommendations\n- **AI Agents** - Risk assessment, optimization decisions\n- **Menu** - Pizza, pasta, secondi, recipes, pricing\n- **Orders** - POS, delivery platforms\n- **Payments** - Including Solana Pay crypto\n- **Suppliers** - Lead times, reliability\n\nWhat would you like to know?",
  restaurantSettings: {
    name: 'Trattoria Bella',
    address: '567 Bella Vista Dr, New York, NY 10001',
    phone: '(212) 555-0165',
    email: 'info@trattoriabellanyc.com',
  },
  demoUsers: {
    restaurant_admin: { name: 'Ibe Mohammed Ali', email: 'admin@trattoriabella.com', restaurant: 'Trattoria Bella', restaurantKey: 'REST-TRB2026-NYCNY' },
    manager: { name: 'Carter Tierney', email: 'manager@trattoriabella.com', restaurant: 'Trattoria Bella', managerId: 'MGR-CART26-TRBLA' },
    pos_user: { name: 'Shaw Tesafye', email: 'pos@trattoriabella.com', restaurant: 'Trattoria Bella' },
  },
}

// ============================================================
// SOUTHERN BBQ (Magnolia Smokehouse)
// ============================================================
const american_bbq: CuisineTemplate = {
  key: 'american_bbq',
  label: 'Southern BBQ',
  flag: 'US',
  restaurantName: 'Magnolia Smokehouse',
  country: 'United States',
  genre: 'full_service',
  ingredients: [
    { id: '1', name: 'Beef Brisket', category: 'meat', current_inventory: 60, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.18, trend: 10 },
    { id: '2', name: 'Pork Shoulder (Boston Butt)', category: 'meat', current_inventory: 45, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.40, trend: -12 },
    { id: '3', name: 'Baby Back Ribs', category: 'meat', current_inventory: 30, unit: 'racks', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.20, trend: -6 },
    { id: '4', name: 'Spare Ribs', category: 'meat', current_inventory: 18, unit: 'racks', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.38, trend: -10 },
    { id: '5', name: 'Chicken Wings', category: 'meat', current_inventory: 55, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.06, trend: 5 },
    { id: '6', name: 'Smoked Sausage', category: 'meat', current_inventory: 35, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.08, trend: 2 },
    { id: '7', name: 'Pulled Chicken', category: 'meat', current_inventory: 25, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.16, trend: -4 },
    { id: '8', name: 'Beef Short Ribs', category: 'meat', current_inventory: 12, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.65, trend: -22 },
    { id: '9', name: 'Cheddar Cheese', category: 'dairy', current_inventory: 20, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.09, trend: 3 },
    { id: '10', name: 'Buttermilk', category: 'dairy', current_inventory: 10, unit: 'gallons', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.19, trend: -5 },
    { id: '11', name: 'Butter', category: 'dairy', current_inventory: 15, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 0 },
    { id: '12', name: 'Collard Greens', category: 'produce', current_inventory: 22, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.32, trend: -9 },
    { id: '13', name: 'Coleslaw Mix', category: 'produce', current_inventory: 30, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 5, stockout_prob: 0.10, trend: 2 },
    { id: '14', name: 'Pickles (Dill)', category: 'produce', current_inventory: 40, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.03, trend: 0 },
    { id: '15', name: 'Jalapenos', category: 'produce', current_inventory: 18, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.07, trend: 4 },
    { id: '16', name: 'Sweet Potatoes', category: 'produce', current_inventory: 50, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 9, stockout_prob: 0.04, trend: 1 },
    { id: '17', name: 'Corn on the Cob', category: 'produce', current_inventory: 60, unit: 'ears', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.08, trend: 3 },
    { id: '18', name: 'Russet Potatoes', category: 'produce', current_inventory: 70, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
    { id: '19', name: 'Yellow Onions', category: 'produce', current_inventory: 45, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.03, trend: 0 },
    { id: '20', name: 'Bananas', category: 'produce', current_inventory: 15, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 3, stockout_prob: 0.22, trend: -7 },
    { id: '21', name: 'White Bread', category: 'dry', current_inventory: 80, unit: 'slices', risk_level: 'SAFE', days_of_cover: 5, stockout_prob: 0.10, trend: 2 },
    { id: '22', name: 'Cornmeal', category: 'dry', current_inventory: 35, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 14, stockout_prob: 0.02, trend: 0 },
    { id: '23', name: 'BBQ Sauce (House)', category: 'dry', current_inventory: 8, unit: 'gallons', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.58, trend: -18 },
    { id: '24', name: 'Carolina Mustard Sauce', category: 'dry', current_inventory: 5, unit: 'gallons', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.35, trend: -10 },
    { id: '25', name: 'Dry Rub Blend', category: 'dry', current_inventory: 12, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.14, trend: -3 },
    { id: '26', name: 'Hickory Wood Chips', category: 'dry', current_inventory: 40, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 0 },
    { id: '27', name: 'Pecan Wood', category: 'dry', current_inventory: 35, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.07, trend: 2 },
    { id: '28', name: 'Apple Cider Vinegar', category: 'dry', current_inventory: 6, unit: 'gallons', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.04, trend: 0 },
    { id: '29', name: 'Brown Sugar', category: 'dry', current_inventory: 25, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
    { id: '30', name: 'Molasses', category: 'dry', current_inventory: 8, unit: 'gallons', risk_level: 'CRITICAL', days_of_cover: 2, stockout_prob: 0.52, trend: -15 },
  ],
  dishIngredients: [
    { id: '1', name: 'Beef Brisket', unit: 'lbs' }, { id: '2', name: 'Pork Shoulder', unit: 'lbs' },
    { id: '3', name: 'Baby Back Ribs', unit: 'racks' }, { id: '4', name: 'Spare Ribs', unit: 'racks' },
    { id: '5', name: 'Chicken Wings', unit: 'lbs' }, { id: '6', name: 'Smoked Sausage', unit: 'lbs' },
    { id: '7', name: 'Pulled Chicken', unit: 'lbs' }, { id: '8', name: 'Beef Short Ribs', unit: 'lbs' },
    { id: '9', name: 'Cheddar Cheese', unit: 'lbs' }, { id: '10', name: 'Buttermilk', unit: 'gallons' },
    { id: '11', name: 'Butter', unit: 'lbs' }, { id: '12', name: 'Collard Greens', unit: 'lbs' },
    { id: '13', name: 'Coleslaw Mix', unit: 'lbs' }, { id: '14', name: 'Pickles (Dill)', unit: 'lbs' },
    { id: '15', name: 'Jalapenos', unit: 'lbs' }, { id: '16', name: 'Sweet Potatoes', unit: 'lbs' },
    { id: '17', name: 'Corn on the Cob', unit: 'ears' }, { id: '18', name: 'Russet Potatoes', unit: 'lbs' },
    { id: '19', name: 'Yellow Onions', unit: 'lbs' }, { id: '20', name: 'Bananas', unit: 'lbs' },
    { id: '21', name: 'White Bread', unit: 'slices' }, { id: '22', name: 'Cornmeal', unit: 'lbs' },
    { id: '23', name: 'BBQ Sauce (House)', unit: 'gallons' }, { id: '24', name: 'Carolina Mustard Sauce', unit: 'gallons' },
    { id: '25', name: 'Dry Rub Blend', unit: 'lbs' }, { id: '26', name: 'Hickory Wood Chips', unit: 'lbs' },
    { id: '27', name: 'Pecan Wood', unit: 'lbs' }, { id: '28', name: 'Apple Cider Vinegar', unit: 'gallons' },
    { id: '29', name: 'Brown Sugar', unit: 'lbs' }, { id: '30', name: 'Molasses', unit: 'gallons' },
  ],
  dishes: [
    { id: '1', name: 'Smoked Brisket Plate', category: 'BBQ Plates', price: 22.00, is_active: true, recipe: [{ id: '1', ingredient_id: '1', ingredient_name: 'Beef Brisket', quantity: 0.75, unit: 'lbs' }, { id: '2', ingredient_id: '25', ingredient_name: 'Dry Rub Blend', quantity: 0.05, unit: 'lbs' }, { id: '3', ingredient_id: '23', ingredient_name: 'BBQ Sauce (House)', quantity: 0.06, unit: 'gallons' }, { id: '4', ingredient_id: '21', ingredient_name: 'White Bread', quantity: 2, unit: 'slices' }], orders_today: 35, orders_7d: 210, orders_30d: 840, trend: 11.5, popularity_rank: 1, daily_orders: [26, 28, 30, 32, 35, 38, 21], revenue_7d: 4620 },
    { id: '2', name: 'Pulled Pork Sandwich', category: 'Sandwiches', price: 14.00, is_active: true, recipe: [{ id: '5', ingredient_id: '2', ingredient_name: 'Pork Shoulder', quantity: 0.5, unit: 'lbs' }, { id: '6', ingredient_id: '23', ingredient_name: 'BBQ Sauce (House)', quantity: 0.04, unit: 'gallons' }, { id: '7', ingredient_id: '13', ingredient_name: 'Coleslaw Mix', quantity: 0.15, unit: 'lbs' }, { id: '8', ingredient_id: '14', ingredient_name: 'Pickles (Dill)', quantity: 0.1, unit: 'lbs' }], orders_today: 30, orders_7d: 185, orders_30d: 740, trend: 8.2, popularity_rank: 2, daily_orders: [22, 24, 26, 28, 30, 33, 22], revenue_7d: 2590 },
    { id: '3', name: 'Baby Back Ribs (Half Rack)', category: 'BBQ Plates', price: 24.00, is_active: true, recipe: [{ id: '9', ingredient_id: '3', ingredient_name: 'Baby Back Ribs', quantity: 0.5, unit: 'racks' }, { id: '10', ingredient_id: '25', ingredient_name: 'Dry Rub Blend', quantity: 0.06, unit: 'lbs' }, { id: '11', ingredient_id: '23', ingredient_name: 'BBQ Sauce (House)', quantity: 0.05, unit: 'gallons' }], orders_today: 22, orders_7d: 145, orders_30d: 580, trend: 5.8, popularity_rank: 3, daily_orders: [18, 19, 20, 22, 24, 26, 16], revenue_7d: 3480 },
    { id: '4', name: 'Fried Chicken', category: 'BBQ Plates', price: 16.00, is_active: true, recipe: [{ id: '12', ingredient_id: '7', ingredient_name: 'Pulled Chicken', quantity: 0.75, unit: 'lbs' }, { id: '13', ingredient_id: '10', ingredient_name: 'Buttermilk', quantity: 0.125, unit: 'gallons' }, { id: '14', ingredient_id: '22', ingredient_name: 'Cornmeal', quantity: 0.2, unit: 'lbs' }], orders_today: 20, orders_7d: 130, orders_30d: 520, trend: -2.5, popularity_rank: 5, daily_orders: [18, 19, 18, 20, 22, 22, 11], revenue_7d: 2080 },
    { id: '5', name: 'Brisket Burnt Ends', category: 'BBQ Plates', price: 28.00, is_active: true, recipe: [{ id: '15', ingredient_id: '1', ingredient_name: 'Beef Brisket', quantity: 0.6, unit: 'lbs' }, { id: '16', ingredient_id: '23', ingredient_name: 'BBQ Sauce (House)', quantity: 0.08, unit: 'gallons' }, { id: '17', ingredient_id: '29', ingredient_name: 'Brown Sugar', quantity: 0.1, unit: 'lbs' }, { id: '18', ingredient_id: '11', ingredient_name: 'Butter', quantity: 0.1, unit: 'lbs' }], orders_today: 18, orders_7d: 115, orders_30d: 460, trend: 14.2, popularity_rank: 4, daily_orders: [12, 14, 16, 18, 20, 22, 13], revenue_7d: 3220 },
    { id: '6', name: 'Smoked Wings', category: 'Wings', price: 15.00, is_active: true, recipe: [{ id: '19', ingredient_id: '5', ingredient_name: 'Chicken Wings', quantity: 1.0, unit: 'lbs' }, { id: '20', ingredient_id: '25', ingredient_name: 'Dry Rub Blend', quantity: 0.04, unit: 'lbs' }, { id: '21', ingredient_id: '23', ingredient_name: 'BBQ Sauce (House)', quantity: 0.04, unit: 'gallons' }], orders_today: 24, orders_7d: 155, orders_30d: 620, trend: 7.5, popularity_rank: 6, daily_orders: [19, 20, 22, 24, 26, 28, 16], revenue_7d: 2325 },
    { id: '7', name: 'Mac & Cheese', category: 'Sides', price: 8.00, is_active: true, recipe: [{ id: '22', ingredient_id: '9', ingredient_name: 'Cheddar Cheese', quantity: 0.3, unit: 'lbs' }, { id: '23', ingredient_id: '11', ingredient_name: 'Butter', quantity: 0.1, unit: 'lbs' }, { id: '24', ingredient_id: '10', ingredient_name: 'Buttermilk', quantity: 0.06, unit: 'gallons' }], orders_today: 32, orders_7d: 200, orders_30d: 800, trend: 4.0, popularity_rank: 7, daily_orders: [25, 27, 28, 30, 32, 35, 23], revenue_7d: 1600 },
    { id: '8', name: 'Collard Greens', category: 'Sides', price: 6.00, is_active: true, recipe: [{ id: '25', ingredient_id: '12', ingredient_name: 'Collard Greens', quantity: 0.5, unit: 'lbs' }, { id: '26', ingredient_id: '6', ingredient_name: 'Smoked Sausage', quantity: 0.1, unit: 'lbs' }, { id: '27', ingredient_id: '28', ingredient_name: 'Apple Cider Vinegar', quantity: 0.02, unit: 'gallons' }], orders_today: 26, orders_7d: 170, orders_30d: 680, trend: -1.2, popularity_rank: 8, daily_orders: [22, 24, 25, 26, 28, 28, 17], revenue_7d: 1020 },
    { id: '9', name: 'Cornbread', category: 'Sides', price: 6.00, is_active: true, recipe: [{ id: '28', ingredient_id: '22', ingredient_name: 'Cornmeal', quantity: 0.25, unit: 'lbs' }, { id: '29', ingredient_id: '10', ingredient_name: 'Buttermilk', quantity: 0.06, unit: 'gallons' }, { id: '30', ingredient_id: '11', ingredient_name: 'Butter', quantity: 0.08, unit: 'lbs' }], orders_today: 28, orders_7d: 180, orders_30d: 720, trend: 2.5, popularity_rank: 9, daily_orders: [24, 25, 26, 28, 30, 30, 17], revenue_7d: 1080 },
    { id: '10', name: 'Banana Pudding', category: 'Desserts', price: 8.00, is_active: true, recipe: [{ id: '31', ingredient_id: '20', ingredient_name: 'Bananas', quantity: 0.3, unit: 'lbs' }, { id: '32', ingredient_id: '10', ingredient_name: 'Buttermilk', quantity: 0.06, unit: 'gallons' }, { id: '33', ingredient_id: '29', ingredient_name: 'Brown Sugar', quantity: 0.05, unit: 'lbs' }], orders_today: 15, orders_7d: 95, orders_30d: 380, trend: 6.0, popularity_rank: 10, daily_orders: [12, 13, 14, 15, 16, 17, 8], revenue_7d: 760 },
    { id: '11', name: 'Pecan Pie', category: 'Desserts', price: 9.00, is_active: true, recipe: [{ id: '34', ingredient_id: '30', ingredient_name: 'Molasses', quantity: 0.03, unit: 'gallons' }, { id: '35', ingredient_id: '29', ingredient_name: 'Brown Sugar', quantity: 0.1, unit: 'lbs' }, { id: '36', ingredient_id: '11', ingredient_name: 'Butter', quantity: 0.1, unit: 'lbs' }], orders_today: 12, orders_7d: 78, orders_30d: 310, trend: -3.5, popularity_rank: 11, daily_orders: [10, 11, 11, 12, 13, 14, 7], revenue_7d: 702 },
    { id: '12', name: 'Loaded Baked Potato', category: 'Sides', price: 10.00, is_active: true, recipe: [{ id: '37', ingredient_id: '18', ingredient_name: 'Russet Potatoes', quantity: 0.75, unit: 'lbs' }, { id: '38', ingredient_id: '9', ingredient_name: 'Cheddar Cheese', quantity: 0.15, unit: 'lbs' }, { id: '39', ingredient_id: '11', ingredient_name: 'Butter', quantity: 0.1, unit: 'lbs' }, { id: '40', ingredient_id: '15', ingredient_name: 'Jalapenos', quantity: 0.05, unit: 'lbs' }], orders_today: 14, orders_7d: 90, orders_30d: 360, trend: -5.0, popularity_rank: 12, daily_orders: [13, 13, 14, 14, 15, 15, 6], revenue_7d: 900 },
  ],
  menuItems: [
    { id: '1', name: 'Smoked Brisket Plate', price: 22.00, category: 'BBQ Plates', popular: true },
    { id: '2', name: 'Baby Back Ribs (Half)', price: 24.00, category: 'BBQ Plates', popular: true },
    { id: '3', name: 'Baby Back Ribs (Full)', price: 38.00, category: 'BBQ Plates' },
    { id: '4', name: 'Brisket Burnt Ends', price: 28.00, category: 'BBQ Plates', popular: true },
    { id: '5', name: 'Smoked Sausage Plate', price: 16.00, category: 'BBQ Plates' },
    { id: '6', name: 'Pulled Pork Sandwich', price: 14.00, category: 'Sandwiches', popular: true },
    { id: '7', name: 'Brisket Sandwich', price: 18.00, category: 'Sandwiches', popular: true },
    { id: '8', name: 'Pulled Chicken Sandwich', price: 13.00, category: 'Sandwiches' },
    { id: '9', name: 'Fried Chicken Sandwich', price: 15.00, category: 'Sandwiches' },
    { id: '10', name: 'Sausage Po Boy', price: 14.00, category: 'Sandwiches' },
    { id: '11', name: 'Mac & Cheese', price: 8.00, category: 'Sides', popular: true },
    { id: '12', name: 'Collard Greens', price: 6.00, category: 'Sides' },
    { id: '13', name: 'Cornbread', price: 6.00, category: 'Sides', popular: true },
    { id: '14', name: 'Loaded Baked Potato', price: 10.00, category: 'Sides' },
    { id: '15', name: 'Coleslaw', price: 5.00, category: 'Sides' },
    { id: '16', name: 'Baked Beans', price: 6.00, category: 'Sides' },
    { id: '17', name: 'Smoked Wings (6pc)', price: 15.00, category: 'Wings', popular: true },
    { id: '18', name: 'Smoked Wings (12pc)', price: 26.00, category: 'Wings' },
    { id: '19', name: 'Fried Chicken (3pc)', price: 16.00, category: 'Wings' },
    { id: '20', name: 'Sweet Tea', price: 3.50, category: 'Drinks', popular: true },
    { id: '21', name: 'Lemonade', price: 4.00, category: 'Drinks' },
    { id: '22', name: 'Craft Beer', price: 7.00, category: 'Drinks' },
    { id: '23', name: 'Bourbon', price: 10.00, category: 'Drinks' },
    { id: '24', name: 'Arnold Palmer', price: 4.50, category: 'Drinks' },
    { id: '25', name: 'Banana Pudding', price: 8.00, category: 'Desserts', popular: true },
    { id: '26', name: 'Pecan Pie', price: 9.00, category: 'Desserts' },
    { id: '27', name: 'Peach Cobbler', price: 9.00, category: 'Desserts', popular: true },
    { id: '28', name: 'Sweet Potato Pie', price: 8.00, category: 'Desserts' },
  ],
  posCategories: ['BBQ Plates', 'Sandwiches', 'Sides', 'Wings', 'Drinks', 'Desserts'],
  suppliers: [
    { id: '1', name: 'Georgia Prime Meats', lead_time_days: 2, min_order_quantity: 50, reliability_score: 0.97, shipping_cost: 40, ingredients: ['Beef Brisket', 'Beef Short Ribs', 'Pork Shoulder', 'Spare Ribs'], pricing: [{ ingredient: 'Beef Brisket', price: 8.50, unit: 'lb' }, { ingredient: 'Beef Short Ribs', price: 11.00, unit: 'lb' }, { ingredient: 'Pork Shoulder', price: 4.50, unit: 'lb' }, { ingredient: 'Spare Ribs', price: 6.00, unit: 'rack' }] },
    { id: '2', name: 'Dixie Poultry Farm', lead_time_days: 1, min_order_quantity: 30, reliability_score: 0.95, shipping_cost: 25, ingredients: ['Chicken Wings', 'Pulled Chicken', 'Baby Back Ribs', 'Smoked Sausage'], pricing: [{ ingredient: 'Chicken Wings', price: 3.80, unit: 'lb' }, { ingredient: 'Pulled Chicken', price: 5.00, unit: 'lb' }, { ingredient: 'Baby Back Ribs', price: 7.50, unit: 'rack' }, { ingredient: 'Smoked Sausage', price: 5.50, unit: 'lb' }] },
    { id: '3', name: 'Athens Fresh Produce', lead_time_days: 1, min_order_quantity: 25, reliability_score: 0.94, shipping_cost: 20, ingredients: ['Collard Greens', 'Sweet Potatoes', 'Corn on the Cob', 'Yellow Onions', 'Jalapenos'], pricing: [{ ingredient: 'Collard Greens', price: 2.50, unit: 'lb' }, { ingredient: 'Sweet Potatoes', price: 1.80, unit: 'lb' }, { ingredient: 'Corn on the Cob', price: 0.75, unit: 'ear' }, { ingredient: 'Yellow Onions', price: 1.20, unit: 'lb' }, { ingredient: 'Jalapenos', price: 3.00, unit: 'lb' }] },
    { id: '4', name: 'Magnolia Sauce Co', lead_time_days: 2, min_order_quantity: 20, reliability_score: 0.98, shipping_cost: 15, ingredients: ['BBQ Sauce (House)', 'Carolina Mustard Sauce', 'Dry Rub Blend', 'Apple Cider Vinegar'], pricing: [{ ingredient: 'BBQ Sauce (House)', price: 18.00, unit: 'gal' }, { ingredient: 'Carolina Mustard Sauce', price: 15.00, unit: 'gal' }, { ingredient: 'Dry Rub Blend', price: 12.00, unit: 'lb' }, { ingredient: 'Apple Cider Vinegar', price: 6.00, unit: 'gal' }] },
    { id: '5', name: 'Southern Smokewood Supply', lead_time_days: 3, min_order_quantity: 40, reliability_score: 0.92, shipping_cost: 35, ingredients: ['Hickory Wood Chips', 'Pecan Wood', 'Brown Sugar', 'Molasses'], pricing: [{ ingredient: 'Hickory Wood Chips', price: 2.00, unit: 'lb' }, { ingredient: 'Pecan Wood', price: 2.50, unit: 'lb' }, { ingredient: 'Brown Sugar', price: 1.50, unit: 'lb' }, { ingredient: 'Molasses', price: 8.00, unit: 'gal' }] },
    { id: '6', name: 'Peachtree Dairy', lead_time_days: 1, min_order_quantity: 20, reliability_score: 0.96, shipping_cost: 15, ingredients: ['Cheddar Cheese', 'Buttermilk', 'Butter', 'Cornmeal'], pricing: [{ ingredient: 'Cheddar Cheese', price: 6.50, unit: 'lb' }, { ingredient: 'Buttermilk', price: 4.00, unit: 'gal' }, { ingredient: 'Butter', price: 5.00, unit: 'lb' }, { ingredient: 'Cornmeal', price: 1.80, unit: 'lb' }] },
  ],
  orderHistory: [
    { id: 'PO-001', supplier: 'Georgia Prime Meats', items: 4, total: 620.00, status: 'Delivered', date: 'Feb 5, 2026' },
    { id: 'PO-002', supplier: 'Dixie Poultry Farm', items: 3, total: 385.00, status: 'Delivered', date: 'Feb 4, 2026' },
    { id: 'PO-003', supplier: 'Athens Fresh Produce', items: 5, total: 195.00, status: 'In Transit', date: 'Feb 6, 2026' },
    { id: 'PO-004', supplier: 'Magnolia Sauce Co', items: 3, total: 280.00, status: 'Processing', date: 'Feb 7, 2026' },
    { id: 'PO-005', supplier: 'Peachtree Dairy', items: 4, total: 165.00, status: 'Delivered', date: 'Feb 3, 2026' },
  ],
  serverNames: ['Jolene M.', 'Clyde W.', 'Tammy R.'],
  customerNames: ['Earl J.', 'Loretta B.', 'Hank W.', 'Daisy M.', 'Buck T.', 'Patsy C.'],
  topDishesToday: [
    { name: 'Smoked Brisket Plate', orders: 35, trend: 11.5 },
    { name: 'Pulled Pork Sandwich', orders: 30, trend: 8.2 },
    { name: 'Mac & Cheese', orders: 32, trend: 4.0 },
    { name: 'Smoked Wings', orders: 24, trend: 7.5 },
    { name: 'Baby Back Ribs', orders: 22, trend: 5.8 },
  ],
  dailyBriefing: `Howdy! Here's your inventory briefing for Magnolia Smokehouse:

**Priority Items:**
- **BBQ Sauce (House)** is at CRITICAL risk with only 1 day of cover. Contact Magnolia Sauce Co. immediately -- we can't serve a plate without it.
- **Beef Short Ribs** are CRITICAL with 1 day of cover. Georgia Prime Meats needs an urgent order placed before noon.
- **Molasses** is running dangerously low -- essential for our sauce base and baked beans. Order from Southern Smokewood Supply.
- **Pork Shoulder** and **Spare Ribs** show URGENT risk. Saturday cook is projected to burn through remaining stock.

**Menu Insights:**
- **Smoked Brisket Plate** is your #1 seller (210 orders/wk, +11.5%) -- driving heavy brisket demand (157.5 lbs/wk projected).
- **Brisket Burnt Ends** trending up fast (+14.2%) -- consider featuring as weekend special.
- **Pulled Pork Sandwich** is #2 (185/wk, +8.2%) -- pork shoulder depletion is accelerating.
- **Fried Chicken** is slightly down (-2.5%) and **Loaded Baked Potato** dipping (-5.0%). Consider a lunch combo deal to boost orders.

**Today's Outlook:**
- 5 items need immediate attention (3 CRITICAL, 2 URGENT)
- Saturday evening: Expecting 200+ covers (brisket and ribs are top sellers)
- Wing orders trending up 18% this week

**Recommendation:** Place urgent meat and sauce orders before 11 AM for same-day delivery. Feature Smoked Wings and Fried Chicken to take pressure off brisket stock for the weekend rush.`,
  deliveryOrders: [
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Preparing', customer: 'Earl J.', total: 68.50, items: 'Smoked Brisket Plate, Mac & Cheese', color: 'from-red-500 to-red-600' },
    { platform: 'Uber Eats', label: 'UE', labelColor: 'bg-green-500 text-white', status: 'Confirmed', customer: 'Loretta B.', total: 94.75, items: 'Baby Back Ribs (Full), Collard Greens, Cornbread', color: 'from-green-500 to-emerald-600' },
    { platform: 'Grubhub', label: 'GH', labelColor: 'bg-orange-500 text-white', status: 'Out for Delivery', customer: 'Daisy M.', total: 52.00, items: 'Pulled Pork Sandwich x2, Sweet Tea x2', color: 'from-orange-500 to-red-500' },
    { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Pending', customer: 'Buck T.', total: 112.50, items: 'Brisket Burnt Ends, Smoked Wings, Banana Pudding x2', color: 'from-red-500 to-red-600' },
  ],
  smartSuggestions: [
    { ingredient: 'BBQ Sauce (House)', supplier: 'Magnolia Sauce Co', qty: '8 gal', cost: '$144.00', urgency: 'critical' },
    { ingredient: 'Beef Short Ribs', supplier: 'Georgia Prime Meats', qty: '20 lb', cost: '$220.00', urgency: 'urgent' },
    { ingredient: 'Pork Shoulder', supplier: 'Georgia Prime Meats', qty: '40 lb', cost: '$180.00', urgency: 'normal' },
  ],
  takeoutOrders: [
    { id: 'TO-001', customerName: 'Earl J.', phone: '(706) 555-1234', pickupTime: '15 min', items: [{ name: 'Smoked Brisket Plate', quantity: 2 }, { name: 'Cornbread', quantity: 2 }], total: 56.00, status: 'preparing', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'TO-002', customerName: 'Hank W.', phone: '(706) 555-2345', pickupTime: '30 min', items: [{ name: 'Pulled Pork Sandwich', quantity: 3 }, { name: 'Coleslaw', quantity: 3 }], total: 57.00, status: 'pending', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'TO-003', customerName: 'Patsy C.', phone: '(706) 555-3456', pickupTime: '45 min', items: [{ name: 'Baby Back Ribs (Full)', quantity: 1 }, { name: 'Mac & Cheese', quantity: 2 }], total: 54.00, status: 'ready', createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
  ],
  deliveryPlatformOrders: [
    { id: 'DEL-001', platform: 'doordash', platformId: 'DD-MAG91E', customerName: 'Loretta B.', items: [{ name: 'Smoked Brisket Plate', quantity: 1, price: 22.00 }, { name: 'Collard Greens', quantity: 1, price: 6.00 }], total: 32.78, status: 'preparing', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'DEL-002', platform: 'uber_eats', platformId: 'UE-MAG82F', customerName: 'Daisy M.', items: [{ name: 'Pulled Pork Sandwich', quantity: 2, price: 28.00 }], total: 34.45, status: 'received', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'DEL-003', platform: 'grubhub', platformId: 'GH-MAG93A', customerName: 'Buck T.', items: [{ name: 'Brisket Burnt Ends', quantity: 1, price: 28.00 }, { name: 'Mac & Cheese', quantity: 1, price: 8.00 }], total: 42.27, status: 'ready', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'DEL-004', platform: 'doordash', platformId: 'DD-MAG04B', customerName: 'Hank W.', items: [{ name: 'Smoked Wings (12pc)', quantity: 1, price: 26.00 }, { name: 'Loaded Baked Potato', quantity: 1, price: 10.00 }], total: 42.57, status: 'picked_up', createdAt: new Date(Date.now() - 35 * 60000).toISOString() },
  ],
  chatIngredientKeywords: [
    'brisket', 'beef brisket', 'pork shoulder', 'boston butt', 'pulled pork',
    'baby back ribs', 'spare ribs', 'ribs', 'chicken wings', 'wings',
    'smoked sausage', 'sausage', 'pulled chicken', 'short ribs', 'burnt ends',
    'cheddar', 'buttermilk', 'collard greens', 'collards', 'coleslaw',
    'pickles', 'jalapenos', 'sweet potatoes', 'corn', 'cornbread',
    'bbq sauce', 'mustard sauce', 'dry rub', 'hickory', 'pecan wood',
    'vinegar', 'brown sugar', 'molasses',
  ],
  initialChatMessage: "Howdy! I'm your AI assistant for Magnolia Smokehouse. I can help with:\n\n- **Inventory** - Stock levels, forecasts, reorder recommendations\n- **AI Agents** - Risk assessment, optimization decisions\n- **Menu** - BBQ plates, sandwiches, sides, recipes, pricing\n- **Orders** - POS, delivery platforms\n- **Payments** - Including Solana Pay crypto\n- **Suppliers** - Lead times, reliability\n\nWhat can I help you with today?",
  restaurantSettings: {
    name: 'Magnolia Smokehouse',
    address: '234 Magnolia Blvd, Nashville, TN 37201',
    phone: '(615) 555-0211',
    email: 'info@magnoliasmokenashville.com',
  },
  demoUsers: {
    restaurant_admin: { name: 'Ibe Mohammed Ali', email: 'admin@magnoliasmokehouse.com', restaurant: 'Magnolia Smokehouse', restaurantKey: 'REST-MAG2026-NASHV' },
    manager: { name: 'Carter Tierney', email: 'manager@magnoliasmokehouse.com', restaurant: 'Magnolia Smokehouse', managerId: 'MGR-CART26-MAGNO' },
    pos_user: { name: 'Shaw Tesafye', email: 'pos@magnoliasmokehouse.com', restaurant: 'Magnolia Smokehouse' },
  },
}

// ============================================================
// Template registry and exports
// ============================================================
const templates: Record<string, CuisineTemplate> = {
  mediterranean,
  japanese,
  mexican,
  indian,
  italian,
  american_bbq,
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
