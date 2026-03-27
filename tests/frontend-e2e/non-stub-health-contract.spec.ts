import { expect, test as pwTest } from '@playwright/test'

const backendPort = process.env.BACKEND_PORT?.trim() || '17380'
const apiOrigin = process.env.BACKEND_BASE_URL?.trim() || `http://127.0.0.1:${backendPort}`
const isCI = process.env.CI === 'true'

let skipReason: string | null = null

function exitIfBackendUnavailable(): boolean {
  if (!skipReason) return false
  pwTest.info().annotations.push({
    type: 'local-backend-unavailable',
    description: `[frontend-e2e-nonstub] ${skipReason}`,
  })
  return true
}

pwTest.beforeAll(async () => {
  try {
    const response = await fetch(`${apiOrigin}/health/`)
    if (!response.ok) {
      throw new Error(`GET /health/ returned ${response.status}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const reason = `backend unavailable at ${apiOrigin}: ${message}`
    if (isCI) {
      throw new Error(`[frontend-e2e-nonstub] ${reason}; CI must fail instead of skipping.`)
    }
    skipReason = reason
  }
})

pwTest('@frontend-nonstub @nonstub health endpoints return live diagnostics', async ({ page }) => {
  if (exitIfBackendUnavailable()) return

  const healthResponse = await page.request.get(`${apiOrigin}/health/`)
  expect(healthResponse.status()).toBe(200)

  const diagnosticsResponse = await page.request.get(`${apiOrigin}/health/diagnostics`)
  expect(diagnosticsResponse.status()).toBe(200)
  const payload = (await diagnosticsResponse.json()) as {
    uptime_seconds?: unknown
    task_counts?: unknown
    metrics?: unknown
  }

  expect(typeof payload.uptime_seconds).toBe('number')
  expect(typeof payload.task_counts).toBe('object')
  expect(typeof payload.metrics).toBe('object')
})
