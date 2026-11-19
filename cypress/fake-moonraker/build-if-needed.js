// Runs `vite build` when dist/ is missing or older than the sources, so `npm run test`
// never tests a stale build. CI builds first, so there this is a quick no-op.

import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const BUILD_OUTPUT = 'dist/index.html'
const SOURCES = ['src', 'public', 'index.html', 'package.json', 'vite.config.ts']

const newestMtime = (path) => {
    const stats = statSync(path)
    if (!stats.isDirectory()) return stats.mtimeMs

    return readdirSync(path, { recursive: true })
        .map((entry) => statSync(join(path, entry)).mtimeMs)
        .reduce((newest, mtime) => Math.max(newest, mtime), stats.mtimeMs)
}

const isStale = () => {
    if (!existsSync(BUILD_OUTPUT)) return true

    const builtAt = statSync(BUILD_OUTPUT).mtimeMs
    return SOURCES.filter((path) => existsSync(path)).some((path) => newestMtime(path) > builtAt)
}

if (isStale()) {
    console.log('[fake-moonraker] dist/ is missing or older than the sources; building')
    execFileSync('npx', ['vite', 'build'], { stdio: 'inherit' })
} else {
    console.log('[fake-moonraker] dist/ is up to date; skipping the build')
}
