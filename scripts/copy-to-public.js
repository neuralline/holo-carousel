// scripts/copy-to-public.js
import {existsSync, mkdirSync, copyFileSync} from 'fs'
import {resolve, dirname} from 'path'

// Get __dirname equivalent in ES module
const __filename = new URL(import.meta.url).pathname
const __dirname = dirname(__filename)

// Define paths
const sourceFile = resolve(__dirname, '../dist/umd/holo.js')
const targetDir = resolve(__dirname, '../public/js')
const targetFile = resolve(targetDir, 'holo.js')
const sourceFileMap = resolve(__dirname, '../dist/umd/holo.js.map')
const targetFileMap = resolve(targetDir, 'holo.js.map')

// Create directory if it doesn't exist
if (!existsSync(targetDir)) {
  console.log(`Creating directory: ${targetDir}`)
  mkdirSync(targetDir, {recursive: true})
}

// Copy file
try {
  copyFileSync(sourceFile, targetFile)
  copyFileSync(sourceFileMap, targetFileMap)
  console.log(`Successfully copied UMD build to public/js/holo.js`)
} catch (err) {
  console.error(`Error copying file: ${err.message}`)
  process.exit(1)
}
