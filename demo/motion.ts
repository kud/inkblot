const REDUCE = "(prefers-reduced-motion: reduce)"

type MatchMedia = (query: string) => MediaQueryList

const forced = (query: string): MediaQueryList =>
  ({
    matches: true,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

export const prefersReducedMotion = (win: Window) =>
  typeof win.matchMedia === "function" && win.matchMedia(REDUCE).matches

export const previewReducedMotion = (win: Window) => {
  const original: MatchMedia = win.matchMedia.bind(win)
  let on = false

  win.matchMedia = (query: string) =>
    on && query.replace(/\s+/g, "") === REDUCE.replace(/\s+/g, "")
      ? forced(query)
      : original(query)

  return (enabled: boolean) => {
    on = enabled
  }
}
