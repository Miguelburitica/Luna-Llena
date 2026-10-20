import { ok, type AdminError, type ModerationOverview, type Result } from '@luna/contracts'
import { requireAdmin, type AdminAccess } from './adminAccess'
import type { ModerationRecords, RoomDirectory } from './ports'

export class ModerationOverviewQuery {
  constructor(
    private readonly access: AdminAccess,
    private readonly records: ModerationRecords,
    private readonly directory: RoomDirectory
  ) {}

  async execute(sessionId: string | undefined): Promise<Result<ModerationOverview, AdminError>> {
    const allowed = requireAdmin(this.access, sessionId)
    if (!allowed.ok) return allowed
    return ok({
      bans: this.records.bans.active(this.access.clock.now()),
      strikes: this.records.strikes(),
      reports: this.records.reports(),
      rooms: await this.directory.rooms()
    })
  }
}
