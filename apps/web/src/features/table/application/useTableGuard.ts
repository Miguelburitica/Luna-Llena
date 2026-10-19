import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { tableScreenOf, type TableScreen } from '../domain/tableScreen'
import { useTableStore } from './useTableStore'

export const useTableGuard = (allowed: readonly TableScreen[]) => {
  const table = useTableStore()
  const router = useRouter()
  const guarded = router.currentRoute.value.name
  const screen = computed(() => tableScreenOf(table.progress, table.view?.outcome != null))
  watch(
    screen,
    (next) => {
      if (router.currentRoute.value.name === guarded && !allowed.includes(next)) void router.replace({ name: next })
    },
    { immediate: true }
  )
  return screen
}
