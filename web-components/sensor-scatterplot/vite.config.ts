import { resolve } from "node:path";
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: resolve(__dirname, "./dist"),
    rollupOptions: {
      input: {
        "sensor-scatterplot": resolve(__dirname, "./src/main.ts")
      },
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      }
    }
  }
})
