<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed } from 'vue'
import type { Seat } from '../../domain/seating'
import DockError from './DockError.vue'
import HuntDock from './HuntDock.vue'
import InspectDock from './InspectDock.vue'
import PotionsDock from './PotionsDock.vue'
import ProtectDock from './ProtectDock.vue'
import SuspectDock from './SuspectDock.vue'

const props = defineProps<{ view: PlayerMatchView; seats: readonly Seat[] }>()
const night = computed(() => props.view.you.night)
</script>

<template>
  <div v-if="night" class="night-dock">
    <HuntDock v-if="night.action === 'hunt'" :view="view" :night="night" :seats="seats" />
    <InspectDock v-else-if="night.action === 'inspect'" :view="view" :night="night" :seats="seats" />
    <ProtectDock v-else-if="night.action === 'protect'" :view="view" :night="night" :seats="seats" />
    <PotionsDock v-else-if="night.action === 'potions'" :view="view" :night="night" :seats="seats" />
    <SuspectDock v-else :view="view" :night="night" :seats="seats" />
    <DockError />
  </div>
</template>

<style scoped>
.night-dock {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
</style>
