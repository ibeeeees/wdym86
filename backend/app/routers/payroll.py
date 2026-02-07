"""
Payroll Router

Employee compensation, pay runs, tips, expenses, sales — with AWS S3 integration
for importing/exporting financial data.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc
from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel
import csv
import io
import json

from ..database import (
    get_session, PayrollEmployee, PayRun, ExpenseRecord,
    Order, DailySalesSnapshot, generate_uuid
)

router = APIRouter(prefix="/payroll", tags=["Payroll"])


# ==========================================
# Pydantic Schemas
# ==========================================

class EmployeeCreate(BaseModel):
    name: str
    role: str
    department: str
    employment_type: str = "full_time"
    compensation_type: str = "hourly"
    hourly_rate: Optional[float] = None
    annual_salary: Optional[float] = None
    email: Optional[str] = None
    start_date: Optional[str] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None
    compensation_type: Optional[str] = None
    hourly_rate: Optional[float] = None
    annual_salary: Optional[float] = None
    status: Optional[str] = None

class PayRunCreate(BaseModel):
    period_start: str
    period_end: str

class ExpenseCreate(BaseModel):
    date: str
    category: str
    description: str
    amount: float
    vendor: Optional[str] = None

class IntegrationConnect(BaseModel):
    provider: str
    api_key: str
    webhook_url: Optional[str] = None


# ==========================================
# Employee Endpoints
# ==========================================

@router.get("/{restaurant_id}/employees")
async def list_employees(
    restaurant_id: str,
    department: Optional[str] = None,
    session: AsyncSession = Depends(get_session)
):
    """List all payroll employees"""
    query = select(PayrollEmployee).where(
        PayrollEmployee.restaurant_id == restaurant_id
    )
    if department:
        query = query.where(PayrollEmployee.department == department)

    result = await session.execute(query)
    employees = result.scalars().all()

    return [
        {
            "id": e.id,
            "name": e.name,
            "role": e.role,
            "department": e.department,
            "employment_type": e.employment_type,
            "compensation_type": e.compensation_type,
            "hourly_rate": e.hourly_rate,
            "annual_salary": e.annual_salary,
            "status": e.status,
            "start_date": e.start_date.isoformat() if e.start_date else None,
        }
        for e in employees
    ]


@router.post("/{restaurant_id}/employees")
async def create_employee(
    restaurant_id: str,
    data: EmployeeCreate,
    session: AsyncSession = Depends(get_session)
):
    """Add a new payroll employee"""
    employee = PayrollEmployee(
        id=generate_uuid(),
        restaurant_id=restaurant_id,
        name=data.name,
        role=data.role,
        department=data.department,
        employment_type=data.employment_type,
        compensation_type=data.compensation_type,
        hourly_rate=data.hourly_rate,
        annual_salary=data.annual_salary,
        start_date=datetime.fromisoformat(data.start_date) if data.start_date else datetime.utcnow(),
    )
    session.add(employee)
    await session.flush()
    return {"id": employee.id, "name": employee.name, "status": "created"}


@router.put("/{restaurant_id}/employees/{employee_id}")
async def update_employee(
    restaurant_id: str,
    employee_id: str,
    data: EmployeeUpdate,
    session: AsyncSession = Depends(get_session)
):
    """Update employee compensation or details"""
    result = await session.execute(
        select(PayrollEmployee).where(
            PayrollEmployee.id == employee_id,
            PayrollEmployee.restaurant_id == restaurant_id
        )
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(employee, field, value)

    await session.flush()
    return {"id": employee.id, "status": "updated"}


@router.delete("/{restaurant_id}/employees/{employee_id}")
async def delete_employee(
    restaurant_id: str,
    employee_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Remove employee from payroll"""
    result = await session.execute(
        select(PayrollEmployee).where(
            PayrollEmployee.id == employee_id,
            PayrollEmployee.restaurant_id == restaurant_id
        )
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    await session.delete(employee)
    return {"status": "deleted"}


# ==========================================
# Pay Run Endpoints
# ==========================================

@router.get("/{restaurant_id}/pay-runs")
async def list_pay_runs(
    restaurant_id: str,
    limit: int = Query(default=10, le=50),
    session: AsyncSession = Depends(get_session)
):
    """List pay run history"""
    result = await session.execute(
        select(PayRun)
        .where(PayRun.restaurant_id == restaurant_id)
        .order_by(PayRun.run_date.desc())
        .limit(limit)
    )
    runs = result.scalars().all()

    return [
        {
            "id": r.id,
            "period_start": r.period_start.isoformat(),
            "period_end": r.period_end.isoformat(),
            "run_date": r.run_date.isoformat(),
            "total_gross": r.total_gross,
            "total_net": r.total_net,
            "total_taxes": r.total_taxes,
            "total_tips": r.total_tips,
            "employee_count": r.employee_count,
            "status": r.status,
        }
        for r in runs
    ]


@router.post("/{restaurant_id}/pay-runs")
async def create_pay_run(
    restaurant_id: str,
    data: PayRunCreate,
    session: AsyncSession = Depends(get_session)
):
    """Create and process a new pay run"""
    # Get active employees
    result = await session.execute(
        select(PayrollEmployee).where(
            PayrollEmployee.restaurant_id == restaurant_id,
            PayrollEmployee.status == "active"
        )
    )
    employees = result.scalars().all()

    if not employees:
        raise HTTPException(status_code=400, detail="No active employees for payroll")

    # Calculate totals
    total_gross = 0.0
    total_tips = 0.0
    for emp in employees:
        if emp.compensation_type == "salary" and emp.annual_salary:
            total_gross += emp.annual_salary / 26  # bi-weekly
        elif emp.hourly_rate:
            total_gross += emp.hourly_rate * 80  # standard bi-weekly hours

    total_taxes = total_gross * 0.22
    total_net = total_gross - total_taxes

    # Get tips from orders in the period
    try:
        tip_result = await session.execute(
            select(sqlfunc.sum(Order.tip)).where(
                Order.restaurant_id == restaurant_id,
                Order.created_at >= datetime.fromisoformat(data.period_start),
                Order.created_at <= datetime.fromisoformat(data.period_end),
            )
        )
        tips = tip_result.scalar() or 0.0
        total_tips = float(tips)
    except Exception:
        total_tips = 0.0

    pay_run = PayRun(
        id=generate_uuid(),
        restaurant_id=restaurant_id,
        period_start=datetime.fromisoformat(data.period_start),
        period_end=datetime.fromisoformat(data.period_end),
        run_date=datetime.utcnow(),
        total_gross=total_gross,
        total_net=total_net,
        total_taxes=total_taxes,
        total_tips=total_tips,
        employee_count=len(employees),
        status="processing",
    )
    session.add(pay_run)
    await session.flush()

    return {
        "id": pay_run.id,
        "status": "processing",
        "total_gross": total_gross,
        "total_net": total_net,
        "total_taxes": total_taxes,
        "total_tips": total_tips,
        "employee_count": len(employees),
    }


# ==========================================
# Tips Endpoints
# ==========================================

@router.get("/{restaurant_id}/tips")
async def get_tips_summary(
    restaurant_id: str,
    period_days: int = Query(default=14),
    session: AsyncSession = Depends(get_session)
):
    """Get tips summary from order data"""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=period_days)

    result = await session.execute(
        select(
            sqlfunc.sum(Order.tip),
            sqlfunc.count(Order.order_id),
            sqlfunc.avg(Order.tip),
        ).where(
            Order.restaurant_id == restaurant_id,
            Order.created_at >= cutoff,
            Order.tip > 0,
        )
    )
    row = result.one()

    return {
        "total_tips": float(row[0] or 0),
        "tipped_orders": int(row[1] or 0),
        "average_tip": float(row[2] or 0),
        "period_days": period_days,
    }


@router.post("/{restaurant_id}/tips/import-s3")
async def import_tips_from_s3(
    restaurant_id: str,
):
    """Import tips data from S3 bucket"""
    try:
        from ..aws.s3 import s3_client

        if not s3_client.enabled:
            return {"status": "s3_disabled", "message": "S3 is not configured. Enable S3 in your AWS settings."}

        files = await s3_client.list_files(f"payroll/{restaurant_id}/tips")
        if not files:
            return {"status": "no_data", "message": "No tips files found in S3."}

        # Download latest file
        latest = sorted(files, key=lambda f: f["last_modified"], reverse=True)[0]
        data = await s3_client.download_file(latest["key"])
        if not data:
            return {"status": "error", "message": "Failed to download tips file."}

        # Parse CSV
        reader = csv.DictReader(io.StringIO(data.decode("utf-8")))
        records = list(reader)

        return {
            "status": "imported",
            "file": latest["key"],
            "records_count": len(records),
            "records": records[:50],  # Return first 50 for preview
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==========================================
# Expenses Endpoints
# ==========================================

@router.get("/{restaurant_id}/expenses")
async def list_expenses(
    restaurant_id: str,
    category: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    session: AsyncSession = Depends(get_session)
):
    """List business expenses"""
    query = select(ExpenseRecord).where(
        ExpenseRecord.restaurant_id == restaurant_id
    )
    if category:
        query = query.where(ExpenseRecord.category == category)

    result = await session.execute(
        query.order_by(ExpenseRecord.date.desc()).limit(limit)
    )
    expenses = result.scalars().all()

    return [
        {
            "id": e.id,
            "date": e.date.isoformat(),
            "category": e.category,
            "description": e.description,
            "amount": e.amount,
            "vendor": e.vendor,
            "status": e.status,
        }
        for e in expenses
    ]


@router.post("/{restaurant_id}/expenses")
async def create_expense(
    restaurant_id: str,
    data: ExpenseCreate,
    session: AsyncSession = Depends(get_session)
):
    """Add a new expense"""
    expense = ExpenseRecord(
        id=generate_uuid(),
        restaurant_id=restaurant_id,
        date=datetime.fromisoformat(data.date),
        category=data.category,
        description=data.description,
        amount=data.amount,
        vendor=data.vendor,
        status="pending",
    )
    session.add(expense)
    await session.flush()
    return {"id": expense.id, "status": "created"}


@router.post("/{restaurant_id}/expenses/import-s3")
async def import_expenses_from_s3(restaurant_id: str):
    """Import expenses from S3"""
    try:
        from ..aws.s3 import s3_client

        if not s3_client.enabled:
            return {"status": "s3_disabled", "message": "S3 is not configured."}

        files = await s3_client.list_files(f"payroll/{restaurant_id}/expenses")
        if not files:
            return {"status": "no_data", "message": "No expense files found in S3."}

        latest = sorted(files, key=lambda f: f["last_modified"], reverse=True)[0]
        data = await s3_client.download_file(latest["key"])
        if not data:
            return {"status": "error", "message": "Failed to download expenses file."}

        reader = csv.DictReader(io.StringIO(data.decode("utf-8")))
        records = list(reader)

        return {
            "status": "imported",
            "file": latest["key"],
            "records_count": len(records),
            "records": records[:50],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/{restaurant_id}/expenses/export-s3")
async def export_expenses_to_s3(
    restaurant_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Export expenses to S3"""
    try:
        from ..aws.s3 import s3_client

        if not s3_client.enabled:
            return {"status": "s3_disabled", "message": "S3 is not configured."}

        # Get expenses
        result = await session.execute(
            select(ExpenseRecord)
            .where(ExpenseRecord.restaurant_id == restaurant_id)
            .order_by(ExpenseRecord.date.desc())
        )
        expenses = result.scalars().all()

        # Build CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Date", "Category", "Description", "Amount", "Vendor", "Status"])
        for e in expenses:
            writer.writerow([
                e.date.isoformat(), e.category, e.description,
                f"{e.amount:.2f}", e.vendor or "", e.status
            ])

        csv_bytes = output.getvalue().encode("utf-8")
        filename = f"expenses-{date.today().isoformat()}.csv"
        s3_url = await s3_client.upload_bytes(
            csv_bytes, filename, f"payroll/{restaurant_id}/expenses", "text/csv"
        )

        return {"status": "exported", "s3_url": s3_url, "records_count": len(expenses)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==========================================
# Sales Endpoints
# ==========================================

@router.get("/{restaurant_id}/sales-summary")
async def get_sales_summary(
    restaurant_id: str,
    period_days: int = Query(default=14),
    session: AsyncSession = Depends(get_session)
):
    """Get sales summary for payroll period"""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=period_days)

    result = await session.execute(
        select(
            sqlfunc.sum(DailySalesSnapshot.total_revenue),
            sqlfunc.sum(DailySalesSnapshot.total_orders),
            sqlfunc.sum(DailySalesSnapshot.total_tips),
            sqlfunc.sum(DailySalesSnapshot.labor_hours),
        ).where(
            DailySalesSnapshot.restaurant_id == restaurant_id,
            DailySalesSnapshot.date >= cutoff,
        )
    )
    row = result.one()

    return {
        "total_revenue": float(row[0] or 0),
        "total_orders": int(row[1] or 0),
        "total_tips": float(row[2] or 0),
        "total_labor_hours": float(row[3] or 0),
        "period_days": period_days,
    }


@router.post("/{restaurant_id}/sales/import-s3")
async def import_sales_from_s3(restaurant_id: str):
    """Import sales data from S3"""
    try:
        from ..aws.s3 import s3_client

        if not s3_client.enabled:
            return {"status": "s3_disabled", "message": "S3 is not configured."}

        files = await s3_client.list_files(f"payroll/{restaurant_id}/sales")
        if not files:
            return {"status": "no_data", "message": "No sales files found in S3."}

        latest = sorted(files, key=lambda f: f["last_modified"], reverse=True)[0]
        data = await s3_client.download_file(latest["key"])
        if not data:
            return {"status": "error", "message": "Failed to download sales file."}

        reader = csv.DictReader(io.StringIO(data.decode("utf-8")))
        records = list(reader)

        return {
            "status": "imported",
            "file": latest["key"],
            "records_count": len(records),
            "records": records[:50],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/{restaurant_id}/sales/export-s3")
async def export_sales_to_s3(
    restaurant_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Export sales data to S3"""
    try:
        from ..aws.s3 import s3_client

        if not s3_client.enabled:
            return {"status": "s3_disabled", "message": "S3 is not configured."}

        result = await session.execute(
            select(DailySalesSnapshot)
            .where(DailySalesSnapshot.restaurant_id == restaurant_id)
            .order_by(DailySalesSnapshot.date.desc())
            .limit(90)
        )
        snapshots = result.scalars().all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Date", "Revenue", "Orders", "Tips", "Refunds", "Labor Hours", "Waste Cost"])
        for s in snapshots:
            writer.writerow([
                s.date.isoformat(), f"{s.total_revenue:.2f}", s.total_orders,
                f"{s.total_tips:.2f}", f"{s.refunds:.2f}", f"{s.labor_hours:.1f}",
                f"{s.waste_cost:.2f}"
            ])

        csv_bytes = output.getvalue().encode("utf-8")
        filename = f"sales-{date.today().isoformat()}.csv"
        s3_url = await s3_client.upload_bytes(
            csv_bytes, filename, f"payroll/{restaurant_id}/sales", "text/csv"
        )

        return {"status": "exported", "s3_url": s3_url, "records_count": len(snapshots)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==========================================
# Paychecks / S3 Export
# ==========================================

@router.post("/{restaurant_id}/paychecks/export-s3")
async def export_paychecks_to_s3(
    restaurant_id: str,
    pay_run_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session)
):
    """Export paycheck data to S3"""
    try:
        from ..aws.s3 import s3_client

        if not s3_client.enabled:
            return {"status": "s3_disabled", "message": "S3 is not configured."}

        # Get employees
        emp_result = await session.execute(
            select(PayrollEmployee).where(
                PayrollEmployee.restaurant_id == restaurant_id,
                PayrollEmployee.status == "active"
            )
        )
        employees = emp_result.scalars().all()

        # Build paycheck CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Name", "Role", "Department", "Type", "Rate/Salary", "Gross Pay", "Taxes", "Net Pay"])
        for emp in employees:
            if emp.compensation_type == "salary" and emp.annual_salary:
                gross = emp.annual_salary / 26
                rate_str = f"${emp.annual_salary:,.0f}/yr"
            elif emp.hourly_rate:
                gross = emp.hourly_rate * 80
                rate_str = f"${emp.hourly_rate:.2f}/hr"
            else:
                gross = 0
                rate_str = "N/A"
            taxes = gross * 0.22
            net = gross - taxes
            writer.writerow([
                emp.name, emp.role, emp.department, emp.employment_type,
                rate_str, f"{gross:.2f}", f"{taxes:.2f}", f"{net:.2f}"
            ])

        csv_bytes = output.getvalue().encode("utf-8")
        filename = f"paychecks-{date.today().isoformat()}.csv"
        s3_url = await s3_client.upload_bytes(
            csv_bytes, filename, f"payroll/{restaurant_id}/paychecks", "text/csv"
        )

        # Update pay run with S3 key if provided
        if pay_run_id:
            run_result = await session.execute(
                select(PayRun).where(PayRun.id == pay_run_id)
            )
            pay_run = run_result.scalar_one_or_none()
            if pay_run:
                pay_run.s3_export_key = f"payroll/{restaurant_id}/paychecks/{filename}"
                pay_run.status = "completed"

        return {"status": "exported", "s3_url": s3_url, "employee_count": len(employees)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/{restaurant_id}/paychecks/s3-url")
async def get_paycheck_download_url(
    restaurant_id: str,
    key: str = Query(..., description="S3 object key"),
):
    """Get presigned URL for paycheck download"""
    try:
        from ..aws.s3 import s3_client

        if not s3_client.enabled:
            return {"status": "s3_disabled", "message": "S3 is not configured."}

        url = await s3_client.get_presigned_url(key, expiration=3600)
        if url:
            return {"status": "ok", "url": url, "expires_in": 3600}
        return {"status": "error", "message": "Failed to generate download URL."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==========================================
# Integration Endpoints (demo-ready)
# ==========================================

# In-memory integration state (production would use DB)
_integrations: dict = {}

@router.get("/{restaurant_id}/integrations")
async def list_integrations(restaurant_id: str):
    """List payroll integrations"""
    return _integrations.get(restaurant_id, [])


@router.post("/{restaurant_id}/integrations")
async def connect_integration(
    restaurant_id: str,
    data: IntegrationConnect,
):
    """Connect a payroll integration"""
    if restaurant_id not in _integrations:
        _integrations[restaurant_id] = []

    integration = {
        "id": generate_uuid(),
        "provider": data.provider,
        "status": "connected",
        "webhook_url": data.webhook_url or f"https://api.wdym86.com/webhooks/payroll/{data.provider}",
        "connected_at": datetime.utcnow().isoformat(),
    }
    _integrations[restaurant_id].append(integration)
    return integration


@router.delete("/{restaurant_id}/integrations/{integration_id}")
async def disconnect_integration(
    restaurant_id: str,
    integration_id: str,
):
    """Disconnect a payroll integration"""
    if restaurant_id in _integrations:
        _integrations[restaurant_id] = [
            i for i in _integrations[restaurant_id] if i["id"] != integration_id
        ]
    return {"status": "disconnected"}


@router.post("/{restaurant_id}/integrations/{integration_id}/sync")
async def sync_integration(
    restaurant_id: str,
    integration_id: str,
):
    """Manually sync with payroll integration"""
    if restaurant_id in _integrations:
        for i in _integrations[restaurant_id]:
            if i["id"] == integration_id:
                i["last_synced_at"] = datetime.utcnow().isoformat()
                return {"status": "synced", "provider": i["provider"]}

    raise HTTPException(status_code=404, detail="Integration not found")
