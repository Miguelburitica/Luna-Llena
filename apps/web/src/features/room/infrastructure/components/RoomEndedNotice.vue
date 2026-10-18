<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LunaNotice from '@/shared/infrastructure/ui/components/LunaNotice.vue'
import type { RoomFailure } from '../../application/ports'
import type { RoomEnding } from '../../application/useRoomStore'

const props = defineProps<{ code: string; ending?: RoomEnding | null; failure?: RoomFailure | null }>()
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()

const kind = (() => {
  if (props.ending === 'kicked') return 'kicked'
  if (props.ending === 'closed') return 'closed'
  if (props.failure?.code === 'unreachable') return 'unreachable'
  if (props.failure?.code === 'room-not-found') return 'notFound'
  return 'seatLost'
})()

const icons = { kicked: 'user-x', closed: 'home', unreachable: 'cloud', notFound: 'help', seatLost: 'ghost' }
</script>

<template>
  <LunaNotice :icon="icons[kind]" :title="t(`room.ended.${kind}Title`)" :tone="kind === 'kicked' ? 'warn' : undefined">
    {{ t(`room.ended.${kind}Body`, { code }) }}
    <template #actions>
      <button v-if="kind === 'unreachable'" type="button" class="btn btn-primary btn-block" @click="emit('retry')">
        {{ t('room.ended.tryAgain') }}
      </button>
      <RouterLink
        v-if="kind === 'seatLost'"
        :to="{ name: 'join', params: { code } }"
        class="btn btn-primary btn-block"
      >
        {{ t('room.ended.joinAgain', { code }) }}
      </RouterLink>
      <RouterLink :to="{ name: 'home' }" class="btn btn-secondary btn-block">{{ t('common.backHome') }}</RouterLink>
    </template>
  </LunaNotice>
</template>
