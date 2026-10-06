import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clear, spill } from "./index.js"

const stubReducedMotion = (matches: boolean) =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches })),
  )

const endAnimation = (el: HTMLElement, animationName = "inkblot-spread") =>
  el.dispatchEvent(Object.assign(new Event("animationend"), { animationName }))

const settled = async (promise: Promise<void>) => {
  const spy = vi.fn()
  void promise.then(spy)
  await Promise.resolve()
  await Promise.resolve()
  return spy.mock.calls.length === 1
}

describe("inkblot", () => {
  let overlay: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    stubReducedMotion(false)
    overlay = document.createElement("div")
    document.body.append(overlay)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.head.innerHTML = ""
    document.body.innerHTML = ""
  })

  describe("injection", () => {
    it("adds the filter and the stylesheet once, however often it spills", () => {
      void spill(overlay, { mode: "cover" })
      void spill(overlay, { mode: "cover" })
      void spill(overlay, { mode: "veil" })

      expect(document.querySelectorAll("#inkblot-defs")).toHaveLength(1)
      expect(document.querySelectorAll("#inkblot-edge")).toHaveLength(1)
      expect(document.querySelectorAll("#inkblot-style")).toHaveLength(1)
    })

    it("keeps the exact turbulence values", () => {
      void spill(overlay, { mode: "cover" })

      const filter = document.getElementById("inkblot-edge")!
      const noise = filter.querySelector("feTurbulence")!
      const displace = filter.querySelector("feDisplacementMap")!

      expect(filter.getAttribute("x")).toBe("-20%")
      expect(filter.getAttribute("width")).toBe("140%")
      expect(noise.getAttribute("baseFrequency")).toBe("0.009 0.013")
      expect(noise.getAttribute("numOctaves")).toBe("2")
      expect(noise.getAttribute("seed")).toBe("11")
      expect(displace.getAttribute("scale")).toBe("26")
    })

    it("keeps the exact timing and clip radii in the stylesheet", () => {
      void spill(overlay, { mode: "cover" })

      const css = document.getElementById("inkblot-style")!.textContent!
      expect(css).toContain("inset: -60px")
      expect(css).toContain("cubic-bezier(0.5, 0, 0.85, 1)")
      expect(css).toContain("circle(150%")
      expect(css).toContain("circle(0%")
    })
  })

  describe("cover", () => {
    it("holds the cover and resolves when the animation ends", async () => {
      const done = spill(overlay, { mode: "cover", colour: "#08080f" })

      expect(overlay.classList.contains("inkblot-cover")).toBe(true)
      expect(overlay.style.backgroundColor).toBe("rgb(8, 8, 15)")
      expect(await settled(done)).toBe(false)

      endAnimation(overlay)

      expect(await settled(done)).toBe(true)
      expect(overlay.classList.contains("inkblot-cover")).toBe(true)
    })

    it("ignores animations that are not its own", async () => {
      const done = spill(overlay, { mode: "cover" })

      endAnimation(overlay, "something-else")

      expect(await settled(done)).toBe(false)
    })

    it("resolves on the safety timeout if no animation event arrives", async () => {
      const done = spill(overlay, { mode: "cover" })

      vi.advanceTimersByTime(899)
      expect(await settled(done)).toBe(false)

      vi.advanceTimersByTime(1)
      expect(await settled(done)).toBe(true)
    })
  })

  describe("origin", () => {
    it("offsets a point by the overlay oversize", () => {
      void spill(overlay, { mode: "cover", from: { x: 100, y: 40 } })

      expect(overlay.style.getPropertyValue("--inkblot-x")).toBe("160px")
      expect(overlay.style.getPropertyValue("--inkblot-y")).toBe("100px")
    })

    it("starts from the centre of an element", () => {
      const button = document.createElement("button")
      button.getBoundingClientRect = () =>
        ({ left: 20, top: 10, width: 100, height: 40 }) as DOMRect

      void spill(overlay, { mode: "cover", from: button })

      expect(overlay.style.getPropertyValue("--inkblot-x")).toBe("130px")
      expect(overlay.style.getPropertyValue("--inkblot-y")).toBe("90px")
    })
  })

  describe("reveal", () => {
    it("plays in reverse, then resolves and leaves nothing standing", async () => {
      const done = spill(overlay, { mode: "reveal", colour: "#fdf5e1" })

      expect(overlay.classList.contains("inkblot-reveal")).toBe(true)
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe("600ms")

      endAnimation(overlay)

      expect(await settled(done)).toBe(true)
      expect(overlay.classList.contains("inkblot-reveal")).toBe(false)
    })
  })

  describe("veil", () => {
    it("stays up after it resolves, until cleared", async () => {
      const done = spill(overlay, { mode: "veil" })
      endAnimation(overlay)

      expect(await settled(done)).toBe(true)
      expect(overlay.classList.contains("inkblot-veil")).toBe(true)

      clear(overlay)

      expect(overlay.classList.contains("inkblot-veil")).toBe(false)
    })
  })

  describe("duration", () => {
    it("overrides the default", () => {
      void spill(overlay, { mode: "cover", duration: 800 })

      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe("800ms")
    })
  })

  describe("reduced motion", () => {
    beforeEach(() => stubReducedMotion(true))

    it("fades the cover in without the spreading edge", async () => {
      const done = spill(overlay, { mode: "cover", from: { x: 1, y: 1 } })

      expect(overlay.classList.contains("inkblot-fade-in")).toBe(true)
      expect(overlay.classList.contains("inkblot-cover")).toBe(false)
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe("280ms")

      endAnimation(overlay, "inkblot-darken")

      expect(await settled(done)).toBe(true)
    })

    it("fades the reveal out and clears it", async () => {
      const done = spill(overlay, { mode: "reveal" })

      expect(overlay.classList.contains("inkblot-fade-out")).toBe(true)
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe("400ms")

      endAnimation(overlay, "inkblot-clear")

      expect(await settled(done)).toBe(true)
      expect(overlay.classList.contains("inkblot-fade-out")).toBe(false)
    })

    it("fades the veil in", () => {
      void spill(overlay, { mode: "veil" })

      expect(overlay.classList.contains("inkblot-veil-fade")).toBe(true)
    })
  })

  describe("clear", () => {
    it("resets the overlay and settles a pending promise", async () => {
      const done = spill(overlay, { mode: "cover", from: { x: 5, y: 5 } })

      clear(overlay)

      expect(await settled(done)).toBe(true)
      expect(overlay.classList.contains("inkblot-cover")).toBe(false)
      expect(overlay.style.getPropertyValue("--inkblot-x")).toBe("")
    })

    it("does nothing to an overlay that was never used", () => {
      expect(() => clear(overlay)).not.toThrow()
    })

    it("leaves the overlay free to spill again", async () => {
      void spill(overlay, { mode: "cover" })
      clear(overlay)

      const again = spill(overlay, { mode: "cover" })
      endAnimation(overlay)

      expect(await settled(again)).toBe(true)
    })
  })

  describe("a second spill", () => {
    it("settles the first and takes over", async () => {
      const first = spill(overlay, { mode: "cover" })
      void spill(overlay, { mode: "veil" })

      expect(await settled(first)).toBe(true)
      expect(overlay.classList.contains("inkblot-cover")).toBe(false)
      expect(overlay.classList.contains("inkblot-veil")).toBe(true)
    })
  })
})
