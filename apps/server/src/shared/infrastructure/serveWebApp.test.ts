import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, request } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { unwrap } from '../../features/room/domain/Room.fixtures'
import { serveWebApp } from './serveWebApp'
import { createSocketKit } from './socketTestKit.fixtures'

const APP_PAGE = '<!doctype html><title>Luna Llena</title><div id="app"></div>'
const SCRIPT = 'console.log("luna")'

const parent = mkdtempSync(join(tmpdir(), 'luna-web-'))
const webRoot = join(parent, 'dist')
mkdirSync(join(webRoot, 'assets'), { recursive: true })
writeFileSync(join(webRoot, 'index.html'), APP_PAGE)
writeFileSync(join(webRoot, 'assets', 'index-abc123.js'), SCRIPT)
writeFileSync(join(webRoot, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
writeFileSync(join(parent, 'secret.txt'), 'outside the build')

const kit = createSocketKit()
let serverPort = 0

const startWith = async (options: { readonly webRoot?: string } = {}): Promise<void> => {
  serverPort = (await kit.start(options)).port
}

interface Answer {
  readonly status: number
  readonly type: string | undefined
  readonly cache: string | undefined
  readonly body: string
}

const fetchRaw = (path: string, method = 'GET', port = serverPort): Promise<Answer> =>
  new Promise((resolve, reject) => {
    const sent = request({ host: 'localhost', port, path, method }, (response) => {
      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => chunks.push(chunk))
      response.on('end', () =>
        resolve({
          status: response.statusCode ?? 0,
          type: response.headers['content-type'],
          cache: response.headers['cache-control'],
          body: Buffer.concat(chunks).toString('utf8')
        })
      )
    })
    sent.on('error', reject)
    sent.end()
  })

afterEach(async () => {
  await kit.stop()
})

afterAll(() => {
  rmSync(parent, { recursive: true, force: true })
})

describe('serving the web app', () => {
  it('gives the app page at the game address', async () => {
    await startWith({ webRoot })
    const answer = await fetchRaw('/')
    expect(answer).toMatchObject({ status: 200, type: 'text/html; charset=utf-8', cache: 'no-cache', body: APP_PAGE })
  })

  it('gives the app page for a shared room link', async () => {
    await startWith({ webRoot })
    expect(await fetchRaw('/room/ABCD')).toMatchObject({ status: 200, body: APP_PAGE })
    expect(await fetchRaw('/room/ABCD/game?from=share')).toMatchObject({ status: 200, body: APP_PAGE })
  })

  it('serves built files, caching the hashed ones for a year', async () => {
    await startWith({ webRoot })
    expect(await fetchRaw('/assets/index-abc123.js')).toMatchObject({
      status: 200,
      type: 'text/javascript; charset=utf-8',
      cache: 'public, max-age=31536000, immutable',
      body: SCRIPT
    })
    expect(await fetchRaw('/favicon.svg')).toMatchObject({ status: 200, type: 'image/svg+xml', cache: 'no-cache' })
    expect(await fetchRaw('/assets/index-abc123.js', 'HEAD')).toMatchObject({ status: 200, body: '' })
  })

  it('answers 404 for a missing file', async () => {
    await startWith({ webRoot })
    expect(await fetchRaw('/assets/gone.js')).toMatchObject({ status: 404 })
  })

  it('never serves a file outside the build folder', async () => {
    await startWith({ webRoot })
    for (const path of ['/../secret.txt', '/%2e%2e/secret.txt', '/assets/..%2f..%2fsecret.txt']) {
      const answer = await fetchRaw(path)
      expect(answer.status).toBe(404)
      expect(answer.body).not.toContain('outside the build')
    }
  })

  it('rejects writes to pages', async () => {
    await startWith({ webRoot })
    expect(await fetchRaw('/room/ABCD', 'POST')).toMatchObject({ status: 405 })
  })

  it('keeps the socket on the same address', async () => {
    await startWith({ webRoot })
    const client = await kit.newClient()
    const session = unwrap(await client.emitWithAck('room:create', { roomName: 'Los Primos', narratorName: 'Nico' }))
    expect(session.code).toHaveLength(6)
  })

  it('leaves reserved routes to their own handlers', async () => {
    const http = createServer()
    http.on('request', (incoming, response) => {
      if (incoming.url !== '/api/own') return
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end('{"ok":true}')
    })
    serveWebApp(http, webRoot, ['/api/own'])
    await new Promise<void>((listening) => http.listen(0, () => listening()))
    const port = (http.address() as AddressInfo).port
    expect(await fetchRaw('/api/own', 'POST', port)).toMatchObject({ status: 200, body: '{"ok":true}' })
    expect(await fetchRaw('/room/ABCD', 'GET', port)).toMatchObject({ status: 200, body: APP_PAGE })
    await new Promise((closed) => http.close(closed))
  })

  it('serves no pages without a build folder, and the socket still works', async () => {
    await startWith()
    expect(await fetchRaw('/')).toMatchObject({ status: 404 })
    const client = await kit.newClient()
    unwrap(await client.emitWithAck('room:create', { roomName: 'Los Primos', narratorName: 'Nico' }))
  })
})
