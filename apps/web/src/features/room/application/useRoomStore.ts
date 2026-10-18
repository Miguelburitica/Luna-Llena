import {
  err,
  roomError,
  type AvatarId,
  type CreateRoomInput,
  type Result,
  type RoomSession,
  type RoomSettingsInput,
  type RoomSnapshot
} from '@luna/contracts'
import { defineStore } from 'pinia'
import { computed, inject, ref } from 'vue'
import { memberWithId } from '../domain/lobby'
import { normalizeRoomCode } from '../domain/roomCode'
import { ROOM_GATEWAY, SESSION_STORE, type RoomFailure, type StoredSession } from './ports'

export type RoomEnding = 'kicked' | 'closed'

const required = <T>(value: T | undefined, name: string): T => {
  if (value === undefined) throw new Error(`${name} was not provided to the app`)
  return value
}

export const useRoomStore = defineStore('room', () => {
  const gateway = required(inject(ROOM_GATEWAY), 'RoomGateway')
  const sessions = required(inject(SESSION_STORE), 'SessionStore')

  const session = ref<StoredSession | null>(null)
  const snapshot = ref<RoomSnapshot | null>(null)
  const ending = ref<RoomEnding | null>(null)

  const me = computed(() => (snapshot.value === null ? null : memberWithId(snapshot.value, session.value?.memberId)))
  const isNarrator = computed(() => me.value?.isNarrator ?? false)

  const forget = () => {
    session.value = null
    snapshot.value = null
    sessions.clear()
  }

  const end = (reason: RoomEnding) => {
    forget()
    ending.value = reason
  }

  const enter = (result: Result<RoomSession, RoomFailure>): Result<RoomSession, RoomFailure> => {
    if (!result.ok) return result
    const { code, memberId, token } = result.value
    session.value = { code, memberId, token }
    snapshot.value = result.value.snapshot
    ending.value = null
    sessions.save(session.value)
    return result
  }

  const resume = async (code: string): Promise<Result<RoomSession, RoomFailure>> => {
    const stored = session.value ?? sessions.load()
    if (stored === null || stored.code !== normalizeRoomCode(code)) return err(roomError('session-invalid'))
    const result = await gateway.resume(stored.code, stored.token)
    if (!result.ok && result.error.code !== 'unreachable') forget()
    return enter(result)
  }

  gateway.onSnapshot((next) => {
    if (next.code === session.value?.code) snapshot.value = next
  })
  gateway.onKicked(() => end('kicked'))
  gateway.onClosed(() => end('closed'))
  gateway.onReconnected(() => {
    if (session.value !== null) void resume(session.value.code)
  })

  return {
    session,
    snapshot,
    ending,
    me,
    isNarrator,
    createRoom: async (input: CreateRoomInput) => enter(await gateway.createRoom(input)),
    lookUp: (code: string) => gateway.lookUp(normalizeRoomCode(code)),
    join: async (code: string, name: string) => enter(await gateway.join(normalizeRoomCode(code), name)),
    resume,
    chooseAvatar: (avatar: AvatarId | null) => gateway.chooseAvatar(avatar),
    setReady: (ready: boolean) => gateway.setReady(ready),
    updateSettings: (settings: RoomSettingsInput) => gateway.updateSettings(settings),
    kick: (memberId: string) => gateway.kick(memberId),
    start: () => gateway.start(),
    playAgain: () => gateway.playAgain(),
    leave: async () => {
      const result = await gateway.leave()
      if (result.ok) forget()
      return result
    }
  }
})
