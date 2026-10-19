import type { RouteLocationNormalized, Router } from 'vue-router'

interface Connection {
  readonly connected: boolean
  connect(): unknown
  disconnect(): unknown
}

export const connectOnlineRoutes = (
  router: Router,
  connection: Connection,
  isOffline: (route: RouteLocationNormalized) => boolean
): void => {
  router.beforeEach((to) => {
    if (isOffline(to)) connection.disconnect()
    else if (!connection.connected) connection.connect()
  })
}
