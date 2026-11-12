import { FILTER_ID } from "./styles.js"

export const DEFS_ID = "inkblot-defs"
export const SVG_NS = "http://www.w3.org/2000/svg"

export type DefsNode = {
  tag: string
  attributes: Record<string, string>
  children: DefsNode[]
}

const node = (
  tag: string,
  attributes: Record<string, string>,
  children: DefsNode[] = [],
): DefsNode => ({ tag, attributes, children })

export const defsTree: DefsNode = node(
  "svg",
  {
    id: DEFS_ID,
    "aria-hidden": "true",
    width: "0",
    height: "0",
    style: "position:absolute",
  },
  [
    node(
      "filter",
      {
        id: FILTER_ID,
        x: "-20%",
        y: "-20%",
        width: "140%",
        height: "140%",
        "color-interpolation-filters": "sRGB",
      },
      [
        node("feTurbulence", {
          type: "fractalNoise",
          baseFrequency: "0.009 0.013",
          numOctaves: "2",
          seed: "11",
          result: "noise",
        }),
        node("feDisplacementMap", {
          in: "SourceGraphic",
          in2: "noise",
          scale: "26",
          xChannelSelector: "R",
          yChannelSelector: "G",
        }),
      ],
    ),
  ],
)

const serialise = ({ tag, attributes, children }: DefsNode): string => {
  const attrs = Object.entries(attributes)
    .map(([name, value]) => ` ${name}="${value}"`)
    .join("")
  const inner = children.map(serialise).join("")
  return inner ? `<${tag}${attrs}>${inner}</${tag}>` : `<${tag}${attrs}/>`
}

export const defsMarkup = serialise(defsTree)
