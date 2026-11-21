import { clear, spill } from "../src/index.ts"
import type { Mode, Origin } from "../src/index.ts"

const HOLD_MS = { cover: 450, veil: 1100 } as const

const stage = document.querySelector<HTMLButtonElement>("#stage")!
const overlay = document.querySelector<HTMLElement>("#overlay")!
const reduced = document.querySelector<HTMLInputElement>("#reduced")!
const motionNote = document.querySelector<HTMLElement>("#motion-note")!
const status = document.querySelector<HTMLElement>("#status")!
const system = window.matchMedia("(prefers-reduced-motion: reduce)")

// Until the switch is touched the demo follows the OS setting, live.
let overridden = false

const syncMotion = () => {
  if (!overridden) reduced.checked = system.matches
  motionNote.textContent = overridden
    ? reduced.checked
      ? "Previewing the fade"
      : "Previewing the spill"
    : "Follows your system"
}

system.addEventListener("change", syncMotion)
reduced.addEventListener("change", () => {
  overridden = true
  syncMotion()
  status.textContent = reduced.checked
    ? "Reduced motion preview on."
    : "Reduced motion preview off."
})
syncMotion()

const checked = (name: string) =>
  document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)!
    .value

const colour = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--swatch-${checked("colour")}`)
    .trim()

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

// Each click starts a new run; a later click supersedes an earlier one.
let run = 0

const play = async (mode: Mode, from: Origin) => {
  const id = ++run
  const options = {
    from,
    colour: colour(),
    reducedMotion: overridden ? reduced.checked : undefined,
  }
  await spill(overlay, { ...options, mode })
  if (mode === "reveal" || id !== run) return
  await wait(HOLD_MS[mode])
  if (id !== run) return
  await spill(overlay, { ...options, mode: "reveal" })
}

stage.addEventListener("click", (event) => {
  // A keyboard activation reports no pointer position: spill from the centre.
  const from =
    event.detail === 0
      ? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      : { x: event.clientX, y: event.clientY }
  void play(checked("mode") as Mode, from)
})

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return
  run++
  clear(overlay)
})

window.addEventListener("pageshow", (event) => {
  if (event.persisted) clear(overlay)
})
