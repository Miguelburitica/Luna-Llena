import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { isTableRoute, tableRoutes } from '@/features/table/infrastructure/tableRoutes'
import { connectOnlineRoutes } from './connectOnlineRoutes'

class FakeConnection {
  connected = false
  readonly calls: string[] = []

  connect() {
    this.connected = true
    this.calls.push('connect')
  }

  disconnect() {
    this.connected = false
    this.calls.push('disconnect')
  }
}

const stub = { render: () => null }

const routerWith = (connection: FakeConnection) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: stub }, { path: '/host', name: 'host', component: stub }, ...tableRoutes.map(({ path, name }) => ({ path, name, component: stub }))]
  })
  connectOnlineRoutes(router, connection, isTableRoute)
  return router
}

describe('connectOnlineRoutes', () => {
  it('Nothing leaves the device: an in-person game never opens the connection', async () => {
    const connection = new FakeConnection()
    const router = routerWith(connection)
    for (const path of ['/table/setup', '/table/deal', '/table', '/table/stage', '/table/over']) await router.push(path)

    expect(connection.calls.filter((call) => call === 'connect')).toEqual([])
    expect(connection.connected).toBe(false)
  })

  it('closes the connection when the narrator moves from home to the table, and opens it again for online play', async () => {
    const connection = new FakeConnection()
    const router = routerWith(connection)
    await router.push('/')
    await router.push('/table/setup')
    expect(connection.connected).toBe(false)
    await router.push('/host')
    expect(connection.calls).toEqual(['connect', 'disconnect', 'connect'])
  })
})
