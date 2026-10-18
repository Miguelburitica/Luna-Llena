<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import RoleCard from '@/shared/infrastructure/ui/components/RoleCard.vue'
import { teamClassOf } from '@/shared/infrastructure/ui/teamClass'
import { phaseLook, sceneBackgroundOf, seatPositions } from '../../domain/phases'
import { aliveCountOf, seatsOf } from '../../domain/seating'
import PhaseTimer from './PhaseTimer.vue'

const DENSE_SEAT_COUNT = 10
const PACK_RING = '#ff8f94'

const props = defineProps<{ view: PlayerMatchView }>()
const { t } = useI18n()
const room = useRoomStore()
const peeking = ref(false)

const look = computed(() => phaseLook(props.view.phase))
const seats = computed(() =>
  seatsOf(props.view, room.snapshot?.members ?? [], room.session?.memberId, props.view.you.packIds)
)
const positions = computed(() => seatPositions(seats.value.length))
const dense = computed(() => seats.value.length >= DENSE_SEAT_COUNT)
</script>

<template>
  <main class="phone table" :class="look.phaseClass">
    <div class="banner">
      <span class="ph-badge"><LunaIcon :name="look.icon" /></span>
      <div class="table-phase">
        <div class="ph-name">{{ t(`match.phases.${view.phase}`) }}</div>
        <div class="ph-sub">{{ t(`match.phaseSub.${view.phase}`, { round: view.round }) }}</div>
      </div>
      <button
        type="button"
        class="btn btn-icon btn-secondary table-peek-button"
        :aria-label="t('match.table.peek')"
        @pointerdown="peeking = true"
        @pointerup="peeking = false"
        @pointerleave="peeking = false"
        @pointercancel="peeking = false"
        @contextmenu.prevent
      >
        <LunaIcon name="card" />
      </button>
      <PhaseTimer :phase="view.phase" />
    </div>

    <div class="scene table-scene" :class="{ 'is-dense': dense }">
      <span class="scene-bg" :class="sceneBackgroundOf(view.phase)" />
      <span class="firefly table-firefly-a" aria-hidden="true" />
      <span class="firefly table-firefly-b" aria-hidden="true" />
      <div class="hearth"><LunaIcon name="flame" size="lg" /></div>
      <div
        v-for="(seat, index) in seats"
        :key="seat.id"
        class="seat table-seat"
        :style="{ left: `${positions[index]?.left}%`, top: `${positions[index]?.top}%` }"
      >
        <LunaAvatar
          :avatar="seat.avatar"
          :name="seat.name"
          :size="dense ? 'md' : undefined"
          :you="seat.isYou"
          :ring="seat.isPack ? PACK_RING : undefined"
          :class="{ 'is-dead': !seat.alive }"
        >
          <span v-if="seat.isYou" class="you-tag">{{ t('match.table.you') }}</span>
          <span v-if="seat.isPack && seat.alive" class="av-badge b-left"><LunaIcon name="paw" size="sm" /></span>
        </LunaAvatar>
        <span class="av-name">{{ seat.name }}</span>
        <span v-if="seat.revealedRole" class="tbadge table-seat-role" :class="teamClassOf(seat.revealedRole)">
          {{ t(`roles.${seat.revealedRole}`) }}
        </span>
      </div>
      <div v-if="peeking" class="table-peek" role="status">
        <RoleCard :role="view.you.role" :team="view.you.team" variant="mini" />
      </div>
    </div>

    <p class="t-small t-muted t-center table-alive">
      {{ t('match.table.alive', { alive: aliveCountOf(view), total: view.players.length }) }}
    </p>
  </main>
</template>

<style scoped>
.table-phase {
  flex: 1;
  min-width: 0;
}

.table-peek-button {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.table-scene {
  margin-top: 8px;
}

.table-firefly-a {
  left: 110px;
  top: 200px;
}

.table-firefly-b {
  left: 270px;
  top: 120px;
  animation-delay: 1s;
}

.table-seat {
  transform: translate(-50%, -50%);
}

.table-seat-role {
  margin-top: 4px;
  font-size: 9px;
  padding: 2px 7px;
}

.is-dense .table-seat {
  width: 56px;
}

.is-dense .av-name {
  font-size: 10px;
}

.table-peek {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
}

.table-alive {
  margin: 12px 0;
}
</style>
