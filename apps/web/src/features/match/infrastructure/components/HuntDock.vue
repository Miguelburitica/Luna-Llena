<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import { PACK_RING } from '@/shared/infrastructure/ui/teamClass'
import { useMatchStore } from '../../application/useMatchStore'
import { offeredTargetsFor, packAgreement, type NightViewOf } from '../../domain/night'
import type { Seat } from '../../domain/seating'
import DockHeader from './DockHeader.vue'
import DockNote from './DockNote.vue'
import TargetPicker from './TargetPicker.vue'

const props = defineProps<{ view: PlayerMatchView; night: NightViewOf<'hunt'>; seats: readonly Seat[] }>()
const { t } = useI18n()
const match = useMatchStore()

const nameOf = (id: string): string => props.seats.find((seat) => seat.id === id)?.name ?? ''
const targets = computed(() => offeredTargetsFor(props.view, props.seats))
const packSize = computed(() => props.seats.filter((seat) => seat.alive && (seat.isPack || seat.isYou)).length)
const agreedId = computed(() => packAgreement(props.night.packPicks, packSize.value))
const hasPicks = computed(() => Object.keys(props.night.packPicks).length > 0)
const pickersOf = (targetId: string): Seat[] =>
  props.seats.filter((seat) => !seat.isYou && props.night.packPicks[seat.id] === targetId)
const noteText = computed(() => {
  if (agreedId.value !== null) return t('match.night.hunt.agrees', { name: nameOf(agreedId.value) })
  return hasPicks.value ? t('match.night.hunt.split') : t('match.night.hunt.waiting')
})
</script>

<template>
  <div class="dock hunt-dock">
    <DockHeader icon="paw" :title="t('match.night.hunt.title')" icon-color="#ff8f94">
      <span class="t-small t-muted">{{ t('match.night.hunt.withPack') }}</span>
    </DockHeader>
    <TargetPicker :targets="targets" :selected-id="night.targetId" @pick="(id) => match.act({ kind: 'hunt', targetId: id })">
      <template #extra="{ target }">
        <span v-if="pickersOf(target.seat.id).length" class="mini">
          <LunaAvatar
            v-for="wolf in pickersOf(target.seat.id)"
            :key="wolf.id"
            :avatar="wolf.avatar"
            :name="t('match.night.hunt.pickedBy', { name: wolf.name, target: target.seat.name })"
            size="xs"
            :ring="PACK_RING"
            class="hunt-mini"
          />
        </span>
      </template>
    </TargetPicker>
    <DockNote :icon="agreedId !== null ? 'check' : 'info'" :tone="agreedId !== null ? 'ok' : 'info'">{{ noteText }}</DockNote>
  </div>
</template>

<style scoped>
.hunt-dock {
  box-shadow:
    inset 0 0 0 1.5px rgba(255, 143, 148, 0.45),
    var(--shadow-2);
}

.hunt-mini {
  margin: 0;
}
</style>
