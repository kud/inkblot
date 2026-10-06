import { clear, spill } from "../src/index.ts"

const overlay = document.querySelector<HTMLElement>("#overlay")!
const colour = document.querySelector<HTMLInputElement>("#colour")!
const status = document.querySelector<HTMLElement>("#status")!

const say = (message: string) => {
  status.textContent = message
}

const run = async (button: HTMLElement, mode: "cover" | "reveal" | "veil") => {
  say(`${mode}…`)
  await spill(overlay, { mode, from: button, colour: colour.value })
  say(`${mode} done.`)
}

const coverThenReveal = async (button: HTMLElement) => {
  await run(button, "cover")
  await new Promise((resolve) => setTimeout(resolve, 600))
  await run(button, "reveal")
}

document.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLElement>(
    "button[data-action]",
  )
  if (!button) return
  const action = button.dataset.action
  if (action === "clear") {
    clear(overlay)
    say("Cleared.")
  } else if (action === "both") void coverThenReveal(button)
  else if (action === "cover" || action === "reveal" || action === "veil")
    void run(button, action)
})

window.addEventListener("pageshow", (event) => {
  if (event.persisted) clear(overlay)
})
