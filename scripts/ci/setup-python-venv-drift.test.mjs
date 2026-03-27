import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const SETUP_DEPS = readFileSync(resolve(REPO_ROOT, ".github/actions/setup-deps/action.yml"), "utf8")
const SETUP_PYTHON_UV = readFileSync(resolve(REPO_ROOT, ".github/actions/setup-python-uv/action.yml"), "utf8")

test("setup-python-uv exports UV_PYTHON for the requested interpreter", () => {
  assert.match(SETUP_PYTHON_UV, /echo "UV_PYTHON=\$PY_BIN" >> "\$GITHUB_ENV"/)
})

test("setup-deps recreates a writable venv when its python version drifts from the requested version", () => {
  assert.match(SETUP_DEPS, /requested_python_version="\$\{\{ inputs\.python-version \}\}"/)
  assert.match(SETUP_DEPS, /existing_python_version=\"\$\(\.venv\/bin\/python -c 'import sys; print\("\."\.join\(map\(str, sys\.version_info\[:2\]\)\)\)'\)\"/)
  assert.match(SETUP_DEPS, /if \[\[ "\$existing_python_version" != "\$requested_python_version" \]\]; then/)
  assert.match(SETUP_DEPS, /rm -rf "\.venv"/)
})
