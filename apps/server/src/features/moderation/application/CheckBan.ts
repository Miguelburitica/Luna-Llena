import type { Clock } from '../../../shared/application/Clock'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import type { ModerationRecords } from './ports'

export class CheckBan {
  constructor(
    private readonly records: ModerationRecords,
    private readonly clock: Clock
  ) {}

  execute(client: ClientIdentity): number | null {
    return this.records.bans.bannedUntil(client, this.clock.now())
  }
}
