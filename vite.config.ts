import { defineConfig } from "vitest/config"

export default defineConfig({
  server: { open: "/demo/" },
  test: { environment: "jsdom" },
})
