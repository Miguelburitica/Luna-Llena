<script setup lang="ts">
import type { HauntRecord } from '@luna/contracts'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useFlash } from '../../application/useFlash'
import { useMatchStore } from '../../application/useMatchStore'
import { GHOST_TOAST_MS, hauntLine, hauntRecordLine, type HauntLine } from '../../domain/ghosts'
import type { Seat } from '../../domain/seating'

const props = defineProps<{ seats: readonly Seat[]; haunts: readonly HauntRecord[] }>()
const { t } = useI18n()
const match = useMatchStore()
const latest = useFlash<string>(GHOST_TOAST_MS)

const nameOf = (memberId: string | null): string => props.seats.find((seat) => seat.id === memberId)?.name ?? ''
const textOf = (line: HauntLine): string => t(line.key, line.params)
const lines = computed(() =>
  props.haunts.map((record, index) => ({
    id: index,
    round: record.round,
    text: textOf(hauntRecordLine(record, nameOf))
  }))
)

watch(
  () => match.lastHaunt,
  (effect) => {
    if (effect) latest.show(textOf(hauntLine(effect, nameOf)))
  }
)
</script>

<template>
  <section v-if="lines.length" class="panel haunt-feed">
    <div class="panel-h">
      <h2 class="h3 haunt-feed-title">{{ t('match.ghost.feed.title') }}</h2>
      <span class="sbadge"><LunaIcon name="ghost" size="sm" />{{ lines.length }}</span>
    </div>
    <ul class="haunt-feed-list">
      <li v-for="line in lines" :key="line.id" class="haunt-feed-line">
        <span class="t-small t-muted haunt-feed-round">{{ t('match.ghost.feed.round', { round: line.round }) }}</span>
        <span class="haunt-feed-text">{{ line.text }}</span>
      </li>
    </ul>
  </section>
  <div v-if="latest.current.value" class="toast is-ghost haunt-feed-toast" role="status">
    <LunaIcon name="ghost" />{{ latest.current.value }}
  </div>
</template>

<style scoped>
.haunt-feed {
  margin-top: 20px;
}

.haunt-feed-title {
  font-size: 18px;
}

.haunt-feed-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.haunt-feed-line {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font: 600 15px var(--font-ui);
}

.haunt-feed-toast {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 50;
  max-width: 420px;
}
</style>
