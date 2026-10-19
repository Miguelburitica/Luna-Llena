<script setup lang="ts">
import { TIMER_EXTENSION_SECONDS, type NarratorMatchView } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NarratorSoundboard from '@/features/atmosphere/infrastructure/components/NarratorSoundboard.vue'
import SettingsOverlay from '@/features/atmosphere/infrastructure/components/SettingsOverlay.vue'
import SoundToggle from '@/features/atmosphere/infrastructure/components/SoundToggle.vue'
import NarratorChatMonitor from '@/features/chat/infrastructure/components/NarratorChatMonitor.vue'
import { useRoomAction } from '@/features/room/application/useRoomAction'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import DeskHeader from '@/shared/infrastructure/ui/components/DeskHeader.vue'
import JoinCallButton from '@/shared/infrastructure/ui/components/JoinCallButton.vue'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import VoiceCallForm from '@/shared/infrastructure/ui/components/VoiceCallForm.vue'
import { PACK_RING, teamClassFor, teamClassOf } from '@/shared/infrastructure/ui/teamClass'
import { useCountdown } from '../../application/useCountdown'
import { useMatchStore } from '../../application/useMatchStore'
import { actionLineOf } from '../../domain/night'
import { nextPhaseOf, phaseLook, stepperOf } from '../../domain/phases'
import { seatsOf, trueRoleOf } from '../../domain/seating'
import { tallyBars, verdictOutcomeOf, voteLinesOf, voteProgressOf } from '../../domain/voting'
import NarratorHauntFeed from './NarratorHauntFeed.vue'
import PhaseTimer from './PhaseTimer.vue'

const props = defineProps<{ view: NarratorMatchView }>()
const { t } = useI18n()
const room = useRoomStore()
const match = useMatchStore()
const seconds = useCountdown()
const { failure: callFailure, pending: callPending, run: runCall } = useRoomAction()
const editingCall = ref(false)
const voiceCallUrl = computed(() => room.snapshot?.voiceCallUrl ?? null)
const callFailureText = computed(() => (callFailure.value === null ? null : t(`room.errors.${callFailure.value.code}`)))

const saveCall = async (url: string | null) => {
  const result = await runCall(() => room.setVoiceCall(url))
  if (result.ok) editingCall.value = false
}

const steps = computed(() =>
  stepperOf(props.view).map((step) => ({
    ...step,
    icon: phaseLook(step.phase).icon,
    label: t('match.dashboard.phaseRound', { phase: t(step.labelKey), round: step.round })
  }))
)
const upcoming = computed(() => nextPhaseOf(props.view.phase))
const seats = computed(() => seatsOf(props.view, room.snapshot?.members ?? [], room.session?.memberId))
const nameOf = (id: string | null): string => seats.value.find((seat) => seat.id === id)?.name ?? ''
const rows = computed(() =>
  seats.value.map((seat) => {
    const action = props.view.night?.actions[seat.id]
    const line = action ? actionLineOf(action) : null
    return {
      ...seat,
      role: trueRoleOf(props.view, seat.id),
      line,
      lineText: line
        ? t(`match.night.line.${line.key}`, {
            name: nameOf(line.targetId),
            result: line.outcome ? t(`match.night.line.${line.outcome}`) : ''
          })
        : ''
    }
  })
)
const preview = computed(() => props.view.night?.preview ?? null)
const waitingNames = computed(() => (props.view.night?.waitingOn ?? []).map(nameOf).join(', '))
const outcomeNames = computed(() => (preview.value?.deaths ?? []).map(nameOf).join(', '))
const voteLines = computed(() => voteLinesOf(props.view, seats.value))
const progress = computed(() => voteProgressOf(props.view))
const verdictRows = computed(() =>
  props.view.verdict === null
    ? []
    : tallyBars(props.view.verdict).map((bar) => ({
        ...bar,
        name: nameOf(bar.targetId),
        voterNames: (bar.voterIds ?? []).map(nameOf).join(', ')
      }))
)
const verdictOutcome = computed(() => (props.view.verdict === null ? null : verdictOutcomeOf(props.view.verdict)))
const shotPending = computed(() => props.view.revenge?.pending === true)
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
          :class="{ 'is-now': step.state === 'now', 'is-done': step.state === 'done' }"
          :aria-current="step.state === 'now' ? 'step' : undefined"
        >
          <LunaIcon :name="step.icon" size="sm" />{{ step.label }}
        </span>
      </nav>
      <div class="dashboard-controls">
        <div class="dashboard-call">
          <template v-if="voiceCallUrl">
            <JoinCallButton :url="voiceCallUrl" compact />
            <button
              type="button"
              class="btn btn-icon btn-ghost"
              :aria-label="t('voiceCall.change')"
              :aria-expanded="editingCall"
              @click="editingCall = !editingCall"
            >
              <LunaIcon name="sliders" />
            </button>
          </template>
          <button v-else type="button" class="btn btn-sm btn-secondary" :aria-expanded="editingCall" @click="editingCall = !editingCall">
            <LunaIcon name="phone" size="sm" />{{ t('voiceCall.add') }}
          </button>
        </div>
        <SoundToggle />
        <SettingsOverlay />
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
        <button type="button" class="btn btn-primary" :disabled="shotPending" @click="match.advance()">
          <LunaIcon :name="phaseLook(upcoming).icon" />{{ t('match.dashboard.next', { phase: t(`match.phases.${upcoming}`) }) }}
        </button>
      </div>
    </div>

    <div class="dashboard-body">
      <section v-if="editingCall" class="panel dashboard-call-panel">
        <div class="panel-h">
          <h2 class="h3 dashboard-heading">{{ voiceCallUrl === null ? t('voiceCall.add') : t('voiceCall.title') }}</h2>
        </div>
        <VoiceCallForm
          :url="voiceCallUrl"
          :code="view.code"
          :pending="callPending"
          :failure-text="callFailureText"
          @save="saveCall"
        />
      </section>

      <section class="panel">
        <div class="panel-h">
          <h2 class="h3 dashboard-heading">{{ t('match.dashboard.players') }}</h2>
          <span class="t-small t-muted dashboard-note"><LunaIcon name="eye" size="sm" />{{ t('match.dashboard.onlyYouSeeRoles') }}</span>
        </div>
        <span v-if="match.failure" class="err" role="alert">
          <LunaIcon name="info" size="sm" />{{ t(`match.errors.${match.failure.code}`) }}
        </span>
        <ul class="dashboard-players" :class="{ 'has-actions': view.night }">
          <li v-for="row in rows" :key="row.id" class="prow" :class="{ 'is-dead': !row.alive }">
            <LunaAvatar
              :avatar="row.avatar"
              :name="row.name"
              size="md"
              :bot="row.bot"
              :ring="row.role === 'werewolf' ? PACK_RING : undefined"
              :class="{ 'is-dead': !row.alive }"
            />
            <div>
              <b>{{ row.name }}</b>
              <span v-if="row.role" class="tbadge dashboard-role" :class="teamClassOf(row.role)">
                {{ t(`roles.${row.role}`) }}
              </span>
            </div>
            <span v-if="row.line" class="act" :class="{ 'is-wait': row.line.waiting }">
              <LunaIcon :name="row.line.icon" size="sm" />{{ row.lineText }}
            </span>
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

      <section v-if="view.votes && progress" class="panel dashboard-panel dashboard-votes">
        <div class="panel-h">
          <h2 class="h3 dashboard-heading">{{ t('match.dashboard.votes.title') }}</h2>
          <span class="sbadge">
            <LunaIcon name="users" size="sm" />{{
              t('match.dashboard.votes.progress', { voted: progress.voted, voters: progress.voters, locked: progress.locked })
            }}
          </span>
        </div>
        <ul class="dashboard-votelist">
          <li v-for="line in voteLines" :key="line.seat.id" class="dashboard-vote">
            <LunaAvatar :avatar="line.seat.avatar" :name="line.seat.name" size="sm" />
            <b>{{ line.seat.name }}</b>
            <span v-if="line.targetId" class="dashboard-vote-target">
              {{ t('match.dashboard.votes.for', { name: nameOf(line.targetId) }) }}
            </span>
            <span v-else class="t-small t-muted dashboard-vote-target">{{ t('match.dashboard.votes.pending') }}</span>
            <span v-if="line.locked" class="sbadge is-ok">
              <LunaIcon name="lock" size="sm" />{{ t('match.dashboard.votes.lockedLabel') }}
            </span>
          </li>
        </ul>
      </section>

      <section v-if="view.verdict && verdictOutcome" class="panel dashboard-panel dashboard-verdict">
        <div class="panel-h">
          <h2 class="h3 dashboard-heading">{{ t('match.dashboard.verdict.title') }}</h2>
          <span v-if="view.verdict.foolWins" class="tbadge team-solo">
            <LunaIcon name="sparkles" size="sm" />{{ t('match.win.solo') }}
          </span>
        </div>
        <ul class="dashboard-votelist">
          <li v-for="row in verdictRows" :key="row.targetId" class="dashboard-vote">
            <b>{{ t('match.dashboard.verdict.tallyLine', { name: row.name, votes: t('match.verdict.votes', row.votes) }) }}</b>
            <span v-if="row.voterNames" class="t-small t-muted">{{ t('match.dashboard.verdict.by', { names: row.voterNames }) }}</span>
          </li>
        </ul>
        <p class="dashboard-verdict-line">
          {{
            verdictOutcome === 'executed'
              ? t('match.dashboard.verdict.executed', { name: nameOf(view.verdict.executedId) })
              : t(`match.dashboard.verdict.${verdictOutcome}`)
          }}
        </p>
      </section>

      <section v-if="view.revenge" class="panel dashboard-panel dashboard-revenge">
        <div class="panel-h">
          <h2 class="h3 dashboard-heading">{{ t('match.dashboard.revenge.title') }}</h2>
          <button v-if="view.revenge.pending" type="button" class="btn btn-sm btn-danger" @click="match.skipRevenge()">
            <LunaIcon name="skip" size="sm" />{{ t('match.dashboard.revenge.skip') }}
          </button>
        </div>
        <p class="dashboard-verdict-line">
          {{
            view.revenge.pending
              ? t('match.dashboard.revenge.pending', { name: nameOf(view.revenge.hunterId) })
              : view.revenge.targetId
                ? t('match.dashboard.revenge.took', { name: nameOf(view.revenge.hunterId), target: nameOf(view.revenge.targetId) })
                : t('match.dashboard.revenge.held', { name: nameOf(view.revenge.hunterId) })
          }}
        </p>
      </section>

      <section v-if="view.night && preview" class="panel dashboard-dawn">
        <div class="panel-h">
          <h2 class="h3 dashboard-heading">{{ t('match.night.preview.title') }}</h2>
          <span v-if="view.night.waitingOn.length" class="sbadge is-warn">
            <LunaIcon name="hourglass" size="sm" />{{ t('match.night.preview.waitingOn', { names: waitingNames }) }}
          </span>
        </div>
        <div class="dashboard-chain">
          <span class="sbadge dashboard-step">
            <LunaIcon name="paw" size="sm" class="dashboard-wolf-icon" />{{
              preview.victimId
                ? t('match.night.preview.wolvesChose', { name: nameOf(preview.victimId) })
                : t('match.night.preview.wolvesUndecided')
            }}
          </span>
          <LunaIcon name="arrow-right" class="t-muted" />
          <span class="sbadge dashboard-step">
            <LunaIcon name="shield" size="sm" />{{
              preview.protectedId
                ? t('match.night.preview.protected', { name: nameOf(preview.protectedId) })
                : t('match.night.preview.unprotected')
            }}
          </span>
          <LunaIcon name="arrow-right" class="t-muted" />
          <span class="sbadge dashboard-step">
            <LunaIcon name="flask" size="sm" />{{
              t(preview.healing ? 'match.night.preview.healing' : 'match.night.preview.notHealing')
            }}
          </span>
          <template v-if="preview.poisonTargetId">
            <LunaIcon name="arrow-right" class="t-muted" />
            <span class="sbadge dashboard-step">
              <LunaIcon name="flask" size="sm" />{{ t('match.night.preview.poisoning', { name: nameOf(preview.poisonTargetId) }) }}
            </span>
          </template>
          <LunaIcon name="arrow-right" class="t-muted" />
          <span class="sbadge dashboard-step dashboard-deaths">
            <LunaIcon name="x" size="sm" />{{
              t('match.night.preview.deaths', { names: outcomeNames }, preview.deaths.length)
            }}
          </span>
        </div>
      </section>

      <NarratorSoundboard />

      <NarratorHauntFeed :seats="seats" :haunts="view.haunts" />

      <NarratorChatMonitor class="dashboard-panel" />
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
  background: #1a0d2b;
  border-bottom: 3px solid var(--outline);
}

.dashboard-controls {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dashboard-call {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dashboard-call-panel {
  margin-bottom: 20px;
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

.dashboard-players.has-actions .prow {
  grid-template-columns: 44px minmax(120px, 1fr) minmax(160px, 1.3fr) auto auto;
}

.dashboard-players .av {
  margin: 0;
}

.dashboard-dawn,
.dashboard-panel {
  margin-top: 20px;
}

.dashboard-votelist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.dashboard-vote {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dashboard-vote .av {
  margin: 0;
}

.dashboard-vote-target {
  flex: 1;
  min-width: 0;
}

.dashboard-verdict-line {
  margin: 12px 0 0;
  font: 700 15px var(--font-ui);
}

.dashboard-chain {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font: 600 15px var(--font-ui);
}

.dashboard-step {
  padding: 8px 12px;
  font-size: 14px;
}

.dashboard-wolf-icon {
  color: #ff8f94;
}

.dashboard-deaths {
  background: rgba(255, 107, 94, 0.18);
  color: #ffb3ab;
}

.act {
  display: flex;
  align-items: center;
  gap: 6px;
  font: 600 13px var(--font-ui);
  color: #d9d6f5;
  min-width: 0;
}

.act.is-wait {
  color: var(--lantern);
}

.dashboard-role {
  margin-left: 8px;
  font-size: 10px;
  padding: 3px 8px;
}

.dashboard-alive {
  color: var(--ok);
}

@media (max-width: 640px) {
  .dashboard-bar {
    padding: 12px 16px;
  }

  .dashboard-body {
    padding: 16px 12px 32px;
  }

  .dashboard-players .prow,
  .dashboard-players.has-actions .prow {
    grid-template-columns: 44px minmax(0, 1fr) auto auto;
  }

  .dashboard-players .act {
    grid-column: 2 / -1;
    grid-row: 2;
  }
}
</style>
