import { MODERATION_LIMITS, type ClientKey } from '@luna/contracts'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import { keyId, keysOf } from './clientKeys'

const HOUR = 3_600_000

const thresholdOf = (key: ClientKey): number =>
  key.kind === 'device' ? MODERATION_LIMITS.deviceStrikesToBan : MODERATION_LIMITS.addressStrikesToBan

export class StrikeLedger {
  private readonly strikes = new Map<string, number[]>()

  strike(client: ClientIdentity, now: number): ClientKey[] {
    const windowStart = now - MODERATION_LIMITS.strikeWindowHours * HOUR
    return keysOf(client).filter((key) => {
      const id = keyId(key)
      const recent = [...(this.strikes.get(id) ?? []).filter((at) => at > windowStart), now]
      this.strikes.set(id, recent)
      return recent.length === thresholdOf(key)
    })
  }

  forgive(key: ClientKey): void {
    this.strikes.delete(keyId(key))
  }
}
