import type { ClientKey, ModerationOverview, Result } from '@luna/contracts'
import { defineStore } from 'pinia'
import { inject, ref } from 'vue'
import { ADMIN_GATEWAY, type AdminFailure } from './ports'

export const useAdminStore = defineStore('admin', () => {
  const gateway = inject(ADMIN_GATEWAY)
  if (gateway === undefined) throw new Error('AdminGateway was not provided to the app')

  const checked = ref(false)
  const signedIn = ref(false)
  const expiresAt = ref<number | null>(null)
  const overview = ref<ModerationOverview | null>(null)
  const failure = ref<AdminFailure | null>(null)
  const pending = ref(false)

  const settle = <T>(result: Result<T, AdminFailure>): Result<T, AdminFailure> => {
    failure.value = result.ok ? null : result.error
    if (!result.ok && result.error.code === 'admin-denied') {
      signedIn.value = false
      overview.value = null
    }
    return result
  }

  const refresh = async () => {
    const result = settle(await gateway.overview())
    if (result.ok) overview.value = result.value
    return result
  }

  const busy = async <T>(work: () => Promise<Result<T, AdminFailure>>): Promise<Result<T, AdminFailure>> => {
    pending.value = true
    try {
      return await work()
    } finally {
      pending.value = false
    }
  }

  const load = async () => {
    const result = await gateway.status()
    checked.value = true
    if (result.ok) {
      signedIn.value = result.value.signedIn
      expiresAt.value = result.value.expiresAt
      if (result.value.signedIn) await refresh()
    } else failure.value = result.error
    return result
  }

  const signIn = (token: string) =>
    busy(async () => {
      const result = settle(await gateway.signIn(token))
      if (!result.ok) return result
      signedIn.value = result.value.signedIn
      expiresAt.value = result.value.expiresAt
      await refresh()
      return result
    })

  const signOut = () =>
    busy(async () => {
      const result = settle(await gateway.signOut())
      signedIn.value = false
      expiresAt.value = null
      overview.value = null
      return result
    })

  const thenRefresh = async (result: Result<void, AdminFailure>) => {
    if (settle(result).ok) await refresh()
    return result
  }

  return {
    checked,
    signedIn,
    expiresAt,
    overview,
    failure,
    pending,
    load,
    refresh,
    signIn,
    signOut,
    ban: (key: ClientKey, hours: number) => busy(async () => thenRefresh(await gateway.ban(key, hours))),
    unban: (key: ClientKey) => busy(async () => thenRefresh(await gateway.unban(key))),
    closeRoom: (code: string) => busy(async () => thenRefresh(await gateway.closeRoom(code)))
  }
})
