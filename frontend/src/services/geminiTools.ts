/**
 * Gemini AI Tools Service
 *
 * Provides function calling tool declarations, local execution against
 * cuisineTemplates data, and structured output generation for AI insight cards.
 */

import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
} from '@google/generative-ai'
import type { CuisineTemplate } from '../data/cuisineTemplates'

// ---------------------------------------------------------------------------
// Function Calling Tool Declarations
// ---------------------------------------------------------------------------

export const restaurantToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'check_inventory',
    description:
      'Check current inventory level for a specific ingredient. Returns stock quantity, risk level, days of cover, and trend.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ingredient_name: {
          type: SchemaType.STRING,
          description: 'Name of the ingredient to check',
        },
      },
      required: ['ingredient_name'],
    },
  },
  {
    name: 'search_menu',
    description:
      'Search the restaurant menu for dishes matching a query. Returns dish names, prices, categories, and order counts.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Search term for dish name or category',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_supplier_info',
    description:
      'Get supplier information for a specific ingredient. Returns available suppliers, prices, lead times, and reliability scores.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ingredient_name: {
          type: SchemaType.STRING,
          description: 'Ingredient to find suppliers for',
        },
      },
      required: ['ingredient_name'],
    },
  },
  {
    name: 'get_daily_stats',
    description:
      "Get today's restaurant statistics including total orders, top dishes, and revenue estimates.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_low_stock_alerts',
    description:
      'Get all ingredients below safe stock levels (CRITICAL, URGENT, or MONITOR risk).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'create_reorder_suggestion',
    description:
      'Generate a reorder suggestion for a specific ingredient, including recommended quantity, best supplier, and estimated cost.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ingredient_name: {
          type: SchemaType.STRING,
          description: 'Ingredient to create reorder suggestion for',
        },
      },
      required: ['ingredient_name'],
    },
  },
]

// ---------------------------------------------------------------------------
// Local Tool Execution (queries CuisineTemplate data)
// ---------------------------------------------------------------------------

export function executeToolCall(
  name: string,
  args: Record<string, any>,
  template: CuisineTemplate,
): Record<string, any> {
  switch (name) {
    case 'check_inventory': {
      const search = (args.ingredient_name || '').toLowerCase()
      const ingredient = template.ingredients.find((i) =>
        i.name.toLowerCase().includes(search),
      )
      if (!ingredient) return { error: `Ingredient "${args.ingredient_name}" not found in inventory` }
      return {
        name: ingredient.name,
        current_inventory: ingredient.current_inventory,
        unit: ingredient.unit,
        risk_level: ingredient.risk_level,
        days_of_cover: ingredient.days_of_cover,
        stockout_probability: ingredient.stockout_prob,
        trend_percent: ingredient.trend,
        category: ingredient.category,
      }
    }

    case 'search_menu': {
      const query = (args.query || '').toLowerCase()
      const matches = template.dishes.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.category.toLowerCase().includes(query),
      )
      return {
        results: matches.slice(0, 8).map((d) => ({
          name: d.name,
          price: d.price,
          category: d.category,
          orders_today: d.orders_today,
          orders_7d: d.orders_7d,
          trend: d.trend,
          popularity_rank: d.popularity_rank,
        })),
        total_matches: matches.length,
      }
    }

    case 'get_supplier_info': {
      const search = (args.ingredient_name || '').toLowerCase()
      const suppliers = template.suppliers.filter(
        (s) =>
          s.ingredients?.some((i) => i.toLowerCase().includes(search)) ||
          s.pricing?.some((p) => p.ingredient.toLowerCase().includes(search)),
      )
      return {
        ingredient: args.ingredient_name,
        suppliers: suppliers.map((s) => {
          const pricing = s.pricing?.find((p) =>
            p.ingredient.toLowerCase().includes(search),
          )
          return {
            name: s.name,
            lead_time_days: s.lead_time_days,
            reliability_score: s.reliability_score,
            shipping_cost: s.shipping_cost,
            price_per_unit: pricing?.price,
            unit: pricing?.unit,
          }
        }),
      }
    }

    case 'get_daily_stats': {
      const totalToday = template.dishes.reduce((s, d) => s + d.orders_today, 0)
      const total7d = template.dishes.reduce((s, d) => s + d.orders_7d, 0)
      const top = [...template.dishes]
        .sort((a, b) => b.orders_today - a.orders_today)
        .slice(0, 5)
      return {
        total_orders_today: totalToday,
        total_orders_7d: total7d,
        estimated_revenue_today: top.reduce(
          (s, d) => s + d.orders_today * d.price,
          0,
        ),
        top_dishes: top.map((d) => ({
          name: d.name,
          orders: d.orders_today,
          price: d.price,
        })),
        critical_items: template.ingredients.filter(
          (i) => i.risk_level === 'CRITICAL',
        ).length,
        urgent_items: template.ingredients.filter(
          (i) => i.risk_level === 'URGENT',
        ).length,
      }
    }

    case 'get_low_stock_alerts': {
      const alerts = template.ingredients
        .filter((i) => ['CRITICAL', 'URGENT', 'MONITOR'].includes(i.risk_level))
        .sort((a, b) => a.days_of_cover - b.days_of_cover)
      return {
        total_alerts: alerts.length,
        items: alerts.map((i) => ({
          name: i.name,
          risk_level: i.risk_level,
          days_of_cover: i.days_of_cover,
          current_inventory: i.current_inventory,
          unit: i.unit,
          trend: i.trend,
        })),
      }
    }

    case 'create_reorder_suggestion': {
      const search = (args.ingredient_name || '').toLowerCase()
      const ingredient = template.ingredients.find((i) =>
        i.name.toLowerCase().includes(search),
      )
      if (!ingredient) return { error: `Ingredient "${args.ingredient_name}" not found` }
      const bestSupplier = template.suppliers
        .filter((s) =>
          s.pricing?.some((p) => p.ingredient.toLowerCase().includes(search)),
        )
        .sort((a, b) => b.reliability_score - a.reliability_score)[0]
      const pricing = bestSupplier?.pricing?.find((p) =>
        p.ingredient.toLowerCase().includes(search),
      )
      const suggestedQty = Math.ceil(ingredient.current_inventory * 2)
      return {
        ingredient: ingredient.name,
        current_stock: ingredient.current_inventory,
        suggested_quantity: suggestedQty,
        unit: ingredient.unit,
        supplier: bestSupplier?.name || 'Unknown',
        unit_price: pricing?.price,
        estimated_cost: pricing
          ? (pricing.price * suggestedQty).toFixed(2)
          : 'N/A',
        lead_time_days: bestSupplier?.lead_time_days,
      }
    }

    default:
      return { error: `Unknown function: ${name}` }
  }
}

// ---------------------------------------------------------------------------
// Context Builders for Structured Output
// ---------------------------------------------------------------------------

export function buildRestaurantContext(template: CuisineTemplate): string {
  const critical = template.ingredients.filter((i) => i.risk_level === 'CRITICAL')
  const urgent = template.ingredients.filter((i) => i.risk_level === 'URGENT')
  const monitor = template.ingredients.filter((i) => i.risk_level === 'MONITOR')
  const topDishes = [...template.dishes]
    .sort((a, b) => b.orders_today - a.orders_today)
    .slice(0, 5)

  return `Restaurant: ${template.restaurantName} (${template.label} cuisine)

CRITICAL ingredients (${critical.length}): ${critical.map((i) => `${i.name} (${i.days_of_cover}d cover, ${i.current_inventory} ${i.unit})`).join(', ') || 'None'}
URGENT ingredients (${urgent.length}): ${urgent.map((i) => `${i.name} (${i.days_of_cover}d cover)`).join(', ') || 'None'}
MONITOR ingredients (${monitor.length}): ${monitor.map((i) => `${i.name} (${i.days_of_cover}d cover)`).join(', ') || 'None'}

Top dishes today: ${topDishes.map((d) => `${d.name} (${d.orders_today} orders, $${d.price})`).join(', ')}
Total orders today: ${template.dishes.reduce((s, d) => s + d.orders_today, 0)}`
}

export function buildMenuContext(template: CuisineTemplate): string {
  return `Restaurant: ${template.restaurantName} (${template.label} cuisine)

Menu items (${template.dishes.length} dishes):
${template.dishes
  .map(
    (d) =>
      `- ${d.name}: $${d.price}, ${d.category}, ${d.orders_7d} orders/7d, trend ${d.trend > 0 ? '+' : ''}${d.trend}%, rank #${d.popularity_rank}`,
  )
  .join('\n')}`
}

export function buildSupplierContext(template: CuisineTemplate): string {
  const critical = template.ingredients.filter((i) =>
    ['CRITICAL', 'URGENT'].includes(i.risk_level),
  )
  return `Restaurant: ${template.restaurantName}

Suppliers (${template.suppliers.length}):
${template.suppliers
  .map(
    (s) =>
      `- ${s.name}: ${s.lead_time_days}d lead, ${(s.reliability_score * 100).toFixed(0)}% reliability, $${s.shipping_cost} shipping`,
  )
  .join('\n')}

Low-stock ingredients needing reorder:
${critical.map((i) => `- ${i.name}: ${i.current_inventory} ${i.unit}, ${i.days_of_cover}d cover, ${i.risk_level}`).join('\n') || 'None'}`
}

// ---------------------------------------------------------------------------
// Structured Output Generation for AI Insight Cards
// ---------------------------------------------------------------------------

export async function generateStructuredInsights(
  apiKey: string,
  type: 'dashboard' | 'menu' | 'procurement',
  template: CuisineTemplate,
): Promise<any> {
  const client = new GoogleGenerativeAI(apiKey)

  const configs: Record<string, { prompt: string; schema: any }> = {
    dashboard: {
      prompt: `Based on this restaurant data, generate exactly 3 key insights about today's risks and opportunities. Be specific using the actual ingredient names and numbers:\n\n${buildRestaurantContext(template)}`,
      schema: {
        type: SchemaType.OBJECT,
        properties: {
          insights: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING, description: 'Short insight title (5-8 words)' },
                description: { type: SchemaType.STRING, description: '1-2 sentence actionable insight using specific data' },
                severity: { type: SchemaType.STRING, description: 'low, medium, or high' },
                type: { type: SchemaType.STRING, description: 'risk, opportunity, or info' },
              },
              required: ['title', 'description', 'severity', 'type'],
            },
          },
        },
        required: ['insights'],
      },
    },
    menu: {
      prompt: `Analyze this restaurant's menu performance and suggest exactly 3 actions (reprice, promote, or discontinue). Use actual dish names and order data:\n\n${buildMenuContext(template)}`,
      schema: {
        type: SchemaType.OBJECT,
        properties: {
          suggestions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                dish_name: { type: SchemaType.STRING },
                action: { type: SchemaType.STRING, description: 'reprice, promote, or discontinue' },
                reason: { type: SchemaType.STRING, description: '1 sentence reason with data' },
                detail: { type: SchemaType.STRING, description: 'Specific recommendation (e.g. new price)' },
              },
              required: ['dish_name', 'action', 'reason', 'detail'],
            },
          },
        },
        required: ['suggestions'],
      },
    },
    procurement: {
      prompt: `Analyze supplier data and give exactly 3 procurement recommendations. Reference actual supplier names and ingredient data:\n\n${buildSupplierContext(template)}`,
      schema: {
        type: SchemaType.OBJECT,
        properties: {
          recommendations: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                action: { type: SchemaType.STRING, description: 'Short action title' },
                details: { type: SchemaType.STRING, description: '1-2 sentence details' },
                savings_estimate: { type: SchemaType.STRING, description: 'Estimated savings or impact' },
                priority: { type: SchemaType.STRING, description: 'high, medium, or low' },
              },
              required: ['action', 'details', 'savings_estimate', 'priority'],
            },
          },
        },
        required: ['recommendations'],
      },
    },
  }

  const { prompt, schema } = configs[type]
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.5,
      maxOutputTokens: 8192,
    },
  })

  const result = await model.generateContent(prompt)
  return JSON.parse(result.response.text())
}
