import { API_BASE_URL } from './api'

// Tax calculation
export async function calculateTax(
  restaurantId: string,
  amount: number,
  customerAddress?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  },
  lineItems?: Array<{
    id: string
    description: string
    quantity: number
    unit_amount: number
    amount: number
  }>,
  shipping: number = 0
): Promise<{
  tax_amount: number
  tax_rate: number
  taxable_amount: number
  breakdown: Record<string, any>
  source: string
}> {
  const response = await fetch(`${API_BASE_URL}/tax/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      restaurant_id: restaurantId,
      amount,
      customer_address: customerAddress,
      line_items: lineItems,
      shipping,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to calculate tax')
  }

  return response.json()
}

export async function updateRestaurantTaxRate(
  restaurantId: string,
  rate: number
): Promise<{ updated: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/tax/restaurants/${restaurantId}/default-rate?rate=${rate}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to update tax rate')
  }

  return response.json()
}

export async function updateRestaurantAddress(
  restaurantId: string,
  address: {
    street: string
    city: string
    state: string
    zip_code: string
    country?: string
  }
): Promise<{ updated: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/tax/restaurants/${restaurantId}/address`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(address),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to update restaurant address')
  }

  return response.json()
}
