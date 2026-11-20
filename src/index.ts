import { ensureInjected } from "./inject.js"
import { spillWithPreparation } from "./spill.js"
import type { SpillOptions } from "./spill.js"

export { clear, setTimeScale } from "./spill.js"
export { defsMarkup } from "./defs.js"
export type { Mode, Origin, SpillOptions } from "./spill.js"

export const spill = (el: HTMLElement, options: SpillOptions) =>
  spillWithPreparation(el, options, ensureInjected)
