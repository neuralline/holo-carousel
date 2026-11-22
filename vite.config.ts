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

// Two builds:
//   vite build              -> es + cjs. `cyre` stays an import, so the app
//                              and Holo share one Cyre (the app owns it).
//   vite build --mode umd   -> umd (public/js/holo.js). A plain <script>
//                              page has no Cyre, so this bundle carries its
//                              own and starts it (__HOLO_STANDALONE__).
// `npm run build` runs both. Test configuration lives in vitest.config.ts.
export default defineConfig(({mode}) => {
  const umd = mode === 'umd'

  return {
    plugins: umd ? [copyUmdToPublic()] : [],
    define: {
      __HOLO_STANDALONE__: JSON.stringify(umd),
      // Cyre's schema fast-path checks NODE_ENV; browsers have no `process`
      ...(umd ? {'process.env.NODE_ENV': JSON.stringify('production')} : {})
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
        // cyre and its subpaths (cyre/metrics) are shared with the app,
        // except in the standalone umd bundle
        external: umd ? [] : [/^cyre(\/.*)?$/],
        output: {
          exports: 'named',
          extend: true,
          name: projectName
        }
      },
      sourcemap: true,
      minify: 'terser',
      target: 'es2020',
      // the umd build runs second and must keep the es/cjs output
      emptyOutDir: !umd
    }
  }
})
