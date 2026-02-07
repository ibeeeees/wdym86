"""
Timeline Analytics Router

Provides time-series analytics for restaurant performance:
- Daily snapshots (revenue, orders, tips, refunds, voids, labor costs)
- Weekly aggregation
- Monthly trends
- Seasonal analysis
- Year-over-year comparison

All data is real or computed from actual order/sales data.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel

from ..database import (
    get_session, DailySalesSnapshot, Order, OrderItem,
    PaymentTransaction, Restaurant
)

router = APIRouter(prefix="/timeline", tags=["timeline"])


class SnapshotCreate(BaseModel):
    date: str  # YYYY-MM-DD
    total_revenue: float = 0
    total_orders: int = 0
    average_order_value: float = 0
    total_tips: float = 0
    total_refunds: float = 0
    total_voids: int = 0
    labor_cost: float = 0
    food_cost: float = 0
    peak_hour: Optional[str] = None
    weather_condition: Optional[str] = None
    notes: Optional[str] = None


# ==========================================
# Daily Snapshots
# ==========================================

@router.get("/{restaurant_id}/daily")
async def get_daily_snapshots(
    restaurant_id: str,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_session),
):
    """Get daily sales snapshots for a date range."""
    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD.")

    if (end - start).days > 365:
        raise HTTPException(400, "Maximum range is 365 days.")

    result = await db.execute(
        select(DailySalesSnapshot).where(
            DailySalesSnapshot.restaurant_id == restaurant_id,
            DailySalesSnapshot.date >= start_date,
            DailySalesSnapshot.date <= end_date,
        ).order_by(DailySalesSnapshot.date)
    )
    snapshots = result.scalars().all()

    return {
        "restaurant_id": restaurant_id,
        "start_date": start_date,
        "end_date": end_date,
        "total_days": len(snapshots),
        "snapshots": [_serialize_snapshot(s) for s in snapshots],
    }


@router.post("/{restaurant_id}/daily")
async def create_daily_snapshot(
    restaurant_id: str,
    data: SnapshotCreate,
    db: AsyncSession = Depends(get_session),
):
    """Create or update a daily sales snapshot."""
    # Check for existing snapshot on this date
    existing = await db.execute(
        select(DailySalesSnapshot).where(
            DailySalesSnapshot.restaurant_id == restaurant_id,
            DailySalesSnapshot.date == data.date,
        )
    )
    snapshot = existing.scalar_one_or_none()

    if snapshot:
        # Update existing
        for field, value in data.dict().items():
            if value is not None:
                setattr(snapshot, field, value)
    else:
        snapshot = DailySalesSnapshot(
            restaurant_id=restaurant_id,
            **data.dict(),
        )
        db.add(snapshot)

    await db.commit()
    await db.refresh(snapshot)
    return {"snapshot": _serialize_snapshot(snapshot)}


@router.post("/{restaurant_id}/compute-snapshot")
async def compute_daily_snapshot(
    restaurant_id: str,
    target_date: str = Query(..., description="Date to compute (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_session),
):
    """
    Compute a daily snapshot from actual order data.
    This pulls real data from orders and payments — never fabricated.
    """
    try:
        d = date.fromisoformat(target_date)
    except ValueError:
        raise HTTPException(400, "Invalid date format.")

    # Get orders for this day
    result = await db.execute(
        select(Order).where(
            Order.restaurant_id == restaurant_id,
            Order.created_at >= f"{target_date}T00:00:00",
            Order.created_at < f"{target_date}T23:59:59",
        )
    )
    orders = result.scalars().all()

    total_orders = len(orders)
    total_revenue = sum(o.total_amount or 0 for o in orders)
    total_tips = sum(o.tip_amount or 0 for o in orders if hasattr(o, 'tip_amount'))
    total_refunds = sum(o.total_amount or 0 for o in orders if o.status == 'refunded')
    total_voids = len([o for o in orders if o.status == 'voided'])
    avg_order = total_revenue / total_orders if total_orders > 0 else 0

    # Create or update snapshot
    existing = await db.execute(
        select(DailySalesSnapshot).where(
            DailySalesSnapshot.restaurant_id == restaurant_id,
            DailySalesSnapshot.date == target_date,
        )
    )
    snapshot = existing.scalar_one_or_none()

    if snapshot:
        snapshot.total_revenue = total_revenue
        snapshot.total_orders = total_orders
        snapshot.average_order_value = round(avg_order, 2)
        snapshot.total_tips = total_tips
        snapshot.total_refunds = total_refunds
        snapshot.total_voids = total_voids
    else:
        snapshot = DailySalesSnapshot(
            restaurant_id=restaurant_id,
            date=target_date,
            total_revenue=total_revenue,
            total_orders=total_orders,
            average_order_value=round(avg_order, 2),
            total_tips=total_tips,
            total_refunds=total_refunds,
            total_voids=total_voids,
        )
        db.add(snapshot)

    await db.commit()
    await db.refresh(snapshot)

    return {
        "computed_from_orders": True,
        "orders_found": total_orders,
        "snapshot": _serialize_snapshot(snapshot),
    }


# ==========================================
# Weekly Aggregation
# ==========================================

@router.get("/{restaurant_id}/weekly")
async def get_weekly_summary(
    restaurant_id: str,
    weeks: int = Query(4, ge=1, le=52, description="Number of weeks to look back"),
    db: AsyncSession = Depends(get_session),
):
    """Get weekly aggregated analytics."""
    start = (date.today() - timedelta(weeks=weeks)).isoformat()
    result = await db.execute(
        select(DailySalesSnapshot).where(
            DailySalesSnapshot.restaurant_id == restaurant_id,
            DailySalesSnapshot.date >= start,
        ).order_by(DailySalesSnapshot.date)
    )
    snapshots = result.scalars().all()

    # Group by ISO week
    weekly_data = {}
    for s in snapshots:
        try:
            d = date.fromisoformat(s.date)
            week_key = f"{d.isocalendar()[0]}-W{d.isocalendar()[1]:02d}"
        except (ValueError, AttributeError):
            continue

        if week_key not in weekly_data:
            weekly_data[week_key] = {
                "week": week_key,
                "revenue": 0,
                "orders": 0,
                "tips": 0,
                "refunds": 0,
                "voids": 0,
                "days_recorded": 0,
            }
        weekly_data[week_key]["revenue"] += s.total_revenue or 0
        weekly_data[week_key]["orders"] += s.total_orders or 0
        weekly_data[week_key]["tips"] += s.total_tips or 0
        weekly_data[week_key]["refunds"] += s.total_refunds or 0
        weekly_data[week_key]["voids"] += s.total_voids or 0
        weekly_data[week_key]["days_recorded"] += 1

    # Calculate averages
    for w in weekly_data.values():
        w["avg_daily_revenue"] = round(w["revenue"] / w["days_recorded"], 2) if w["days_recorded"] else 0
        w["avg_order_value"] = round(w["revenue"] / w["orders"], 2) if w["orders"] else 0
        w["revenue"] = round(w["revenue"], 2)
        w["tips"] = round(w["tips"], 2)
        w["refunds"] = round(w["refunds"], 2)

    return {
        "restaurant_id": restaurant_id,
        "weeks_requested": weeks,
        "weeks_with_data": len(weekly_data),
        "weekly": list(weekly_data.values()),
    }


# ==========================================
# Monthly Trends
# ==========================================

@router.get("/{restaurant_id}/monthly")
async def get_monthly_trends(
    restaurant_id: str,
    months: int = Query(6, ge=1, le=24, description="Number of months to look back"),
    db: AsyncSession = Depends(get_session),
):
    """Get monthly aggregated analytics with trend indicators."""
    start = (date.today() - timedelta(days=months * 30)).isoformat()
    result = await db.execute(
        select(DailySalesSnapshot).where(
            DailySalesSnapshot.restaurant_id == restaurant_id,
            DailySalesSnapshot.date >= start,
        ).order_by(DailySalesSnapshot.date)
    )
    snapshots = result.scalars().all()

    # Group by month
    monthly_data = {}
    for s in snapshots:
        try:
            d = date.fromisoformat(s.date)
            month_key = f"{d.year}-{d.month:02d}"
        except (ValueError, AttributeError):
            continue

        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "month": month_key,
                "revenue": 0,
                "orders": 0,
                "tips": 0,
                "refunds": 0,
                "labor_cost": 0,
                "food_cost": 0,
                "days_recorded": 0,
            }
        monthly_data[month_key]["revenue"] += s.total_revenue or 0
        monthly_data[month_key]["orders"] += s.total_orders or 0
        monthly_data[month_key]["tips"] += s.total_tips or 0
        monthly_data[month_key]["refunds"] += s.total_refunds or 0
        monthly_data[month_key]["labor_cost"] += s.labor_cost or 0
        monthly_data[month_key]["food_cost"] += s.food_cost or 0
        monthly_data[month_key]["days_recorded"] += 1

    # Calculate trends
    month_list = sorted(monthly_data.values(), key=lambda x: x["month"])
    for i, m in enumerate(month_list):
        m["revenue"] = round(m["revenue"], 2)
        m["tips"] = round(m["tips"], 2)
        m["refunds"] = round(m["refunds"], 2)
        m["labor_cost"] = round(m["labor_cost"], 2)
        m["food_cost"] = round(m["food_cost"], 2)
        m["avg_daily_revenue"] = round(m["revenue"] / m["days_recorded"], 2) if m["days_recorded"] else 0

        if i > 0:
            prev_rev = month_list[i-1]["revenue"]
            if prev_rev > 0:
                m["revenue_change_pct"] = round((m["revenue"] - prev_rev) / prev_rev * 100, 1)
            else:
                m["revenue_change_pct"] = 0
            m["trend"] = "up" if m["revenue"] > prev_rev else "down" if m["revenue"] < prev_rev else "flat"
        else:
            m["revenue_change_pct"] = 0
            m["trend"] = "baseline"

    return {
        "restaurant_id": restaurant_id,
        "months_requested": months,
        "months_with_data": len(month_list),
        "monthly": month_list,
    }


# ==========================================
# Seasonal Analysis
# ==========================================

@router.get("/{restaurant_id}/seasonal")
async def get_seasonal_analysis(
    restaurant_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Analyze performance by season across all available data."""
    result = await db.execute(
        select(DailySalesSnapshot).where(
            DailySalesSnapshot.restaurant_id == restaurant_id,
        ).order_by(DailySalesSnapshot.date)
    )
    snapshots = result.scalars().all()

    seasons = {
        "spring": {"months": [3, 4, 5], "revenue": 0, "orders": 0, "days": 0},
        "summer": {"months": [6, 7, 8], "revenue": 0, "orders": 0, "days": 0},
        "fall": {"months": [9, 10, 11], "revenue": 0, "orders": 0, "days": 0},
        "winter": {"months": [12, 1, 2], "revenue": 0, "orders": 0, "days": 0},
    }

    for s in snapshots:
        try:
            d = date.fromisoformat(s.date)
            month = d.month
        except (ValueError, AttributeError):
            continue

        for season_name, season_data in seasons.items():
            if month in season_data["months"]:
                season_data["revenue"] += s.total_revenue or 0
                season_data["orders"] += s.total_orders or 0
                season_data["days"] += 1
                break

    # Calculate averages
    for season_data in seasons.values():
        del season_data["months"]
        season_data["revenue"] = round(season_data["revenue"], 2)
        season_data["avg_daily_revenue"] = round(
            season_data["revenue"] / season_data["days"], 2
        ) if season_data["days"] else 0
        season_data["avg_orders_per_day"] = round(
            season_data["orders"] / season_data["days"], 1
        ) if season_data["days"] else 0

    # Find best/worst seasons
    best = max(seasons.items(), key=lambda x: x[1]["avg_daily_revenue"])
    worst = min(
        [(k, v) for k, v in seasons.items() if v["days"] > 0],
        key=lambda x: x[1]["avg_daily_revenue"],
        default=(None, None),
    )

    return {
        "restaurant_id": restaurant_id,
        "seasons": seasons,
        "best_season": best[0] if best else None,
        "worst_season": worst[0] if worst else None,
    }


# ==========================================
# Day-of-Week Analysis
# ==========================================

@router.get("/{restaurant_id}/day-of-week")
async def get_day_of_week_analysis(
    restaurant_id: str,
    weeks: int = Query(12, ge=1, le=52),
    db: AsyncSession = Depends(get_session),
):
    """Analyze performance by day of week."""
    start = (date.today() - timedelta(weeks=weeks)).isoformat()
    result = await db.execute(
        select(DailySalesSnapshot).where(
            DailySalesSnapshot.restaurant_id == restaurant_id,
            DailySalesSnapshot.date >= start,
        )
    )
    snapshots = result.scalars().all()

    days = {i: {"day": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
                "revenue": 0, "orders": 0, "count": 0}
            for i in range(7)}

    for s in snapshots:
        try:
            d = date.fromisoformat(s.date)
            dow = d.weekday()
        except (ValueError, AttributeError):
            continue
        days[dow]["revenue"] += s.total_revenue or 0
        days[dow]["orders"] += s.total_orders or 0
        days[dow]["count"] += 1

    for d in days.values():
        d["avg_revenue"] = round(d["revenue"] / d["count"], 2) if d["count"] else 0
        d["avg_orders"] = round(d["orders"] / d["count"], 1) if d["count"] else 0
        d["revenue"] = round(d["revenue"], 2)

    busiest = max(days.values(), key=lambda x: x["avg_revenue"])
    slowest = min(
        [d for d in days.values() if d["count"] > 0],
        key=lambda x: x["avg_revenue"],
        default=None,
    )

    return {
        "restaurant_id": restaurant_id,
        "weeks_analyzed": weeks,
        "days": list(days.values()),
        "busiest_day": busiest["day"] if busiest else None,
        "slowest_day": slowest["day"] if slowest else None,
    }


# ==========================================
# KPI Summary
# ==========================================

@router.get("/{restaurant_id}/kpi")
async def get_kpi_summary(
    restaurant_id: str,
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_session),
):
    """Get key performance indicators for a given period."""
    start = (date.today() - timedelta(days=period_days)).isoformat()

    result = await db.execute(
        select(DailySalesSnapshot).where(
            DailySalesSnapshot.restaurant_id == restaurant_id,
            DailySalesSnapshot.date >= start,
        )
    )
    snapshots = result.scalars().all()

    if not snapshots:
        return {
            "restaurant_id": restaurant_id,
            "period_days": period_days,
            "has_data": False,
            "note": "No daily snapshots found for this period. Compute snapshots from order data first.",
        }

    total_revenue = sum(s.total_revenue or 0 for s in snapshots)
    total_orders = sum(s.total_orders or 0 for s in snapshots)
    total_tips = sum(s.total_tips or 0 for s in snapshots)
    total_refunds = sum(s.total_refunds or 0 for s in snapshots)
    total_labor = sum(s.labor_cost or 0 for s in snapshots)
    total_food = sum(s.food_cost or 0 for s in snapshots)
    days = len(snapshots)

    return {
        "restaurant_id": restaurant_id,
        "period_days": period_days,
        "days_with_data": days,
        "has_data": True,
        "kpi": {
            "total_revenue": round(total_revenue, 2),
            "avg_daily_revenue": round(total_revenue / days, 2),
            "total_orders": total_orders,
            "avg_daily_orders": round(total_orders / days, 1),
            "avg_order_value": round(total_revenue / total_orders, 2) if total_orders else 0,
            "total_tips": round(total_tips, 2),
            "tip_rate": round(total_tips / total_revenue * 100, 1) if total_revenue else 0,
            "total_refunds": round(total_refunds, 2),
            "refund_rate": round(total_refunds / total_revenue * 100, 1) if total_revenue else 0,
            "labor_cost": round(total_labor, 2),
            "labor_cost_pct": round(total_labor / total_revenue * 100, 1) if total_revenue else 0,
            "food_cost": round(total_food, 2),
            "food_cost_pct": round(total_food / total_revenue * 100, 1) if total_revenue else 0,
        },
    }


def _serialize_snapshot(s: DailySalesSnapshot) -> dict:
    return {
        "id": s.id,
        "date": s.date,
        "total_revenue": s.total_revenue,
        "total_orders": s.total_orders,
        "average_order_value": s.average_order_value,
        "total_tips": s.total_tips,
        "total_refunds": s.total_refunds,
        "total_voids": s.total_voids,
        "labor_cost": s.labor_cost,
        "food_cost": s.food_cost,
        "peak_hour": s.peak_hour,
        "weather_condition": s.weather_condition,
        "notes": s.notes,
    }
