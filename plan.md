# 📊 POS INTEGRATION & ANALYTICS SYSTEM - MASTER PROMPT SPECIFICATION

**Version:** 1.0  
**Date:** February 2026  
**Type:** System Context & Implementation Prompt  
**Purpose:** Complete specification for POS system integration and sales analytics

---

## 🎯 SYSTEM CONTEXT

You are working on **POS Integration & Analytics System**, a production-grade integration platform for connecting external POS systems (Aloha, Toast) with the restaurant inventory dashboard and analytics platform. This document contains the complete system specification, architecture, and implementation guidelines for AI-assisted development.

**Integration Context:**

- This system integrates with existing inventory dashboard system (Mykonos/WDYM86)
- Connects to external POS systems (Aloha, Toast) via APIs
- Provides sales reporting, analytics, and tips tracking
- Works alongside existing AWS infrastructure and database connections
- Must maintain compatibility with existing Claude system architecture

---

## 📋 PROJECT OVERVIEW

### Core Identity

```yaml
project_name: "POS Integration & Analytics System"
version: "1.0.0"
type: "External POS Integration + Sales Analytics Platform"
integration: "Aloha POS + Toast POS + Inventory Dashboard"
status: "Specification Phase"
architecture: "API Integration Layer + Analytics Engine"
```

### Three Core Integration Areas

1. **POS System Integration** (Aloha & Toast)
   - API connection and authentication
   - Daily/weekly/monthly sales report retrieval
   - Real-time order data synchronization
   - Historical data import

2. **Sales Analytics & Reporting**
   - Sales performance metrics
   - Popular/least popular items analysis
   - Revenue trends and patterns
   - Comparative analytics (day/week/month)

3. **Tips Tracking & Optimization**
   - Tips collection and aggregation
   - Tips performance analytics
   - Tips optimization recommendations
   - Staff tips distribution tracking

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL POS SYSTEMS                             │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   Aloha POS  │              │   Toast POS  │            │
│  │   API        │              │   API        │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         │                              │                     │
│         │ REST API / Webhooks          │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│           POS INTEGRATION LAYER                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Adapter Pattern                                       │  │
│  │  - AlohaAdapter                                       │  │
│  │  - ToastAdapter                                       │  │
│  │  - Unified Data Normalization                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Synchronization Service                         │  │
│  │  - Scheduled Report Pulling                          │  │
│  │  - Real-time Webhook Processing                       │  │
│  │  - Historical Data Import                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           ANALYTICS & REPORTING ENGINE                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Sales Analytics Module                               │  │
│  │  - Daily/Weekly/Monthly Reports                      │  │
│  │  - Item Popularity Analysis                           │  │
│  │  - Revenue Trends                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tips Tracking Module                                 │  │
│  │  - Tips Collection & Aggregation                      │  │
│  │  - Performance Analytics                              │  │
│  │  - Optimization Recommendations                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           INVENTORY DASHBOARD INTEGRATION                    │
│  - Sales data → Inventory deduction                          │
│  - Demand forecasting enhancement                            │
│  - Real-time inventory updates                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
External POS System
         │
         │ API Call / Webhook
         ▼
┌────────────────────┐
│  Authentication     │  Verify API credentials
│  & Authorization    │  Check rate limits
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Data Extraction   │  Parse POS-specific format
│  & Normalization   │  Convert to unified schema
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Data Validation   │  Validate completeness
│  & Enrichment      │  Add metadata
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Storage Layer     │  Store in analytics database
│  & Indexing        │  Index for fast queries
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Analytics Engine  │  Generate reports
│  & Aggregation     │  Calculate metrics
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Dashboard Display │  Visualize data
│  & API Endpoints    │  Serve to frontend
└────────────────────┘
```

---

## 🎨 PROMPT ENGINEERING GUIDELINES

### When Working on This System

#### 1. **Context Awareness**

Always consider:

- You're working on a **production integration system** connecting external POS systems
- **Data accuracy is critical** - sales data affects inventory and business decisions
- **API reliability** - external systems may have downtime or rate limits
- **Data normalization** - different POS systems have different data formats
- **Real-time vs batch** - balance between real-time updates and system load

#### 2. **Code Style Requirements**

```python
# REQUIRED: Always follow these patterns

# ✅ Good: Type hints, docstrings, error handling, retry logic
def fetch_sales_report(
    self,
    pos_system: str,
    start_date: datetime,
    end_date: datetime,
    report_type: str = "daily"
) -> SalesReport:
    """
    Fetch sales report from external POS system
    
    Args:
        pos_system: 'aloha' or 'toast'
        start_date: Start date for report
        end_date: End date for report
        report_type: 'daily', 'weekly', or 'monthly'
        
    Returns:
        SalesReport with normalized data
        
    Raises:
        POSAPIError: If API call fails
        AuthenticationError: If credentials invalid
        RateLimitError: If rate limit exceeded
    """
    logger.info(f"Fetching {report_type} report from {pos_system}")
    
    try:
        adapter = self.get_adapter(pos_system)
        raw_data = adapter.fetch_report(start_date, end_date, report_type)
        normalized = self.normalize_data(raw_data, pos_system)
        return SalesReport.from_normalized(normalized)
    except Exception as e:
        logger.error(f"Failed to fetch report: {e}")
        raise

# ❌ Bad: No types, no error handling, no retry logic
def get_report(pos, start, end):
    # Implementation...
```

#### 3. **POS Integration Pattern**

```python
# CRITICAL: Adapter pattern for POS systems

class POSAdapter(ABC):
    """Base adapter for POS system integration"""
    
    @abstractmethod
    def authenticate(self) -> bool:
        """Authenticate with POS system API"""
        pass
    
    @abstractmethod
    def fetch_daily_report(self, date: datetime) -> Dict:
        """Fetch daily sales report"""
        pass
    
    @abstractmethod
    def fetch_weekly_report(self, start_date: datetime) -> Dict:
        """Fetch weekly sales report"""
        pass
    
    @abstractmethod
    def fetch_monthly_report(self, month: int, year: int) -> Dict:
        """Fetch monthly sales report"""
        pass
    
    @abstractmethod
    def normalize_data(self, raw_data: Dict) -> NormalizedSalesData:
        """Convert POS-specific format to unified schema"""
        pass

class AlohaAdapter(POSAdapter):
    """Adapter for Aloha POS system"""
    
    def authenticate(self) -> bool:
        """Authenticate with Aloha API"""
        # Implementation with OAuth or API key
        pass
    
    def fetch_daily_report(self, date: datetime) -> Dict:
        """Fetch Aloha daily report"""
        # Aloha-specific API call
        pass
    
    def normalize_data(self, raw_data: Dict) -> NormalizedSalesData:
        """Convert Aloha format to unified schema"""
        # Map Aloha fields to unified schema
        pass

class ToastAdapter(POSAdapter):
    """Adapter for Toast POS system"""
    
    def authenticate(self) -> bool:
        """Authenticate with Toast API"""
        # Implementation with Toast authentication
        pass
    
    def fetch_daily_report(self, date: datetime) -> Dict:
        """Fetch Toast daily report"""
        # Toast-specific API call
        pass
    
    def normalize_data(self, raw_data: Dict) -> NormalizedSalesData:
        """Convert Toast format to unified schema"""
        # Map Toast fields to unified schema
        pass
```

#### 4. **Data Normalization Pattern**

```python
# ALWAYS normalize POS data to unified schema

@dataclass
class NormalizedSalesData:
    """Unified sales data schema"""
    restaurant_id: str
    date: datetime
    total_revenue: float
    total_items_sold: int
    items: List[ItemSale]
    tips: float
    payment_methods: Dict[str, float]
    tax: float
    discounts: float

@dataclass
class ItemSale:
    """Normalized item sale data"""
    item_id: str
    item_name: str
    quantity: int
    unit_price: float
    total_price: float
    category: str
    modifiers: List[str]

def normalize_aloha_data(raw_data: Dict) -> NormalizedSalesData:
    """Convert Aloha-specific format to unified schema"""
    return NormalizedSalesData(
        restaurant_id=raw_data['location_id'],
        date=parse_aloha_date(raw_data['date']),
        total_revenue=raw_data['net_sales'],
        items=[normalize_aloha_item(item) for item in raw_data['items']],
        tips=raw_data.get('tips', 0.0),
        # ... map all fields
    )

def normalize_toast_data(raw_data: Dict) -> NormalizedSalesData:
    """Convert Toast-specific format to unified schema"""
    return NormalizedSalesData(
        restaurant_id=raw_data['restaurant']['id'],
        date=parse_toast_date(raw_data['businessDate']),
        total_revenue=raw_data['netSales']['amount'],
        items=[normalize_toast_item(item) for item in raw_data['checks']],
        tips=raw_data.get('tips', {}).get('amount', 0.0),
        # ... map all fields
    )
```

#### 5. **Analytics Response Format**

```python
# Standard response format for analytics queries

{
    "report_type": "daily|weekly|monthly",
    "period": {
        "start_date": "2026-02-01",
        "end_date": "2026-02-07"
    },
    "summary": {
        "total_revenue": 45230.50,
        "total_items_sold": 1234,
        "average_order_value": 36.65,
        "total_tips": 5427.66,
        "tips_percentage": 12.0
    },
    "popular_items": [
        {
            "item_name": "Lamb Souvlaki",
            "quantity_sold": 145,
            "revenue": 4060.00,
            "percentage_of_sales": 8.98
        }
    ],
    "least_popular_items": [
        {
            "item_name": "Greek Salad",
            "quantity_sold": 12,
            "revenue": 180.00,
            "percentage_of_sales": 0.40
        }
    ],
    "tips_analysis": {
        "average_tip_percentage": 12.0,
        "tip_trends": "increasing",
        "recommendations": [
            "Tips increased 5% this week",
            "Consider training on upselling"
        ]
    },
    "timestamp": "2026-02-07T10:30:00Z"
}
```

---

## 🔧 IMPLEMENTATION PATTERNS

### Pattern 1: Scheduled Report Fetching

```python
# When implementing scheduled data fetching:

def fetch_scheduled_reports(self):
    """Fetch reports on schedule (daily, weekly, monthly)"""
    
    # 1. Get all active POS connections
    connections = self.get_active_pos_connections()
    
    # 2. For each connection, fetch appropriate reports
    for connection in connections:
        try:
            adapter = self.get_adapter(connection.pos_system)
            
            # 3. Fetch daily report (yesterday)
            yesterday = datetime.now() - timedelta(days=1)
            daily_report = adapter.fetch_daily_report(yesterday)
            self.store_report(daily_report)
            
            # 4. Fetch weekly report (if Monday)
            if datetime.now().weekday() == 0:  # Monday
                last_week_start = datetime.now() - timedelta(days=7)
                weekly_report = adapter.fetch_weekly_report(last_week_start)
                self.store_report(weekly_report)
            
            # 5. Fetch monthly report (if first of month)
            if datetime.now().day == 1:
                last_month = datetime.now() - timedelta(days=30)
                monthly_report = adapter.fetch_monthly_report(
                    last_month.month,
                    last_month.year
                )
                self.store_report(monthly_report)
            
            # 6. Publish event
            self.event_bus.publish('reports_fetched', {
                'pos_system': connection.pos_system,
                'restaurant_id': connection.restaurant_id
            })
            
        except Exception as e:
            logger.error(f"Failed to fetch reports for {connection}: {e}")
            self.handle_fetch_error(connection, e)
```

### Pattern 2: Analytics Aggregation

```python
# All analytics follow this structure:

class SalesAnalytics:
    def generate_report(
        self,
        restaurant_id: str,
        start_date: datetime,
        end_date: datetime,
        report_type: str
    ) -> AnalyticsReport:
        """Generate sales analytics report"""
        
        # 1. Fetch raw sales data
        sales_data = self.db.fetch_sales_data(
            restaurant_id,
            start_date,
            end_date
        )
        
        # 2. Calculate summary metrics
        summary = self._calculate_summary(sales_data)
        
        # 3. Analyze popular items
        popular_items = self._analyze_popular_items(sales_data)
        
        # 4. Analyze least popular items
        least_popular = self._analyze_least_popular_items(sales_data)
        
        # 5. Calculate trends
        trends = self._calculate_trends(sales_data, report_type)
        
        # 6. Generate recommendations
        recommendations = self._generate_recommendations(
            summary,
            popular_items,
            least_popular,
            trends
        )
        
        # 7. Return structured report
        return AnalyticsReport(
            report_type=report_type,
            period={'start': start_date, 'end': end_date},
            summary=summary,
            popular_items=popular_items,
            least_popular_items=least_popular,
            trends=trends,
            recommendations=recommendations
        )
```

### Pattern 3: Tips Tracking & Analysis

```python
# Tips tracking and optimization:

class TipsTracker:
    def analyze_tips_performance(
        self,
        restaurant_id: str,
        period_start: datetime,
        period_end: datetime
    ) -> TipsAnalysis:
        """Analyze tips performance and provide recommendations"""
        
        # 1. Fetch tips data
        tips_data = self.db.fetch_tips_data(
            restaurant_id,
            period_start,
            period_end
        )
        
        # 2. Calculate metrics
        total_tips = sum(t.tip_amount for t in tips_data)
        total_sales = sum(t.sale_amount for t in tips_data)
        average_tip_percentage = (total_tips / total_sales) * 100 if total_sales > 0 else 0
        
        # 3. Compare with previous period
        previous_period = self._get_previous_period(period_start, period_end)
        previous_tips = self.db.fetch_tips_data(
            restaurant_id,
            previous_period['start'],
            previous_period['end']
        )
        previous_avg = self._calculate_average_tip_percentage(previous_tips)
        
        # 4. Identify trends
        trend = "increasing" if average_tip_percentage > previous_avg else "decreasing"
        change = average_tip_percentage - previous_avg
        
        # 5. Generate recommendations
        recommendations = self._generate_tips_recommendations(
            average_tip_percentage,
            trend,
            change,
            tips_data
        )
        
        # 6. Identify areas for improvement
        improvement_areas = self._identify_improvement_areas(tips_data)
        
        return TipsAnalysis(
            average_tip_percentage=average_tip_percentage,
            total_tips=total_tips,
            trend=trend,
            change_percentage=change,
            recommendations=recommendations,
            improvement_areas=improvement_areas
        )
    
    def _generate_tips_recommendations(
        self,
        current_avg: float,
        trend: str,
        change: float,
        tips_data: List[TipsData]
    ) -> List[str]:
        """Generate actionable tips improvement recommendations"""
        recommendations = []
        
        if current_avg < 15.0:  # Industry average
            recommendations.append(
                "Current tip percentage is below industry average. "
                "Consider staff training on customer service."
            )
        
        if trend == "decreasing" and abs(change) > 2.0:
            recommendations.append(
                f"Tips decreased by {abs(change):.1f}% this period. "
                "Review service quality and customer feedback."
            )
        
        # Analyze time-based patterns
        peak_hours = self._identify_peak_tip_hours(tips_data)
        recommendations.append(
            f"Peak tip hours: {', '.join(peak_hours)}. "
            "Ensure best staff are scheduled during these times."
        )
        
        return recommendations
```

---

## 📊 DATA MODELS

### Core Data Structures

```python
from dataclasses import dataclass
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class POSSystem(str, Enum):
    ALOHA = "aloha"
    TOAST = "toast"

@dataclass
class POSConnection:
    """POS system connection configuration"""
    id: str
    restaurant_id: str
    pos_system: POSSystem
    api_credentials: dict  # Encrypted
    connection_status: str  # 'active', 'inactive', 'error'
    last_sync_at: datetime
    sync_frequency: str  # 'daily', 'hourly', 'realtime'
    is_active: bool

@dataclass
class SalesReport:
    """Normalized sales report data"""
    id: str
    restaurant_id: str
    pos_system: POSSystem
    report_date: datetime
    report_type: str  # 'daily', 'weekly', 'monthly'
    total_revenue: float
    total_items_sold: int
    items: List[ItemSale]
    tips: float
    tax: float
    discounts: float
    payment_methods: Dict[str, float]
    created_at: datetime

@dataclass
class ItemSale:
    """Individual item sale record"""
    id: str
    sales_report_id: str
    item_id: str
    item_name: str
    category: str
    quantity: int
    unit_price: float
    total_price: float
    modifiers: List[str]
    order_time: datetime

@dataclass
class TipsData:
    """Tips tracking data"""
    id: str
    restaurant_id: str
    sale_id: str
    sale_amount: float
    tip_amount: float
    tip_percentage: float
    payment_method: str
    server_id: Optional[str]
    shift_id: Optional[str]
    sale_date: datetime
    created_at: datetime

@dataclass
class AnalyticsReport:
    """Analytics report structure"""
    report_type: str
    period: Dict[str, datetime]
    summary: Dict[str, float]
    popular_items: List[Dict]
    least_popular_items: List[Dict]
    tips_analysis: Dict
    trends: Dict
    recommendations: List[str]
    generated_at: datetime

@dataclass
class TipsAnalysis:
    """Tips performance analysis"""
    average_tip_percentage: float
    total_tips: float
    trend: str  # 'increasing', 'decreasing', 'stable'
    change_percentage: float
    recommendations: List[str]
    improvement_areas: List[str]
    period_comparison: Dict
```

---

## 🎯 API ENDPOINT SPECIFICATIONS

### RESTful API Design

```yaml
base_url: "/api/v1/pos"
authentication: "JWT Bearer token"
response_format: "JSON"
```

#### POS Integration API

```python
# POST /pos/connections
Request:
  {
    "restaurant_id": "rest_123",
    "pos_system": "aloha",
    "api_credentials": {
      "api_key": "encrypted_key",
      "api_secret": "encrypted_secret"
    },
    "sync_frequency": "daily"
  }
  
Response:
  {
    "connection_id": "conn_456",
    "restaurant_id": "rest_123",
    "pos_system": "aloha",
    "connection_status": "active",
    "last_sync_at": "2026-02-07T10:30:00Z",
    "created_at": "2026-02-07T10:30:00Z"
  }

# GET /pos/connections/{connection_id}/test
Response:
  {
    "connection_status": "active",
    "api_response_time": 245,
    "last_successful_sync": "2026-02-07T10:30:00Z",
    "test_result": "success"
  }

# POST /pos/connections/{connection_id}/sync
Request:
  {
    "report_type": "daily",
    "date": "2026-02-06"
  }
  
Response:
  {
    "sync_id": "sync_789",
    "status": "completed",
    "records_imported": 156,
    "sync_duration_ms": 1234,
    "synced_at": "2026-02-07T10:35:00Z"
  }
```

#### Sales Reports API

```python
# GET /pos/reports
Query params:
  restaurant_id: "rest_123"
  start_date: "2026-02-01"
  end_date: "2026-02-07"
  report_type: "daily" | "weekly" | "monthly"
  
Response:
  {
    "reports": [
      {
        "id": "report_123",
        "restaurant_id": "rest_123",
        "report_date": "2026-02-06",
        "report_type": "daily",
        "total_revenue": 4523.50,
        "total_items_sold": 123,
        "tips": 542.82,
        "created_at": "2026-02-07T10:30:00Z"
      }
    ],
    "total_reports": 7,
    "summary": {
      "total_revenue": 31664.50,
      "total_items_sold": 861,
      "total_tips": 3799.74
    }
  }

# GET /pos/reports/{report_id}/items
Response:
  {
    "report_id": "report_123",
    "items": [
      {
        "item_name": "Lamb Souvlaki",
        "category": "Entrees",
        "quantity_sold": 45,
        "total_revenue": 1260.00,
        "average_price": 28.00
      }
    ],
    "total_items": 25
  }
```

#### Analytics API

```python
# GET /pos/analytics/popular-items
Query params:
  restaurant_id: "rest_123"
  start_date: "2026-02-01"
  end_date: "2026-02-07"
  limit: 10
  
Response:
  {
    "period": {
      "start_date": "2026-02-01",
      "end_date": "2026-02-07"
    },
    "popular_items": [
      {
        "item_name": "Lamb Souvlaki",
        "quantity_sold": 145,
        "revenue": 4060.00,
        "percentage_of_sales": 12.82,
        "rank": 1
      }
    ],
    "total_items_analyzed": 45
  }

# GET /pos/analytics/least-popular-items
Query params:
  restaurant_id: "rest_123"
  start_date: "2026-02-01"
  end_date: "2026-02-07"
  limit: 10
  
Response:
  {
    "period": {
      "start_date": "2026-02-01",
      "end_date": "2026-02-07"
    },
    "least_popular_items": [
      {
        "item_name": "Greek Salad",
        "quantity_sold": 12,
        "revenue": 180.00,
        "percentage_of_sales": 0.57,
        "rank": 45
      }
    ],
    "total_items_analyzed": 45
  }
```

#### Tips Analytics API

```python
# GET /pos/tips/analysis
Query params:
  restaurant_id: "rest_123"
  start_date: "2026-02-01"
  end_date: "2026-02-07"
  
Response:
  {
    "period": {
      "start_date": "2026-02-01",
      "end_date": "2026-02-07"
    },
    "summary": {
      "total_tips": 5427.66,
      "total_sales": 45230.50,
      "average_tip_percentage": 12.0,
      "total_transactions": 1234
    },
    "trends": {
      "direction": "increasing",
      "change_percentage": 1.2,
      "previous_period_avg": 10.8
    },
    "recommendations": [
      "Tips increased 1.2% this week",
      "Peak tip hours: 7 PM - 9 PM",
      "Consider training on upselling techniques"
    ],
    "improvement_areas": [
      {
        "area": "Lunch service",
        "current_tip_percentage": 8.5,
        "recommendation": "Focus on service quality during lunch hours"
      }
    ]
  }

# GET /pos/tips/stats
Query params:
  restaurant_id: "rest_123"
  group_by: "day" | "week" | "month" | "server" | "shift"
  
Response:
  {
    "group_by": "day",
    "stats": [
      {
        "period": "2026-02-01",
        "total_tips": 775.38,
        "total_sales": 6461.50,
        "tip_percentage": 12.0,
        "transaction_count": 176
      }
    ]
  }
```

---

## 🧪 TESTING REQUIREMENTS

### Test Coverage Requirements

```python
# All modules must have:
# - Unit tests (>80% coverage)
# - Integration tests
# - API mock tests
# - Example test cases

def test_aloha_adapter_authentication():
    """Test Aloha adapter authentication"""
    
    # Arrange
    adapter = AlohaAdapter(api_key="test_key", api_secret="test_secret")
    
    # Act
    result = adapter.authenticate()
    
    # Assert
    assert result == True
    assert adapter.is_authenticated == True

def test_data_normalization():
    """Test POS data normalization"""
    
    # Arrange
    aloha_raw_data = {
        "location_id": "loc_123",
        "date": "2026-02-06",
        "net_sales": 4523.50,
        "items": [...]
    }
    adapter = AlohaAdapter()
    
    # Act
    normalized = adapter.normalize_data(aloha_raw_data)
    
    # Assert
    assert isinstance(normalized, NormalizedSalesData)
    assert normalized.restaurant_id == "loc_123"
    assert normalized.total_revenue == 4523.50

def test_tips_analysis():
    """Test tips analysis generation"""
    
    # Arrange
    tips_tracker = TipsTracker()
    tips_data = create_mock_tips_data(days=7)
    
    # Act
    analysis = tips_tracker.analyze_tips_performance(
        restaurant_id="rest_123",
        period_start=datetime(2026, 2, 1),
        period_end=datetime(2026, 2, 7)
    )
    
    # Assert
    assert analysis.average_tip_percentage > 0
    assert len(analysis.recommendations) > 0
    assert analysis.trend in ["increasing", "decreasing", "stable"]
```

---

## 🚨 CRITICAL CONSTRAINTS

### DO's

✅ **ALWAYS:**

- Use adapter pattern for POS system integration
- Normalize all data to unified schema
- Implement retry logic for API calls
- Handle rate limiting gracefully
- Encrypt API credentials in storage
- Validate data completeness before storage
- Log all API interactions
- Handle API errors gracefully
- Cache frequently accessed reports
- Provide fallback for API failures
- Use existing infrastructure where applicable
- Follow existing code patterns and architecture

### DON'Ts

❌ **NEVER:**

- Store API credentials in plain text
- Make blocking API calls in main thread
- Ignore API rate limits
- Skip data validation
- Mix POS-specific logic with business logic
- Hardcode POS system formats
- Skip error handling
- Return raw API errors to users
- Create new infrastructure when existing can be used
- Break compatibility with existing systems

---

## 🎓 DOMAIN KNOWLEDGE

### Restaurant Operations Context

```yaml
pos_systems:
  aloha:
    api_type: "REST API"
    authentication: "OAuth 2.0 or API Key"
    report_endpoints: ["/reports/daily", "/reports/weekly", "/reports/monthly"]
    data_format: "JSON"
    rate_limits: "Varies by plan"
    
  toast:
    api_type: "REST API"
    authentication: "OAuth 2.0"
    report_endpoints: ["/v1/reports/sales", "/v1/reports/items"]
    data_format: "JSON"
    rate_limits: "100 requests/minute"

sales_analytics:
  report_types:
    daily: "Single day sales report"
    weekly: "7-day aggregated report"
    monthly: "30-day aggregated report"
  
  metrics:
    total_revenue: "Sum of all sales"
    total_items_sold: "Count of items sold"
    average_order_value: "Revenue / Number of orders"
    popular_items: "Items sorted by quantity sold"
    least_popular_items: "Items with lowest sales"

tips_tracking:
  industry_averages:
    full_service: "15-20%"
    quick_service: "10-15%"
    fine_dining: "18-25%"
  
  optimization_strategies:
    - "Staff training on customer service"
    - "Upselling techniques"
    - "Peak hour staffing"
    - "Service quality monitoring"
```

### Business Rules

```python
# Critical business logic:

# 1. Report fetching schedule
def should_fetch_daily_report() -> bool:
    """Fetch daily report for previous day"""
    current_hour = datetime.now().hour
    return current_hour >= 2  # After 2 AM

def should_fetch_weekly_report() -> bool:
    """Fetch weekly report on Mondays"""
    return datetime.now().weekday() == 0  # Monday

def should_fetch_monthly_report() -> bool:
    """Fetch monthly report on first of month"""
    return datetime.now().day == 1

# 2. Data validation rules
def validate_sales_report(report: SalesReport) -> bool:
    """Validate sales report completeness"""
    if report.total_revenue < 0:
        return False
    if report.total_items_sold < 0:
        return False
    if not report.items:
        return False
    if report.report_date > datetime.now():
        return False
    return True

# 3. Tips calculation
def calculate_tip_percentage(sale_amount: float, tip_amount: float) -> float:
    """Calculate tip percentage"""
    if sale_amount <= 0:
        return 0.0
    return (tip_amount / sale_amount) * 100

# 4. Popular items threshold
def is_popular_item(item: ItemSale, total_items: int) -> bool:
    """Determine if item is popular (top 20%)"""
    threshold = total_items * 0.2
    return item.quantity_sold >= threshold
```

---

## 🔒 SECURITY CONSIDERATIONS

### API Credential Management

```python
# Never expose in logs or responses:
SENSITIVE_FIELDS = [
    "api_key",
    "api_secret",
    "oauth_token",
    "refresh_token",
    "password"
]

def encrypt_credentials(credentials: dict) -> dict:
    """Encrypt POS API credentials before storage"""
    encrypted = {}
    for key, value in credentials.items():
        if key in SENSITIVE_FIELDS:
            encrypted[key] = encrypt_value(value)  # Use existing encryption
        else:
            encrypted[key] = value
    return encrypted

def sanitize_for_logging(data: dict) -> dict:
    """Remove sensitive data before logging"""
    return {
        k: "***REDACTED***" if k in SENSITIVE_FIELDS else v
        for k, v in data.items()
    }
```

### API Rate Limiting

```python
# Implement rate limiting for POS API calls

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = []
    
    def can_make_request(self) -> bool:
        """Check if request can be made within rate limit"""
        now = datetime.now()
        # Remove old requests outside window
        self.requests = [
            req_time for req_time in self.requests
            if (now - req_time).total_seconds() < self.window_seconds
        ]
        
        if len(self.requests) >= self.max_requests:
            return False
        
        self.requests.append(now)
        return True
    
    def wait_time(self) -> float:
        """Calculate wait time until next request allowed"""
        if not self.requests:
            return 0.0
        
        oldest_request = min(self.requests)
        elapsed = (datetime.now() - oldest_request).total_seconds()
        return max(0.0, self.window_seconds - elapsed)
```

---

## 🚀 DEPLOYMENT SPECIFICATIONS

### Environment Configuration

```yaml
development:
  debug: true
  log_level: DEBUG
  pos_api_timeout: 30
  retry_attempts: 3
  cache_enabled: false
  sync_frequency: "hourly"

staging:
  debug: false
  log_level: INFO
  pos_api_timeout: 30
  retry_attempts: 3
  cache_enabled: true
  sync_frequency: "hourly"

production:
  debug: false
  log_level: WARNING
  pos_api_timeout: 60
  retry_attempts: 5
  cache_enabled: true
  sync_frequency: "daily"
  enable_monitoring: true
  enable_alerts: true
  backup_enabled: true
```

### Integration with Existing Systems

```yaml
inventory_dashboard:
  integration: "Event-driven updates"
  data_flow: "Sales → Inventory deduction"
  sync_frequency: "Real-time or batch"
  
aws_infrastructure:
  database: "Use existing database connections"
  secrets: "Use existing AWS Secrets Manager for API credentials"
  monitoring: "Use existing CloudWatch/logging"
  queue: "Use existing async task queue for report fetching"
```

---

## 📈 PERFORMANCE REQUIREMENTS

### Response Time Targets

```yaml
api_endpoints:
  test_connection: <2s
  fetch_report: <10s
  generate_analytics: <5s
  tips_analysis: <3s
  
data_sync:
  daily_report_sync: <30s
  weekly_report_sync: <2min
  monthly_report_sync: <5min
  
caching:
  report_cache_ttl: "1 hour"
  analytics_cache_ttl: "30 minutes"
```

### Scalability Targets

```yaml
concurrent_pos_connections: 100+
restaurants: 1000+
daily_reports_per_restaurant: 1
weekly_reports_per_restaurant: 1
monthly_reports_per_restaurant: 1
api_requests_per_minute: 100+
```

---

## 🎯 SUCCESS CRITERIA

### Definition of Done

A feature/component is complete when:

✅ **Code Quality**

- [ ] Type hints on all functions
- [ ] Comprehensive docstrings
- [ ] Error handling implemented
- [ ] Retry logic for API calls
- [ ] Logging added
- [ ] No hardcoded values
- [ ] Follows existing code patterns

✅ **Testing**

- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests passing
- [ ] API mock tests completed
- [ ] Manual testing completed
- [ ] Edge cases handled

✅ **Documentation**

- [ ] API endpoint documented
- [ ] Examples provided
- [ ] Integration guide updated
- [ ] Comments for complex logic

✅ **Performance**

- [ ] Response time within target
- [ ] API rate limiting handled
- [ ] Caching implemented
- [ ] No blocking operations

✅ **Security**

- [ ] API credentials encrypted
- [ ] Input validation
- [ ] Error handling (no sensitive data exposure)
- [ ] Rate limiting implemented
- [ ] Security audit passed

---

## 🔍 DEBUGGING GUIDELINES

### Common Issues & Solutions

```python
# Issue: POS API authentication failing
Solution:
  - Check API credentials in secrets manager
  - Verify OAuth token expiration
  - Review authentication logs
  - Test credentials manually
  - Check for credential rotation

# Issue: Data normalization errors
Solution:
  - Review POS system API documentation
  - Check for API format changes
  - Verify field mappings
  - Test with sample data
  - Add validation logging

# Issue: Report fetching timeout
Solution:
  - Increase timeout settings
  - Implement pagination for large reports
  - Add retry logic with exponential backoff
  - Review API rate limits
  - Consider async processing

# Issue: Tips analysis showing incorrect percentages
Solution:
  - Verify tips data collection
  - Check calculation formulas
  - Review data validation rules
  - Test with known values
  - Check for data type mismatches
```

---

## 📝 FINAL NOTES

### When Generating Code for This System

1. **Always start with context**: Understand which POS system you're integrating
2. **Follow patterns**: Use the established adapter and normalization patterns
3. **Be explicit**: Type hints, docstrings, clear variable names
4. **Think production**: Error handling, logging, retry logic, rate limiting
5. **Test thoroughly**: Unit tests, integration tests, API mocks
6. **Document well**: Comments, examples, API docs
7. **Integrate carefully**: Work with existing infrastructure, don't duplicate
8. **Security first**: Encrypt credentials, validate inputs, handle errors safely

### Key Principles

- **Reliability > Speed**: Better to be reliable than fast
- **Normalization > Custom**: Unified schema over POS-specific formats
- **Resilience > Perfection**: Handle failures gracefully
- **Integration > Duplication**: Use existing systems where possible
- **Data Quality > Quantity**: Validate and clean data before storage

---

## 🎉 CONCLUSION

This document provides complete context for AI-assisted development of the POS Integration & Analytics System. All implementations should follow these specifications, patterns, and guidelines to ensure consistency, quality, reliability, and seamless integration with existing systems.

**Remember**: This is a production integration system affecting real restaurant operations. Data accuracy and API reliability are paramount.

---

**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Living Document  
**Integration:** Aloha POS + Toast POS + Inventory Dashboard + Analytics Platform

---

## 📞 QUICK REFERENCE

```yaml
# Key Concepts
pos_systems:
  aloha: "NCR Aloha POS system integration"
  toast: "Toast POS system integration"

report_types:
  daily: "Previous day sales report"
  weekly: "Previous 7 days aggregated report"
  monthly: "Previous 30 days aggregated report"

analytics_features:
  popular_items: "Top selling items by quantity"
  least_popular_items: "Lowest selling items"
  tips_tracking: "Tips collection and optimization"
  sales_trends: "Revenue patterns and forecasting"

integration_pattern:
  adapter: "POS-specific adapter classes"
  normalization: "Unified data schema"
  sync: "Scheduled or real-time data fetching"
```

---

**END OF PROMPT SPECIFICATION**
