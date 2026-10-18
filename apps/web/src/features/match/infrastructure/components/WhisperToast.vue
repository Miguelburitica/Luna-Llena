<script setup lang="ts">
import type { HauntEffect } from '@luna/contracts'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useFlash } from '../../application/useFlash'
import { useMatchStore } from '../../application/useMatchStore'
import { GHOST_TOAST_MS } from '../../domain/ghosts'

const { t } = useI18n()
const room = useRoomStore()
const match = useMatchStore()
const whisper = useFlash<HauntEffect>(GHOST_TOAST_MS)

watch(
  () => match.lastHaunt,
  (effect) => {
    if (effect?.kind === 'whisper' && effect.targetId === room.session?.memberId) whisper.show(effect)
  }
)
</script>

<template>
  <div v-if="whisper.current.value" class="toast is-ghost whisper-toast" role="status">
    <LunaIcon name="ghost" />{{ t('match.ghost.whispered', { word: whisper.current.value.word ?? '' }) }}
  </div>
</template>

<style scoped>
.whisper-toast {
  position: fixed;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 50;
  max-width: 420px;
  margin: 0 auto;
}
</style>
