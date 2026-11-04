export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/+$/, '')

export async function postApi(endpoint, payload) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot reach the FinanceTracker backend at ${API_BASE_URL}. Start the backend and verify VITE_API_BASE_URL.`
      )
    }
    throw error
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error(`Backend returned an invalid response (HTTP ${response.status}).`)
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `Backend request failed (HTTP ${response.status}).`)
  }

  return result
}
