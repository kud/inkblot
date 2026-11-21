import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

// The hosted demo is served at kud.io/projects/inkblot/demo through a rewrite,
// so every asset URL must carry that absolute prefix.
export default defineConfig({
  root: fileURLToPath(new URL("./demo", import.meta.url)),
  base: "/projects/inkblot/demo/",
  build: { outDir: "dist", emptyOutDir: true },
})
