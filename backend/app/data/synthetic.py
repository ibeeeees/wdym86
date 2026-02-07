"""
Synthetic Data Generator

Generates realistic restaurant usage data for demos and testing.
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json


def generate_usage_series(
    base_demand: float,
    n_days: int = 90,
    weekly_pattern: Optional[List[float]] = None,
    noise_level: float = 0.15,
    trend: float = 0.0,
    seasonality_amplitude: float = 0.1,
    seed: Optional[int] = None
) -> np.ndarray:
    """
    Generate synthetic daily usage data

    Args:
        base_demand: Average daily demand
        n_days: Number of days to generate
        weekly_pattern: Multipliers for Mon-Sun (default: restaurant pattern)
        noise_level: Standard deviation of noise as fraction of demand
        trend: Daily trend factor (e.g., 0.001 for 0.1% daily growth)
        seasonality_amplitude: Amplitude of seasonal variation
        seed: Random seed for reproducibility

    Returns:
        Array of daily usage values
    """
    if seed is not None:
        np.random.seed(seed)

    # Default restaurant pattern (slower Mon-Tue, busy Fri-Sat)
    if weekly_pattern is None:
        weekly_pattern = [0.8, 0.85, 0.95, 1.0, 1.15, 1.25, 1.1]

    usage = np.zeros(n_days)

    for day in range(n_days):
        # Base demand with trend
        base = base_demand * (1 + trend * day)

        # Day of week effect
        dow = day % 7
        dow_effect = weekly_pattern[dow]

        # Seasonal effect (annual cycle approximated over demo period)
        season_effect = 1 + seasonality_amplitude * np.sin(2 * np.pi * day / 365)

        # Random noise
        noise = np.random.normal(1, noise_level)
        noise = max(0.5, min(1.5, noise))  # Clip extreme values

        # Combine effects
        daily_usage = base * dow_effect * season_effect * noise

        # Ensure non-negative
        usage[day] = max(0, daily_usage)

    return usage


def generate_events(
    n_days: int,
    event_probability: float = 0.05,
    event_boost: float = 1.5,
    seed: Optional[int] = None
) -> np.ndarray:
    """Generate random event flags"""
    if seed is not None:
        np.random.seed(seed)

    events = np.random.random(n_days) < event_probability
    return events.astype(float)


def generate_weather_series(
    n_days: int,
    base_severity: float = 0.1,
    storm_probability: float = 0.05,
    seed: Optional[int] = None
) -> np.ndarray:
    """Generate synthetic weather severity data"""
    if seed is not None:
        np.random.seed(seed)

    weather = np.random.beta(2, 10, n_days) * 0.3  # Mostly mild

    # Add occasional storms
    storm_days = np.random.random(n_days) < storm_probability
    weather[storm_days] = np.random.uniform(0.6, 1.0, sum(storm_days))

    return weather


def generate_traffic_series(
    n_days: int,
    seed: Optional[int] = None
) -> np.ndarray:
    """Generate synthetic traffic congestion data"""
    if seed is not None:
        np.random.seed(seed)

    # Higher traffic on weekdays
    traffic = np.zeros(n_days)
    for day in range(n_days):
        dow = day % 7
        if dow < 5:  # Weekday
            traffic[day] = np.random.beta(3, 5)
        else:  # Weekend
            traffic[day] = np.random.beta(2, 8)

    return traffic


def generate_restaurant_data(
    n_ingredients: int = 10,
    n_days: int = 90,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Generate complete synthetic restaurant data

    Returns data suitable for seeding the database and demo.
    """
    np.random.seed(seed)

    # Restaurant info - Mykonos Mediterranean
    restaurant = {
        'name': 'Mykonos Mediterranean Restaurant',
        'location': 'Athens, GA'
    }

    # Mykonos Mediterranean ingredients with realistic parameters
    ingredient_templates = [
        # Proteins (Meat & Seafood)
        {'name': 'Lamb Leg', 'unit': 'lbs', 'category': 'meat', 'base_demand': 35, 'shelf_life': 4, 'perishable': True, 'cost': 12.50},
        {'name': 'Chicken Thighs', 'unit': 'lbs', 'category': 'meat', 'base_demand': 45, 'shelf_life': 4, 'perishable': True, 'cost': 3.80},
        {'name': 'Ground Lamb', 'unit': 'lbs', 'category': 'meat', 'base_demand': 25, 'shelf_life': 3, 'perishable': True, 'cost': 9.50},
        {'name': 'Branzino', 'unit': 'lbs', 'category': 'seafood', 'base_demand': 20, 'shelf_life': 2, 'perishable': True, 'cost': 18.00},
        {'name': 'Octopus', 'unit': 'lbs', 'category': 'seafood', 'base_demand': 12, 'shelf_life': 2, 'perishable': True, 'cost': 22.00},
        {'name': 'Shrimp (Large)', 'unit': 'lbs', 'category': 'seafood', 'base_demand': 18, 'shelf_life': 2, 'perishable': True, 'cost': 14.00},
        # Dairy & Cheese
        {'name': 'Feta Cheese', 'unit': 'lbs', 'category': 'dairy', 'base_demand': 30, 'shelf_life': 21, 'perishable': True, 'cost': 8.50},
        {'name': 'Halloumi', 'unit': 'lbs', 'category': 'dairy', 'base_demand': 15, 'shelf_life': 30, 'perishable': True, 'cost': 12.00},
        {'name': 'Greek Yogurt', 'unit': 'lbs', 'category': 'dairy', 'base_demand': 25, 'shelf_life': 14, 'perishable': True, 'cost': 4.50},
        # Produce
        {'name': 'Tomatoes', 'unit': 'lbs', 'category': 'produce', 'base_demand': 40, 'shelf_life': 7, 'perishable': True, 'cost': 2.80},
        {'name': 'Cucumbers', 'unit': 'lbs', 'category': 'produce', 'base_demand': 25, 'shelf_life': 7, 'perishable': True, 'cost': 1.50},
        {'name': 'Red Onions', 'unit': 'lbs', 'category': 'produce', 'base_demand': 20, 'shelf_life': 14, 'perishable': True, 'cost': 1.20},
        {'name': 'Eggplant', 'unit': 'lbs', 'category': 'produce', 'base_demand': 18, 'shelf_life': 7, 'perishable': True, 'cost': 2.00},
        {'name': 'Bell Peppers', 'unit': 'lbs', 'category': 'produce', 'base_demand': 15, 'shelf_life': 10, 'perishable': True, 'cost': 3.50},
        {'name': 'Fresh Spinach', 'unit': 'lbs', 'category': 'produce', 'base_demand': 12, 'shelf_life': 5, 'perishable': True, 'cost': 4.00},
        {'name': 'Lemons', 'unit': 'units', 'category': 'produce', 'base_demand': 80, 'shelf_life': 14, 'perishable': True, 'cost': 0.40},
        # Dry Goods & Grains
        {'name': 'Orzo Pasta', 'unit': 'lbs', 'category': 'dry_goods', 'base_demand': 20, 'shelf_life': 365, 'perishable': False, 'cost': 2.50},
        {'name': 'Arborio Rice', 'unit': 'lbs', 'category': 'dry_goods', 'base_demand': 15, 'shelf_life': 365, 'perishable': False, 'cost': 3.00},
        {'name': 'Phyllo Dough', 'unit': 'boxes', 'category': 'dry_goods', 'base_demand': 8, 'shelf_life': 90, 'perishable': False, 'cost': 6.50},
        {'name': 'Chickpeas (Dried)', 'unit': 'lbs', 'category': 'dry_goods', 'base_demand': 15, 'shelf_life': 365, 'perishable': False, 'cost': 1.80},
        # Oils & Sauces
        {'name': 'Extra Virgin Olive Oil', 'unit': 'gallons', 'category': 'oils', 'base_demand': 8, 'shelf_life': 365, 'perishable': False, 'cost': 28.00},
        {'name': 'Tahini', 'unit': 'lbs', 'category': 'oils', 'base_demand': 5, 'shelf_life': 180, 'perishable': False, 'cost': 7.00},
        # Herbs & Spices
        {'name': 'Fresh Oregano', 'unit': 'bunches', 'category': 'herbs', 'base_demand': 20, 'shelf_life': 7, 'perishable': True, 'cost': 2.00},
        {'name': 'Fresh Dill', 'unit': 'bunches', 'category': 'herbs', 'base_demand': 15, 'shelf_life': 5, 'perishable': True, 'cost': 2.00},
        {'name': 'Fresh Mint', 'unit': 'bunches', 'category': 'herbs', 'base_demand': 12, 'shelf_life': 5, 'perishable': True, 'cost': 2.00},
        # Bar Ingredients
        {'name': 'Ouzo', 'unit': 'bottles', 'category': 'spirits', 'base_demand': 4, 'shelf_life': 730, 'perishable': False, 'cost': 25.00},
        {'name': 'Metaxa', 'unit': 'bottles', 'category': 'spirits', 'base_demand': 3, 'shelf_life': 730, 'perishable': False, 'cost': 32.00},
        {'name': 'Greek Wine (Assyrtiko)', 'unit': 'bottles', 'category': 'wine', 'base_demand': 15, 'shelf_life': 365, 'perishable': False, 'cost': 18.00},
        {'name': 'Pomegranate Juice', 'unit': 'liters', 'category': 'beverages', 'base_demand': 10, 'shelf_life': 14, 'perishable': True, 'cost': 5.50},
        {'name': 'Honey (Greek)', 'unit': 'lbs', 'category': 'dry_goods', 'base_demand': 8, 'shelf_life': 365, 'perishable': False, 'cost': 12.00},
    ]

    # Limit to requested number
    templates = ingredient_templates[:n_ingredients]

    # Mediterranean Suppliers
    suppliers = [
        {'name': 'Aegean Imports', 'lead_time': 4, 'moq': 75, 'reliability': 0.94, 'shipping': 45},
        {'name': 'Athens Fresh Market', 'lead_time': 2, 'moq': 30, 'reliability': 0.88, 'shipping': 25},
        {'name': 'Mediterranean Seafood Co.', 'lead_time': 1, 'moq': 20, 'reliability': 0.92, 'shipping': 55},
        {'name': 'Hellenic Wines & Spirits', 'lead_time': 5, 'moq': 12, 'reliability': 0.96, 'shipping': 30},
        {'name': 'Olympus Dairy', 'lead_time': 2, 'moq': 25, 'reliability': 0.90, 'shipping': 20},
    ]

    # Generate data for each ingredient
    ingredients_data = []
    today = datetime.now()

    for i, template in enumerate(templates):
        # Generate usage history
        usage = generate_usage_series(
            base_demand=template['base_demand'],
            n_days=n_days,
            seed=seed + i
        )

        # Generate external factors
        events = generate_events(n_days, seed=seed + i + 100)
        weather = generate_weather_series(n_days, seed=seed + i + 200)
        traffic = generate_traffic_series(n_days, seed=seed + i + 300)

        # Calculate current inventory (random reasonable level)
        avg_usage = np.mean(usage[-7:])
        current_inventory = avg_usage * np.random.uniform(3, 10)

        # Generate dates
        dates = [today - timedelta(days=n_days-d-1) for d in range(n_days)]

        ingredients_data.append({
            'info': {
                'name': template['name'],
                'unit': template['unit'],
                'category': template['category'],
                'shelf_life_days': template['shelf_life'],
                'is_perishable': template['perishable'],
                'unit_cost': template['cost']
            },
            'current_inventory': float(current_inventory),
            'usage_history': [
                {
                    'date': dates[d].isoformat(),
                    'quantity_used': float(usage[d]),
                    'event_flag': bool(events[d]),
                    'weather_severity': float(weather[d]),
                    'traffic_index': float(traffic[d]),
                    'hazard_flag': False
                }
                for d in range(n_days)
            ],
            'avg_daily_usage': float(np.mean(usage)),
            'usage_std': float(np.std(usage))
        })

    return {
        'restaurant': restaurant,
        'suppliers': suppliers,
        'ingredients': ingredients_data,
        'generated_at': datetime.now().isoformat(),
        'config': {
            'n_ingredients': n_ingredients,
            'n_days': n_days,
            'seed': seed
        }
    }


def save_synthetic_data(filepath: str, **kwargs):
    """Generate and save synthetic data to JSON file"""
    data = generate_restaurant_data(**kwargs)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    return data


if __name__ == '__main__':
    # Generate demo data
    data = generate_restaurant_data()
    print(f"Generated data for {len(data['ingredients'])} ingredients")
    print(f"Days of history: {len(data['ingredients'][0]['usage_history'])}")

    # Save to file
    save_synthetic_data('../../data/synthetic/demo_data.json')
    print("Saved to demo_data.json")
