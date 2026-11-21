import {spawn} from 'node:child_process'

const children = []
let shuttingDown = false

function run(args) {
  const child = spawn('vite', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  children.push(child)
  child.on('exit', (code, signal) => {
    if (signal || shuttingDown) return
    shutdown(code ?? 0)
  })
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

run(['build', '--mode', 'umd', '--watch'])
run(['--config', 'vite.demo.config.ts'])
