import type { BanSource, BanView, ClientKey } from '@luna/contracts'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import { keyId, keyOfId, keysOf } from './clientKeys'

interface Ban {
  readonly until: number
  readonly source: BanSource
}

export class BanList {
  private readonly bans = new Map<string, Ban>()

  ban(key: ClientKey, until: number, source: BanSource): void {
    this.bans.set(keyId(key), { until, source })
  }

  lift(key: ClientKey): boolean {
    return this.bans.delete(keyId(key))
  }

  bannedUntil(client: ClientIdentity, now: number): number | null {
    const ends = keysOf(client)
      .map((key) => this.bans.get(keyId(key)))
      .flatMap((ban) => (ban !== undefined && ban.until > now ? [ban.until] : []))
    return ends.length === 0 ? null : Math.max(...ends)
  }

  active(now: number): BanView[] {
    return [...this.bans]
      .filter(([, ban]) => ban.until > now)
      .map(([id, ban]) => ({ key: keyOfId(id), until: ban.until, source: ban.source }))
  }
}
