import { expect } from '@playwright/test'
import { bootstrapButtonBehaviorApp, buttonBehaviorCase } from './support/button-behavior-harness'

buttonBehaviorCase(
  { case_id: 'helptour-open-panel', assertion_type: 'text-visible' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page)
    await page.getByRole('button', { name: '帮助' }).click()

    await expect(page.getByRole('dialog', { name: '帮助' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '操作步骤' })).toBeVisible()
  },
)

buttonBehaviorCase(
  { case_id: 'helptour-restart-onboarding', assertion_type: 'storage-change' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page)
    await page.getByRole('button', { name: '帮助' }).click()
    await page.getByRole('button', { name: '重新走一遍首用引导' }).click()

    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('ab_onboarding_done'))).toBe(null)
    await expect(page.getByText('第 1 步：明确目标并检查参数区')).toBeVisible()
  },
)
