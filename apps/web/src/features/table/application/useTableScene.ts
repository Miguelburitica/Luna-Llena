import { onBeforeUnmount, onMounted } from 'vue'
import { useAtmosphereStore } from '@/features/atmosphere/application/useAtmosphereStore'
import { useTableStore } from './useTableStore'

export const useTableScene = () => {
  const atmosphere = useAtmosphereStore()
  const table = useTableStore()
  onMounted(() => atmosphere.followScene(() => table.view))
  onBeforeUnmount(() => atmosphere.followScene(null))
}
