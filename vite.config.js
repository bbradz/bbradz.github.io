import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/bbradz.github.io/",
  assetsInclude: ["**/*.heic", "**/*.HEIC", "**/*.JPG"], // Add this line to handle special file types
});
