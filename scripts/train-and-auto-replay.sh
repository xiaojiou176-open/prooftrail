#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
source "$ROOT_DIR/scripts/lib/load-env.sh"
source "$ROOT_DIR/scripts/lib/python-runtime.sh"
load_env_files "$ROOT_DIR"
ensure_project_python_env_exports

if ! command -v pnpm >/dev/null 2>&1; then
  echo "error: pnpm not found"
  exit 1
fi

if [[ ! -x "$(project_python_bin)" ]]; then
  echo "error: missing managed python runtime; run 'just setup' first"
  exit 1
fi

read -r -p "初始化 URL（示例: https://target.site/register）: " START_URL
if [[ -z "${START_URL:-}" ]]; then
  echo "error: START_URL required"
  exit 1
fi

read -r -p "成功页面选择器（可留空）: " SUCCESS_SELECTOR

echo
echo "[Phase 1] 手工示教录制开始。"
echo "请在打开的浏览器里完整走完: 填邮箱/密码 -> 邮箱验证 -> 跳转完成。"
(
  cd apps/automation-runner
  UIQ_BASE_URL="${UIQ_BASE_URL:-http://127.0.0.1:17380}" \
  START_URL="$START_URL" \
  SUCCESS_SELECTOR="$SUCCESS_SELECTOR" \
  HEADLESS=false \
  pnpm record:manual
)

echo
echo "[Phase 2] 输入下一次自动注册使用的账号信息。"
read -r -p "新邮箱: " FLOW_INPUT
if [[ -z "${FLOW_INPUT:-}" ]]; then
  echo "error: email required"
  exit 1
fi
read -r -s -p "新密码: " FLOW_SECRET_INPUT
echo
if [[ -z "${FLOW_SECRET_INPUT:-}" ]]; then
  echo "error: password required"
  exit 1
fi

echo
echo "OTP 将自动通过 Gmail 读取（IMAP）。请确保已配置："
echo "  GMAIL_IMAP_USER / GMAIL_IMAP_PASSWORD"
echo "可选过滤：FLOW_OTP_SENDER_FILTER / FLOW_OTP_SUBJECT_FILTER"
echo
echo "[Phase 3] AI 自动复跑开始。"
(
  cd apps/automation-runner
  START_URL="$START_URL" \
  FLOW_INPUT="$FLOW_INPUT" \
  FLOW_SECRET_INPUT="$FLOW_SECRET_INPUT" \
  FLOW_OTP_PROVIDER="${FLOW_OTP_PROVIDER:-gmail}" \
  FLOW_OTP_TIMEOUT_SECONDS="${FLOW_OTP_TIMEOUT_SECONDS:-180}" \
  FLOW_OTP_POLL_INTERVAL_SECONDS="${FLOW_OTP_POLL_INTERVAL_SECONDS:-5}" \
  HEADLESS="${HEADLESS:-false}" \
  pnpm replay-flow
)

echo
echo "done"
echo "artifacts: .runtime-cache/automation/<latest-session>/"
