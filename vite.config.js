import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset paths relative so the built site works when it is
// served from a subfolder (for example a GitHub Pages project URL).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, open: true }
})
