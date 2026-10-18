<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useAtmosphereStore } from '../../application/useAtmosphereStore'

const { t } = useI18n()
const atmosphere = useAtmosphereStore()
const locked = computed(() => atmosphere.soundState === 'locked')
</script>

<template>
  <button
    type="button"
    class="btn btn-secondary sound-toggle"
    :class="locked ? 'btn-sm is-locked' : 'btn-icon'"
    :aria-label="t(`atmosphere.toggle.${atmosphere.soundState}`)"
    :aria-pressed="atmosphere.soundState === 'on'"
    @click="atmosphere.toggleSound()"
  >
    <LunaIcon :name="atmosphere.soundState === 'off' ? 'volume-x' : 'volume'" :size="locked ? 'sm' : undefined" />
    <template v-if="locked">{{ t('atmosphere.toggle.locked') }}</template>
  </button>
</template>
