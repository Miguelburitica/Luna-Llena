import type { BanView, ClientKey } from '@luna/contracts'

export const BAN_HOUR_CHOICES = [1, 24, 48, 168] as const

export const sameKey = (first: ClientKey, second: ClientKey): boolean =>
  first.kind === second.kind && first.value === second.value

export const soonestEndingFirst = (bans: readonly BanView[]): BanView[] => [...bans].sort((first, second) => first.until - second.until)
