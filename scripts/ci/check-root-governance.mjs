#!/usr/bin/env node

import { fileExists, loadGovernanceControlPlane, listRootEntries, matchesSimpleGlob } from "./lib/governance-control-plane.mjs"

const failures = []
const argv = new Set(process.argv.slice(2))
const jsonMode = argv.has("--json")

const { rootAllowlist } = loadGovernanceControlPlane()

const allowedTracked = new Set(rootAllowlist.allowedTrackedRoots)
const allowedLocal = new Set([
  ...rootAllowlist.allowedLocalRuntimeRoots,
  ...rootAllowlist.allowedLocalToolingRoots,
])
const rootEntries = listRootEntries()

for (const entry of rootEntries) {
  if (allowedTracked.has(entry) || allowedLocal.has(entry)) continue
  failures.push(`unexpected top-level entry: ${entry}`)
}

for (const forbidden of rootAllowlist.forbiddenRootNames) {
  if (rootEntries.includes(forbidden)) {
    failures.push(`forbidden root entry present: ${forbidden}`)
  }
}

for (const pattern of rootAllowlist.forbiddenRootGlobs) {
  const matches = rootEntries.filter((entry) => matchesSimpleGlob(entry, pattern))
  for (const match of matches) {
    failures.push(`forbidden root glob matched: ${pattern} -> ${match}`)
  }
}

for (const requiredDoc of rootAllowlist.requiredDocs) {
  if (!fileExists(requiredDoc)) {
    failures.push(`required governance doc missing: ${requiredDoc}`)
  }
}

const result = {
  mode: rootAllowlist.mode,
  scannedRoots: rootEntries.length,
  failures,
}

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2))
}

if (failures.length > 0) {
  if (!jsonMode) {
    console.error("[root-governance] failed:")
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
  }
  process.exit(1)
}

if (!jsonMode) {
  console.log(`[root-governance] ok (${rootEntries.length} top-level entries)`)
}
