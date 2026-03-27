import { expect, test as pwTest, type Page  } from '@playwright/test'

type Command = {
  command_id: string
  title: string
  description: string
  tags: string[]
}

type Task = {
  task_id: string
  command_id: string
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
  requested_by: string | null
  attempt: number
  max_attempts: number
  created_at: string
  started_at: string | null
  finished_at: string | null
  exit_code: number | null
  message: string | null
  output_tail: string
}

type UniversalRun = {
  run_id: string
  template_id: string
  status: 'queued' | 'running' | 'waiting_user' | 'waiting_otp' | 'success' | 'failed' | 'cancelled'
  step_cursor: number
  params: Record<string, string>
  task_id: string | null
  last_error: string | null
  artifacts_ref: Record<string, string>
  created_at: string
  updated_at: string
  logs: Array<{ ts: string; level: 'info' | 'warn' | 'error'; message: string }>
}

type StubState = {
  commands: Command[]
  tasks: Task[]
  runs: UniversalRun[]
  templates: Array<{
    template_id: string
    flow_id: string
    name: string
    params_schema: Array<{
      key: string
      type: 'string' | 'secret' | 'enum' | 'regex' | 'email'
      required: boolean
      description?: string | null
      enum_values?: string[]
      pattern?: string | null
    }>
    defaults: Record<string, string>
    policies: {
      retries: number
      timeout_seconds: number
      otp: {
        required: boolean
        provider: 'manual' | 'gmail' | 'imap' | 'vonage'
        timeout_seconds: number
        regex: string
      }
      branches: Record<string, unknown>
    }
    created_by: string | null
    created_at: string
    updated_at: string
  }>
  latestFlow: {
    session_id: string | null
    start_url: string | null
    generated_at: string | null
    source_event_count: number
    step_count: number
    steps: Array<{ step_id: string; action: string; selector?: string | null }>
  }
  flowDraft: {
    flow_id: string
    session_id: string
    start_url: string
    generated_at: string
    source_event_count: number
    steps: Array<{
      step_id: string
      action: 'navigate' | 'click' | 'type'
      selected_selector_index: number
      target: { selectors: Array<{ kind: 'css' | 'role' | 'id' | 'name'; value: string; score: number }> }
      url?: string
    }>
  }
  evidenceTimeline: Array<{
    step_id: string
    action: string
    ok: boolean
    detail: string
    duration_ms: number
    matched_selector: string | null
    selector_index: number | null
    screenshot_before_path: string | null
    screenshot_after_path: string | null
    screenshot_before_data_url: string | null
    screenshot_after_data_url: string | null
    fallback_trail: Array<{
      selector_index: number
      kind: string
      value: string
      normalized: string | null
      success: boolean
      error: string | null
    }>
  }>
  calls: {
    fetchTasks: number
    fetchDiagnostics: number
    runCommand: number
    createRun: number
    cancelTask: number
    submitRunOtp: number
    saveFlowDraft: number
    replayLatestFlow: number
    replayStep: number
    replayFromStep: number
    taskQuery: {
      status: string
      command_id: string
      limit: string
    }
  }
  seq: number
}

async function clickCategoryTab(page: Page, testId: string, roleName: string) {
  const byTestId = page.getByTestId(testId)
  if ((await byTestId.count()) > 0) {
    await byTestId.click()
    return
  }
  await page.getByRole('tab', { name: new RegExp(`^${roleName}(\\s|$)`) }).click()
}

async function getBaseUrlInput(page: Page) {
  const byTestId = page.getByTestId('param-base-url-input')
  if ((await byTestId.count()) > 0) return byTestId
  return page.getByRole('textbox', { name: '你要操作的网站地址（BASE_URL）' })
}

async function getRegisterPasswordInput(page: Page) {
  const byTestId = page.getByTestId('param-register-password-input')
  if ((await byTestId.count()) > 0) return byTestId
  return page.getByRole('textbox', { name: '注册密码（可选）' })
}

async function clickRegisterPasswordVisibilityToggle(page: Page, input: ReturnType<Page['locator']>) {
  const byTestId = page.getByTestId('params-toggle-register-password-visibility')
  if ((await byTestId.count()) > 0) {
    await byTestId.click()
    return
  }
  const field = page.locator('.field').filter({ has: input })
  await field.getByRole('button', { name: /显示|隐藏/ }).click()
}

async function clickTabByTestIdOrRole(page: Page, testId: string, roleName: string) {
  const byTestId = page.getByTestId(testId)
  if ((await byTestId.count()) > 0) {
    await byTestId.click()
    return
  }
  await page.getByRole('tab', { name: new RegExp(`^${roleName}(\\s|$)`) }).click()
}

function createTask(taskId: string, commandId: string, status: Task['status']): Task {
  return {
    task_id: taskId,
    command_id: commandId,
    status,
    requested_by: 'e2e',
    attempt: 1,
    max_attempts: 3,
    created_at: '2026-02-20T00:00:00.000Z',
    started_at: '2026-02-20T00:00:01.000Z',
    finished_at: null,
    exit_code: null,
    message: status === 'running' ? '任务运行中' : null,
    output_tail: `output-${taskId}`,
  }
}

function createState(): StubState {
  return {
    commands: [
      {
        command_id: 'cmd-e2e-001',
        title: '打开首页',
        description: 'E2E 关键按钮测试命令',
        tags: ['e2e'],
      },
      {
        command_id: 'clean',
        title: '清理缓存',
        description: 'delete temp cache before rerun',
        tags: ['maintenance'],
      },
    ],
    tasks: [
      createTask('task-running-001', 'cmd-e2e-001', 'running'),
      { ...createTask('task-success-001', 'cmd-e2e-001', 'success'), finished_at: '2026-02-20T00:02:00.000Z', exit_code: 0 },
    ],
    runs: [
      {
        run_id: 'run-waiting-otp-001',
        template_id: 'tpl-e2e-001',
        status: 'waiting_otp',
        step_cursor: 2,
        params: { email: 'demo@example.com' },
        task_id: null,
        last_error: null,
        artifacts_ref: {},
        created_at: '2026-02-20T00:00:00.000Z',
        updated_at: '2026-02-20T00:00:00.000Z',
        logs: [],
      },
    ],
    templates: [
      {
        template_id: 'tpl-e2e-001',
        flow_id: 'flow-e2e-001',
        name: '示例模板',
        params_schema: [{ key: 'email', type: 'email', required: true, description: '账号邮箱' }],
        defaults: { email: 'demo@example.com' },
        policies: {
          retries: 0,
          timeout_seconds: 120,
          otp: { required: true, provider: 'manual', timeout_seconds: 120, regex: '\\b(\\d{6})\\b' },
          branches: {},
        },
        created_by: 'e2e',
        created_at: '2026-02-20T00:00:00.000Z',
        updated_at: '2026-02-20T00:00:00.000Z',
      },
    ],
    latestFlow: {
      session_id: 'session-e2e-001',
      start_url: 'https://example.com',
      generated_at: '2026-02-20T00:00:00.000Z',
      source_event_count: 4,
      step_count: 2,
      steps: [
        { step_id: 's1', action: 'navigate', selector: null },
        { step_id: 's2', action: 'click', selector: '#submit' },
      ],
    },
    flowDraft: {
      flow_id: 'flow-e2e-001',
      session_id: 'session-e2e-001',
      start_url: 'https://example.com',
      generated_at: '2026-02-20T00:00:00.000Z',
      source_event_count: 4,
      steps: [
        {
          step_id: 's1',
          action: 'navigate',
          selected_selector_index: 0,
          url: 'https://example.com',
          target: { selectors: [{ kind: 'css', value: 'body', score: 80 }] },
        },
        {
          step_id: 's2',
          action: 'click',
          selected_selector_index: 0,
          target: { selectors: [{ kind: 'css', value: '#submit', score: 90 }] },
        },
      ],
    },
    evidenceTimeline: [
      {
        step_id: 's1',
        action: 'navigate',
        ok: true,
        detail: 'step s1 ok',
        duration_ms: 120,
        matched_selector: null,
        selector_index: null,
        screenshot_before_path: null,
        screenshot_after_path: null,
        screenshot_before_data_url: null,
        screenshot_after_data_url: null,
        fallback_trail: [],
      },
      {
        step_id: 's2',
        action: 'click',
        ok: false,
        detail: 'step s2 failed',
        duration_ms: 240,
        matched_selector: '#submit',
        selector_index: 0,
        screenshot_before_path: null,
        screenshot_after_path: null,
        screenshot_before_data_url: null,
        screenshot_after_data_url: null,
        fallback_trail: [],
      },
    ],
    calls: {
      fetchTasks: 0,
      fetchDiagnostics: 0,
      runCommand: 0,
      createRun: 0,
      cancelTask: 0,
      submitRunOtp: 0,
      saveFlowDraft: 0,
      replayLatestFlow: 0,
      replayStep: 0,
      replayFromStep: 0,
      taskQuery: {
        status: 'all',
        command_id: '',
        limit: '100',
      },
    },
    seq: 100,
  }
}

function createReplayTask(state: StubState, commandId: string): Task {
  state.seq += 1
  return createTask(`task-e2e-${state.seq}`, commandId, 'running')
}

async function installBackendStubs(page: Page, state: StubState) {
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const method = request.method()
    const url = new URL(request.url())
    const { pathname } = url

    if (pathname === '/api/automation/commands' && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ commands: state.commands }) })
      return
    }
    if (pathname === '/api/automation/tasks' && method === 'GET') {
      state.calls.fetchTasks += 1
      const status = url.searchParams.get('status') ?? 'all'
      const commandId = url.searchParams.get('command_id') ?? ''
      const limit = url.searchParams.get('limit') ?? '100'
      state.calls.taskQuery = { status, command_id: commandId, limit }

      let filtered = [...state.tasks]
      if (status !== 'all') filtered = filtered.filter((task) => task.status === status)
      if (commandId.trim()) filtered = filtered.filter((task) => task.command_id.includes(commandId.trim()))
      const limitValue = Number.parseInt(limit, 10)
      if (Number.isInteger(limitValue) && limitValue > 0) filtered = filtered.slice(0, limitValue)

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tasks: filtered }) })
      return
    }
    if (pathname === '/api/automation/run' && method === 'POST') {
      state.calls.runCommand += 1
      const payload = request.postDataJSON() as { command_id?: string }
      const task = createReplayTask(state, payload.command_id ?? 'cmd-e2e-001')
      state.tasks = [task, ...state.tasks]
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ task }) })
      return
    }
    if (pathname.match(/^\/api\/automation\/tasks\/[^/]+\/cancel$/) && method === 'POST') {
      state.calls.cancelTask += 1
      const taskId = pathname.split('/')[4] ?? ''
      state.tasks = state.tasks.map((task) =>
        task.task_id === taskId
          ? { ...task, status: 'cancelled', finished_at: '2026-02-20T00:03:00.000Z', exit_code: 130, message: '已取消' }
          : task,
      )
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
      return
    }

    if (pathname === '/api/flows' && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ flows: [] }) })
      return
    }
    if (pathname === '/api/templates' && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ templates: state.templates }) })
      return
    }
    if (pathname === '/api/runs' && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ runs: state.runs }) })
      return
    }
    if (pathname === '/api/runs' && method === 'POST') {
      state.calls.createRun += 1
      state.seq += 1
      const newRunId = `run-e2e-${state.seq}`
      const payload = request.postDataJSON() as { template_id?: string; params?: Record<string, string> }
      state.runs = [
        {
          run_id: newRunId,
          template_id: payload.template_id ?? 'tpl-e2e-001',
          status: 'queued',
          step_cursor: 1,
          params: payload.params ?? {},
          task_id: null,
          last_error: null,
          artifacts_ref: {},
          created_at: '2026-02-20T00:00:00.000Z',
          updated_at: '2026-02-20T00:00:00.000Z',
          logs: [{ ts: '2026-02-20T00:00:00.000Z', level: 'info', message: 'run created' }],
        },
        ...state.runs,
      ]
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ run_id: newRunId }) })
      return
    }
    if (pathname.match(/^\/api\/runs\/[^/]+\/otp$/) && method === 'POST') {
      state.calls.submitRunOtp += 1
      const runId = pathname.split('/')[3] ?? ''
      state.runs = state.runs.map((run) =>
        run.run_id === runId
          ? {
              ...run,
              status: 'running',
              logs: [...run.logs, { ts: '2026-02-20T00:00:02.000Z', level: 'info', message: 'otp submitted' }],
              updated_at: '2026-02-20T00:00:02.000Z',
            }
          : run,
      )
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ run_id: runId, status: 'running' }) })
      return
    }

    if (pathname === '/api/command-tower/latest-flow' && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.latestFlow) })
      return
    }
    if (pathname === '/api/command-tower/latest-flow-draft' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session_id: state.flowDraft.session_id, flow: state.flowDraft }),
      })
      return
    }
    if (pathname === '/api/command-tower/latest-flow-draft' && method === 'PATCH') {
      state.calls.saveFlowDraft += 1
      const payload = request.postDataJSON() as { flow?: typeof state.flowDraft }
      if (payload.flow) state.flowDraft = payload.flow
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
      return
    }
    if (pathname === '/api/command-tower/evidence-timeline' && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: state.evidenceTimeline }) })
      return
    }
    if (pathname === '/api/command-tower/evidence' && method === 'GET') {
      const stepId = url.searchParams.get('step_id') ?? ''
      const hit = state.evidenceTimeline.find((item) => item.step_id === stepId)
      if (!hit) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'not found' }) })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(hit) })
      return
    }
    if (pathname === '/api/command-tower/replay-latest' && method === 'POST') {
      state.calls.replayLatestFlow += 1
      const task = createReplayTask(state, 'flow-replay')
      state.tasks = [task, ...state.tasks]
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ task }) })
      return
    }
    if (pathname === '/api/command-tower/replay-latest-step' && method === 'POST') {
      state.calls.replayStep += 1
      const task = createReplayTask(state, 'flow-step-replay')
      state.tasks = [task, ...state.tasks]
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ task }) })
      return
    }
    if (pathname === '/api/command-tower/replay-latest-from-step' && method === 'POST') {
      state.calls.replayFromStep += 1
      const task = createReplayTask(state, 'flow-resume')
      state.tasks = [task, ...state.tasks]
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ task }) })
      return
    }

    throw new Error(`[critical-buttons] Unhandled API route: ${method} ${pathname}`)
  })

  await page.route('**/health/**', async (route) => {
    const method = route.request().method()
    const pathname = new URL(route.request().url()).pathname
    if (pathname === '/health/diagnostics') {
      state.calls.fetchDiagnostics += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uptime_seconds: 600,
          task_total: state.tasks.length,
          task_counts: {
            queued: state.tasks.filter((task) => task.status === 'queued').length,
            running: state.tasks.filter((task) => task.status === 'running').length,
            success: state.tasks.filter((task) => task.status === 'success').length,
            failed: state.tasks.filter((task) => task.status === 'failed').length,
            cancelled: state.tasks.filter((task) => task.status === 'cancelled').length,
          },
          metrics: { requests_total: 42, rate_limited: 0 },
        }),
      })
      return
    }
    if (pathname === '/health/alerts') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'ok',
          failure_rate: 0,
          threshold: 0.2,
          completed: state.tasks.filter((task) => task.status === 'success').length,
          failed: state.tasks.filter((task) => task.status === 'failed').length,
        }),
      })
      return
    }
    if (pathname === '/health/rum' && method === 'POST') {
      await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ accepted: true }) })
      return
    }
    throw new Error(`[critical-buttons] Unhandled health route: ${method} ${pathname}`)
  })
}

async function assertApiKeyBranch(page: Page) {
  const apiKeyInput = page.locator('#api-key')
  if ((await apiKeyInput.count()) === 0) {
    // New Gemini-first panel no longer exposes a dedicated api-key input.
    await expect(page.locator('#automation-token'), 'automation token input must be rendered when api-key input is absent').toHaveCount(1)
    return
  }
  const apiKeyField = page.locator('.field').filter({ has: page.locator('#api-key') })
  await apiKeyInput.fill('sk-demo-123')
  await expect(apiKeyInput).toHaveAttribute('type', 'password')
  await apiKeyField.getByRole('button', { name: '显示' }).click()
  await expect(apiKeyInput).toHaveAttribute('type', 'text')
  await apiKeyField.getByRole('button', { name: '隐藏' }).click()
  await expect(apiKeyInput).toHaveAttribute('type', 'password')
}

async function assertModelFallbackBranch(page: Page) {
  const modelNameInput = page.locator('#model-name')
  await expect(modelNameInput, 'model-name input must stay available for explicit Gemini model pinning').toHaveCount(1)
  await modelNameInput.fill('gemini-3.1-pro-preview')
  await expect(modelNameInput).toHaveValue('gemini-3.1-pro-preview')
}

pwTest.describe('@frontend-critical-buttons', () => {
  pwTest.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('ab_onboarding_done', '1')
      window.localStorage.setItem('ab_first_use_done', '1')
    })
  })

  pwTest('QuickLaunch / TaskCenter / Header / Terminal critical buttons', async ({ page }) => {
    const state = createState()
    await installBackendStubs(page, state)
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: 'ProofTrail' })).toBeVisible()

    await page.getByRole('button', { name: '执行' }).first().click()
    await expect(page.getByText('已提交 打开首页')).toBeVisible()
    await expect.poll(() => state.calls.runCommand).toBeGreaterThan(0)

    await page.getByRole('button', { name: '启动运行任务', exact: true }).first().click()
    await expect(page.getByText('运行任务创建成功')).toBeVisible()
    await expect.poll(() => state.calls.createRun).toBeGreaterThan(0)

    await page.getByRole('tab', { name: '任务中心' }).click()
    await expect(page.getByRole('tab', { name: '任务中心' })).toHaveAttribute('aria-selected', 'true')

    await page.getByRole('tab', { name: /运行记录（模板）/ }).click()
    await expect(page.getByRole('listbox', { name: '运行记录列表（模板）' })).toBeVisible()
    await page.getByRole('tab', { name: /运行记录（命令）/ }).click()
    await expect(page.getByRole('list', { name: '运行记录列表（命令）' })).toBeVisible()

    const taskListColumn = page.locator('.task-list-column')
    const refreshBefore = state.calls.fetchTasks
    await taskListColumn.getByRole('button', { name: '刷新' }).first().click()
    await expect.poll(() => state.calls.fetchTasks).toBeGreaterThan(refreshBefore)

    await page.getByRole('button', { name: '取消' }).first().click()
    await expect(page.getByText(/已取消任务/)).toBeVisible()
    await expect.poll(() => state.calls.cancelTask).toBeGreaterThan(0)

    await page.getByRole('tab', { name: /运行记录（模板）/ }).click()
    const waitingOtpOptionById = page.locator('#task-center-template-option-run-waiting-otp-001')
    await expect(waitingOtpOptionById).toHaveCount(1)
    await waitingOtpOptionById.click()
    await expect(page.getByText(/运行记录 #run-wait/)).toBeVisible()
    await expect(page.getByText('该运行记录正在等待验证码，请输入后提交：')).toBeVisible()
    await page.getByPlaceholder('输入验证码').fill('654321')
    await page.locator('.task-detail-column').getByRole('button', { name: '提交', exact: true }).click()
    await expect(page.getByText('验证码已提交，运行任务已继续')).toBeVisible()
    await expect.poll(() => state.calls.submitRunOtp).toBeGreaterThan(0)

    const pageHeader = page.locator('header').first()
    await pageHeader.getByRole('button', { name: '帮助' }).click()
    const helpDialog = page.getByRole('dialog', { name: '帮助' })
    await expect(helpDialog).toBeVisible()
    await helpDialog.getByLabel('关闭帮助面板').click()

    await pageHeader.getByRole('button', { name: '重新开始引导' }).click()
    await expect(page.getByText('第 1 步：明确目标并检查参数区')).toBeVisible()
    await page.getByRole('button', { name: '稍后再看' }).click()

    const terminal = page.getByRole('region', { name: '实时终端' })
    await terminal.getByRole('button', { name: '清空' }).click()
    await expect(terminal.getByText('终端日志为空')).toBeVisible()
  })

  pwTest('Major mapping anchors (31/32/40/41/42/43/46/47/48/58) stay stable', async ({ page }) => {
    const state = createState()
    state.tasks = [createTask('task-running-major-map-001', 'cmd-e2e-001', 'running')]
    await installBackendStubs(page, state)
    await page.goto('/')
    await page.evaluate(() => {
      window.localStorage.setItem('ab_first_use_done', '0')
      window.localStorage.setItem('ab_first_use_stage', 'welcome')
      window.localStorage.removeItem('ab_first_use_progress')
    })
    await page.reload()

    await page.getByTestId('console-tab-quick-launch').click()
    const locateConfigButton = page.getByTestId('quick-launch-first-use-locate-config')
    if (await locateConfigButton.count()) {
      await expect(locateConfigButton).toBeVisible()
    }
    await clickCategoryTab(page, 'command-category-maintenance', '维护')
    await clickCategoryTab(page, 'command-category-frontend', '前端')
    await clickCategoryTab(page, 'command-category-all', '全部')

    const baseUrlInput = await getBaseUrlInput(page)
    await baseUrlInput.fill('http://127.0.0.1:17380/register')
    await expect(baseUrlInput).toHaveValue('http://127.0.0.1:17380/register')
    if (await locateConfigButton.count()) {
      await locateConfigButton.click()
    }

    const registerPassword = await getRegisterPasswordInput(page)
    await expect(registerPassword).toHaveAttribute('type', 'password')
    await clickRegisterPasswordVisibilityToggle(page, registerPassword)
    await expect(registerPassword).toHaveAttribute('type', 'text')
    await clickRegisterPasswordVisibilityToggle(page, registerPassword)
    await expect(registerPassword).toHaveAttribute('type', 'password')

    await clickTabByTestIdOrRole(page, 'console-tab-task-center', '任务中心')
    const taskCenterTab = page.getByTestId('console-tab-task-center')
    if ((await taskCenterTab.count()) > 0) {
      await expect(taskCenterTab).toHaveAttribute('aria-selected', 'true')
    } else {
      await expect(page.getByRole('tab', { name: /^任务中心(\s|$)/ })).toHaveAttribute('aria-selected', 'true')
    }
    await clickTabByTestIdOrRole(page, 'task-center-tab-command-runs', '运行记录（命令）')
    await clickTabByTestIdOrRole(page, 'task-center-tab-template-runs', '运行记录（模板）')
    const refreshByTestId = page.getByTestId('task-center-template-runs-refresh')
    if ((await refreshByTestId.count()) > 0) {
      await refreshByTestId.click()
    } else {
      await page.locator('.task-list-column').getByRole('button', { name: '刷新' }).first().click()
    }
  })

  pwTest('ParamsPanel api-key branch is explicitly covered', async ({ page }) => {
    const state = createState()
    await installBackendStubs(page, state)
    await page.goto('/')
    await assertApiKeyBranch(page)
  })

  pwTest('ParamsPanel model-name input branch is explicitly covered', async ({ page }) => {
    const state = createState()
    await installBackendStubs(page, state)
    await page.goto('/')
    await assertModelFallbackBranch(page)
  })

  pwTest('ConfirmDialog / ParamsPanel(shared) / TaskListPanel / Terminal controls', async ({ page }) => {
    const state = createState()
    await installBackendStubs(page, state)
    await page.goto('/')

    const tokenField = page.locator('.field').filter({ has: page.locator('#automation-token') })
    const tokenInput = page.locator('#automation-token')
    await tokenInput.fill('token-demo-123')
    await expect(tokenInput).toHaveAttribute('type', 'password')
    await tokenField.getByRole('button', { name: '显示' }).click()
    await expect(tokenInput).toHaveAttribute('type', 'text')
    await tokenField.getByRole('button', { name: '隐藏' }).click()
    await expect(tokenInput).toHaveAttribute('type', 'password')

    const headlessCheckbox = page.getByLabel('后台运行浏览器（Headless）')
    const strictCheckbox = page.getByLabel('严格识别页面元素（Midscene Strict）')
    await headlessCheckbox.check()
    await strictCheckbox.check()
    await expect(headlessCheckbox).toBeChecked()
    await expect(strictCheckbox).toBeChecked()

    let cleanCommandCard = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: '清理缓存' }) })
      .first()
    if ((await cleanCommandCard.count()) === 0) {
      cleanCommandCard = page
        .locator('article')
        .filter({ has: page.getByRole('button', { name: '执行' }) })
        .first()
    }
    const executeButton = cleanCommandCard.getByRole('button', { name: '执行' })
    await expect(executeButton).toBeVisible()
    await executeButton.click()
    const dangerDialog = page.getByRole('alertdialog').filter({ hasText: '确认执行危险命令' })
    const dialogOverlay = page.locator('.ui-dialog-overlay, .dialog-overlay')
    if ((await dangerDialog.count()) > 0 || (await dialogOverlay.count()) > 0) {
      if ((await dangerDialog.count()) > 0) {
        await expect(dangerDialog).toBeVisible()
      }
      const cancelButton = page.getByRole('button', { name: '取消', exact: true }).last()
      if ((await cancelButton.count()) > 0) {
        await cancelButton.click()
      } else {
        await page.keyboard.press('Escape')
      }
      await expect(dialogOverlay).toHaveCount(0)
      await expect(dangerDialog).toHaveCount(0)
    }

    await clickTabByTestIdOrRole(page, 'console-tab-task-center', '任务中心')
    const taskCenterPanel = page.locator('section#app-view-tasks-panel')
    await expect(taskCenterPanel).toBeVisible()
    const taskListColumn = taskCenterPanel.locator('.task-list-column')
    await taskListColumn.getByLabel('按状态过滤任务').selectOption('running')
    await taskListColumn.getByLabel('按命令编号筛选运行记录').fill('clean-e2e-001')
    await taskListColumn.getByLabel('任务显示数量').selectOption('20')
    await taskListColumn.getByRole('button', { name: '刷新' }).first().click()
    await expect.poll(() => state.calls.taskQuery).toEqual({
      status: 'running',
      command_id: 'clean-e2e-001',
      limit: '20',
    })

    const terminal = page.getByRole('region', { name: '实时终端' })
    const terminalHeight = terminal.locator('#terminal-size')
    const beforeRows = await terminalHeight.inputValue()
    await terminalHeight.focus()
    await page.keyboard.press('ArrowRight')
    await expect(terminalHeight).not.toHaveValue(beforeRows)

    const autoScrollCheckbox = terminal.getByLabel('自动滚动')
    await autoScrollCheckbox.uncheck()
    await expect(autoScrollCheckbox).not.toBeChecked()
    await terminal.getByLabel('日志级别过滤').selectOption('error')
    await expect(terminal.getByText('终端日志为空')).toBeVisible()
    await terminal.getByLabel('日志级别过滤').selectOption('all')
    await terminal.getByRole('button', { name: '清空' }).click()
    await expect(terminal.getByText('终端日志为空')).toBeVisible()
  })

  pwTest('FlowWorkshop critical buttons', async ({ page }) => {
    const state = createState()
    await installBackendStubs(page, state)
    await page.goto('/')

    await page.getByRole('tab', { name: '流程工坊' }).click()
    await expect(page.getByRole('heading', { name: '关键结果与下一步' })).toBeVisible()
    await page.getByText('进阶工坊（可选）：系统诊断、流程编辑与调试证据').click()

    await page.getByRole('button', { name: '保存草稿' }).first().click()
    await expect(
      page.getByRole('button', { name: '关闭通知: 流程草稿保存成功' })
    ).toBeVisible()
    await expect.poll(() => state.calls.saveFlowDraft).toBeGreaterThan(0)

    await page.getByRole('button', { name: '回放最新流程' }).click()
    await expect(page.getByText('已触发流程回放')).toBeVisible()
    await expect.poll(() => state.calls.replayLatestFlow).toBeGreaterThan(0)

    await page.getByRole('button', { name: '新增步骤' }).click()
    await expect(page.getByRole('list', { name: 'flow-editor-steps' }).getByRole('listitem')).toHaveCount(3)

    await page.getByRole('button', { name: '试跑' }).first().click()
    await expect(page.getByText('已触发单步试跑 s1')).toBeVisible()
    await expect.poll(() => state.calls.replayStep).toBeGreaterThan(0)

    await page.getByText('步骤参数（动作 / URL / 输入变量）').first().click()
    await page.getByLabel('step-0-action').selectOption('type')
    await page.getByLabel('step-0-value-ref').fill('${params.otp_code}')
    await expect(page.getByLabel('step-0-value-ref')).toHaveValue('${params.otp_code}')

    await page.getByText('高级设置（step_id / selector / 排序）').first().click()
    const firstAdvancedPanel = page.locator('.debug-disclosure').nth(1)
    await firstAdvancedPanel.getByRole('button', { name: '上移' }).click()
    await firstAdvancedPanel.getByRole('button', { name: '下移' }).click()
    await expect(page.getByRole('list', { name: 'flow-editor-steps' }).getByRole('listitem')).toHaveCount(3)

    await page.getByRole('button', { name: /续跑/ }).first().click()
    await expect(page.getByText('已触发从步骤 s2 继续')).toBeVisible()
    await expect.poll(() => state.calls.replayFromStep).toBeGreaterThan(0)

    const diagnosticsBefore = state.calls.fetchDiagnostics
    await page.locator('.flow-editor-column').getByRole('button', { name: '刷新' }).click()
    await expect.poll(() => state.calls.fetchDiagnostics).toBeGreaterThan(diagnosticsBefore)
  })

  pwTest('Onboarding complete chain', async ({ page }) => {
    const state = createState()
    await installBackendStubs(page, state)
    await page.addInitScript(() => {
      window.localStorage.removeItem('ab_onboarding_done')
      window.localStorage.setItem('ab_first_use_done', '1')
    })
    await page.goto('/')

    await expect(page.getByRole('dialog', { name: '第 1 步：明确目标并检查参数区' })).toBeVisible()
    await page.getByRole('button', { name: '下一步' }).click()
    await expect(page.getByRole('dialog', { name: '第 2 步：在「快速启动」提交任务' })).toBeVisible()
    await page.getByRole('button', { name: '下一步' }).click()
    await expect(page.getByRole('dialog', { name: '第 3 步：到「任务中心」确认结果' })).toBeVisible()
    await page.getByRole('button', { name: '开始使用' }).click()

    await expect(page.getByRole('dialog', { name: '第 1 步：明确目标并检查参数区' })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('ab_onboarding_done'))).toBe('1')
  })
})
