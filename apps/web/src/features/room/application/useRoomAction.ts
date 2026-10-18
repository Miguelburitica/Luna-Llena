import type { Result } from '@luna/contracts'
import { ref } from 'vue'
import type { RoomFailure } from './ports'

export const useRoomAction = () => {
  const failure = ref<RoomFailure | null>(null)
  const pending = ref(false)

  const run = async <T>(action: () => Promise<Result<T, RoomFailure>>): Promise<Result<T, RoomFailure>> => {
    pending.value = true
    failure.value = null
    const result = await action()
    pending.value = false
    if (!result.ok) failure.value = result.error
    return result
  }

  return { failure, pending, run, clear: () => (failure.value = null) }
}
