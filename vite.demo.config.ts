import {defineConfig} from 'vite'

// Serves the static demo in public/. `pnpm dev` pairs this with
// `vite build --mode umd --watch`, which rebuilds public/js/holo.js
// (Cyre is already inside that UMD — no separate Cyre copy).
export default defineConfig({
  root: 'public',
  server: {
    port: 5173,
    open: true
  }
})
