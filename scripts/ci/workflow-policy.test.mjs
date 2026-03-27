import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const PR_WORKFLOW = readFileSync(resolve(REPO_ROOT, ".github/workflows/pr.yml"), "utf8")
const CI_WORKFLOW = readFileSync(resolve(REPO_ROOT, ".github/workflows/ci.yml"), "utf8")
const NIGHTLY_WORKFLOW = readFileSync(resolve(REPO_ROOT, ".github/workflows/nightly.yml"), "utf8")
const WEEKLY_WORKFLOW = readFileSync(resolve(REPO_ROOT, ".github/workflows/weekly.yml"), "utf8")
const RELEASE_WORKFLOW = readFileSync(
  resolve(REPO_ROOT, ".github/workflows/release-candidate.yml"),
  "utf8"
)
const PRECOMMIT_WORKFLOW = readFileSync(
  resolve(REPO_ROOT, ".github/workflows/pre-commit.yml"),
  "utf8"
)
const UPSTREAM_DRIFT_WORKFLOW = readFileSync(
  resolve(REPO_ROOT, ".github/workflows/upstream-drift-audit.yml"),
  "utf8"
)
const RUNTIME_GC_WORKFLOW = readFileSync(
  resolve(REPO_ROOT, ".github/workflows/runtime-gc-weekly.yml"),
  "utf8"
)
const DESKTOP_SMOKE_WORKFLOW = readFileSync(
  resolve(REPO_ROOT, ".github/workflows/desktop-smoke.yml"),
  "utf8"
)

function getTopLevelPermissionsBlock(content) {
  const match = content.match(/^permissions:\n([\s\S]*?)(?=^concurrency:|^jobs:|\Z)/m)
  assert.ok(match, "expected workflow to declare top-level permissions")
  return match[1]
}

function getJobSection(content, jobName) {
  const escaped = jobName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = content.match(new RegExp(`(^  ${escaped}:[\\s\\S]*?)(?=^  [A-Za-z0-9_.-]+:|\\Z)`, "m"))
  assert.ok(match, `expected workflow to contain job ${jobName}`)
  return match[1]
}

test("mainline CI no longer triggers on pull_request", () => {
  assert.doesNotMatch(CI_WORKFLOW, /^\s+pull_request:/m)
  assert.match(PR_WORKFLOW, /^  pull_request:/m)
})

test("workflow top-level permissions default to contents: read only", () => {
  for (const [name, content] of [
    ["pr", PR_WORKFLOW],
    ["ci", CI_WORKFLOW],
    ["nightly", NIGHTLY_WORKFLOW],
    ["weekly", WEEKLY_WORKFLOW],
    ["release", RELEASE_WORKFLOW],
  ]) {
    const block = getTopLevelPermissionsBlock(content)
    assert.match(block, /^\s+contents:\s+read/m, `${name} must keep contents: read at top level`)
    assert.doesNotMatch(block, /^\s+packages:\s+/m, `${name} must not declare packages at top level`)
    assert.doesNotMatch(block, /^\s+id-token:\s+/m, `${name} must not declare id-token at top level`)
  }
})

test("build image and attestation-like jobs use job-level elevated permissions", () => {
  for (const [name, content] of [
    ["pr", PR_WORKFLOW],
    ["ci", CI_WORKFLOW],
    ["nightly", NIGHTLY_WORKFLOW],
    ["weekly", WEEKLY_WORKFLOW],
    ["release", RELEASE_WORKFLOW],
  ]) {
    const section = getJobSection(content, "build_ci_image")
    assert.match(section, /permissions:\s*\n\s+contents:\s+read\n\s+packages:\s+write/m, `${name} build_ci_image must declare job-level packages: write`)
  }

  const runnerBootstrap = getJobSection(CI_WORKFLOW, "runner-bootstrap")
  assert.match(
    runnerBootstrap,
    /permissions:\s*\n\s+contents:\s+read\n\s+id-token:\s+write/m,
    "ci runner-bootstrap must hold id-token at the job level"
  )
})

test("fork PR lane is GitHub-hosted and receives a readonly governance subset", () => {
  const changesSection = getJobSection(PR_WORKFLOW, "changes")
  assert.match(changesSection, /runs-on:\s+ubuntu-24\.04/)
  assert.match(changesSection, /pr_runner_json=\["ubuntu-24\.04"\]/)
  assert.match(changesSection, /is_untrusted_fork=true/)
  assert.match(changesSection, /runner_lane=untrusted-fork/)

  const forkReadonlySection = getJobSection(PR_WORKFLOW, "fork-readonly-governance")
  assert.match(forkReadonlySection, /runs-on:\s+ubuntu-24\.04/)
  assert.match(forkReadonlySection, /bash scripts\/ci\/gate-openai-residue\.sh/)
  assert.match(forkReadonlySection, /bash scripts\/ci\/check-workflow-hygiene\.sh/)
  assert.match(forkReadonlySection, /bash scripts\/docs-gate\.sh/)
})

test("release candidate workflow routes required gates through run-in-container tasks", () => {
  assert.match(RELEASE_WORKFLOW, /docs-gate:[\s\S]*run-in-container\.sh --task release-docs-gate --gate release-docs-gate/)
  assert.match(RELEASE_WORKFLOW, /type-gate:[\s\S]*run-in-container\.sh --task release-typecheck --gate release-typecheck/)
  assert.match(RELEASE_WORKFLOW, /security-gate:[\s\S]*run-in-container\.sh --task security-scan --gate release-security-gate/)
  assert.match(
    RELEASE_WORKFLOW,
    /release-gate:[\s\S]*run-in-container\.sh --task release-candidate-gate --gate release-candidate-gate/
  )
})

test("scheduled and helper self-hosted workflows use shared self-hosted checkout contract", () => {
  for (const [name, content] of [
    ["pre-commit", PRECOMMIT_WORKFLOW],
    ["nightly", NIGHTLY_WORKFLOW],
    ["weekly", WEEKLY_WORKFLOW],
    ["upstream-drift", UPSTREAM_DRIFT_WORKFLOW],
    ["runtime-gc", RUNTIME_GC_WORKFLOW],
    ["desktop-smoke", DESKTOP_SMOKE_WORKFLOW],
    ["release", RELEASE_WORKFLOW],
  ]) {
    assert.match(
      content,
      /uses: \.\/\.github\/actions\/self-hosted-checkout/,
      `${name} should consume shared self-hosted checkout contract`
    )
  }
})
