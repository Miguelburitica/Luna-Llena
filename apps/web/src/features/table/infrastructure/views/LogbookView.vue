<script setup lang="ts">
import { TIMER_EXTENSION_SECONDS } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAtmosphereStore } from '@/features/atmosphere/application/useAtmosphereStore'
import NarratorSoundboard from '@/features/atmosphere/infrastructure/components/NarratorSoundboard.vue'
import ScreenEffects from '@/features/atmosphere/infrastructure/components/ScreenEffects.vue'
import SettingsOverlay from '@/features/atmosphere/infrastructure/components/SettingsOverlay.vue'
import SoundToggle from '@/features/atmosphere/infrastructure/components/SoundToggle.vue'
import type { Target } from '@/features/match/domain/night'
import { nextPhaseOf, phaseLook } from '@/features/match/domain/phases'
import DawnAnnouncement from '@/features/match/infrastructure/components/DawnAnnouncement.vue'
import PhaseTimer from '@/features/match/infrastructure/components/PhaseTimer.vue'
import TargetPicker from '@/features/match/infrastructure/components/TargetPicker.vue'
import VerdictReveal from '@/features/match/infrastructure/components/VerdictReveal.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { teamClassFor } from '@/shared/infrastructure/ui/teamClass'
import { useTableCountdown } from '../../application/useTableCountdown'
import { useTableGuard } from '../../application/useTableGuard'
import { useTableScene } from '../../application/useTableScene'
import { useTableStore } from '../../application/useTableStore'
import { nightScriptOf, unloggedSteps } from '../../domain/nightScript'
import NightScript from '../components/NightScript.vue'
import TableSeats from '../components/TableSeats.vue'
import VotePanel from '../components/VotePanel.vue'
import { useTableSeats } from '../useTableSeats'

const { t, te } = useI18n()
const router = useRouter()
const table = useTableStore()
const atmosphere = useAtmosphereStore()
useTableGuard(['table'])
useTableScene()
const { seconds, totalSeconds, timeUp } = useTableCountdown(() => atmosphere.alertTimeUp())
const { seats, nameOf } = useTableSeats()

const view = computed(() => table.view)
const confirming = ref(false)
const look = computed(() => (view.value === null ? null : phaseLook(view.value.phase)))
const upcoming = computed(() => (view.value === null ? null : nextPhaseOf(view.value.phase)))
const unlogged = computed(() => (view.value?.night ? unloggedSteps(nightScriptOf(view.value)) : []))
const unloggedNames = computed(() => unlogged.value.map((step) => t(`table.night.powers.${step.power}`)).join(', '))
const preview = computed(() => view.value?.night?.preview ?? null)
const shotPending = computed(() => view.value?.revenge?.pending === true)
const revengeTargets = computed<Target[]>(() =>
  seats.value.filter((seat) => seat.alive && seat.id !== view.value?.revenge?.hunterId).map((seat) => ({ seat, blocked: null }))
)
const failureText = computed(() => {
  const code = table.failure?.code
  if (code === undefined) return null
  if (te(`table.logbook.errors.${code}`)) return t(`table.logbook.errors.${code}`)
  return te(`match.errors.${code}`) ? t(`match.errors.${code}`) : t('table.logbook.errors.generic')
})

const next = () => {
  if (unlogged.value.length > 0 && !confirming.value) {
    confirming.value = true
    return
  }
  confirming.value = false
  table.advance()
}

const endGame = async () => {
  if (table.endGame().ok) await router.push({ name: 'table-over' })
}
</script>

<template>
  <main v-if="view && look" class="phone logbook" :class="look.phaseClass">
    <header class="logbook-head">
      <span class="sbadge logbook-phase">
        <LunaIcon :name="look.icon" size="sm" />{{
          t('table.logbook.phaseRound', { phase: t(`match.phases.${view.phase}`), round: view.round })
        }}
      </span>
      <div class="logbook-tools">
        <button type="button" class="btn btn-icon btn-ghost" :aria-label="t('table.logbook.undo')" @click="table.undo()">
          <LunaIcon name="refresh" />
        </button>
        <RouterLink :to="{ name: 'table-stage' }" class="btn btn-icon btn-ghost" :aria-label="t('table.logbook.stage')">
          <LunaIcon name="eye-off" />
        </RouterLink>
        <SoundToggle />
        <SettingsOverlay />
      </div>
    </header>

    <div class="logbook-body">
      <div v-if="seconds !== null" class="card logbook-timer" :class="{ 'is-up': timeUp }">
        <PhaseTimer :seconds="seconds" :total-seconds="totalSeconds" />
        <b v-if="timeUp" class="h3 logbook-timeup" role="alert">{{ t('table.logbook.timeUp') }}</b>
        <button type="button" class="btn btn-sm btn-secondary" @click="table.extendTimer()">
          {{ t('table.logbook.addTime', { seconds: TIMER_EXTENSION_SECONDS }) }}
        </button>
      </div>

      <span v-if="failureText" class="err" role="alert"><LunaIcon name="info" size="sm" />{{ failureText }}</span>

      <section v-if="view.pendingWinner" class="card logbook-win" :class="teamClassFor(view.pendingWinner)" role="alert">
        <LunaIcon name="trophy" size="lg" />
        <b class="h2">{{ t(`match.win.${view.pendingWinner}`) }}</b>
        <span class="t-small">{{ t(`match.win.${view.pendingWinner}Hint`) }}</span>
        <div class="logbook-win-actions">
          <button type="button" class="btn btn-secondary" @click="table.keepPlaying()">{{ t('table.logbook.win.keepPlaying') }}</button>
          <button type="button" class="btn btn-primary" @click="endGame">{{ t('table.logbook.win.endGame') }}</button>
        </div>
      </section>

      <section v-if="shotPending && view.revenge" class="panel logbook-revenge">
        <div class="panel-h">
          <h2 class="h3 logbook-heading">{{ t('table.revenge.title', { name: nameOf(view.revenge.hunterId) }) }}</h2>
          <button type="button" class="btn btn-sm btn-danger" @click="table.skipRevenge()">
            <LunaIcon name="skip" size="sm" />{{ t('table.revenge.skip') }}
          </button>
        </div>
        <p class="t-small">{{ t('table.revenge.ask') }}</p>
        <TargetPicker :targets="revengeTargets" :selected-id="null" @pick="table.logRevenge" />
      </section>

      <template v-if="view.phase === 'night'">
        <NightScript />
        <section v-if="preview" class="panel logbook-preview">
          <h2 class="h3 logbook-heading">{{ t('match.night.preview.title') }}</h2>
          <ul class="logbook-chain">
            <li>
              <LunaIcon name="paw" size="sm" />{{
                preview.victimId
                  ? t('match.night.preview.wolvesChose', { name: nameOf(preview.victimId) })
                  : t('match.night.preview.wolvesUndecided')
              }}
            </li>
            <li>
              <LunaIcon name="shield" size="sm" />{{
                preview.protectedId
                  ? t('match.night.preview.protected', { name: nameOf(preview.protectedId) })
                  : t('match.night.preview.unprotected')
              }}
            </li>
            <li>
              <LunaIcon name="flask" size="sm" />{{
                t(preview.healing ? 'match.night.preview.healing' : 'match.night.preview.notHealing')
              }}
            </li>
            <li v-if="preview.poisonTargetId">
              <LunaIcon name="flask" size="sm" />{{ t('match.night.preview.poisoning', { name: nameOf(preview.poisonTargetId) }) }}
            </li>
            <li class="logbook-deaths">
              <LunaIcon name="x" size="sm" />{{
                t('match.night.preview.deaths', { names: preview.deaths.map(nameOf).join(', ') }, preview.deaths.length)
              }}
            </li>
          </ul>
        </section>
      </template>
      <DawnAnnouncement v-else-if="view.phase === 'dawn' && view.dawn" :view="view" :seats="seats" />
      <section v-else-if="view.phase === 'day'" class="card logbook-day">
        <h2 class="h2">{{ t('table.day.title') }}</h2>
        <p class="t-body t-muted">{{ t('table.day.hint') }}</p>
      </section>
      <VotePanel v-else-if="view.phase === 'vote'" />
      <template v-else-if="view.phase === 'execution' && view.verdict">
        <VerdictReveal :view="view" :seats="seats" />
        <span v-if="view.verdict.foolWins" class="tbadge team-solo logbook-fool">
          <LunaIcon name="sparkles" size="sm" />{{ t('match.win.solo') }}
        </span>
      </template>

      <TableSeats />
      <NarratorSoundboard local />
    </div>

    <footer class="logbook-foot">
      <section v-if="confirming" class="card logbook-confirm" role="alertdialog">
        <b class="h3">{{ t('table.logbook.confirm.title') }}</b>
        <span class="t-small">{{ t('table.logbook.confirm.body', { steps: unloggedNames }) }}</span>
        <div class="logbook-win-actions">
          <button type="button" class="btn btn-secondary" @click="confirming = false">{{ t('table.logbook.confirm.no') }}</button>
          <button type="button" class="btn btn-primary" @click="next">{{ t('table.logbook.confirm.yes') }}</button>
        </div>
      </section>
      <button v-else-if="upcoming" type="button" class="btn btn-primary btn-lg btn-block" :disabled="shotPending" @click="next">
        <LunaIcon :name="phaseLook(upcoming).icon" />{{ t('table.logbook.next', { phase: t(`match.phases.${upcoming}`) }) }}
      </button>
    </footer>
    <ScreenEffects />
  </main>
</template>

<style scoped>
.logbook {
  overflow: visible;
}

.logbook-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 16px 8px;
}

.logbook-tools {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logbook-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 16px 120px;
}

.logbook-heading {
  margin: 0;
}

.logbook-timer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logbook-timer .btn {
  margin-left: auto;
}

.logbook-timer.is-up {
  outline: 3px solid var(--accent);
}

.logbook-timeup {
  margin: 0;
}

.logbook-win,
.logbook-confirm {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.logbook-win-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.logbook-chain {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.logbook-chain li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logbook-deaths {
  font-weight: 900;
}

.logbook-day p {
  margin: 0;
}

.logbook-fool {
  align-self: center;
}

.logbook-foot {
  position: sticky;
  bottom: 0;
  padding: 12px 16px 16px;
  background: linear-gradient(180deg, transparent, var(--bg-2) 40%);
  z-index: 10;
}
</style>
