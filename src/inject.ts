import { STYLE_ID, stylesheet } from "./styles.js"
import { ensureFilter } from "./filter.js"

const buildStyle = () => {
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = stylesheet
  return style
}

export const ensureInjected = (injectStyle = true) => {
  if (injectStyle && !document.getElementById(STYLE_ID))
    (document.head ?? document.documentElement).append(buildStyle())
  ensureFilter()
}
