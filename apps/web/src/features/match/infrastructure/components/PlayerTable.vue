<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingsOverlay from '@/features/atmosphere/infrastructure/components/SettingsOverlay.vue'
import SoundToggle from '@/features/atmosphere/infrastructure/components/SoundToggle.vue'
import ChatBar from '@/features/chat/infrastructure/components/ChatBar.vue'
import ChatSheet from '@/features/chat/infrastructure/components/ChatSheet.vue'
import LastWordsPrompt from '@/features/chat/infrastructure/components/LastWordsPrompt.vue'
import LastWordsSpotlight from '@/features/chat/infrastructure/components/LastWordsSpotlight.vue'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import JoinCallButton from '@/shared/infrastructure/ui/components/JoinCallButton.vue'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import RoleCard from '@/shared/infrastructure/ui/components/RoleCard.vue'
import { PACK_RING, teamClassOf } from '@/shared/infrastructure/ui/teamClass'
import { phaseLook, sceneBackgroundOf, seatPositions } from '../../domain/phases'
import { aliveCountOf, seatsOf } from '../../domain/seating'
import { revengeStanceOf } from '../../domain/voting'
import DawnAnnouncement from './DawnAnnouncement.vue'
import FoolWinsCard from './FoolWinsCard.vue'
import GhostDock from './GhostDock.vue'
import HunterAimsBanner from './HunterAimsBanner.vue'
import MicsOffReminder from './MicsOffReminder.vue'
import NightDock from './NightDock.vue'
import PhaseTimer from './PhaseTimer.vue'
import RevengeDock from './RevengeDock.vue'
import VerdictReveal from './VerdictReveal.vue'
import VoteDock from './VoteDock.vue'

const DENSE_SEAT_COUNT = 10

const props = defineProps<{ view: PlayerMatchView }>()
const { t } = useI18n()
const room = useRoomStore()
const peeking = ref(false)
const voiceCallUrl = computed(() => room.snapshot?.voiceCallUrl ?? null)

const look = computed(() => phaseLook(props.view.phase))
const seats = computed(() =>
  seatsOf(props.view, room.snapshot?.members ?? [], room.session?.memberId, props.view.you.packIds)
)
const positions = computed(() => seatPositions(seats.value.length))
const dense = computed(() => seats.value.length >= DENSE_SEAT_COUNT)
const stance = computed(() => revengeStanceOf(props.view, seats.value))
const votingOpen = computed(
  () => props.view.phase === 'vote' && props.view.voting !== null && seats.value.some((seat) => seat.isYou && seat.alive)
)
</script>

<template>
  <main class="phone table" :class="look.phaseClass">
    <HunterAimsBanner v-if="stance === 'watcher' || stance === 'settled'" :view="view" :seats="seats" />
    <div class="banner">
      <span class="ph-badge"><LunaIcon :name="look.icon" /></span>
      <div class="table-phase">
        <div class="ph-name">{{ t(`match.phases.${view.phase}`) }}</div>
        <div class="ph-sub">{{ t(`match.phaseSub.${view.phase}`, { round: view.round }) }}</div>
      </div>
      <JoinCallButton v-if="voiceCallUrl" :url="voiceCallUrl" icon-only />
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

    <div class="table-tools">
      <SoundToggle />
      <SettingsOverlay />
    </div>

    <MicsOffReminder v-if="view.phase === 'night' && voiceCallUrl" :key="view.round" :code="view.code" :round="view.round" />

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

    <RevengeDock v-if="stance === 'shooter'" :view="view" :seats="seats" />
    <GhostDock v-else-if="view.you.haunt" :view="view" :seats="seats" />
    <NightDock v-if="view.phase === 'night' && view.you.night" :view="view" :seats="seats" />
    <DawnAnnouncement v-else-if="view.phase === 'dawn' && view.dawn" :view="view" :seats="seats" />
    <VoteDock v-else-if="votingOpen" :view="view" :seats="seats" />
    <VerdictReveal v-else-if="view.phase === 'execution' && view.verdict" :view="view" :seats="seats" />

    <p class="t-small t-muted t-center table-alive">
      {{ t('match.table.alive', { alive: aliveCountOf(view), total: view.players.length }) }}
    </p>

    <ChatBar :view="view" />
    <ChatSheet :view="view" />
    <LastWordsPrompt />
    <LastWordsSpotlight />

    <FoolWinsCard
      v-if="view.verdict?.foolWins"
      :key="view.verdict.round"
      :code="view.code"
      :verdict="view.verdict"
      :seats="seats"
    />
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

.table-tools {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
}

.table-scene {
  margin-top: 8px;
  height: 400px;
}

.table-scene .hearth {
  left: 50%;
  top: 61%;
  transform: translate(-50%, -50%);
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

.table-seat .av-name {
  background: var(--surface);
  padding: 2px 8px;
  border-radius: 99px;
  box-shadow: inset 0 0 0 1px var(--line);
  color: var(--ink);
}

.table-seat .is-dead + .av-name {
  color: var(--ink);
  text-decoration: line-through;
  opacity: 0.8;
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
