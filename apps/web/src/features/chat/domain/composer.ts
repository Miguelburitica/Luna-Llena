import { CHAT_LIMITS, type ChatAccess, type ChatChannel, type Phase } from '@luna/contracts'
import { isDead } from './channels'

export const charactersLeft = (draft: string): number | null =>
  draft.length < CHAT_LIMITS.countdownFrom ? null : Math.max(0, CHAT_LIMITS.maxMessageLength - draft.length)

export type ComposerState = 'write' | 'night-closed' | 'paused' | 'read-only'

export type ComposerNote = 'villageAsleep' | 'denQuiet' | 'paused' | 'villageReadOnly' | 'denReadOnly'

export interface Composer {
  readonly state: ComposerState
  readonly note: ComposerNote | null
}

const WRITABLE: Composer = { state: 'write', note: null }

const closedFor = (channel: ChatChannel, phase: Phase, access: ChatAccess): boolean => {
  if (isDead(access)) return false
  return channel === 'village' ? phase === 'night' : phase !== 'night'
}

export const composerState = (access: ChatAccess, channel: ChatChannel, phase: Phase): Composer => {
  if (access.write.includes(channel)) return WRITABLE
  if (channel === 'village' && access.villagePaused) return { state: 'paused', note: 'paused' }
  const wolves = channel === 'wolves'
  if (closedFor(channel, phase, access)) {
    return { state: 'night-closed', note: wolves ? 'denQuiet' : 'villageAsleep' }
  }
  return { state: 'read-only', note: wolves ? 'denReadOnly' : 'villageReadOnly' }
}
