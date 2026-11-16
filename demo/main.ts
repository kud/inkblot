import { clear, spill } from "../src/index.ts"
import type { Mode, Origin } from "../src/index.ts"
import { prefersReducedMotion, previewReducedMotion } from "./motion.ts"
import { keepBareHostOutOfSearch } from "./robots.ts"

keepBareHostOutOfSearch(document, location.hostname)

const overlay = document.querySelector<HTMLElement>("#overlay")!
const colour = document.querySelector<HTMLInputElement>("#colour")!
const reduced = document.querySelector<HTMLInputElement>("#reduced")!
const status = document.querySelector<HTMLElement>("#status")!

const setPreview = previewReducedMotion(window)
reduced.checked = prefersReducedMotion(window)

const HOLD_MS = 600

let run = 0

const say = (message: string) => {
  status.textContent = message
}

const mode = (): Mode => {
  const picked = document.querySelector<HTMLInputElement>(
    'input[name="mode"]:checked',
  )
  const value = picked?.value
  return value === "reveal" || value === "veil" ? value : "cover"
}

const pause = () => new Promise((resolve) => setTimeout(resolve, HOLD_MS))

const play = async (from: Origin, picked: Mode) => {
  const id = ++run
  const options = { from, colour: colour.value }
  const still = () => id === run

  say(`${picked}…`)
  await spill(overlay, { ...options, mode: picked })
  if (!still()) return

  if (picked === "cover") {
    await pause()
    if (!still()) return
    await spill(overlay, { ...options, mode: "reveal" })
  } else if (picked === "veil") {
    await pause()
    if (!still()) return
    clear(overlay)
  }
  if (still()) say(`${picked} done. Tap again.`)
}

const isControl = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest("button, input, label, select, a, .controls") !== null

document.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLElement>(
    "button[data-action]",
  )
  if (button?.dataset.action === "clear") {
    run++
    clear(overlay)
    say("Cleared.")
    return
  }
  if (isControl(event.target)) return
  void play({ x: event.clientX, y: event.clientY }, mode())
})

document.querySelectorAll<HTMLButtonElement>("[data-swatch]").forEach((s) => {
  s.style.background = s.dataset.swatch!
  s.addEventListener("click", () => {
    colour.value = s.dataset.swatch!
  })
})

reduced.addEventListener("change", () => {
  setPreview(reduced.checked)
  say(reduced.checked ? "Reduced motion: plain fade." : "Full ink.")
})

window.addEventListener("pageshow", (event) => {
  if (event.persisted) clear(overlay)
})
