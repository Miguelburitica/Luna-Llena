<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useMatchStore } from '../../application/useMatchStore'
import { offeredTargetsFor, type NightViewOf } from '../../domain/night'
import type { Seat } from '../../domain/seating'
import DockHeader from './DockHeader.vue'
import TargetPicker from './TargetPicker.vue'

const props = defineProps<{ view: PlayerMatchView; night: NightViewOf<'inspect'>; seats: readonly Seat[] }>()
const { t } = useI18n()
const match = useMatchStore()

const seatOf = (id: string): Seat | undefined => props.seats.find((seat) => seat.id === id)
const targets = computed(() => offeredTargetsFor(props.view, props.seats))
const vision = computed(() => props.night.vision)
const visionSeat = computed(() => (vision.value ? seatOf(vision.value.targetId) : undefined))
const past = computed(() =>
  props.view.you.visions.map((entry) => ({ ...entry, seat: seatOf(entry.targetId) }))
)
</script>

<template>
  <div class="dock">
    <template v-if="vision">
      <DockHeader icon="eye" :title="t('match.night.inspect.vision')">
        <span class="sbadge"><LunaIcon name="eye-off" size="sm" />{{ t('match.night.inspect.onlyYou') }}</span>
      </DockHeader>
      <div class="result a-flip inspect-result">
        <LunaAvatar
          :avatar="visionSeat?.avatar ?? null"
          :name="visionSeat?.name ?? ''"
          size="lg"
          :ring="vision.isWolf ? '#b8323a' : undefined"
          class="inspect-avatar"
        />
        <div class="inspect-said">
          <div class="t-story inspect-says">{{ t('match.night.inspect.says') }}</div>
          <div class="t-display inspect-verdict">
            {{ t(vision.isWolf ? 'match.night.inspect.isWolf' : 'match.night.inspect.isNotWolf', { name: visionSeat?.name ?? '' }) }}
          </div>
        </div>
        <LunaIcon v-if="vision.isWolf" name="paw" size="xl" class="inspect-paw" />
      </div>
    </template>
    <template v-else>
      <DockHeader icon="eye" :title="t('match.night.inspect.title')" />
      <TargetPicker :targets="targets" :selected-id="night.targetId" @pick="(id) => match.act({ kind: 'inspect', targetId: id })" />
    </template>
    <div v-if="past.length" class="inspect-past">
      <span class="t-cap t-muted">{{ t('match.night.inspect.past') }}</span>
      <div v-for="entry in past" :key="entry.round" class="inspect-past-row">
        <LunaAvatar :avatar="entry.seat?.avatar ?? null" :name="entry.seat?.name ?? ''" size="sm" class="inspect-past-avatar" />
        <span class="t-small inspect-past-name">{{ t('match.night.inspect.pastEntry', { round: entry.round, name: entry.seat?.name ?? '' }) }}</span>
        <span class="sbadge" :class="entry.isWolf ? 'is-warn' : 'is-ok'">
          <LunaIcon :name="entry.isWolf ? 'paw' : 'home'" size="sm" />{{ t(entry.isWolf ? 'match.night.inspect.wolfTag' : 'match.night.inspect.notWolfTag') }}
        </span>
      </div>
    </div>
    <span class="t-small t-muted t-center">{{ t(vision ? 'match.night.inspect.done' : 'match.night.inspect.hint') }}</span>
  </div>
</template>

<style scoped>
.inspect-result {
  padding: 16px;
  gap: 14px;
  box-shadow: inset 0 0 0 1px #dcc59a;
}

.inspect-avatar {
  margin: 0;
}

.inspect-said {
  flex: 1;
}

.inspect-says {
  font-size: 17px;
  font-style: italic;
  color: #6a4e30;
}

.inspect-verdict {
  font-size: 28px;
  font-weight: 800;
}

.inspect-paw {
  color: #b8323a;
}

.inspect-past {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.inspect-past-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--surface-2);
}

.inspect-past-avatar {
  margin: 0;
}

.inspect-past-name {
  flex: 1;
}
</style>
