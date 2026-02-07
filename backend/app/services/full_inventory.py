"""
Full Inventory Tracking Service — Beyond Food

Tracks ALL restaurant inventory categories:
- Kitchen Equipment (ovens, stoves, grills, fryers, knives, pots, pans, mixers)
- Serviceware (plates, cups, beverage cups, napkins, to-go boxes, bags, lids)
- Cleaning & Facility (chemicals, bathroom materials, trash bags, paper products)
- Beverages (beer, wine, spirits, juices, mixers)
- Staff Supplies (uniforms, aprons, gloves, new hire kits)

Inventory impacts automatically influence AI recommendations.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime


# ==========================================
# Default Inventory Templates by Category
# ==========================================

KITCHEN_EQUIPMENT = [
    {"name": "Commercial Oven", "subcategory": "ovens", "unit": "units", "min_qty": 1, "cost": 8500.00, "storage": "kitchen"},
    {"name": "Gas Stove (6-burner)", "subcategory": "stoves", "unit": "units", "min_qty": 1, "cost": 4200.00, "storage": "kitchen"},
    {"name": "Flat Top Grill", "subcategory": "grills", "unit": "units", "min_qty": 1, "cost": 3800.00, "storage": "kitchen"},
    {"name": "Deep Fryer (Dual)", "subcategory": "fryers", "unit": "units", "min_qty": 1, "cost": 2200.00, "storage": "kitchen"},
    {"name": "Chef's Knife Set", "subcategory": "knives", "unit": "sets", "min_qty": 4, "cost": 250.00, "storage": "kitchen"},
    {"name": "Paring Knife", "subcategory": "knives", "unit": "units", "min_qty": 6, "cost": 35.00, "storage": "kitchen"},
    {"name": "Stock Pot (20 qt)", "subcategory": "pots", "unit": "units", "min_qty": 4, "cost": 120.00, "storage": "kitchen"},
    {"name": "Sauté Pan (12 in)", "subcategory": "pans", "unit": "units", "min_qty": 8, "cost": 85.00, "storage": "kitchen"},
    {"name": "Sheet Pan (Full)", "subcategory": "pans", "unit": "units", "min_qty": 12, "cost": 22.00, "storage": "kitchen"},
    {"name": "Stand Mixer", "subcategory": "mixers", "unit": "units", "min_qty": 1, "cost": 650.00, "storage": "kitchen"},
    {"name": "Immersion Blender", "subcategory": "blenders", "unit": "units", "min_qty": 2, "cost": 180.00, "storage": "kitchen"},
    {"name": "Food Processor", "subcategory": "mixers", "unit": "units", "min_qty": 1, "cost": 420.00, "storage": "kitchen"},
    {"name": "Cutting Board (Color-coded)", "subcategory": "prep", "unit": "sets", "min_qty": 3, "cost": 45.00, "storage": "kitchen"},
    {"name": "Tongs (12 in)", "subcategory": "utensils", "unit": "units", "min_qty": 10, "cost": 8.00, "storage": "kitchen"},
    {"name": "Ladle Set", "subcategory": "utensils", "unit": "sets", "min_qty": 4, "cost": 18.00, "storage": "kitchen"},
]

SERVICEWARE = [
    {"name": "Dinner Plate (10.5 in)", "subcategory": "plates", "unit": "units", "min_qty": 80, "cost": 6.50, "storage": "storage_room"},
    {"name": "Salad Plate (8 in)", "subcategory": "plates", "unit": "units", "min_qty": 60, "cost": 4.50, "storage": "storage_room"},
    {"name": "Bread Plate (6 in)", "subcategory": "plates", "unit": "units", "min_qty": 60, "cost": 3.00, "storage": "storage_room"},
    {"name": "Soup Bowl", "subcategory": "plates", "unit": "units", "min_qty": 40, "cost": 5.00, "storage": "storage_room"},
    {"name": "Water Glass (16 oz)", "subcategory": "cups", "unit": "units", "min_qty": 80, "cost": 2.50, "storage": "bar"},
    {"name": "Wine Glass (Red)", "subcategory": "cups", "unit": "units", "min_qty": 48, "cost": 4.00, "storage": "bar"},
    {"name": "Wine Glass (White)", "subcategory": "cups", "unit": "units", "min_qty": 48, "cost": 4.00, "storage": "bar"},
    {"name": "Rocks Glass", "subcategory": "cups", "unit": "units", "min_qty": 36, "cost": 3.00, "storage": "bar"},
    {"name": "Pint Glass", "subcategory": "cups", "unit": "units", "min_qty": 48, "cost": 2.00, "storage": "bar"},
    {"name": "Coffee Mug", "subcategory": "cups", "unit": "units", "min_qty": 30, "cost": 2.50, "storage": "storage_room"},
    {"name": "Beverage Cup (16 oz, disposable)", "subcategory": "beverage_cups", "unit": "cases", "min_qty": 5, "cost": 32.00, "storage": "storage_room"},
    {"name": "Beverage Cup (12 oz, disposable)", "subcategory": "beverage_cups", "unit": "cases", "min_qty": 5, "cost": 28.00, "storage": "storage_room"},
    {"name": "Cocktail Napkins", "subcategory": "napkins", "unit": "cases", "min_qty": 4, "cost": 24.00, "storage": "storage_room"},
    {"name": "Dinner Napkins (Cloth)", "subcategory": "napkins", "unit": "units", "min_qty": 100, "cost": 1.80, "storage": "storage_room"},
    {"name": "Paper Napkins", "subcategory": "napkins", "unit": "cases", "min_qty": 6, "cost": 18.00, "storage": "storage_room"},
    {"name": "To-Go Box (Large)", "subcategory": "to_go", "unit": "cases", "min_qty": 4, "cost": 42.00, "storage": "storage_room"},
    {"name": "To-Go Box (Small)", "subcategory": "to_go", "unit": "cases", "min_qty": 4, "cost": 35.00, "storage": "storage_room"},
    {"name": "To-Go Bag (Large)", "subcategory": "to_go", "unit": "cases", "min_qty": 3, "cost": 28.00, "storage": "storage_room"},
    {"name": "Cup Lids (fits 16 oz)", "subcategory": "to_go", "unit": "cases", "min_qty": 5, "cost": 22.00, "storage": "storage_room"},
    {"name": "Straws (Paper)", "subcategory": "to_go", "unit": "cases", "min_qty": 3, "cost": 38.00, "storage": "storage_room"},
    {"name": "Utensil Kit (Fork/Knife/Napkin)", "subcategory": "to_go", "unit": "cases", "min_qty": 3, "cost": 45.00, "storage": "storage_room"},
    {"name": "Silverware Set (Fork)", "subcategory": "silverware", "unit": "units", "min_qty": 80, "cost": 3.50, "storage": "storage_room"},
    {"name": "Silverware Set (Knife)", "subcategory": "silverware", "unit": "units", "min_qty": 80, "cost": 3.50, "storage": "storage_room"},
    {"name": "Silverware Set (Spoon)", "subcategory": "silverware", "unit": "units", "min_qty": 80, "cost": 3.00, "storage": "storage_room"},
]

CLEANING_FACILITY = [
    {"name": "Degreaser (Commercial)", "subcategory": "chemicals", "unit": "gallons", "min_qty": 3, "cost": 24.00, "storage": "storage_room"},
    {"name": "Sanitizer Solution", "subcategory": "chemicals", "unit": "gallons", "min_qty": 5, "cost": 18.00, "storage": "kitchen"},
    {"name": "Glass Cleaner", "subcategory": "chemicals", "unit": "bottles", "min_qty": 4, "cost": 6.50, "storage": "storage_room"},
    {"name": "Floor Cleaner", "subcategory": "chemicals", "unit": "gallons", "min_qty": 3, "cost": 15.00, "storage": "storage_room"},
    {"name": "Dish Soap (Commercial)", "subcategory": "chemicals", "unit": "gallons", "min_qty": 4, "cost": 12.00, "storage": "kitchen"},
    {"name": "Hand Soap (Dispenser Refill)", "subcategory": "bathroom", "unit": "cases", "min_qty": 2, "cost": 28.00, "storage": "bathroom"},
    {"name": "Paper Towels (Multi-fold)", "subcategory": "bathroom", "unit": "cases", "min_qty": 4, "cost": 32.00, "storage": "bathroom"},
    {"name": "Toilet Paper (Commercial)", "subcategory": "bathroom", "unit": "cases", "min_qty": 3, "cost": 45.00, "storage": "bathroom"},
    {"name": "Toilet Seat Covers", "subcategory": "bathroom", "unit": "cases", "min_qty": 2, "cost": 22.00, "storage": "bathroom"},
    {"name": "Trash Bags (55 gal)", "subcategory": "trash", "unit": "cases", "min_qty": 3, "cost": 35.00, "storage": "storage_room"},
    {"name": "Trash Bags (33 gal)", "subcategory": "trash", "unit": "cases", "min_qty": 3, "cost": 28.00, "storage": "kitchen"},
    {"name": "Recycling Bags (Blue)", "subcategory": "trash", "unit": "cases", "min_qty": 2, "cost": 30.00, "storage": "storage_room"},
    {"name": "Mop Heads", "subcategory": "supplies", "unit": "units", "min_qty": 4, "cost": 12.00, "storage": "storage_room"},
    {"name": "Sponges (Heavy Duty)", "subcategory": "supplies", "unit": "packs", "min_qty": 6, "cost": 8.00, "storage": "kitchen"},
    {"name": "Steel Wool Pads", "subcategory": "supplies", "unit": "packs", "min_qty": 4, "cost": 6.00, "storage": "kitchen"},
    {"name": "Microfiber Cloths", "subcategory": "supplies", "unit": "packs", "min_qty": 6, "cost": 14.00, "storage": "storage_room"},
    {"name": "Air Freshener Refills", "subcategory": "bathroom", "unit": "units", "min_qty": 4, "cost": 8.00, "storage": "bathroom"},
]

BEVERAGES = [
    # Beer
    {"name": "House Draft Beer (Keg)", "subcategory": "beer", "unit": "kegs", "min_qty": 2, "cost": 185.00, "storage": "bar"},
    {"name": "Craft IPA (Keg)", "subcategory": "beer", "unit": "kegs", "min_qty": 1, "cost": 220.00, "storage": "bar"},
    {"name": "Bottled Beer (Domestic)", "subcategory": "beer", "unit": "cases", "min_qty": 4, "cost": 22.00, "storage": "bar"},
    {"name": "Bottled Beer (Import)", "subcategory": "beer", "unit": "cases", "min_qty": 3, "cost": 32.00, "storage": "bar"},
    # Wine
    {"name": "House Red Wine", "subcategory": "wine", "unit": "bottles", "min_qty": 12, "cost": 14.00, "storage": "bar"},
    {"name": "House White Wine", "subcategory": "wine", "unit": "bottles", "min_qty": 12, "cost": 13.00, "storage": "bar"},
    {"name": "Prosecco / Sparkling", "subcategory": "wine", "unit": "bottles", "min_qty": 8, "cost": 16.00, "storage": "bar"},
    {"name": "Premium Wine Selection", "subcategory": "wine", "unit": "bottles", "min_qty": 6, "cost": 28.00, "storage": "bar"},
    # Spirits
    {"name": "Vodka (House)", "subcategory": "spirits", "unit": "bottles", "min_qty": 4, "cost": 22.00, "storage": "bar"},
    {"name": "Gin (House)", "subcategory": "spirits", "unit": "bottles", "min_qty": 3, "cost": 26.00, "storage": "bar"},
    {"name": "Rum (House)", "subcategory": "spirits", "unit": "bottles", "min_qty": 3, "cost": 20.00, "storage": "bar"},
    {"name": "Tequila (House)", "subcategory": "spirits", "unit": "bottles", "min_qty": 3, "cost": 28.00, "storage": "bar"},
    {"name": "Whiskey / Bourbon", "subcategory": "spirits", "unit": "bottles", "min_qty": 3, "cost": 35.00, "storage": "bar"},
    # Juices & Mixers
    {"name": "Orange Juice", "subcategory": "juices", "unit": "gallons", "min_qty": 3, "cost": 8.00, "storage": "bar"},
    {"name": "Cranberry Juice", "subcategory": "juices", "unit": "gallons", "min_qty": 2, "cost": 7.50, "storage": "bar"},
    {"name": "Pineapple Juice", "subcategory": "juices", "unit": "gallons", "min_qty": 2, "cost": 9.00, "storage": "bar"},
    {"name": "Lime Juice (Fresh)", "subcategory": "juices", "unit": "bottles", "min_qty": 4, "cost": 12.00, "storage": "bar"},
    {"name": "Simple Syrup", "subcategory": "mixers", "unit": "bottles", "min_qty": 4, "cost": 6.00, "storage": "bar"},
    {"name": "Tonic Water", "subcategory": "mixers", "unit": "cases", "min_qty": 3, "cost": 18.00, "storage": "bar"},
    {"name": "Club Soda", "subcategory": "mixers", "unit": "cases", "min_qty": 3, "cost": 15.00, "storage": "bar"},
    {"name": "Grenadine", "subcategory": "mixers", "unit": "bottles", "min_qty": 2, "cost": 8.00, "storage": "bar"},
    {"name": "Bitters (Angostura)", "subcategory": "mixers", "unit": "bottles", "min_qty": 2, "cost": 12.00, "storage": "bar"},
]

STAFF_SUPPLIES = [
    {"name": "Chef Coat (White)", "subcategory": "uniforms", "unit": "units", "min_qty": 6, "cost": 32.00, "storage": "storage_room"},
    {"name": "Server Apron (Black)", "subcategory": "aprons", "unit": "units", "min_qty": 10, "cost": 18.00, "storage": "storage_room"},
    {"name": "Kitchen Apron (Heavy)", "subcategory": "aprons", "unit": "units", "min_qty": 6, "cost": 22.00, "storage": "storage_room"},
    {"name": "Disposable Gloves (Nitrile, M)", "subcategory": "gloves", "unit": "boxes", "min_qty": 8, "cost": 12.00, "storage": "kitchen"},
    {"name": "Disposable Gloves (Nitrile, L)", "subcategory": "gloves", "unit": "boxes", "min_qty": 8, "cost": 12.00, "storage": "kitchen"},
    {"name": "Heat-Resistant Gloves", "subcategory": "gloves", "unit": "pairs", "min_qty": 4, "cost": 28.00, "storage": "kitchen"},
    {"name": "Non-Slip Shoes (Voucher)", "subcategory": "uniforms", "unit": "vouchers", "min_qty": 0, "cost": 65.00, "storage": "storage_room"},
    {"name": "New Hire Kit", "subcategory": "new_hire", "unit": "kits", "min_qty": 3, "cost": 85.00, "storage": "storage_room"},
    {"name": "Hair Nets", "subcategory": "hygiene", "unit": "boxes", "min_qty": 4, "cost": 8.00, "storage": "kitchen"},
    {"name": "First Aid Kit (Refill)", "subcategory": "safety", "unit": "kits", "min_qty": 2, "cost": 35.00, "storage": "kitchen"},
    {"name": "Order Pad (Server)", "subcategory": "supplies", "unit": "packs", "min_qty": 10, "cost": 4.00, "storage": "storage_room"},
]


ALL_CATEGORIES = {
    "kitchen_equipment": KITCHEN_EQUIPMENT,
    "serviceware": SERVICEWARE,
    "cleaning": CLEANING_FACILITY,
    "beverages": BEVERAGES,
    "staff_supplies": STAFF_SUPPLIES,
}

CATEGORY_LABELS = {
    "kitchen_equipment": "Kitchen Equipment",
    "serviceware": "Serviceware & Disposables",
    "cleaning": "Cleaning & Facility",
    "beverages": "Beverages (Bar)",
    "staff_supplies": "Staff Supplies",
}


def get_default_inventory_items(categories: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """Get all default inventory items, optionally filtered by category."""
    cats = categories or list(ALL_CATEGORIES.keys())
    items = []
    for cat in cats:
        for item in ALL_CATEGORIES.get(cat, []):
            items.append({
                **item,
                "category": cat,
            })
    return items


def get_low_stock_alerts(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return items that are below their minimum quantity threshold."""
    alerts = []
    for item in items:
        current = item.get("current_quantity", 0)
        min_qty = item.get("min_quantity", 0) or item.get("min_qty", 0)
        if current <= min_qty:
            alerts.append({
                "name": item["name"],
                "category": item.get("category", ""),
                "current": current,
                "minimum": min_qty,
                "unit": item.get("unit", "units"),
                "urgency": "critical" if current == 0 else "low",
            })
    return sorted(alerts, key=lambda x: x["current"])


def get_inventory_value_summary(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate total inventory value by category."""
    by_category = {}
    total = 0
    for item in items:
        cat = item.get("category", "other")
        qty = item.get("current_quantity", 0)
        cost = item.get("unit_cost", 0) or item.get("cost", 0)
        value = qty * cost
        total += value
        if cat not in by_category:
            by_category[cat] = {"label": CATEGORY_LABELS.get(cat, cat), "value": 0, "item_count": 0}
        by_category[cat]["value"] += value
        by_category[cat]["item_count"] += 1

    return {
        "total_value": round(total, 2),
        "by_category": {k: {**v, "value": round(v["value"], 2)} for k, v in by_category.items()},
    }
