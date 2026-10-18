<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useMatchStore } from '../../application/useMatchStore'
import type { Seat } from '../../domain/seating'
import HuntDock from './HuntDock.vue'
import InspectDock from './InspectDock.vue'
import PotionsDock from './PotionsDock.vue'
import ProtectDock from './ProtectDock.vue'
import SuspectDock from './SuspectDock.vue'

const props = defineProps<{ view: PlayerMatchView; seats: readonly Seat[] }>()
const { t } = useI18n()
const match = useMatchStore()
const night = computed(() => props.view.you.night)
</script>

<template>
  <div v-if="night" class="night-dock">
    <HuntDock v-if="night.action === 'hunt'" :view="view" :night="night" :seats="seats" />
    <InspectDock v-else-if="night.action === 'inspect'" :view="view" :night="night" :seats="seats" />
    <ProtectDock v-else-if="night.action === 'protect'" :view="view" :night="night" :seats="seats" />
    <PotionsDock v-else-if="night.action === 'potions'" :view="view" :night="night" :seats="seats" />
    <SuspectDock v-else :view="view" :night="night" :seats="seats" />
    <span v-if="match.failure" class="err night-dock-error" role="alert">
      <LunaIcon name="info" size="sm" />{{ t(`match.errors.${match.failure.code}`) }}
    </span>
  </div>
</template>

<style scoped>
.night-dock {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.night-dock-error {
  margin: 0 16px;
}
</style>
