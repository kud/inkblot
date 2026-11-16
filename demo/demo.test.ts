import { afterEach, describe, expect, it, vi } from "vitest"
import { prefersReducedMotion, previewReducedMotion } from "./motion.js"
import { isBareHost, keepBareHostOutOfSearch } from "./robots.js"

describe("demo", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.head.innerHTML = ""
  })

  describe("reduced-motion preview", () => {
    const stubSystem = (matches: boolean) =>
      vi.stubGlobal(
        "matchMedia",
        vi.fn((media: string) => ({ matches, media })),
      )

    it("leaves the system preference alone until the toggle is on", () => {
      stubSystem(false)
      previewReducedMotion(window)

      expect(prefersReducedMotion(window)).toBe(false)
    })

    it("reports reduced motion while the toggle is on, and stops when it is off", () => {
      stubSystem(false)
      const setPreview = previewReducedMotion(window)

      setPreview(true)
      expect(prefersReducedMotion(window)).toBe(true)

      setPreview(false)
      expect(prefersReducedMotion(window)).toBe(false)
    })

    it("only forces the reduced-motion query", () => {
      stubSystem(false)
      const setPreview = previewReducedMotion(window)
      setPreview(true)

      const dark = window.matchMedia("(prefers-color-scheme: dark)")
      expect(dark.matches).toBe(false)
    })

    it("keeps a system reduced-motion setting when the toggle is off", () => {
      stubSystem(true)
      previewReducedMotion(window)

      expect(prefersReducedMotion(window)).toBe(true)
    })
  })

  describe("bare host", () => {
    it("recognises the vercel.app host and nothing else", () => {
      expect(isBareHost("inkblot-demo.vercel.app")).toBe(true)
      expect(isBareHost("kud.io")).toBe(false)
      expect(isBareHost("localhost")).toBe(false)
    })

    it("adds noindex on the vercel.app host only", () => {
      keepBareHostOutOfSearch(document, "kud.io")
      expect(document.querySelector('meta[name="robots"]')).toBeNull()

      keepBareHostOutOfSearch(document, "inkblot-demo.vercel.app")
      keepBareHostOutOfSearch(document, "inkblot-demo.vercel.app")
      const metas = document.querySelectorAll('meta[name="robots"]')
      expect(metas).toHaveLength(1)
      expect(metas[0]!.getAttribute("content")).toBe("noindex")
    })
  })
})
