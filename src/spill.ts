import { ensureInjected } from "./inject.js"

export type Mode = "cover" | "reveal" | "veil"

export type Origin = { x: number; y: number } | Element

export type SpillOptions = {
  mode: Mode
  from?: Origin
  colour?: string
  duration?: number
  inject?: boolean
}

type Plan = { className: string; duration: number }

const OVERSIZE = 60
const SAFETY_MARGIN_MS = 400

const MODE_CLASSES = [
  "inkblot-cover",
  "inkblot-reveal",
  "inkblot-veil",
  "inkblot-fade-in",
  "inkblot-fade-out",
  "inkblot-veil-fade",
]

const INKED: Record<Mode, Plan> = {
  cover: { className: "inkblot-cover", duration: 500 },
  reveal: { className: "inkblot-reveal", duration: 600 },
  veil: { className: "inkblot-veil", duration: 500 },
}

const FADED: Record<Mode, Plan> = {
  cover: { className: "inkblot-fade-in", duration: 280 },
  reveal: { className: "inkblot-fade-out", duration: 400 },
  veil: { className: "inkblot-veil-fade", duration: 280 },
}

const inBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined"

const pending = new WeakMap<HTMLElement, () => void>()

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

const planFor = (mode: Mode, duration?: number): Plan => {
  const plan = prefersReducedMotion() ? FADED[mode] : INKED[mode]
  return { ...plan, duration: duration ?? plan.duration }
}

const resolvePoint = (from: Origin) => {
  if (!(from instanceof Element)) return from
  const box = from.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

const placeOrigin = (el: HTMLElement, from: Origin) => {
  const { x, y } = resolvePoint(from)
  el.style.setProperty("--inkblot-x", `${x + OVERSIZE}px`)
  el.style.setProperty("--inkblot-y", `${y + OVERSIZE}px`)
}

const reset = (el: HTMLElement) => {
  el.classList.remove(...MODE_CLASSES)
  el.style.removeProperty("--inkblot-x")
  el.style.removeProperty("--inkblot-y")
  el.style.removeProperty("--inkblot-duration")
}

const isOwnAnimation = (el: HTMLElement, event: Event) =>
  event.target === el &&
  String((event as AnimationEvent).animationName).startsWith("inkblot-")

export const clear = (el: HTMLElement) => {
  if (!inBrowser()) return
  pending.get(el)?.()
  reset(el)
}

export const spill = (el: HTMLElement, options: SpillOptions) => {
  if (!inBrowser()) return Promise.resolve()
  ensureInjected(options.inject ?? true)
  clear(el)
  const { className, duration } = planFor(options.mode, options.duration)

  el.classList.add("inkblot")
  if (options.colour) el.style.setProperty("--inkblot-colour", options.colour)
  if (options.from) placeOrigin(el, options.from)
  el.style.setProperty("--inkblot-duration", `${duration}ms`)
  void el.offsetWidth

  return new Promise<void>((resolve) => {
    const release = () => {
      el.removeEventListener("animationend", onEnd)
      window.clearTimeout(timer)
      pending.delete(el)
      resolve()
    }
    const finish = () => {
      release()
      if (options.mode === "reveal") reset(el)
    }
    const onEnd = (event: Event) => {
      if (isOwnAnimation(el, event)) finish()
    }
    const timer = window.setTimeout(finish, duration + SAFETY_MARGIN_MS)

    pending.set(el, release)
    el.addEventListener("animationend", onEnd)
    el.classList.add(className)
  })
}
