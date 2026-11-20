import { readFileSync } from "node:fs"
import { setTimeout } from "node:timers"
import { URL } from "node:url"
import { JSDOM } from "jsdom"

const dist = new URL("../dist/", import.meta.url)

// Every file reachable from an entry, following relative imports into shared chunks.
const reachable = (entry, seen = new Set()) => {
  if (seen.has(entry)) return seen
  seen.add(entry)
  const source = readFileSync(new URL(entry, dist), "utf8")
  for (const [, file] of source.matchAll(/from\s*["']\.\/([^"']+)["']/g))
    reachable(file, seen)
  return seen
}

// This is a bundle-level property: inject: false at runtime cannot remove
// stylesheet source that was already shipped to the browser.
for (const file of reachable("core.js")) {
  const source = readFileSync(new URL(file, dist), "utf8")
  if (source.includes(".inkblot-cover") || source.includes("@keyframes"))
    throw new Error(`The /core bundle reaches the stylesheet via ${file}`)
}

// Both entries must share one spill module, so clear() from either cancels
// a transition started by the other.
const { window } = new JSDOM("<!doctype html><body></body>")
Object.assign(globalThis, { window, document: window.document })
const core = await import(new URL("core.js", dist).href)
const index = await import(new URL("index.js", dist).href)
const el = window.document.createElement("div")
window.document.body.append(el)
const settled = await Promise.race([
  core.spill(el, { mode: "cover", duration: 60_000 }).then(() => true),
  new Promise((resolve) => {
    index.clear(el)
    setTimeout(() => resolve(false), 50)
  }),
])
window.close()
if (!settled)
  throw new Error("index and core entries do not share transition state")
