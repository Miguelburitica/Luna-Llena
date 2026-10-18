import { onMounted, type Ref } from 'vue'
import { useRoomAction } from './useRoomAction'
import { useRoomStore } from './useRoomStore'

export const useRoomEntry = (code: Ref<string>) => {
  const store = useRoomStore()
  const { failure, pending, run } = useRoomAction()

  const enter = async () => {
    if (store.snapshot?.code === code.value) return
    await run(() => store.resume(code.value))
  }

  onMounted(enter)

  return { failure, pending, retry: enter }
}
