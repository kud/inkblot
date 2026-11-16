import { readFileSync } from "node:fs"
import { URL } from "node:url"

// This is a bundle-level property: inject: false at runtime cannot remove
// stylesheet source that was already shipped to the browser.
const core = readFileSync(new URL("../dist/core.js", import.meta.url), "utf8")
if (core.includes(".inkblot-cover") || core.includes("inkblot-style")) {
  throw new Error("The /core bundle includes the injected stylesheet")
}
