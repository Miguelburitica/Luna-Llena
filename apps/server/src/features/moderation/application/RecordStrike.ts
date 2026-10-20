import { MODERATION_LIMITS, type StrikeReason } from '@luna/contracts'
import type { Clock } from '../../../shared/application/Clock'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import type { ModerationRecords } from './ports'

const HOUR = 3_600_000

export interface StrikeInput {
  readonly client: ClientIdentity
  readonly reason: StrikeReason
  readonly roomCode: string | null
  readonly excerpt: string | null
}

export class RecordStrike {
  constructor(
    private readonly records: ModerationRecords,
    private readonly clock: Clock
  ) {}

  execute({ client, reason, roomCode, excerpt }: StrikeInput): void {
    const now = this.clock.now()
    this.records.noteStrike({
      device: client.device,
      address: client.address,
      reason,
      roomCode,
      excerpt: excerpt === null ? null : excerpt.slice(0, MODERATION_LIMITS.excerptLength),
      at: now
    })
    for (const key of this.records.ledger.strike(client, now)) {
      this.records.bans.ban(key, now + MODERATION_LIMITS.banHours * HOUR, 'strikes')
    }
  }
}
