#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
source "$ROOT_DIR/scripts/lib/python-runtime.sh"
ensure_project_python_env_exports

SKIP_ENV_CHECK=false
SKIP_GITLEAKS=false

while (($# > 0)); do
  case "$1" in
    --skip-env-check)
      SKIP_ENV_CHECK=true
      ;;
    --skip-gitleaks)
      SKIP_GITLEAKS=true
      ;;
    *)
      echo "error: unknown option '$1'"
      echo "usage: $0 [--skip-env-check] [--skip-gitleaks]"
      exit 2
      ;;
  esac
  shift
done

if [[ ! -x "$(project_python_bin)" ]]; then
  echo "warning: managed python env not found, bootstrapping with 'uv sync --extra dev'"
  uv sync --extra dev
fi

run_precommit() {
  local hook="$1"
  shift
  local config_path="configs/tooling/pre-commit-config.yaml"
  if command -v pre-commit >/dev/null 2>&1; then
    pre-commit run --config "$config_path" "$hook" "$@"
    return 0
  fi
  if command -v pnpm >/dev/null 2>&1 && pnpm exec pre-commit --version >/dev/null 2>&1; then
    pnpm exec pre-commit run --config "$config_path" "$hook" "$@"
    return 0
  fi
  echo "warning: pre-commit not found in PATH; fallback to 'uvx pre-commit'" >&2
  uvx pre-commit run --config "$config_path" "$hook" "$@"
}

if [[ "$SKIP_ENV_CHECK" == "true" ]]; then
  echo "[security 1/9] env contract gate (declared env refs only) [skipped]"
else
  echo "[security 1/9] env contract gate (declared env refs only)"
  pnpm env:check
fi

echo "[security 2/9] env source contract gate (.env.example + .gitignore)"
if [[ ! -f ".env.example" ]]; then
  echo "error: .env.example is required"
  exit 1
fi
if ! grep -Eq '^\.env(\..*)?$' .gitignore; then
  echo "error: .gitignore must ignore .env and optional .env.* files"
  exit 1
fi

echo "[security 3/9] tracked local env gate (.env/.env.local must not be tracked)"
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "error: .env is tracked by git; remove from index and keep it local-only"
  exit 1
fi
if git ls-files --error-unmatch .env.local >/dev/null 2>&1; then
  echo "error: .env.local is tracked by git; remove from index and keep it local-only"
  exit 1
fi

echo "[security 4/9] IaC consistency gate (devcontainer + compose)"
bash scripts/ci/check-iac-exists.sh

if [[ "$SKIP_GITLEAKS" == "true" ]]; then
  echo "[security 5/9] secret leak gate (pre-commit gitleaks) [skipped]"
else
  echo "[security 5/9] secret leak gate (pre-commit gitleaks)"
  run_precommit gitleaks --all-files
fi

echo "[security 6/9] python dependency audit"
mkdir -p .runtime-cache/security
REQ_FILE=".runtime-cache/security/pip-freeze.txt"
uv pip freeze --python "$(project_python_bin)" | grep -Ev '^(#|-e )|^prooftrail==' > "$REQ_FILE"

PYTHON_AUDIT_EXCEPTIONS_FILE="configs/security/python-audit-exceptions.json"
PYTHON_AUDIT_IGNORE_FILE=".runtime-cache/security/python-audit-ignore.txt"
python3 - <<'PY' "$PYTHON_AUDIT_EXCEPTIONS_FILE" > "$PYTHON_AUDIT_IGNORE_FILE"
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

path = Path(sys.argv[1])
if not path.exists():
    sys.exit(0)

payload = json.loads(path.read_text(encoding="utf-8"))
if payload.get("version") != 1:
    raise SystemExit("python audit exceptions file must declare version=1")

now = datetime.now(timezone.utc)
for index, item in enumerate(payload.get("exceptions", [])):
    vuln_id = item.get("id")
    expires_on = item.get("expiresOn")
    package = item.get("package")
    reason = item.get("reason")
    ticket = item.get("ticket")
    if not vuln_id or not expires_on or not package or not reason or not ticket:
      raise SystemExit(f"python audit exception[{index}] missing required fields")
    expiry = datetime.fromisoformat(f"{expires_on}T23:59:59+00:00")
    if expiry < now:
      raise SystemExit(f"python audit exception expired: {vuln_id}")
    print(vuln_id)
PY

PIP_AUDIT_IGNORE_ARGS=()
while IFS= read -r vuln_id; do
  if [[ -n "$vuln_id" ]]; then
    PIP_AUDIT_IGNORE_ARGS+=(--ignore-vuln "$vuln_id")
  fi
done < "$PYTHON_AUDIT_IGNORE_FILE"

# Audit the fully pinned freeze list directly to avoid pip-audit temp venv bootstrap
# failures in some local Python builds while keeping strict vulnerability gating.
uvx --from pip-audit pip-audit --strict --no-deps --disable-pip "${PIP_AUDIT_IGNORE_ARGS[@]}" -r "$REQ_FILE"

echo "[security 7/9] backend sast (bandit)"
uvx --from bandit bandit -ll -r apps/api/app

echo "[security 8/9] frontend dependency audit"
(cd apps/web && pnpm audit --prod --audit-level=moderate)

echo "[security 9/9] automation dependency audit"
(cd apps/automation-runner && pnpm audit --prod --audit-level=moderate)

echo "security scan passed"
