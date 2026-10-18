import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const scannedRoots = ['apps', 'packages']
const skippedDirectories = new Set(['node_modules', 'dist', 'coverage'])
const cssComment = /\/\*[\s\S]*?\*\//
const styleBlock = /<style[^>]*>([\s\S]*?)<\/style>/g

const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (skippedDirectories.has(entry.name)) return []
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })

const stylesOf = (path, content) => {
  if (path.endsWith('.css')) return [content]
  if (path.endsWith('.vue')) return [...content.matchAll(styleBlock)].map((match) => match[1] ?? '')
  return []
}

const offenders = scannedRoots
  .flatMap((directory) => walk(join(root, directory)))
  .filter((path) => stylesOf(path, readFileSync(path, 'utf8')).some((css) => cssComment.test(css)))

if (offenders.length > 0) {
  console.error('Comments are not allowed in styles:')
  for (const path of offenders) console.error(`  ${relative(root, path)}`)
  process.exit(1)
}
