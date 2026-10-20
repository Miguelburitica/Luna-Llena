<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useRoomStore } from '../../application/useRoomStore'

const TAKEOVER_TOAST_MS = 6000

const { t } = useI18n()
const room = useRoomStore()
let timer: ReturnType<typeof setTimeout> | undefined

watch(
  () => room.takeover,
  (takeover) => {
    clearTimeout(timer)
    if (takeover !== null) timer = setTimeout(() => room.dismissTakeover(), TAKEOVER_TOAST_MS)
  }
)

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div v-if="room.takeover" class="toast is-warn seat-takeover-toast" role="status">
    <LunaIcon name="user-x" />{{ t('room.takeover', { formerName: room.takeover.formerName, botName: room.takeover.botName }) }}
  </div>
</template>

<style scoped>
.seat-takeover-toast {
  position: fixed;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 50;
  max-width: 420px;
  margin: 0 auto;
}
</style>
