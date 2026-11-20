import { DEFS_ID, SVG_NS, defsTree, type DefsNode } from "./defs.js"
import { FILTER_ID, STYLE_ID, stylesheet } from "./styles.js"

const createSvgNode = ({ tag, attributes, children }: DefsNode): Element => {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attributes))
    node.setAttribute(name, value)
  for (const child of children) node.append(createSvgNode(child))
  return node
}

const buildDefs = () => createSvgNode(defsTree)

const buildStyle = () => {
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = stylesheet
  return style
}

export const ensureInjected = (injectStyle = true) => {
  if (injectStyle && !document.getElementById(STYLE_ID))
    (document.head ?? document.documentElement).append(buildStyle())
  if (!document.getElementById(DEFS_ID) && !document.getElementById(FILTER_ID))
    (document.body ?? document.documentElement).append(buildDefs())
}
