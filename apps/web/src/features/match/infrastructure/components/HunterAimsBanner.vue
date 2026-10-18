<script setup lang="ts">
import type { MatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import type { Seat } from '../../domain/seating'

const props = defineProps<{ view: MatchView; seats: readonly Seat[] }>()
const { t } = useI18n()

const revenge = computed(() => props.view.revenge)
const text = computed(() => {
  if (revenge.value === null) return ''
  if (revenge.value.pending) return t('match.revenge.aims')
  if (revenge.value.targetId === null) return t('match.revenge.held')
  const name = props.seats.find((seat) => seat.id === revenge.value?.targetId)?.name ?? ''
  return t('match.revenge.took', { name })
})
</script>

<template>
  <div v-if="revenge" class="netbar hunter-banner" :class="{ 'is-settled': !revenge.pending }" role="status">
    <LunaIcon name="target" size="sm" />{{ text }}
  </div>
</template>

<style scoped>
.hunter-banner {
  justify-content: center;
  background: #ff6b5e;
  color: #2a0a0a;
}

.hunter-banner.is-settled {
  background: var(--surface-2);
  color: var(--ink);
}
</style>
