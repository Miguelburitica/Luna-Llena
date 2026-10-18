import { computed, ref, type Ref } from 'vue'
import { inviteLinkFor } from '../domain/roomCode'

const COPIED_FEEDBACK_MS = 2500

export const useInviteLink = (code: Ref<string>) => {
  const link = computed(() => inviteLinkFor(window.location.origin, code.value))
  const copied = ref(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.value)
      copied.value = true
      setTimeout(() => (copied.value = false), COPIED_FEEDBACK_MS)
    } catch {
      copied.value = false
    }
  }

  return { link, copied, copy }
}
