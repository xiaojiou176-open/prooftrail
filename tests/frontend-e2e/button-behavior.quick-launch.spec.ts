import { expect } from '@playwright/test'
import { CONSOLE_TAB_QUICK_LAUNCH_TEST_ID, CONSOLE_TAB_TASK_CENTER_TEST_ID } from '../../apps/web/src/constants/testIds'
import { bootstrapButtonBehaviorApp, buttonBehaviorCase } from './support/button-behavior-harness'

buttonBehaviorCase(
  { case_id: 'nav-quick-launch-selected', assertion_type: 'aria-selected' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page)
    const quickLaunchTab = page.getByTestId(CONSOLE_TAB_QUICK_LAUNCH_TEST_ID)
    const taskCenterTab = page.getByTestId(CONSOLE_TAB_TASK_CENTER_TEST_ID)

    await taskCenterTab.click()
    await quickLaunchTab.click()

    await expect(quickLaunchTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#quick-launch-params-panel')).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'quicklaunch-first-use-start-stage', assertion_type: 'text-visible' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page, {
      localStorage: {
        onboardingDone: true,
        firstUseDone: false,
      },
      tasks: [],
      runs: [],
    })

    await page.getByRole('button', { name: '开始第 1 步' }).click()
    await expect(page.getByText(/第 1 步：在右侧参数面板配置 baseUrl\/startUrl\/successSelector/)).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'quicklaunch-enter-run-stage', assertion_type: 'text-visible' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page, {
      localStorage: {
        onboardingDone: true,
        firstUseDone: false,
        firstUseStage: 'configure',
        firstUseProgress: {
          configValid: true,
          runTriggered: false,
          resultSeen: false,
        },
      },
      tasks: [],
      runs: [],
    })

    await page.getByRole('button', { name: '我已配置，进入运行' }).click()
    await expect(page.getByText(/第 2 步：选择一个命令或模板并点击运行。/)).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'quicklaunch-first-use-locate-config', assertion_type: 'text-visible' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page, {
      localStorage: {
        onboardingDone: true,
        firstUseDone: false,
      },
      tasks: [],
      runs: [],
    })

    await page.getByTestId('quick-launch-first-use-locate-config').click()
    await expect(
      page.getByText(/第 1 步：在右侧参数面板配置 baseUrl\/startUrl\/successSelector/)
    ).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'quicklaunch-sidebar-toggle-panel', assertion_type: 'visibility-toggle' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page)
    const collapseButton = page.getByRole('button', { name: '收起参数面板' })
    const paramsPanel = page.locator('#quick-launch-params-panel')

    await collapseButton.click()
    await expect(paramsPanel).toBeHidden()
    await expect(page.getByRole('button', { name: '展开参数面板' })).toBeVisible()
  },
)
