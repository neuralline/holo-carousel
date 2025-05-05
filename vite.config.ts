/** @format */

import {defineConfig} from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/app.js',
      name: 'Holo',
      fileName: format => `holo.${format}.js`,
      formats: ['es', 'umd', 'cjs']
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['cyre'],
      output: {
        globals: {
          cyre: 'Cyre'
        }
      }
    }
  },
  server: {
    open: true
  }
})
