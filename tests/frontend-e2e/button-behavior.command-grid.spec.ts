import { expect } from '@playwright/test'
import { bootstrapButtonBehaviorApp, buttonBehaviorCase } from './support/button-behavior-harness'

buttonBehaviorCase(
  { case_id: 'commandgrid-filter-pipeline', assertion_type: 'text-visible' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page)
    await page.getByRole('tab', { name: /流水线/ }).click()

    await expect(page.getByRole('heading', { name: '运行流水线任务' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '初始化环境' })).toHaveCount(0)
  },
)

buttonBehaviorCase(
  { case_id: 'commandgrid-filter-frontend', assertion_type: 'text-visible' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page, {
      commands: [
        {
          command_id: 'frontend-lint',
          title: '前端检查',
          description: '验证前端分类筛选',
          tags: ['frontend'],
        },
        {
          command_id: 'clean-cache',
          title: '清理缓存',
          description: '验证维护分类筛选',
          tags: ['maintenance'],
        },
      ],
    })
    await page.getByTestId('command-category-frontend').click()

    await expect(page.getByRole('heading', { name: '前端检查' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '清理缓存' })).toHaveCount(0)
  },
)

buttonBehaviorCase(
  { case_id: 'commandgrid-filter-maintenance', assertion_type: 'text-visible' },
  async ({ page }) => {
    await bootstrapButtonBehaviorApp(page, {
      commands: [
        {
          command_id: 'frontend-lint',
          title: '前端检查',
          description: '验证前端分类筛选',
          tags: ['frontend'],
        },
        {
          command_id: 'clean-cache',
          title: '清理缓存',
          description: '验证维护分类筛选',
          tags: ['maintenance'],
        },
      ],
    })
    await page.getByTestId('command-category-maintenance').click()

    await expect(page.getByRole('heading', { name: '清理缓存' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '前端检查' })).toHaveCount(0)
  },
)

buttonBehaviorCase(
  { case_id: 'commandgrid-run-command-success', assertion_type: 'toast-visible' },
  async ({ page }) => {
    const harness = await bootstrapButtonBehaviorApp(page)
    const commandCard = page
      .locator('.command-grid')
      .locator(':scope > *')
      .filter({ hasText: '运行流水线任务' })
      .first()

    await expect(commandCard).toBeVisible()
    await commandCard.getByRole('button', { name: '执行' }).click()

    await expect.poll(() => harness.calls.runCommand).toBe(1)
    await expect(page.getByText('已提交 运行流水线任务')).toBeVisible()
  },
)
