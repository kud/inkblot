import { FILTER_ID, STYLE_ID, stylesheet } from "./styles.js"

const DEFS_ID = "inkblot-defs"
const SVG_NS = "http://www.w3.org/2000/svg"

const createSvgNode = (tag: string, attributes: Record<string, string>) => {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attributes))
    node.setAttribute(name, value)
  return node
}

const buildDefs = () => {
  const svg = createSvgNode("svg", {
    id: DEFS_ID,
    "aria-hidden": "true",
    width: "0",
    height: "0",
  })
  const filter = createSvgNode("filter", {
    id: FILTER_ID,
    x: "-20%",
    y: "-20%",
    width: "140%",
    height: "140%",
    "color-interpolation-filters": "sRGB",
  })
  filter.append(
    createSvgNode("feTurbulence", {
      type: "fractalNoise",
      baseFrequency: "0.009 0.013",
      numOctaves: "2",
      seed: "11",
      result: "noise",
    }),
    createSvgNode("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "noise",
      scale: "26",
      xChannelSelector: "R",
      yChannelSelector: "G",
    }),
  )
  svg.append(filter)
  svg.style.position = "absolute"
  return svg
}

const buildStyle = () => {
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = stylesheet
  return style
}

export const ensureInjected = (injectStyle = true) => {
  if (injectStyle && !document.getElementById(STYLE_ID))
    (document.head ?? document.documentElement).append(buildStyle())
  if (!document.getElementById(DEFS_ID))
    (document.body ?? document.documentElement).append(buildDefs())
}
