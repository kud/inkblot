import { defineConfig } from "vite"

export default defineConfig({
  root: "demo",
  base: "/projects/inkblot/demo/",
  build: { outDir: "../dist-demo", emptyOutDir: true },
})
