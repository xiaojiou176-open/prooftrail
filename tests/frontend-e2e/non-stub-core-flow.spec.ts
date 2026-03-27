import { expect, test as pwTest  } from '@playwright/test'

type TaskStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
type TaskRecord = { task_id: string; status: TaskStatus }
type CommandInfo = { command_id: string }

const backendPort = process.env.BACKEND_PORT?.trim() || '17380'
const apiOrigin = process.env.BACKEND_BASE_URL?.trim() || `http://127.0.0.1:${backendPort}`
const automationClientId = process.env.VITE_DEFAULT_AUTOMATION_CLIENT_ID?.trim() || 'client-frontend-e2e'
const automationToken =
  process.env.AUTOMATION_API_TOKEN?.trim() || process.env.VITE_DEFAULT_AUTOMATION_TOKEN?.trim() || ''
const authHeaders = automationToken
  ? {
      'x-automation-token': automationToken,
      'x-automation-client-id': automationClientId,
    }
  : { 'x-automation-client-id': automationClientId }
const isCI = process.env.CI === 'true'

async function getBackendUnavailableReason(): Promise<string | null> {
  try {
    const response = await fetch(`${apiOrigin}/api/automation/commands`, { headers: authHeaders })
    if (response.status === 401 || response.status === 403) {
      if (!automationToken) {
        return 'backend requires auth token; set AUTOMATION_API_TOKEN or VITE_DEFAULT_AUTOMATION_TOKEN'
      }
      return `GET /api/automation/commands rejected with ${response.status} even with token`
    }
    if (!response.ok) {
      return `GET /api/automation/commands returned ${response.status}`
    }
    const payload = (await response.json()) as { commands?: unknown }
    if (!Array.isArray(payload.commands)) {
      return 'GET /api/automation/commands response missing commands array'
    }
    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return `GET /api/automation/commands failed: ${message}`
  }
}

async function pickCommandForRun(): Promise<string> {
  const response = await fetch(`${apiOrigin}/api/automation/commands`, { headers: authHeaders })
  if (!response.ok) {
    throw new Error(`GET /api/automation/commands returned ${response.status}`)
  }
  const payload = (await response.json()) as { commands?: CommandInfo[] }
  const commands = Array.isArray(payload.commands) ? payload.commands : []
  const preferredIds = ['run-ui', 'run-ui-midscene', 'automation-test', 'backend-test']
  for (const preferredId of preferredIds) {
    if (commands.some((item) => item.command_id === preferredId)) {
      return preferredId
    }
  }
  const fallback = commands[0]?.command_id ?? ''
  if (!fallback) {
    throw new Error('commands list is empty')
  }
  return fallback
}

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
  const unavailableReason = await getBackendUnavailableReason()
  if (unavailableReason) {
    const reason = `backend unavailable at ${apiOrigin}: ${unavailableReason}`
    if (isCI) {
      throw new Error(`[frontend-e2e-nonstub] ${reason}; CI must fail instead of skipping.`)
    }
    skipReason = reason
  }
})

pwTest.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('ab_onboarding_done', '1')
    window.localStorage.setItem('ab_first_use_done', '1')
  })
})

pwTest('@frontend-nonstub-main @frontend-nonstub @nonstub @counterfactual run and cancel chain over live local api', async ({ page }) => {
  if (exitIfBackendUnavailable()) return

  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: 'ProofTrail' })).toBeVisible()
  const commandId = await pickCommandForRun()

  const runResponse = await page.request.post(`${apiOrigin}/api/automation/run`, {
    headers: authHeaders,
    data: { command: commandId, params: {} },
  })
  expect(runResponse.status()).toBe(200)
  const runPayload = (await runResponse.json()) as { task?: { task_id?: string } }
  const createdTaskId = runPayload.task?.task_id ?? ''
  expect(createdTaskId.length).toBeGreaterThan(0)

  const cancelResponse = await page.request.post(
    `${apiOrigin}/api/automation/tasks/${encodeURIComponent(createdTaskId)}/cancel`,
    { headers: authHeaders }
  )
  expect([200, 202]).toContain(cancelResponse.status())

  let terminalStatus: TaskStatus | '' = ''
  let cancelAttempts = 1
  let lastCancelAt = Date.now()
  await expect
    .poll(
      async () => {
        const taskResponse = await page.request.get(
          `${apiOrigin}/api/automation/tasks/${encodeURIComponent(createdTaskId)}`,
          { headers: authHeaders }
        )
        if (taskResponse.status() !== 200) return ''
        const taskPayload = (await taskResponse.json()) as TaskRecord
        terminalStatus = taskPayload.status
        if (
          (terminalStatus === 'queued' || terminalStatus === 'running') &&
          cancelAttempts < 3 &&
          Date.now() - lastCancelAt >= 5000
        ) {
          const retryCancelResponse = await page.request.post(
            `${apiOrigin}/api/automation/tasks/${encodeURIComponent(createdTaskId)}/cancel`,
            { headers: authHeaders }
          )
          expect([200, 202, 409]).toContain(retryCancelResponse.status())
          cancelAttempts += 1
          lastCancelAt = Date.now()
        }
        if (terminalStatus === 'failed' || terminalStatus === 'success') {
          throw new Error(
            `cancel flow must settle as cancelled; got terminal status ${terminalStatus}`
          )
        }
        return taskPayload.status
      },
      { timeout: 45000, intervals: [500, 1000, 2000, 3000] }
    )
    .toBe('cancelled')

  expect(terminalStatus, 'cancel flow must not end as failed').not.toBe('failed')
  expect(
    terminalStatus,
    `cancel flow must settle as cancelled; got ${terminalStatus || 'unknown'}`
  ).toBe('cancelled')
})
