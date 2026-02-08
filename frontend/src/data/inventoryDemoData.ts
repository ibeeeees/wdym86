/**
 * Cuisine-specific inventory demo data for all 6 restaurant types.
 * Each cuisine has ~20 items across 5 categories:
 *   kitchen_equipment, serviceware, cleaning, beverages, staff_supplies
 */

export interface InventoryItem {
  id: string
  restaurant_id: string
  category: string
  name: string
  quantity: number
  unit: string
  minimum_quantity: number
  cost_per_unit: number
  supplier_name: string | null
  location: string | null
  last_restocked: string | null
  notes: string | null
}

// ---------------------------------------------------------------------------
// Mediterranean — Mykonos Mediterranean
// ---------------------------------------------------------------------------
const mediterranean: InventoryItem[] = [
  // Kitchen Equipment
  { id: 'med-1', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Vertical Gyro Slicer', quantity: 2, unit: 'units', minimum_quantity: 2, cost_per_unit: 349.99, supplier_name: 'Nella Cutlery', location: 'Kitchen - Grill Station', last_restocked: '2026-01-18', notes: null },
  { id: 'med-2', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Pizza Stone (16")', quantity: 4, unit: 'units', minimum_quantity: 3, cost_per_unit: 42.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Oven Area', last_restocked: '2026-01-22', notes: null },
  { id: 'med-3', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Olive Oil Dispenser Bottles', quantity: 6, unit: 'units', minimum_quantity: 8, cost_per_unit: 14.50, supplier_name: 'WebstaurantStore', location: 'Kitchen - Prep Station', last_restocked: '2025-12-28', notes: 'Running low' },
  { id: 'med-4', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Mortar & Pestle (Marble)', quantity: 3, unit: 'units', minimum_quantity: 2, cost_per_unit: 28.99, supplier_name: 'Sysco', location: 'Kitchen - Spice Station', last_restocked: '2026-01-10', notes: null },
  { id: 'med-5', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Charcoal Grill Grates', quantity: 3, unit: 'units', minimum_quantity: 2, cost_per_unit: 89.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Grill Station', last_restocked: '2026-01-25', notes: null },
  // Serviceware
  { id: 'med-6', restaurant_id: 'demo', category: 'serviceware', name: 'Ceramic Mezze Plates (6")', quantity: 48, unit: 'units', minimum_quantity: 40, cost_per_unit: 6.99, supplier_name: 'US Foods', location: 'FOH - Plate Storage', last_restocked: '2026-01-15', notes: null },
  { id: 'med-7', restaurant_id: 'demo', category: 'serviceware', name: 'Raki/Ouzo Glasses', quantity: 24, unit: 'units', minimum_quantity: 30, cost_per_unit: 5.50, supplier_name: 'WebstaurantStore', location: 'Bar - Glass Rack', last_restocked: '2025-12-20', notes: 'Below minimum' },
  { id: 'med-8', restaurant_id: 'demo', category: 'serviceware', name: 'Oval Serving Platters (14")', quantity: 12, unit: 'units', minimum_quantity: 8, cost_per_unit: 18.99, supplier_name: 'Sysco', location: 'FOH - Plate Storage', last_restocked: '2026-01-20', notes: null },
  { id: 'med-9', restaurant_id: 'demo', category: 'serviceware', name: 'Pita Bread Baskets (Woven)', quantity: 15, unit: 'units', minimum_quantity: 10, cost_per_unit: 7.25, supplier_name: 'Restaurant Depot', location: 'FOH - Bread Station', last_restocked: '2026-02-01', notes: null },
  { id: 'med-10', restaurant_id: 'demo', category: 'serviceware', name: 'Linen Napkins (Navy Blue)', quantity: 180, unit: 'units', minimum_quantity: 150, cost_per_unit: 2.50, supplier_name: 'Cintas', location: 'FOH - Linen Closet', last_restocked: '2026-01-28', notes: null },
  // Cleaning
  { id: 'med-11', restaurant_id: 'demo', category: 'cleaning', name: 'Commercial Degreaser', quantity: 6, unit: 'gallons', minimum_quantity: 4, cost_per_unit: 24.99, supplier_name: 'Sysco', location: 'Storage Room', last_restocked: '2026-01-30', notes: null },
  { id: 'med-12', restaurant_id: 'demo', category: 'cleaning', name: 'Sanitizer Tablets (QT)', quantity: 2, unit: 'bottles', minimum_quantity: 5, cost_per_unit: 15.99, supplier_name: 'Restaurant Depot', location: 'Storage Room', last_restocked: '2025-12-10', notes: 'LOW - reorder immediately' },
  { id: 'med-13', restaurant_id: 'demo', category: 'cleaning', name: 'Grill Cleaning Bricks', quantity: 8, unit: 'units', minimum_quantity: 6, cost_per_unit: 4.99, supplier_name: 'WebstaurantStore', location: 'Kitchen - Grill Station', last_restocked: '2026-01-15', notes: null },
  { id: 'med-14', restaurant_id: 'demo', category: 'cleaning', name: 'Trash Bags (55 gal)', quantity: 3, unit: 'cases', minimum_quantity: 3, cost_per_unit: 32.00, supplier_name: 'US Foods', location: 'Storage Room', last_restocked: '2026-01-22', notes: null },
  // Beverages
  { id: 'med-15', restaurant_id: 'demo', category: 'beverages', name: 'Ouzo (750ml)', quantity: 8, unit: 'bottles', minimum_quantity: 6, cost_per_unit: 22.99, supplier_name: 'Wine Distributor', location: 'Bar - Spirits Shelf', last_restocked: '2026-01-20', notes: null },
  { id: 'med-16', restaurant_id: 'demo', category: 'beverages', name: 'Greek Wine (Assyrtiko)', quantity: 12, unit: 'bottles', minimum_quantity: 10, cost_per_unit: 16.50, supplier_name: 'Wine Distributor', location: 'Bar - Wine Rack', last_restocked: '2026-01-18', notes: null },
  { id: 'med-17', restaurant_id: 'demo', category: 'beverages', name: 'Turkish Coffee (Ground)', quantity: 3, unit: 'lbs', minimum_quantity: 8, cost_per_unit: 19.99, supplier_name: 'Local Roaster', location: 'Bar - Coffee Station', last_restocked: '2025-12-28', notes: 'Running low' },
  // Staff Supplies
  { id: 'med-18', restaurant_id: 'demo', category: 'staff_supplies', name: 'Aprons (White, Greek Pattern)', quantity: 14, unit: 'units', minimum_quantity: 10, cost_per_unit: 16.99, supplier_name: 'Cintas', location: 'Staff Room', last_restocked: '2026-01-05', notes: null },
  { id: 'med-19', restaurant_id: 'demo', category: 'staff_supplies', name: 'Disposable Gloves (L)', quantity: 2, unit: 'cases', minimum_quantity: 4, cost_per_unit: 28.00, supplier_name: 'Sysco', location: 'Kitchen - Shelf C1', last_restocked: '2025-12-30', notes: 'Need to reorder' },
  { id: 'med-20', restaurant_id: 'demo', category: 'staff_supplies', name: 'Non-Slip Kitchen Shoes', quantity: 8, unit: 'pairs', minimum_quantity: 6, cost_per_unit: 45.00, supplier_name: 'Shoes For Crews', location: 'Staff Room', last_restocked: '2026-01-12', notes: null },
]

// ---------------------------------------------------------------------------
// Japanese — Sakura Japanese Kitchen
// ---------------------------------------------------------------------------
const japanese: InventoryItem[] = [
  // Kitchen Equipment
  { id: 'jpn-1', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Yanagiba Sushi Knife (10.5")', quantity: 4, unit: 'units', minimum_quantity: 3, cost_per_unit: 189.99, supplier_name: 'Korin Japanese Trading', location: 'Kitchen - Sushi Bar', last_restocked: '2026-01-18', notes: null },
  { id: 'jpn-2', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Commercial Rice Cooker (23 cup)', quantity: 2, unit: 'units', minimum_quantity: 2, cost_per_unit: 329.99, supplier_name: 'Zojirushi Direct', location: 'Kitchen - Rice Station', last_restocked: '2026-01-05', notes: null },
  { id: 'jpn-3', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Carbon Steel Wok (14")', quantity: 5, unit: 'units', minimum_quantity: 4, cost_per_unit: 54.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Wok Station', last_restocked: '2026-01-22', notes: null },
  { id: 'jpn-4', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Bamboo Sushi Rolling Mats', quantity: 8, unit: 'units', minimum_quantity: 10, cost_per_unit: 3.99, supplier_name: 'Korin Japanese Trading', location: 'Kitchen - Sushi Bar', last_restocked: '2025-12-20', notes: 'Below minimum' },
  { id: 'jpn-5', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Tempura Fryer (Countertop)', quantity: 2, unit: 'units', minimum_quantity: 2, cost_per_unit: 199.99, supplier_name: 'WebstaurantStore', location: 'Kitchen - Fry Station', last_restocked: '2026-01-10', notes: null },
  // Serviceware
  { id: 'jpn-6', restaurant_id: 'demo', category: 'serviceware', name: 'Chopstick Sets (Reusable)', quantity: 60, unit: 'pairs', minimum_quantity: 80, cost_per_unit: 2.99, supplier_name: 'Korin Japanese Trading', location: 'FOH - Utensil Station', last_restocked: '2025-12-15', notes: 'Need to reorder' },
  { id: 'jpn-7', restaurant_id: 'demo', category: 'serviceware', name: 'Sake Cups (Ceramic)', quantity: 36, unit: 'units', minimum_quantity: 30, cost_per_unit: 4.50, supplier_name: 'WebstaurantStore', location: 'Bar - Glass Rack', last_restocked: '2026-01-20', notes: null },
  { id: 'jpn-8', restaurant_id: 'demo', category: 'serviceware', name: 'Bento Box Containers', quantity: 25, unit: 'units', minimum_quantity: 20, cost_per_unit: 12.99, supplier_name: 'Restaurant Depot', location: 'FOH - Takeout Station', last_restocked: '2026-01-25', notes: null },
  { id: 'jpn-9', restaurant_id: 'demo', category: 'serviceware', name: 'Sushi Geta Plates (Wood)', quantity: 14, unit: 'units', minimum_quantity: 10, cost_per_unit: 15.99, supplier_name: 'Korin Japanese Trading', location: 'Kitchen - Sushi Bar', last_restocked: '2026-01-15', notes: null },
  { id: 'jpn-10', restaurant_id: 'demo', category: 'serviceware', name: 'Ramen Bowls (Large, Ceramic)', quantity: 40, unit: 'units', minimum_quantity: 30, cost_per_unit: 8.99, supplier_name: 'US Foods', location: 'FOH - Bowl Storage', last_restocked: '2026-02-01', notes: null },
  // Cleaning
  { id: 'jpn-11', restaurant_id: 'demo', category: 'cleaning', name: 'Sushi Bar Sanitizer Spray', quantity: 4, unit: 'bottles', minimum_quantity: 6, cost_per_unit: 12.99, supplier_name: 'Sysco', location: 'Kitchen - Sushi Bar', last_restocked: '2025-12-28', notes: 'Running low' },
  { id: 'jpn-12', restaurant_id: 'demo', category: 'cleaning', name: 'Bamboo Mat Cleaner', quantity: 3, unit: 'bottles', minimum_quantity: 3, cost_per_unit: 8.50, supplier_name: 'Korin Japanese Trading', location: 'Kitchen - Sushi Bar', last_restocked: '2026-01-10', notes: null },
  { id: 'jpn-13', restaurant_id: 'demo', category: 'cleaning', name: 'Kitchen Floor Degreaser', quantity: 5, unit: 'gallons', minimum_quantity: 4, cost_per_unit: 22.99, supplier_name: 'Sysco', location: 'Storage Room', last_restocked: '2026-01-30', notes: null },
  { id: 'jpn-14', restaurant_id: 'demo', category: 'cleaning', name: 'Trash Bags (33 gal)', quantity: 3, unit: 'cases', minimum_quantity: 3, cost_per_unit: 26.00, supplier_name: 'US Foods', location: 'Storage Room', last_restocked: '2026-01-22', notes: null },
  // Beverages
  { id: 'jpn-15', restaurant_id: 'demo', category: 'beverages', name: 'Sake (Junmai, 720ml)', quantity: 15, unit: 'bottles', minimum_quantity: 10, cost_per_unit: 24.99, supplier_name: 'Wine Distributor', location: 'Bar - Sake Cooler', last_restocked: '2026-01-20', notes: null },
  { id: 'jpn-16', restaurant_id: 'demo', category: 'beverages', name: 'Matcha Powder (Ceremonial)', quantity: 2, unit: 'lbs', minimum_quantity: 5, cost_per_unit: 34.99, supplier_name: 'Ippodo Tea', location: 'Bar - Tea Station', last_restocked: '2025-12-18', notes: 'LOW - reorder' },
  { id: 'jpn-17', restaurant_id: 'demo', category: 'beverages', name: 'Ramune Soda (Assorted)', quantity: 4, unit: 'cases', minimum_quantity: 3, cost_per_unit: 18.99, supplier_name: 'Asian Food Distributor', location: 'Bar - Cooler', last_restocked: '2026-02-01', notes: null },
  // Staff Supplies
  { id: 'jpn-18', restaurant_id: 'demo', category: 'staff_supplies', name: 'Sushi Chef Headbands (Hachimaki)', quantity: 10, unit: 'units', minimum_quantity: 6, cost_per_unit: 8.99, supplier_name: 'Korin Japanese Trading', location: 'Staff Room', last_restocked: '2026-01-08', notes: null },
  { id: 'jpn-19', restaurant_id: 'demo', category: 'staff_supplies', name: 'Disposable Sushi Gloves (M)', quantity: 1, unit: 'cases', minimum_quantity: 3, cost_per_unit: 32.00, supplier_name: 'Sysco', location: 'Kitchen - Sushi Bar', last_restocked: '2025-12-22', notes: 'LOW - reorder' },
  { id: 'jpn-20', restaurant_id: 'demo', category: 'staff_supplies', name: 'Chef Coats (White)', quantity: 8, unit: 'units', minimum_quantity: 6, cost_per_unit: 24.99, supplier_name: 'Cintas', location: 'Staff Room', last_restocked: '2026-01-15', notes: null },
]

// ---------------------------------------------------------------------------
// Mexican — Casa del Sol
// ---------------------------------------------------------------------------
const mexican: InventoryItem[] = [
  // Kitchen Equipment
  { id: 'mex-1', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Cast Iron Tortilla Press', quantity: 3, unit: 'units', minimum_quantity: 2, cost_per_unit: 34.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Tortilla Station', last_restocked: '2026-01-18', notes: null },
  { id: 'mex-2', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Molcajete (Volcanic Stone)', quantity: 4, unit: 'units', minimum_quantity: 3, cost_per_unit: 29.99, supplier_name: 'MexGrocer Supply', location: 'Kitchen - Prep Station', last_restocked: '2026-01-10', notes: null },
  { id: 'mex-3', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Comal Griddle (Round, 18")', quantity: 3, unit: 'units', minimum_quantity: 3, cost_per_unit: 45.99, supplier_name: 'WebstaurantStore', location: 'Kitchen - Grill Line', last_restocked: '2026-01-22', notes: null },
  { id: 'mex-4', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Churro Maker (Commercial)', quantity: 1, unit: 'units', minimum_quantity: 1, cost_per_unit: 249.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Dessert Station', last_restocked: '2026-01-05', notes: null },
  { id: 'mex-5', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Bean Masher (Stainless Steel)', quantity: 4, unit: 'units', minimum_quantity: 3, cost_per_unit: 12.99, supplier_name: 'Sysco', location: 'Kitchen - Prep Station', last_restocked: '2026-01-25', notes: null },
  // Serviceware
  { id: 'mex-6', restaurant_id: 'demo', category: 'serviceware', name: 'Talavera Dinner Plates (10")', quantity: 60, unit: 'units', minimum_quantity: 50, cost_per_unit: 9.99, supplier_name: 'MexGrocer Supply', location: 'FOH - Plate Storage', last_restocked: '2026-01-15', notes: null },
  { id: 'mex-7', restaurant_id: 'demo', category: 'serviceware', name: 'Margarita Glasses (Salt Rim)', quantity: 20, unit: 'units', minimum_quantity: 36, cost_per_unit: 6.99, supplier_name: 'WebstaurantStore', location: 'Bar - Glass Rack', last_restocked: '2025-12-18', notes: 'Below minimum - reorder' },
  { id: 'mex-8', restaurant_id: 'demo', category: 'serviceware', name: 'Tortilla Warmers (Ceramic)', quantity: 10, unit: 'units', minimum_quantity: 8, cost_per_unit: 11.50, supplier_name: 'Restaurant Depot', location: 'FOH - Bread Station', last_restocked: '2026-01-20', notes: null },
  { id: 'mex-9', restaurant_id: 'demo', category: 'serviceware', name: 'Salsa Bowls (Molcajete Style)', quantity: 30, unit: 'units', minimum_quantity: 24, cost_per_unit: 5.25, supplier_name: 'MexGrocer Supply', location: 'FOH - Salsa Station', last_restocked: '2026-01-28', notes: null },
  { id: 'mex-10', restaurant_id: 'demo', category: 'serviceware', name: 'Colorful Cloth Napkins', quantity: 160, unit: 'units', minimum_quantity: 120, cost_per_unit: 2.75, supplier_name: 'Cintas', location: 'FOH - Linen Closet', last_restocked: '2026-02-01', notes: null },
  // Cleaning
  { id: 'mex-11', restaurant_id: 'demo', category: 'cleaning', name: 'Griddle Cleaner (Comal)', quantity: 4, unit: 'bottles', minimum_quantity: 3, cost_per_unit: 14.99, supplier_name: 'Sysco', location: 'Kitchen - Grill Line', last_restocked: '2026-01-30', notes: null },
  { id: 'mex-12', restaurant_id: 'demo', category: 'cleaning', name: 'Sanitizer Concentrate', quantity: 2, unit: 'gallons', minimum_quantity: 4, cost_per_unit: 18.99, supplier_name: 'Restaurant Depot', location: 'Storage Room', last_restocked: '2025-12-15', notes: 'LOW - reorder' },
  { id: 'mex-13', restaurant_id: 'demo', category: 'cleaning', name: 'Floor Cleaner (Pine Sol)', quantity: 6, unit: 'gallons', minimum_quantity: 4, cost_per_unit: 9.99, supplier_name: 'US Foods', location: 'Storage Room', last_restocked: '2026-01-22', notes: null },
  { id: 'mex-14', restaurant_id: 'demo', category: 'cleaning', name: 'Heavy Duty Trash Bags (55 gal)', quantity: 4, unit: 'cases', minimum_quantity: 3, cost_per_unit: 32.00, supplier_name: 'US Foods', location: 'Storage Room', last_restocked: '2026-01-25', notes: null },
  // Beverages
  { id: 'mex-15', restaurant_id: 'demo', category: 'beverages', name: 'Tequila Blanco (1L)', quantity: 6, unit: 'bottles', minimum_quantity: 8, cost_per_unit: 34.99, supplier_name: 'Spirits Distributor', location: 'Bar - Tequila Shelf', last_restocked: '2025-12-28', notes: 'Running low' },
  { id: 'mex-16', restaurant_id: 'demo', category: 'beverages', name: 'Horchata Mix (Concentrate)', quantity: 5, unit: 'gallons', minimum_quantity: 4, cost_per_unit: 12.50, supplier_name: 'MexGrocer Supply', location: 'Bar - Cooler', last_restocked: '2026-01-18', notes: null },
  { id: 'mex-17', restaurant_id: 'demo', category: 'beverages', name: 'Jarritos Soda (Assorted)', quantity: 6, unit: 'cases', minimum_quantity: 4, cost_per_unit: 16.99, supplier_name: 'MexGrocer Supply', location: 'Bar - Cooler', last_restocked: '2026-02-01', notes: null },
  // Staff Supplies
  { id: 'mex-18', restaurant_id: 'demo', category: 'staff_supplies', name: 'Embroidered Aprons (Colorful)', quantity: 12, unit: 'units', minimum_quantity: 10, cost_per_unit: 18.99, supplier_name: 'Cintas', location: 'Staff Room', last_restocked: '2026-01-05', notes: null },
  { id: 'mex-19', restaurant_id: 'demo', category: 'staff_supplies', name: 'Disposable Gloves (M/L)', quantity: 1, unit: 'cases', minimum_quantity: 4, cost_per_unit: 28.00, supplier_name: 'Sysco', location: 'Kitchen - Shelf C1', last_restocked: '2025-12-30', notes: 'Need to reorder' },
  { id: 'mex-20', restaurant_id: 'demo', category: 'staff_supplies', name: 'Hair Nets (Bulk)', quantity: 3, unit: 'boxes', minimum_quantity: 2, cost_per_unit: 8.99, supplier_name: 'Restaurant Depot', location: 'Staff Room', last_restocked: '2026-01-12', notes: null },
]

// ---------------------------------------------------------------------------
// Indian — Spice Route
// ---------------------------------------------------------------------------
const indian: InventoryItem[] = [
  // Kitchen Equipment
  { id: 'ind-1', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Tandoor Oven Skewers (Set)', quantity: 4, unit: 'sets', minimum_quantity: 3, cost_per_unit: 45.99, supplier_name: 'India Kitchen Supply', location: 'Kitchen - Tandoor Station', last_restocked: '2026-01-18', notes: null },
  { id: 'ind-2', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Masala Dabba (Spice Box)', quantity: 6, unit: 'units', minimum_quantity: 4, cost_per_unit: 24.99, supplier_name: 'India Kitchen Supply', location: 'Kitchen - Spice Station', last_restocked: '2026-01-10', notes: null },
  { id: 'ind-3', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Kadai Wok (Iron, 14")', quantity: 5, unit: 'units', minimum_quantity: 4, cost_per_unit: 38.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Curry Station', last_restocked: '2026-01-22', notes: null },
  { id: 'ind-4', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Chapati Press (Roti Maker)', quantity: 2, unit: 'units', minimum_quantity: 2, cost_per_unit: 89.99, supplier_name: 'India Kitchen Supply', location: 'Kitchen - Bread Station', last_restocked: '2026-01-05', notes: null },
  { id: 'ind-5', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Spice Grinder (Commercial)', quantity: 2, unit: 'units', minimum_quantity: 2, cost_per_unit: 129.99, supplier_name: 'WebstaurantStore', location: 'Kitchen - Spice Station', last_restocked: '2026-01-25', notes: null },
  // Serviceware
  { id: 'ind-6', restaurant_id: 'demo', category: 'serviceware', name: 'Stainless Steel Thali Plates', quantity: 50, unit: 'units', minimum_quantity: 40, cost_per_unit: 8.99, supplier_name: 'India Kitchen Supply', location: 'FOH - Plate Storage', last_restocked: '2026-01-15', notes: null },
  { id: 'ind-7', restaurant_id: 'demo', category: 'serviceware', name: 'Copper Tumblers (Lassi Cups)', quantity: 24, unit: 'units', minimum_quantity: 30, cost_per_unit: 7.50, supplier_name: 'India Kitchen Supply', location: 'Bar - Glass Rack', last_restocked: '2025-12-20', notes: 'Below minimum' },
  { id: 'ind-8', restaurant_id: 'demo', category: 'serviceware', name: 'Naan Bread Baskets (Brass)', quantity: 12, unit: 'units', minimum_quantity: 8, cost_per_unit: 14.99, supplier_name: 'Restaurant Depot', location: 'FOH - Bread Station', last_restocked: '2026-01-20', notes: null },
  { id: 'ind-9', restaurant_id: 'demo', category: 'serviceware', name: 'Small Chutney Bowls (Steel)', quantity: 60, unit: 'units', minimum_quantity: 48, cost_per_unit: 3.25, supplier_name: 'Sysco', location: 'FOH - Condiment Station', last_restocked: '2026-01-28', notes: null },
  { id: 'ind-10', restaurant_id: 'demo', category: 'serviceware', name: 'Cloth Table Runners (Saffron)', quantity: 20, unit: 'units', minimum_quantity: 15, cost_per_unit: 9.99, supplier_name: 'Cintas', location: 'FOH - Linen Closet', last_restocked: '2026-02-01', notes: null },
  // Cleaning
  { id: 'ind-11', restaurant_id: 'demo', category: 'cleaning', name: 'Tandoor Oven Cleaner', quantity: 3, unit: 'bottles', minimum_quantity: 4, cost_per_unit: 18.99, supplier_name: 'India Kitchen Supply', location: 'Kitchen - Tandoor Station', last_restocked: '2025-12-28', notes: 'Running low' },
  { id: 'ind-12', restaurant_id: 'demo', category: 'cleaning', name: 'Turmeric Stain Remover', quantity: 4, unit: 'bottles', minimum_quantity: 3, cost_per_unit: 11.99, supplier_name: 'Sysco', location: 'Storage Room', last_restocked: '2026-01-15', notes: null },
  { id: 'ind-13', restaurant_id: 'demo', category: 'cleaning', name: 'Grease Trap Cleaner', quantity: 5, unit: 'gallons', minimum_quantity: 4, cost_per_unit: 19.99, supplier_name: 'Restaurant Depot', location: 'Storage Room', last_restocked: '2026-01-30', notes: null },
  { id: 'ind-14', restaurant_id: 'demo', category: 'cleaning', name: 'Trash Bags (44 gal)', quantity: 2, unit: 'cases', minimum_quantity: 3, cost_per_unit: 29.00, supplier_name: 'US Foods', location: 'Storage Room', last_restocked: '2025-12-22', notes: 'Reorder soon' },
  // Beverages
  { id: 'ind-15', restaurant_id: 'demo', category: 'beverages', name: 'Chai Masala Tea (Loose Leaf)', quantity: 4, unit: 'lbs', minimum_quantity: 6, cost_per_unit: 16.99, supplier_name: 'India Kitchen Supply', location: 'Bar - Tea Station', last_restocked: '2025-12-18', notes: 'Running low' },
  { id: 'ind-16', restaurant_id: 'demo', category: 'beverages', name: 'Mango Lassi Mix', quantity: 6, unit: 'gallons', minimum_quantity: 4, cost_per_unit: 14.50, supplier_name: 'India Kitchen Supply', location: 'Bar - Cooler', last_restocked: '2026-01-20', notes: null },
  { id: 'ind-17', restaurant_id: 'demo', category: 'beverages', name: 'Kingfisher Beer', quantity: 3, unit: 'cases', minimum_quantity: 4, cost_per_unit: 28.99, supplier_name: 'Beer Distributor', location: 'Bar - Cooler', last_restocked: '2026-01-10', notes: 'Below minimum' },
  // Staff Supplies
  { id: 'ind-18', restaurant_id: 'demo', category: 'staff_supplies', name: 'Chef Kurta Tops', quantity: 8, unit: 'units', minimum_quantity: 6, cost_per_unit: 22.99, supplier_name: 'India Kitchen Supply', location: 'Staff Room', last_restocked: '2026-01-08', notes: null },
  { id: 'ind-19', restaurant_id: 'demo', category: 'staff_supplies', name: 'Heat-Resistant Gloves (Tandoor)', quantity: 3, unit: 'pairs', minimum_quantity: 4, cost_per_unit: 19.99, supplier_name: 'WebstaurantStore', location: 'Kitchen - Tandoor Station', last_restocked: '2025-12-30', notes: 'Need more' },
  { id: 'ind-20', restaurant_id: 'demo', category: 'staff_supplies', name: 'Disposable Gloves (L)', quantity: 3, unit: 'cases', minimum_quantity: 4, cost_per_unit: 28.00, supplier_name: 'Sysco', location: 'Kitchen - Shelf C1', last_restocked: '2026-01-02', notes: null },
]

// ---------------------------------------------------------------------------
// Italian — Trattoria Bella
// ---------------------------------------------------------------------------
const italian: InventoryItem[] = [
  // Kitchen Equipment
  { id: 'ita-1', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Pasta Machine (Imperia)', quantity: 2, unit: 'units', minimum_quantity: 2, cost_per_unit: 199.99, supplier_name: 'WebstaurantStore', location: 'Kitchen - Pasta Station', last_restocked: '2026-01-18', notes: null },
  { id: 'ita-2', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Pizza Peel (Wooden, 14")', quantity: 4, unit: 'units', minimum_quantity: 3, cost_per_unit: 24.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Pizza Oven', last_restocked: '2026-01-22', notes: null },
  { id: 'ita-3', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Espresso Machine (La Marzocco)', quantity: 1, unit: 'units', minimum_quantity: 1, cost_per_unit: 4899.99, supplier_name: 'La Marzocco USA', location: 'Bar - Coffee Station', last_restocked: '2025-11-15', notes: 'Service due Q2' },
  { id: 'ita-4', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Ravioli Stamp Cutters (Set)', quantity: 3, unit: 'sets', minimum_quantity: 2, cost_per_unit: 18.99, supplier_name: 'WebstaurantStore', location: 'Kitchen - Pasta Station', last_restocked: '2026-01-10', notes: null },
  { id: 'ita-5', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Wood-Fired Pizza Stone', quantity: 2, unit: 'units', minimum_quantity: 2, cost_per_unit: 79.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Pizza Oven', last_restocked: '2026-01-25', notes: null },
  // Serviceware
  { id: 'ita-6', restaurant_id: 'demo', category: 'serviceware', name: 'Pasta Bowls (Wide Rim)', quantity: 55, unit: 'units', minimum_quantity: 48, cost_per_unit: 7.99, supplier_name: 'US Foods', location: 'FOH - Plate Storage', last_restocked: '2026-01-15', notes: null },
  { id: 'ita-7', restaurant_id: 'demo', category: 'serviceware', name: 'Wine Decanters (Crystal)', quantity: 6, unit: 'units', minimum_quantity: 8, cost_per_unit: 32.99, supplier_name: 'WebstaurantStore', location: 'Bar - Wine Station', last_restocked: '2025-12-18', notes: 'Below minimum' },
  { id: 'ita-8', restaurant_id: 'demo', category: 'serviceware', name: 'Tiramisu Cups (Glass)', quantity: 24, unit: 'units', minimum_quantity: 20, cost_per_unit: 4.50, supplier_name: 'Restaurant Depot', location: 'FOH - Dessert Station', last_restocked: '2026-01-20', notes: null },
  { id: 'ita-9', restaurant_id: 'demo', category: 'serviceware', name: 'Breadstick Baskets (Wicker)', quantity: 14, unit: 'units', minimum_quantity: 10, cost_per_unit: 6.99, supplier_name: 'Sysco', location: 'FOH - Bread Station', last_restocked: '2026-01-28', notes: null },
  { id: 'ita-10', restaurant_id: 'demo', category: 'serviceware', name: 'Italian Linen Napkins (White)', quantity: 200, unit: 'units', minimum_quantity: 150, cost_per_unit: 2.99, supplier_name: 'Cintas', location: 'FOH - Linen Closet', last_restocked: '2026-02-01', notes: null },
  // Cleaning
  { id: 'ita-11', restaurant_id: 'demo', category: 'cleaning', name: 'Pizza Oven Brush (Brass)', quantity: 3, unit: 'units', minimum_quantity: 2, cost_per_unit: 19.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Pizza Oven', last_restocked: '2026-01-30', notes: null },
  { id: 'ita-12', restaurant_id: 'demo', category: 'cleaning', name: 'Espresso Machine Descaler', quantity: 2, unit: 'bottles', minimum_quantity: 4, cost_per_unit: 14.99, supplier_name: 'La Marzocco USA', location: 'Bar - Coffee Station', last_restocked: '2025-12-10', notes: 'LOW - reorder' },
  { id: 'ita-13', restaurant_id: 'demo', category: 'cleaning', name: 'Commercial Degreaser', quantity: 5, unit: 'gallons', minimum_quantity: 4, cost_per_unit: 24.99, supplier_name: 'Sysco', location: 'Storage Room', last_restocked: '2026-01-22', notes: null },
  { id: 'ita-14', restaurant_id: 'demo', category: 'cleaning', name: 'Trash Bags (55 gal)', quantity: 4, unit: 'cases', minimum_quantity: 3, cost_per_unit: 32.00, supplier_name: 'US Foods', location: 'Storage Room', last_restocked: '2026-01-25', notes: null },
  // Beverages
  { id: 'ita-15', restaurant_id: 'demo', category: 'beverages', name: 'Prosecco (DOC, 750ml)', quantity: 14, unit: 'bottles', minimum_quantity: 10, cost_per_unit: 18.99, supplier_name: 'Wine Distributor', location: 'Bar - Wine Rack', last_restocked: '2026-01-20', notes: null },
  { id: 'ita-16', restaurant_id: 'demo', category: 'beverages', name: 'Limoncello (500ml)', quantity: 4, unit: 'bottles', minimum_quantity: 6, cost_per_unit: 22.50, supplier_name: 'Spirits Distributor', location: 'Bar - Spirits Shelf', last_restocked: '2025-12-28', notes: 'Running low' },
  { id: 'ita-17', restaurant_id: 'demo', category: 'beverages', name: 'Espresso Beans (Dark Roast)', quantity: 4, unit: 'lbs', minimum_quantity: 10, cost_per_unit: 21.99, supplier_name: 'Local Roaster', location: 'Bar - Coffee Station', last_restocked: '2025-12-22', notes: 'LOW - critical' },
  // Staff Supplies
  { id: 'ita-18', restaurant_id: 'demo', category: 'staff_supplies', name: 'Chef Coats (Classic White)', quantity: 10, unit: 'units', minimum_quantity: 8, cost_per_unit: 28.99, supplier_name: 'Cintas', location: 'Staff Room', last_restocked: '2026-01-08', notes: null },
  { id: 'ita-19', restaurant_id: 'demo', category: 'staff_supplies', name: 'Disposable Gloves (M)', quantity: 2, unit: 'cases', minimum_quantity: 4, cost_per_unit: 28.00, supplier_name: 'Sysco', location: 'Kitchen - Shelf C1', last_restocked: '2025-12-30', notes: 'Need to reorder' },
  { id: 'ita-20', restaurant_id: 'demo', category: 'staff_supplies', name: 'Server Aprons (Black, Long)', quantity: 12, unit: 'units', minimum_quantity: 10, cost_per_unit: 14.99, supplier_name: 'Cintas', location: 'Staff Room', last_restocked: '2026-01-15', notes: null },
]

// ---------------------------------------------------------------------------
// American BBQ — Magnolia Smokehouse
// ---------------------------------------------------------------------------
const american_bbq: InventoryItem[] = [
  // Kitchen Equipment
  { id: 'bbq-1', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Hickory Smoking Wood Chips', quantity: 3, unit: 'bags', minimum_quantity: 6, cost_per_unit: 18.99, supplier_name: 'BBQ Supply Co', location: 'Kitchen - Smoker Area', last_restocked: '2025-12-28', notes: 'LOW - reorder' },
  { id: 'bbq-2', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Digital Meat Thermometer', quantity: 6, unit: 'units', minimum_quantity: 4, cost_per_unit: 24.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Grill Station', last_restocked: '2026-01-22', notes: null },
  { id: 'bbq-3', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Silicone Basting Brushes (12")', quantity: 8, unit: 'units', minimum_quantity: 6, cost_per_unit: 6.99, supplier_name: 'WebstaurantStore', location: 'Kitchen - Grill Station', last_restocked: '2026-01-18', notes: null },
  { id: 'bbq-4', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Meat Claws (Pulled Pork)', quantity: 4, unit: 'pairs', minimum_quantity: 3, cost_per_unit: 9.99, supplier_name: 'BBQ Supply Co', location: 'Kitchen - Prep Station', last_restocked: '2026-01-10', notes: null },
  { id: 'bbq-5', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Cast Iron Dutch Oven (8 qt)', quantity: 3, unit: 'units', minimum_quantity: 2, cost_per_unit: 64.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Stove Area', last_restocked: '2026-01-25', notes: null },
  // Serviceware
  { id: 'bbq-6', restaurant_id: 'demo', category: 'serviceware', name: 'Mason Jar Glasses (16oz)', quantity: 48, unit: 'units', minimum_quantity: 40, cost_per_unit: 3.50, supplier_name: 'US Foods', location: 'Bar - Glass Rack', last_restocked: '2026-01-15', notes: null },
  { id: 'bbq-7', restaurant_id: 'demo', category: 'serviceware', name: 'BBQ Serving Platters (Oval)', quantity: 14, unit: 'units', minimum_quantity: 12, cost_per_unit: 12.99, supplier_name: 'WebstaurantStore', location: 'FOH - Plate Storage', last_restocked: '2026-01-20', notes: null },
  { id: 'bbq-8', restaurant_id: 'demo', category: 'serviceware', name: 'Corn Cob Holders (Sets)', quantity: 20, unit: 'sets', minimum_quantity: 24, cost_per_unit: 2.99, supplier_name: 'Restaurant Depot', location: 'FOH - Utensil Station', last_restocked: '2025-12-15', notes: 'Below minimum' },
  { id: 'bbq-9', restaurant_id: 'demo', category: 'serviceware', name: 'Paper-Lined Trays (Checkered)', quantity: 200, unit: 'units', minimum_quantity: 150, cost_per_unit: 0.75, supplier_name: 'Sysco', location: 'FOH - Tray Station', last_restocked: '2026-01-28', notes: null },
  { id: 'bbq-10', restaurant_id: 'demo', category: 'serviceware', name: 'Sauce Squeeze Bottles (Set)', quantity: 10, unit: 'sets', minimum_quantity: 8, cost_per_unit: 8.99, supplier_name: 'WebstaurantStore', location: 'FOH - Condiment Station', last_restocked: '2026-02-01', notes: null },
  // Cleaning
  { id: 'bbq-11', restaurant_id: 'demo', category: 'cleaning', name: 'Smoker Grate Cleaner', quantity: 3, unit: 'bottles', minimum_quantity: 4, cost_per_unit: 16.99, supplier_name: 'BBQ Supply Co', location: 'Kitchen - Smoker Area', last_restocked: '2025-12-28', notes: 'Running low' },
  { id: 'bbq-12', restaurant_id: 'demo', category: 'cleaning', name: 'Heavy Duty Degreaser', quantity: 6, unit: 'gallons', minimum_quantity: 4, cost_per_unit: 26.99, supplier_name: 'Sysco', location: 'Storage Room', last_restocked: '2026-01-30', notes: null },
  { id: 'bbq-13', restaurant_id: 'demo', category: 'cleaning', name: 'Sanitizer Wipes (Industrial)', quantity: 2, unit: 'cases', minimum_quantity: 3, cost_per_unit: 24.99, supplier_name: 'Restaurant Depot', location: 'Storage Room', last_restocked: '2025-12-20', notes: 'Reorder soon' },
  { id: 'bbq-14', restaurant_id: 'demo', category: 'cleaning', name: 'Trash Bags (55 gal, Heavy)', quantity: 5, unit: 'cases', minimum_quantity: 3, cost_per_unit: 34.00, supplier_name: 'US Foods', location: 'Storage Room', last_restocked: '2026-01-22', notes: null },
  // Beverages
  { id: 'bbq-15', restaurant_id: 'demo', category: 'beverages', name: 'Sweet Tea Concentrate', quantity: 4, unit: 'gallons', minimum_quantity: 6, cost_per_unit: 8.99, supplier_name: 'US Foods', location: 'Bar - Beverage Station', last_restocked: '2025-12-28', notes: 'Running low' },
  { id: 'bbq-16', restaurant_id: 'demo', category: 'beverages', name: 'Bourbon (750ml, House)', quantity: 8, unit: 'bottles', minimum_quantity: 6, cost_per_unit: 29.99, supplier_name: 'Spirits Distributor', location: 'Bar - Spirits Shelf', last_restocked: '2026-01-20', notes: null },
  { id: 'bbq-17', restaurant_id: 'demo', category: 'beverages', name: 'Root Beer (Craft, Cases)', quantity: 5, unit: 'cases', minimum_quantity: 4, cost_per_unit: 22.99, supplier_name: 'Local Brewery', location: 'Bar - Cooler', last_restocked: '2026-02-01', notes: null },
  // Staff Supplies
  { id: 'bbq-18', restaurant_id: 'demo', category: 'staff_supplies', name: 'Denim Aprons (Heavy Duty)', quantity: 10, unit: 'units', minimum_quantity: 8, cost_per_unit: 22.99, supplier_name: 'Cintas', location: 'Staff Room', last_restocked: '2026-01-05', notes: null },
  { id: 'bbq-19', restaurant_id: 'demo', category: 'staff_supplies', name: 'Heat-Resistant BBQ Gloves', quantity: 4, unit: 'pairs', minimum_quantity: 6, cost_per_unit: 18.99, supplier_name: 'BBQ Supply Co', location: 'Kitchen - Smoker Area', last_restocked: '2025-12-22', notes: 'Need more' },
  { id: 'bbq-20', restaurant_id: 'demo', category: 'staff_supplies', name: 'Disposable Gloves (XL)', quantity: 2, unit: 'cases', minimum_quantity: 4, cost_per_unit: 30.00, supplier_name: 'Sysco', location: 'Kitchen - Shelf C1', last_restocked: '2025-12-30', notes: 'Need to reorder' },
]

// ---------------------------------------------------------------------------
// Export helper
// ---------------------------------------------------------------------------

const inventoryByType: Record<string, InventoryItem[]> = {
  mediterranean,
  japanese,
  mexican,
  indian,
  italian,
  american_bbq,
}

export function getCuisineInventory(cuisineType?: string): InventoryItem[] {
  return inventoryByType[cuisineType || 'mediterranean'] || mediterranean
}
