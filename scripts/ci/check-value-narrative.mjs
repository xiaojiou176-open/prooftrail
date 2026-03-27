#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const failures = []

checkReadme()
checkShowcase()
checkHumanHandoff()

if (failures.length > 0) {
  console.error("[value-narrative] failed:")
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log("[value-narrative] ok")

function checkReadme() {
  const relativePath = "README.md"
  const content = read(relativePath)
  requireIncludes(relativePath, content, "## What This Repo Actually Does")
  requireIncludes(relativePath, content, "How do we make browser automation reproducible, inspectable, and recoverable")
  requireIncludes(relativePath, content, "just run")
  requireIncludes(relativePath, content, "pnpm uiq run --profile pr --target web.local")
  requireIncludes(relativePath, content, "## Validation and Governance")

  const valueIndex = content.indexOf("## What This Repo Actually Does")
  const governanceIndex = content.indexOf("## Validation and Governance")
  if (valueIndex === -1 || governanceIndex === -1 || valueIndex > governanceIndex) {
    failures.push("README.md must explain the real problem/value before the governance section")
  }
}

function checkShowcase() {
  const relativePath = "docs/showcase/minimal-success-case.md"
  const content = read(relativePath)
  requireIncludes(relativePath, content, "What is the smallest real thing this repository can do end-to-end?")
  requireIncludes(relativePath, content, "just run")
  requireIncludes(relativePath, content, "pnpm uiq run --profile pr --target web.local")
  requireIncludes(relativePath, content, "This is not a decorative example.")
}

function checkHumanHandoff() {
  const relativePath = "docs/getting-started/human-first-10-min.md"
  const content = read(relativePath)
  requireIncludes(relativePath, content, "just run")
  requireIncludes(relativePath, content, "canonical public mainline wrapper")
  requireIncludes(relativePath, content, "helper path, not the public default mainline")
}

function requireIncludes(relativePath, content, needle) {
  if (!content.includes(needle)) {
    failures.push(`${relativePath} missing ${JSON.stringify(needle)}`)
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8")
}
