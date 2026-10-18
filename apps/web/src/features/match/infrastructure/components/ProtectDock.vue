<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMatchStore } from '../../application/useMatchStore'
import { offeredTargetsFor, type NightViewOf } from '../../domain/night'
import type { Seat } from '../../domain/seating'
import DockHeader from './DockHeader.vue'
import DockNote from './DockNote.vue'
import TargetPicker from './TargetPicker.vue'

const props = defineProps<{ view: PlayerMatchView; night: NightViewOf<'protect'>; seats: readonly Seat[] }>()
const { t } = useI18n()
const match = useMatchStore()

const nameOf = (id: string | null): string => props.seats.find((seat) => seat.id === id)?.name ?? ''
const targets = computed(() => offeredTargetsFor(props.view, props.seats))
</script>

<template>
  <div class="dock">
    <DockHeader icon="shield" :title="t('match.night.protect.title')" />
    <TargetPicker :targets="targets" :selected-id="night.targetId" @pick="(id) => match.act({ kind: 'protect', targetId: id })" />
    <DockNote v-if="night.blockedTargetId" icon="info" tone="info">
      {{ t('match.night.protect.blocked', { name: nameOf(night.blockedTargetId) }) }}
    </DockNote>
    <DockNote v-if="night.targetId" icon="shield-check">
      {{ t('match.night.protect.protected', { name: nameOf(night.targetId) }) }}
    </DockNote>
  </div>
</template>
