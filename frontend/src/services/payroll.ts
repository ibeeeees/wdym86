import { API_BASE_URL } from './api'

// Payroll API functions

export async function getEmployees(restaurantId: string, department?: string) {
  const url = department
    ? `${API_BASE_URL}/payroll/${restaurantId}/employees?department=${department}`
    : `${API_BASE_URL}/payroll/${restaurantId}/employees`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch employees')
  }

  return response.json()
}

export async function createEmployee(
  restaurantId: string,
  data: {
    name: string
    role: string
    department: string
    employment_type: string
    compensation_type: string
    hourly_rate?: number
    annual_salary?: number
    email?: string
    start_date?: string
  }
) {
  const response = await fetch(`${API_BASE_URL}/payroll/${restaurantId}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create employee')
  }

  return response.json()
}

export async function updateEmployee(
  restaurantId: string,
  employeeId: string,
  data: Partial<{
    name: string
    role: string
    department: string
    employment_type: string
    compensation_type: string
    hourly_rate: number
    annual_salary: number
    status: string
  }>
) {
  const response = await fetch(
    `${API_BASE_URL}/payroll/${restaurantId}/employees/${employeeId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to update employee')
  }

  return response.json()
}

export async function deleteEmployee(restaurantId: string, employeeId: string) {
  const response = await fetch(
    `${API_BASE_URL}/payroll/${restaurantId}/employees/${employeeId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to delete employee')
  }

  return response.json()
}

export async function getPayRuns(restaurantId: string, limit: number = 10) {
  const response = await fetch(
    `${API_BASE_URL}/payroll/${restaurantId}/pay-runs?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch pay runs')
  }

  return response.json()
}

export async function createPayRun(
  restaurantId: string,
  data: {
    period_start: string
    period_end: string
  }
) {
  const response = await fetch(`${API_BASE_URL}/payroll/${restaurantId}/pay-runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create pay run')
  }

  return response.json()
}

export async function getTipsSummary(restaurantId: string, periodDays: number = 14) {
  const response = await fetch(
    `${API_BASE_URL}/payroll/${restaurantId}/tips?period_days=${periodDays}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch tips summary')
  }

  return response.json()
}

export async function getExpenses(
  restaurantId: string,
  category?: string,
  limit: number = 50
) {
  let url = `${API_BASE_URL}/payroll/${restaurantId}/expenses?limit=${limit}`
  if (category) {
    url += `&category=${category}`
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch expenses')
  }

  return response.json()
}

export async function createExpense(
  restaurantId: string,
  data: {
    date: string
    category: string
    description: string
    amount: number
    vendor?: string
  }
) {
  const response = await fetch(`${API_BASE_URL}/payroll/${restaurantId}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create expense')
  }

  return response.json()
}

export async function getSalesSummary(restaurantId: string, periodDays: number = 14) {
  const response = await fetch(
    `${API_BASE_URL}/payroll/${restaurantId}/sales-summary?period_days=${periodDays}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch sales summary')
  }

  return response.json()
}

// S3 Import/Export functions (optional)

export async function exportPaychecksToS3(restaurantId: string, payRunId?: string) {
  const url = payRunId
    ? `${API_BASE_URL}/payroll/${restaurantId}/paychecks/export-s3?pay_run_id=${payRunId}`
    : `${API_BASE_URL}/payroll/${restaurantId}/paychecks/export-s3`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to export paychecks')
  }

  return response.json()
}

export async function exportExpensesToS3(restaurantId: string) {
  const response = await fetch(
    `${API_BASE_URL}/payroll/${restaurantId}/expenses/export-s3`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to export expenses')
  }

  return response.json()
}

export async function exportSalesToS3(restaurantId: string) {
  const response = await fetch(
    `${API_BASE_URL}/payroll/${restaurantId}/sales/export-s3`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to export sales')
  }

  return response.json()
}
