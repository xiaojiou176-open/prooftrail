#!/usr/bin/env node

import fs from "node:fs"

const failures = []

const requiredFiles = [
  "assets/storefront/prooftrail-hero.png",
  "assets/storefront/prooftrail-hero.svg",
  "assets/storefront/prooftrail-social-preview.svg",
  "assets/storefront/prooftrail-social-preview.png",
  "docs/assets/README.md",
]

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    failures.push(`missing storefront asset file: ${file}`)
  }
}

const readme = fs.existsSync("README.md") ? fs.readFileSync("README.md", "utf8") : ""
if (!readme.includes("assets/storefront/prooftrail-hero.png")) {
  failures.push("README.md missing storefront hero reference")
}

const readmeHeroMatches = [...readme.matchAll(/!\[[^\]]*\]\((assets\/storefront\/[^)]+)\)/g)]
if (readmeHeroMatches.length !== 1) {
  failures.push(`README.md must reference exactly one storefront hero asset (found ${readmeHeroMatches.length})`)
}

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) continue
  const content = fs.readFileSync(file, "utf8")
  if (content.includes("AutoBrowser")) {
    failures.push(`${file} still contains legacy storefront name AutoBrowser`)
  }
}

if (failures.length > 0) {
  console.error("[storefront-assets] failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("[storefront-assets] ok")
