<script setup lang="ts">
import { PHASES, TIMER_EXTENSION_SECONDS, type NarratorMatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import DeskHeader from '@/shared/infrastructure/ui/components/DeskHeader.vue'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { teamClassFor, teamClassOf } from '@/shared/infrastructure/ui/teamClass'
import { useCountdown } from '../../application/useCountdown'
import { useMatchStore } from '../../application/useMatchStore'
import { nextPhaseOf, phaseLook } from '../../domain/phases'
import { seatsOf, trueRoleOf } from '../../domain/seating'
import PhaseTimer from './PhaseTimer.vue'

const PACK_RING = '#ff8f94'

const props = defineProps<{ view: NarratorMatchView }>()
const { t } = useI18n()
const room = useRoomStore()
const match = useMatchStore()
const seconds = useCountdown()

const currentIndex = computed(() => PHASES.indexOf(props.view.phase))
const steps = computed(() =>
  PHASES.map((phase, index) => ({
    phase,
    icon: phaseLook(phase).icon,
    current: index === currentIndex.value,
    done: index < currentIndex.value,
    label:
      phase === 'night' && index === currentIndex.value
        ? t('match.dashboard.nightRound', { round: props.view.round })
        : t(`match.phases.${phase}`)
  }))
)
const upcoming = computed(() => nextPhaseOf(props.view.phase))
const seats = computed(() => seatsOf(props.view, room.snapshot?.members ?? [], room.session?.memberId))
const rows = computed(() =>
  seats.value.map((seat) => ({ ...seat, role: trueRoleOf(props.view, seat.id) }))
)
</script>

<template>
  <div class="desk ph-night dashboard">
    <div v-if="view.pendingWinner" class="dashboard-win" :class="teamClassFor(view.pendingWinner)" role="alert">
      <LunaIcon name="trophy" size="lg" />
      <b class="t-display dashboard-win-title">{{ t(`match.win.${view.pendingWinner}`) }}</b>
      <span class="dashboard-win-hint">{{ t(`match.win.${view.pendingWinner}Hint`) }}</span>
      <div class="dashboard-win-actions">
        <button type="button" class="btn btn-sm dashboard-win-keep" @click="match.keepPlaying()">
          {{ t('match.dashboard.keepPlaying') }}
        </button>
        <button type="button" class="btn btn-sm dashboard-win-end" @click="match.endGame()">
          {{ t('match.dashboard.endGame') }}
        </button>
      </div>
    </div>

    <DeskHeader :trail="`${room.snapshot?.name ?? ''} / ${t('match.dashboard.game')}`">
      <span class="sbadge">{{ view.code }}</span>
    </DeskHeader>

    <div class="dashboard-bar">
      <nav class="stepper" :aria-label="t('match.dashboard.stepperLabel')">
        <span class="step is-done"><LunaIcon name="users" size="sm" />{{ t('match.dashboard.lobby') }}</span>
        <span
          v-for="step in steps"
          :key="step.phase"
          class="step"
          :class="{ 'is-now': step.current, 'is-done': step.done }"
          :aria-current="step.current ? 'step' : undefined"
        >
          <LunaIcon :name="step.icon" size="sm" />{{ step.label }}
        </span>
      </nav>
      <div class="dashboard-controls">
        <div class="dashboard-timer">
          <PhaseTimer :phase="view.phase" />
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            :disabled="seconds === null"
            :aria-label="t('match.dashboard.addTimeLabel', { seconds: TIMER_EXTENSION_SECONDS })"
            @click="match.extendTimer()"
          >
            {{ t('match.dashboard.addTime', { seconds: TIMER_EXTENSION_SECONDS }) }}
          </button>
        </div>
        <button type="button" class="btn btn-primary" @click="match.advance()">
          <LunaIcon :name="phaseLook(upcoming).icon" />{{ t('match.dashboard.next', { phase: t(`match.phases.${upcoming}`) }) }}
        </button>
      </div>
    </div>

    <div class="dashboard-body">
      <section class="panel">
        <div class="panel-h">
          <h2 class="h3 dashboard-heading">{{ t('match.dashboard.players') }}</h2>
          <span class="t-small t-muted dashboard-note"><LunaIcon name="eye" size="sm" />{{ t('match.dashboard.onlyYouSeeRoles') }}</span>
        </div>
        <span v-if="match.failure" class="err" role="alert">
          <LunaIcon name="info" size="sm" />{{ t(`match.errors.${match.failure.code}`) }}
        </span>
        <ul class="dashboard-players">
          <li v-for="row in rows" :key="row.id" class="prow" :class="{ 'is-dead': !row.alive }">
            <LunaAvatar
              :avatar="row.avatar"
              :name="row.name"
              size="md"
              :ring="row.role === 'werewolf' ? PACK_RING : undefined"
              :class="{ 'is-dead': !row.alive }"
            />
            <div>
              <b>{{ row.name }}</b>
              <span v-if="row.role" class="tbadge dashboard-role" :class="teamClassOf(row.role)">
                {{ t(`roles.${row.role}`) }}
              </span>
            </div>
            <span class="t-small" :class="row.alive ? 'dashboard-alive' : 't-muted'">
              {{ row.alive ? t('match.dashboard.alive') : t('match.dashboard.dead') }}
            </span>
            <button
              v-if="row.alive"
              type="button"
              class="btn btn-sm btn-secondary"
              :aria-label="t('match.dashboard.killLabel', { name: row.name })"
              @click="match.setAlive(row.id, false)"
            >
              <LunaIcon name="x" size="sm" />{{ t('match.dashboard.kill') }}
            </button>
            <button
              v-else
              type="button"
              class="btn btn-sm btn-secondary"
              :aria-label="t('match.dashboard.reviveLabel', { name: row.name })"
              @click="match.setAlive(row.id, true)"
            >
              <LunaIcon name="heart" size="sm" />{{ t('match.dashboard.revive') }}
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100dvh;
}

.dashboard-win {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 32px;
  background: var(--team);
  color: #fff;
  flex-wrap: wrap;
}

.dashboard-win-title {
  font-size: 24px;
}

.dashboard-win-hint {
  font-size: 14px;
  opacity: 0.9;
}

.dashboard-win-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.dashboard-win-keep {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.dashboard-win-end {
  background: #fff;
  color: #1e1230;
}

.dashboard-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 32px;
  flex-wrap: wrap;
  background: #0e1130;
  border-bottom: 1px solid rgba(233, 230, 255, 0.1);
}

.dashboard-controls {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dashboard-timer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
}

.dashboard-body {
  max-width: 1360px;
  margin: 0 auto;
  padding: 20px 32px 40px;
}

.dashboard-heading {
  font-size: 18px;
}

.dashboard-note {
  display: flex;
  gap: 6px;
  align-items: center;
}

.dashboard-players {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.dashboard-players .prow {
  grid-template-columns: 44px minmax(120px, 1fr) auto auto;
}

.dashboard-players .av {
  margin: 0;
}

.dashboard-role {
  margin-left: 8px;
  font-size: 10px;
  padding: 3px 8px;
}

.dashboard-alive {
  color: var(--ok);
}
</style>
