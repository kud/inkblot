import { ensureFilter } from "./filter.js"
import { spillWithPreparation } from "./spill.js"
import type { SpillOptions } from "./spill.js"

export { clear } from "./spill.js"
export { defsMarkup } from "./defs.js"
export type { Mode, Origin } from "./spill.js"

/** CSS-file consumers must import @kud/inkblot/style.css separately. */
export type CoreSpillOptions = Omit<SpillOptions, "inject">

export const spill = (el: HTMLElement, options: CoreSpillOptions) =>
  spillWithPreparation(el, options, ensureFilter)
