import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clear, defsMarkup, spill, setTimeScale } from "./index.js"
import { setTimeScale as setCoreTimeScale, spill as spillCore } from "./core.js"

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
    setTimeScale(1)
    stubReducedMotion(false)
    overlay = document.createElement("div")
    document.body.append(overlay)
  })

  afterEach(() => {
    setTimeScale(1)
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

    it("core entry injects only the SVG filter, not the stylesheet", () => {
      void spillCore(overlay, { mode: "cover" })

      expect(document.getElementById("inkblot-style")).toBeNull()
      expect(document.getElementById("inkblot-edge")).not.toBeNull()
      expect(overlay.classList.contains("inkblot-cover")).toBe(true)
    })

    it("core entry reuses a filter the page already declares", () => {
      document.body.innerHTML = defsMarkup
      document.body.append(overlay)

      void spillCore(overlay, { mode: "cover" })

      expect(document.querySelectorAll("#inkblot-edge")).toHaveLength(1)
      expect(document.getElementById("inkblot-style")).toBeNull()
    })

    it("reuses filter defs already in the markup", () => {
      document.body.innerHTML = defsMarkup
      document.body.append(overlay)

      void spill(overlay, { mode: "cover" })

      expect(document.querySelectorAll("#inkblot-defs")).toHaveLength(1)
      expect(document.querySelectorAll("#inkblot-edge")).toHaveLength(1)
    })

    it("reuses a filter the page declared in its own svg", () => {
      document.body.innerHTML = `<svg><filter id="inkblot-edge"></filter></svg>`

      void spill(overlay, { mode: "cover" })

      expect(document.querySelectorAll("#inkblot-edge")).toHaveLength(1)
      expect(document.querySelectorAll("#inkblot-defs")).toHaveLength(0)
    })

    it("describes the same filter in its static markup as it injects", () => {
      void spill(overlay, { mode: "cover" })

      const injected = document.getElementById("inkblot-defs")!.outerHTML
      const template = document.createElement("template")
      template.innerHTML = defsMarkup

      expect(injected).toBe(template.content.firstElementChild!.outerHTML)
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

  describe("environments", () => {
    it("skips the style tag when told to, keeping the filter", () => {
      void spill(overlay, { mode: "cover", inject: false })

      expect(document.getElementById("inkblot-style")).toBeNull()
      expect(document.getElementById("inkblot-edge")).not.toBeNull()
    })

    it("no-ops without a DOM, so a server import is safe", async () => {
      vi.stubGlobal("window", undefined)
      vi.stubGlobal("document", undefined)

      await expect(spill(overlay, { mode: "cover" })).resolves.toBeUndefined()
      expect(() => clear(overlay)).not.toThrow()
    })
  })

  describe("cover", () => {
    it("holds the cover and resolves when the animation ends", async () => {
      const done = spill(overlay, { mode: "cover", colour: "#08080f" })

      expect(overlay.classList.contains("inkblot-cover")).toBe(true)
      expect(overlay.style.getPropertyValue("--inkblot-colour")).toBe("#08080f")
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

  describe("global time scale", () => {
    it("slows normal and reduced-motion defaults by the same factor", () => {
      setTimeScale(4)
      void spill(overlay, { mode: "cover" })
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe(
        "2000ms",
      )

      stubReducedMotion(true)
      void spill(overlay, { mode: "reveal" })
      expect(overlay.classList.contains("inkblot-fade-out")).toBe(true)
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe(
        "1600ms",
      )
    })

    it("also scales explicitly configured durations", () => {
      setTimeScale(0.5)
      void spill(overlay, { mode: "veil", duration: 800 })
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe("400ms")
    })

    it("scales the animation safety timeout rather than settling early", async () => {
      setTimeScale(4)
      const done = spill(overlay, { mode: "cover" })
      vi.advanceTimersByTime(2399)
      expect(await settled(done)).toBe(false)
      vi.advanceTimersByTime(1)
      expect(await settled(done)).toBe(true)
    })

    it("rejects invalid scales without corrupting the active scale", () => {
      setTimeScale(2)
      for (const value of [0, -1, NaN, Infinity, -Infinity])
        expect(() => setTimeScale(value)).toThrow(RangeError)
      void spill(overlay, { mode: "cover" })
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe(
        "1000ms",
      )
    })

    it("scales the plan chosen by a reducedMotion override", () => {
      setTimeScale(2)
      stubReducedMotion(false)
      void spill(overlay, { mode: "cover", reducedMotion: true })
      expect(overlay.classList.contains("inkblot-fade-in")).toBe(true)
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe("560ms")

      stubReducedMotion(true)
      void spill(overlay, { mode: "reveal", reducedMotion: false })
      expect(overlay.classList.contains("inkblot-reveal")).toBe(true)
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe(
        "1200ms",
      )
    })

    it("shares one scale between the default and core entries", () => {
      setCoreTimeScale(3)
      void spill(overlay, { mode: "cover" })
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe(
        "1500ms",
      )
      void spillCore(overlay, { mode: "cover" })
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe(
        "1500ms",
      )
    })
  })

  describe("reducedMotion option", () => {
    it("forces the fade when the OS permits motion", () => {
      stubReducedMotion(false)
      void spill(overlay, { mode: "cover", reducedMotion: true })
      expect(overlay.classList.contains("inkblot-fade-in")).toBe(true)
      expect(overlay.classList.contains("inkblot-cover")).toBe(false)
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe("280ms")
    })

    it("permits the ink edge even when the OS requests reduced motion", () => {
      stubReducedMotion(true)
      void spill(overlay, { mode: "cover", reducedMotion: false })
      expect(overlay.classList.contains("inkblot-cover")).toBe(true)
      expect(overlay.classList.contains("inkblot-fade-in")).toBe(false)
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe("500ms")
    })

    it("still honours an explicit duration when motion is forced", () => {
      stubReducedMotion(false)
      void spill(overlay, { mode: "veil", reducedMotion: true, duration: 850 })
      expect(overlay.classList.contains("inkblot-veil-fade")).toBe(true)
      expect(overlay.style.getPropertyValue("--inkblot-duration")).toBe("850ms")
    })

    it("uses the live OS preference when the option is absent", () => {
      stubReducedMotion(true)
      void spill(overlay, { mode: "reveal" })
      expect(overlay.classList.contains("inkblot-fade-out")).toBe(true)
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
