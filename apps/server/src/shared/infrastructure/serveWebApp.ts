import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
}

const LONG_CACHE = 'public, max-age=31536000, immutable'

const isFile = async (path: string): Promise<boolean> => {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

const decodedPathOf = (url: string | undefined): string | null => {
  try {
    return decodeURIComponent((url ?? '/').split('?')[0] ?? '/')
  } catch {
    return null
  }
}

const sendFile = (request: IncomingMessage, response: ServerResponse, file: string, cache: string): void => {
  response.statusCode = 200
  response.setHeader('Content-Type', CONTENT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream')
  response.setHeader('Cache-Control', cache)
  if (request.method === 'HEAD') {
    response.end()
    return
  }
  createReadStream(file)
    .on('error', () => response.destroy())
    .pipe(response)
}

const sendStatus = (response: ServerResponse, status: number): void => {
  response.statusCode = status
  response.setHeader('Content-Type', 'text/plain; charset=utf-8')
  response.end(status === 404 ? 'Not found' : 'Method not allowed')
}

export const serveWebApp = (http: Server, webRoot: string | undefined, reservedPaths: readonly string[] = []): void => {
  const root = webRoot === undefined ? null : resolve(webRoot)
  http.on('request', (request: IncomingMessage, response: ServerResponse) => {
    const rawPath = (request.url ?? '/').split('?')[0] ?? '/'
    if (rawPath.startsWith('/socket.io/') || reservedPaths.includes(rawPath)) return
    if (root === null) {
      sendStatus(response, 404)
      return
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendStatus(response, 405)
      return
    }
    const path = decodedPathOf(request.url)
    const file = path === null ? null : resolve(root, `.${path}`)
    if (file === null || path === null || (file !== root && !file.startsWith(root + sep))) {
      sendStatus(response, 404)
      return
    }
    void (async () => {
      if (await isFile(file)) {
        sendFile(request, response, file, path.startsWith('/assets/') ? LONG_CACHE : 'no-cache')
        return
      }
      const appPage = join(root, 'index.html')
      if (extname(path) === '' && (await isFile(appPage))) {
        sendFile(request, response, appPage, 'no-cache')
        return
      }
      sendStatus(response, 404)
    })()
  })
}
