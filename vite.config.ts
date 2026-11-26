import {defineConfig} from 'vite'
import * as path from 'path'
import {fileURLToPath} from 'url'
import {dirname} from 'path'
import {copyFileSync, existsSync, mkdirSync} from 'fs'

// Get the directory name from the current module URL (no __dirname in ESM)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectName = 'holo'

// Copies the built UMD bundle into public/js so public/index.html's demo
// (which loads it via a plain <script src="js/holo.js">, not through
// Vite's module graph) always reflects the latest build. Runs after every
// build, including each rebuild during `vite build --watch` - a plain
// `node scripts/copy-to-public.js && ...` chain (still used by the plain
// `npm run build` script) can't reach into watch mode the same way.
const copyUmdToPublic = () => ({
  name: 'copy-umd-to-public',
  closeBundle() {
    const sourceDir = path.resolve(__dirname, 'dist/umd')
    const targetDir = path.resolve(__dirname, 'public/js')
    const sourceFile = path.resolve(sourceDir, `${projectName}.js`)

    if (!existsSync(sourceFile)) return
    if (!existsSync(targetDir)) mkdirSync(targetDir, {recursive: true})

    copyFileSync(sourceFile, path.resolve(targetDir, `${projectName}.js`))

    const sourceMap = `${sourceFile}.map`
    if (existsSync(sourceMap)) {
      copyFileSync(sourceMap, path.resolve(targetDir, `${projectName}.js.map`))
    }
  }
})

// Builds - Cyre is never bundled into Holo (a peer dependency: the app or
// the page installs both from npm and they share one Cyre):
//   vite build                    -> es + cjs. `cyre` stays an import.
//   vite build --mode umd         -> umd (public/js/holo.js) for <script>
//                                    pages: reads the global `Cyre`.
//   vite build --mode cyre-global -> public/js/cyre.js, the demo pages' own
//                                    copy of Cyre as `window.Cyre` (from the
//                                    dev dependency; not part of the package).
// `npm run build` runs all three, then tsc writes dist/types. Test
// configuration lives in vitest.config.ts.
export default defineConfig(({mode}) => {
  const umd = mode === 'umd'
  if (mode === 'cyre-global') {
    return {
      define: {'process.env.NODE_ENV': JSON.stringify('production')},
      publicDir: false,
      build: {
        outDir: 'public/js',
        emptyOutDir: false,
        lib: {entry: path.resolve(__dirname, 'scripts/cyre-global.ts'), name: 'CyreGlobal', formats: ['iife'], fileName: () => 'cyre.js'},
        sourcemap: true,
        minify: 'terser',
        target: 'es2020'
      }
    }
  }

  return {
    plugins: umd ? [copyUmdToPublic()] : [],
    // the library only: public/ (demo pages, images) is never copied into dist
    publicDir: false,
    define: {
      __HOLO_STANDALONE__: JSON.stringify(umd)
    },
    build: {
      outDir: 'dist',
      lib: {
        // es / cjs: three entries sharing chunks - the full build, lite
        // (no stage effects) and the effects on their own. umd: the full
        // build in one file.
        entry: umd
          ? path.resolve(__dirname, 'src/index.ts')
          : {
              index: path.resolve(__dirname, 'src/index.ts'),
              lite: path.resolve(__dirname, 'src/lite.ts'),
              effects: path.resolve(__dirname, 'src/effects.ts')
            },
        name: projectName,
        formats: umd ? ['umd'] : ['es', 'cjs'],
        fileName: (format, entryName) => {
          switch (format) {
            case 'es':
              return `es/${entryName}.js`
            case 'cjs':
              return `cjs/${entryName}.cjs` // Use .cjs extension for CommonJS
            case 'umd':
              return `umd/${projectName}.js`
            default:
              return `${format}/${entryName}.js`
          }
        }
      },
      rollupOptions: {
        // cyre and its subpaths (cyre/metrics) are the app's / the page's
        external: [/^cyre(\/.*)?$/],
        output: umd
          ? {
              exports: 'named',
              extend: true,
              name: projectName,
              // the page's Cyre (window.Cyre - e.g. public/js/cyre.js)
              globals: {cyre: 'Cyre', 'cyre/metrics': 'Cyre'}
            }
          : // shared chunks next to their entries (es/, cjs/), so the
            // package's `files` (dist/es, dist/cjs) carries them
            (['es', 'cjs'] as const).map(format => ({
              format,
              exports: 'named' as const,
              chunkFileNames: `${format}/[name]-[hash].${format === 'es' ? 'js' : 'cjs'}`
            }))
      },
      sourcemap: true,
      minify: 'terser',
      target: 'es2020',
      // the umd build runs second and must keep the es/cjs output
      emptyOutDir: !umd
    }
  }
})
