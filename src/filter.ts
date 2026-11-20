import { DEFS_ID, SVG_NS, defsTree, type DefsNode } from "./defs.js"
import { FILTER_ID } from "./ids.js"

const createSvgNode = ({ tag, attributes, children }: DefsNode): Element => {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attributes))
    node.setAttribute(name, value)
  for (const child of children) node.append(createSvgNode(child))
  return node
}

// Reuse a filter the page already declares, whether pasted from defsMarkup
// or written into its own SVG, so the id is never duplicated.
export const ensureFilter = () => {
  if (!document.getElementById(DEFS_ID) && !document.getElementById(FILTER_ID))
    (document.body ?? document.documentElement).append(createSvgNode(defsTree))
}
