import {
  adminError,
  CLIENT_KEY_KINDS,
  done,
  err,
  MODERATION_LIMITS,
  type AdminError,
  type ClientKey,
  type Result
} from '@luna/contracts'
import { requireAdmin, type AdminAccess } from './adminAccess'
import type { ModerationRecords } from './ports'

const HOUR = 3_600_000

export const clientKeyOf = (input: { readonly kind?: unknown; readonly value?: unknown }): ClientKey | null => {
  const kind = CLIENT_KEY_KINDS.find((candidate) => candidate === input.kind)
  const value = typeof input.value === 'string' ? input.value.trim() : ''
  return kind === undefined || value.length === 0 || value.length > 128 ? null : { kind, value }
}

export class BanClient {
  constructor(
    private readonly access: AdminAccess,
    private readonly records: ModerationRecords
  ) {}

  execute(
    sessionId: string | undefined,
    input: { readonly kind?: unknown; readonly value?: unknown; readonly hours?: unknown }
  ): Result<void, AdminError> {
    const allowed = requireAdmin(this.access, sessionId)
    if (!allowed.ok) return allowed
    const key = clientKeyOf(input)
    const hours = input.hours
    const validHours =
      typeof hours === 'number' && Number.isInteger(hours) && hours >= 1 && hours <= MODERATION_LIMITS.maxOperatorBanHours
    if (key === null || !validHours) return err(adminError('ban-invalid'))
    this.records.bans.ban(key, this.access.clock.now() + hours * HOUR, 'operator')
    return done
  }
}
