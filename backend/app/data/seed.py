"""
Database Seeding Script

Seeds the database with demo data for showcasing the platform.
"""

import asyncio
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import async_session_maker, User, Restaurant, Ingredient, Supplier, IngredientSupplier, InventoryState, UsageHistory, Dish, Recipe, Forecast
from .synthetic import generate_restaurant_data


async def seed_database(force: bool = False):
    """
    Seed database with demo data

    Args:
        force: If True, seed even if data exists
    """
    async with async_session_maker() as session:
        # Check if data already exists
        result = await session.execute(select(func.count(Ingredient.id)))
        count = result.scalar()

        if count > 0 and not force:
            print(f"Database already has {count} ingredients. Skipping seed.")
            return False

        print("Seeding database with demo data...")

        # Generate synthetic data - Mykonos has 30 ingredients
        data = generate_restaurant_data(n_ingredients=30, n_days=90, seed=42)

        # Create demo user
        demo_user = User(
            id="demo-user-id",
            email="demo@wdym86.com",
            password_hash="$2b$12$demo_hash_not_for_real_auth",
            name="Demo User"
        )
        session.add(demo_user)

        # Create restaurant
        restaurant = Restaurant(
            id="demo-restaurant-id",
            user_id="demo-user-id",
            name=data['restaurant']['name'],
            location=data['restaurant']['location']
        )
        session.add(restaurant)

        # Create suppliers
        supplier_ids = []
        for i, sup_data in enumerate(data['suppliers']):
            supplier = Supplier(
                id=f"supplier-{i+1}",
                restaurant_id="demo-restaurant-id",
                name=sup_data['name'],
                lead_time_days=sup_data['lead_time'],
                min_order_quantity=sup_data['moq'],
                reliability_score=sup_data['reliability'],
                shipping_cost=sup_data['shipping']
            )
            session.add(supplier)
            supplier_ids.append(supplier.id)

        # Create ingredients with inventory and usage history
        ingredient_ids = []
        for i, ing_data in enumerate(data['ingredients']):
            info = ing_data['info']
            ingredient = Ingredient(
                id=f"ingredient-{i+1}",
                restaurant_id="demo-restaurant-id",
                name=info['name'],
                unit=info['unit'],
                category=info['category'],
                shelf_life_days=info['shelf_life_days'],
                is_perishable=info['is_perishable'],
                unit_cost=info['unit_cost']
            )
            session.add(ingredient)
            ingredient_ids.append(ingredient.id)

            # Add current inventory
            inventory = InventoryState(
                ingredient_id=ingredient.id,
                quantity=ing_data['current_inventory']
            )
            session.add(inventory)

            # Add usage history
            for usage in ing_data['usage_history']:
                history = UsageHistory(
                    ingredient_id=ingredient.id,
                    date=datetime.fromisoformat(usage['date']),
                    quantity_used=usage['quantity_used'],
                    event_flag=usage['event_flag'],
                    weather_severity=usage['weather_severity'],
                    traffic_index=usage['traffic_index'],
                    hazard_flag=usage['hazard_flag']
                )
                session.add(history)

            # Link to random supplier
            supplier_link = IngredientSupplier(
                ingredient_id=ingredient.id,
                supplier_id=supplier_ids[i % len(supplier_ids)],
                unit_cost=info['unit_cost'],
                priority=1
            )
            session.add(supplier_link)

        # Mykonos Mediterranean Menu - Dishes with recipes
        dishes_data = [
            # Appetizers (Mezze)
            {
                'name': 'Classic Hummus',
                'category': 'Appetizer',
                'price': 12.00,
                'recipe': [
                    ('ingredient-20', 0.25),  # Chickpeas
                    ('ingredient-22', 0.05),  # Tahini
                    ('ingredient-16', 1),     # Lemons
                    ('ingredient-21', 0.02),  # Olive Oil
                ]
            },
            {
                'name': 'Spanakopita',
                'category': 'Appetizer',
                'price': 14.00,
                'recipe': [
                    ('ingredient-15', 0.25),  # Fresh Spinach
                    ('ingredient-7', 0.15),   # Feta Cheese
                    ('ingredient-19', 0.5),   # Phyllo Dough
                    ('ingredient-21', 0.02),  # Olive Oil
                ]
            },
            {
                'name': 'Saganaki',
                'category': 'Appetizer',
                'price': 16.00,
                'recipe': [
                    ('ingredient-8', 0.35),   # Halloumi
                    ('ingredient-16', 0.5),   # Lemons
                    ('ingredient-21', 0.01),  # Olive Oil
                ]
            },
            {
                'name': 'Grilled Octopus',
                'category': 'Appetizer',
                'price': 24.00,
                'recipe': [
                    ('ingredient-5', 0.5),    # Octopus
                    ('ingredient-21', 0.03),  # Olive Oil
                    ('ingredient-16', 1),     # Lemons
                    ('ingredient-23', 0.25),  # Fresh Oregano
                ]
            },
            # Salads
            {
                'name': 'Greek Salad (Horiatiki)',
                'category': 'Salad',
                'price': 14.00,
                'recipe': [
                    ('ingredient-10', 0.4),   # Tomatoes
                    ('ingredient-11', 0.3),   # Cucumbers
                    ('ingredient-12', 0.15),  # Red Onions
                    ('ingredient-7', 0.25),   # Feta Cheese
                    ('ingredient-21', 0.02),  # Olive Oil
                ]
            },
            {
                'name': 'Mediterranean Quinoa Bowl',
                'category': 'Salad',
                'price': 16.00,
                'recipe': [
                    ('ingredient-10', 0.2),   # Tomatoes
                    ('ingredient-11', 0.2),   # Cucumbers
                    ('ingredient-7', 0.15),   # Feta Cheese
                    ('ingredient-21', 0.02),  # Olive Oil
                    ('ingredient-25', 0.1),   # Fresh Mint
                ]
            },
            # Seafood Entrees
            {
                'name': 'Grilled Branzino',
                'category': 'Seafood',
                'price': 34.00,
                'recipe': [
                    ('ingredient-4', 0.75),   # Branzino
                    ('ingredient-16', 2),     # Lemons
                    ('ingredient-21', 0.03),  # Olive Oil
                    ('ingredient-23', 0.25),  # Fresh Oregano
                    ('ingredient-24', 0.15),  # Fresh Dill
                ]
            },
            {
                'name': 'Shrimp Saganaki',
                'category': 'Seafood',
                'price': 29.00,
                'recipe': [
                    ('ingredient-6', 0.5),    # Shrimp
                    ('ingredient-10', 0.3),   # Tomatoes
                    ('ingredient-7', 0.2),    # Feta Cheese
                    ('ingredient-21', 0.02),  # Olive Oil
                ]
            },
            # Meat Entrees
            {
                'name': 'Lamb Souvlaki',
                'category': 'Main',
                'price': 28.00,
                'recipe': [
                    ('ingredient-1', 0.5),    # Lamb Leg
                    ('ingredient-12', 0.1),   # Red Onions
                    ('ingredient-21', 0.02),  # Olive Oil
                    ('ingredient-23', 0.15),  # Fresh Oregano
                    ('ingredient-9', 0.15),   # Greek Yogurt (tzatziki)
                ]
            },
            {
                'name': 'Moussaka',
                'category': 'Main',
                'price': 26.00,
                'recipe': [
                    ('ingredient-3', 0.35),   # Ground Lamb
                    ('ingredient-13', 0.4),   # Eggplant
                    ('ingredient-10', 0.2),   # Tomatoes
                    ('ingredient-9', 0.15),   # Greek Yogurt
                    ('ingredient-21', 0.02),  # Olive Oil
                ]
            },
            {
                'name': 'Chicken Souvlaki',
                'category': 'Main',
                'price': 22.00,
                'recipe': [
                    ('ingredient-2', 0.45),   # Chicken Thighs
                    ('ingredient-12', 0.1),   # Red Onions
                    ('ingredient-21', 0.02),  # Olive Oil
                    ('ingredient-23', 0.15),  # Fresh Oregano
                    ('ingredient-9', 0.15),   # Greek Yogurt
                ]
            },
            {
                'name': 'Beef Kofta',
                'category': 'Main',
                'price': 24.00,
                'recipe': [
                    ('ingredient-3', 0.4),    # Ground Lamb (mixed with beef)
                    ('ingredient-12', 0.15),  # Red Onions
                    ('ingredient-25', 0.1),   # Fresh Mint
                    ('ingredient-21', 0.02),  # Olive Oil
                ]
            },
            # Vegetarian
            {
                'name': 'Stuffed Bell Peppers',
                'category': 'Vegetarian',
                'price': 21.00,
                'recipe': [
                    ('ingredient-14', 0.5),   # Bell Peppers
                    ('ingredient-18', 0.25),  # Arborio Rice
                    ('ingredient-10', 0.2),   # Tomatoes
                    ('ingredient-7', 0.15),   # Feta Cheese
                    ('ingredient-21', 0.02),  # Olive Oil
                ]
            },
            {
                'name': 'Imam Bayildi',
                'category': 'Vegetarian',
                'price': 19.00,
                'recipe': [
                    ('ingredient-13', 0.5),   # Eggplant
                    ('ingredient-10', 0.25),  # Tomatoes
                    ('ingredient-12', 0.15),  # Red Onions
                    ('ingredient-21', 0.03),  # Olive Oil
                ]
            },
            # Desserts
            {
                'name': 'Baklava',
                'category': 'Dessert',
                'price': 10.00,
                'recipe': [
                    ('ingredient-19', 0.3),   # Phyllo Dough
                    ('ingredient-30', 0.1),   # Honey (Greek)
                    ('ingredient-21', 0.01),  # Olive Oil
                ]
            },
            {
                'name': 'Greek Yogurt with Honey',
                'category': 'Dessert',
                'price': 8.00,
                'recipe': [
                    ('ingredient-9', 0.3),    # Greek Yogurt
                    ('ingredient-30', 0.05),  # Honey (Greek)
                ]
            },
            # Drinks (Signature)
            {
                'name': 'Mykonos Sunset',
                'category': 'Cocktail',
                'price': 14.00,
                'recipe': [
                    ('ingredient-26', 0.05),  # Ouzo
                    ('ingredient-29', 0.1),   # Pomegranate Juice
                    ('ingredient-16', 0.5),   # Lemons
                ]
            },
            {
                'name': 'Mediterranean Martini',
                'category': 'Cocktail',
                'price': 15.00,
                'recipe': [
                    ('ingredient-27', 0.05),  # Metaxa
                    ('ingredient-16', 0.5),   # Lemons
                    ('ingredient-30', 0.02),  # Honey
                ]
            },
        ]

        for i, dish_data in enumerate(dishes_data):
            dish = Dish(
                id=f"dish-{i+1}",
                restaurant_id="demo-restaurant-id",
                name=dish_data['name'],
                category=dish_data['category'],
                price=dish_data['price'],
                is_active=True
            )
            session.add(dish)

            # Add recipe ingredients
            for ing_id, qty in dish_data['recipe']:
                # Get the unit from the ingredient
                ing_result = await session.execute(
                    select(Ingredient.unit).where(Ingredient.id == ing_id)
                )
                unit = ing_result.scalar() or 'units'

                recipe = Recipe(
                    dish_id=dish.id,
                    ingredient_id=ing_id,
                    quantity=qty,
                    unit=unit
                )
                session.add(recipe)

        await session.commit()
        print(f"Seeded {len(ingredient_ids)} ingredients, {len(supplier_ids)} suppliers, {len(dishes_data)} dishes")
        return True


async def clear_database():
    """Clear all data from database (for testing)"""
    async with async_session_maker() as session:
        # Delete in order of dependencies
        await session.execute(Recipe.__table__.delete())
        await session.execute(Dish.__table__.delete())
        await session.execute(Forecast.__table__.delete())
        await session.execute(UsageHistory.__table__.delete())
        await session.execute(InventoryState.__table__.delete())
        await session.execute(IngredientSupplier.__table__.delete())
        await session.execute(Ingredient.__table__.delete())
        await session.execute(Supplier.__table__.delete())
        await session.execute(Restaurant.__table__.delete())
        await session.execute(User.__table__.delete())
        await session.commit()
        print("Database cleared")


if __name__ == '__main__':
    asyncio.run(seed_database(force=True))
