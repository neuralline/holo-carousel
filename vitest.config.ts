import {defineConfig} from 'vitest/config'
import * as path from 'path'
import {fileURLToPath} from 'url'
import {dirname} from 'path'

// Get the directory name from the current module URL (no __dirname in ESM)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// This file - not vite.config.ts's `test` block - is what `vitest`/`npm test`
// actually reads: Vitest prefers a standalone vitest.config.ts over the
// `test` property in vite.config.ts whenever both exist, so keeping the
// two in sync used to be a trap (vite.config.ts's fuller test config -
// aliases, coverage, setupFiles - was silently never used). Build-only
// concerns (lib entry, rollup output, etc.) stay in vite.config.ts, which
// `vite build`/`vite public` read instead; this file is the single source
// of truth for everything `vitest` needs.
export default defineConfig({
  test: {
    globals: true,
    // Holo Carousel manipulates window/document/HTMLElement directly, so
    // tests need a DOM - the previous 'node' environment would have made
    // any real test of holoStore/holo-touch/holo-essentials/app fail with
    // "document is not defined" the moment it ran.
    environment: 'jsdom',
    // There are no test files yet - fail the run for a real config/setup
    // error, not merely because nothing has been written to test yet.
    passWithNoTests: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
      'test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'
    ],
    coverage: {
      // Matches the @vitest/coverage-v8 package actually installed -
      // 'istanbul' here previously required a separate
      // @vitest/coverage-istanbul package that was never added, so
      // `npm run test:coverage` would have failed outright.
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.{test,spec}.ts']
    },
    deps: {
      inline: [/^(?!.*node_modules).*$/]
    },
    root: '.',
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
