import { adminError, done, err, type AdminError, type Result } from '@luna/contracts'
import { requireAdmin, type AdminAccess } from './adminAccess'
import type { RoomDirectory } from './ports'

export class CloseRoomAsAdmin {
  constructor(
    private readonly access: AdminAccess,
    private readonly directory: RoomDirectory
  ) {}

  async execute(sessionId: string | undefined, input: { readonly code?: unknown }): Promise<Result<void, AdminError>> {
    const allowed = requireAdmin(this.access, sessionId)
    if (!allowed.ok) return allowed
    const closed = typeof input.code === 'string' && (await this.directory.close(input.code))
    return closed ? done : err(adminError('room-not-found'))
  }
}
