<div align="center">

🖋️

# Inkblot

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![npm](https://img.shields.io/npm/v/@kud/inkblot?style=flat-square&color=CB3837)
![MIT](https://img.shields.io/badge/licence-MIT-22C55E?style=flat-square)

**A hand-inked page transition: a turbulence-edged circle of colour that spills from a click, in pure CSS and SVG**

<a href="https://kud.io/projects/inkblot">Website</a> · <a href="https://kud.io/projects/inkblot/docs">Documentation</a>

</div>

## Features

- **Organic edge** — a circle of colour spreads from the point you click, its rim wobbled by `feTurbulence` and `feDisplacementMap`, so it reads as ink rather than a geometric wipe.
- **Pure CSS and SVG** — no canvas, no animation library, zero runtime dependencies. ESM, tiny.
- **Framework-agnostic** — one function and an empty element. It works the same in a React app, a Vite site or plain HTML.
- **Three modes** — `cover` to leave a page, `reveal` to arrive on one, `veil` to hold a quiet wash while something loads.
- **Promise-based** — `spill()` resolves when the ink has landed, so navigating is just the next line.
- **Respects reduced motion** — under `prefers-reduced-motion` it becomes a plain fade, with no spreading edge.

## Install

```sh
npm install @kud/inkblot
```

## Usage

Give the page one empty element to act as the overlay. Inkblot does the rest.

```html
<div id="overlay" aria-hidden="true"></div>
```

Cover the page from a click, then navigate under it:

```ts
import { spill } from "@kud/inkblot"

const overlay = document.querySelector<HTMLElement>("#overlay")!

document.addEventListener("click", async (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]")
  if (!link) return

  event.preventDefault()
  await spill(overlay, { mode: "cover", from: link, colour: "#2b1d14" })
  window.location.href = link.href
})
```

Arrive on the new page and lift the ink. Call this before first paint if the page should start covered:

```ts
import { clear, spill } from "@kud/inkblot"

const overlay = document.querySelector<HTMLElement>("#overlay")!

await spill(overlay, { mode: "reveal", colour: "#2b1d14" })

window.addEventListener("pageshow", (event) => {
  if (event.persisted) clear(overlay)
})
```

### API

```ts
spill(el: HTMLElement, options: SpillOptions): Promise<void>
clear(el: HTMLElement): void
```

```ts
type Mode = "cover" | "reveal" | "veil"
type Origin = { x: number; y: number } | Element

type SpillOptions = {
  mode: Mode
  from?: Origin
  colour?: string
  duration?: number
}
```

| Option     | Description                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `mode`     | `cover`, `reveal` or `veil`, described below.                                                                                |
| `from`     | Where the ink starts: a viewport `{ x, y }` point, or an element (its centre is used). Defaults to the centre of the screen. |
| `colour`   | Any CSS colour, applied as the overlay's background.                                                                         |
| `duration` | Milliseconds. Overrides the mode's default.                                                                                  |

| Mode     | Default                 | Behaviour                                                                              |
| -------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `cover`  | 500 ms                  | Spreads until the screen is covered, then stays covered, so you can navigate under it. |
| `reveal` | 600 ms                  | Plays in reverse, for arriving on a new page. Clears itself when done.                 |
| `veil`   | 500 ms, at 0.88 opacity | Washes the page and holds until you call `clear()`.                                    |

`spill()` resolves when the overlay is fully covered (`cover`), fully uncovered (`reveal`) or veiled (`veil`). Spilling again on the same element settles the first promise and takes over.

`clear(el)` resets the overlay and settles any pending promise. Use it on bfcache restores via `pageshow`, and to lift a veil.

**Reduced motion.** With `prefers-reduced-motion: reduce`, every mode becomes a plain fade: 280 ms in, 400 ms out, 280 ms for the veil. No spreading edge.

**The overlay.** It is an empty element your page provides. Inkblot fixes it to the viewport, oversized by 60 px on every side (`inset: -60px`) so the displacement never bares a screen edge, and adjusts the origin for that offset for you. Its `z-index` is overridable with `--inkblot-z`.

### Why the CSS ships from JS

A bundler-specific stylesheet import (CSS modules, `?inline`, side-effect CSS imports) is not portable between a Next.js app and a plain Vite or no-bundler site. A `<style>` tag injected from the module works identically in both, with no config.

On first `spill()`, the SVG filter and the stylesheet are injected once, idempotently. The cost: a strict CSP needs `style-src` to allow inline styles (or a nonce). The stylesheet is about 2 KB.

### Out of scope

Colour tokens, themes, typography, routing, sounds, deciding when ink is appropriate, and framework adapters. Inkblot spills the ink; the rest is yours.

## Development

```sh
git clone https://github.com/kud/inkblot.git
cd inkblot
npm install
npm test
```

Run the demo with `npm run demo` (or `npx vite`). It opens `/demo/`.

📚 **Full documentation → [inkblot/docs](https://kud.io/projects/inkblot/docs)**
