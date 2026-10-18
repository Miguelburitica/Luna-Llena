import { forgetStored, readStored, writeStored, type StorageArea } from '@/shared/infrastructure/storage/deviceStorage'
import type { SessionStore, StoredSession } from '../application/ports'

const KEY = 'luna-llena.session'
const AREAS: readonly StorageArea[] = ['tab', 'device']

const isStoredSession = (value: unknown): value is StoredSession =>
  typeof value === 'object' &&
  value !== null &&
  ['code', 'memberId', 'token'].every((field) => typeof (value as Record<string, unknown>)[field] === 'string')

export class LocalSessionStore implements SessionStore {
  load(): StoredSession | null {
    for (const area of AREAS) {
      const session = readStored(KEY, isStoredSession, area)
      if (session !== null) return session
    }
    return null
  }

  save(session: StoredSession): void {
    for (const area of AREAS) writeStored(KEY, session, area)
  }

  clear(): void {
    for (const area of AREAS) forgetStored(KEY, area)
  }
}
