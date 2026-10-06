import { mkdir, writeFile } from "node:fs/promises"
import { defineConfig } from "tsup"
import { stylesheet } from "./src/styles.ts"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  clean: true,
  sourcemap: true,
  splitting: false,
  onSuccess: async () => {
    await mkdir("dist", { recursive: true })
    await writeFile("dist/style.css", stylesheet.trimStart())
  },
})
