import type { App } from 'vue'
import type { LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import { ADMIN_GATEWAY } from '../application/ports'
import { HttpSocketAdminGateway } from './HttpSocketAdminGateway'

export const installAdmin = (app: App, socket: LunaSocket): void => {
  app.provide(ADMIN_GATEWAY, new HttpSocketAdminGateway(socket))
}
