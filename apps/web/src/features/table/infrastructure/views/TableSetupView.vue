<script setup lang="ts">
import { ROOM_LIMITS, TIMER_OPTIONS, TIMER_PHASES, type RoleId, type TimerPhase } from '@luna/contracts'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { timerLabelOf } from '@/features/room/domain/lobby'
import DeckBuilder from '@/features/room/infrastructure/components/DeckBuilder.vue'
import LunaCounter from '@/shared/infrastructure/ui/components/LunaCounter.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import LunaSegmented from '@/shared/infrastructure/ui/components/LunaSegmented.vue'
import LunaToggle from '@/shared/infrastructure/ui/components/LunaToggle.vue'
import { useTableStore } from '../../application/useTableStore'
import { canDeal, defaultTableSetup, nameErrorsOf, unmetDealConditionsOf, withSeatCount } from '../../domain/tableSetup'

const PHASE_ICONS: Record<TimerPhase, string> = { night: 'moon', day: 'sun', vote: 'vote' }

const { t } = useI18n()
const router = useRouter()
const table = useTableStore()

const start = table.journal?.setup ?? defaultTableSetup()
const draft = reactive({
  names: [...start.names],
  timers: { ...start.timers } as Record<TimerPhase, number>,
  revealRoleOnDeath: start.revealRoleOnDeath,
  deck: { ...start.deck } as Record<RoleId, number>
})
const savedRunning = ref(table.journal !== null && table.view?.outcome == null)

const seatCount = computed({
  get: () => draft.names.length,
  set: (count: number) => {
    draft.names = [...withSeatCount(draft, count).names]
  }
})
const nameErrors = computed(() => nameErrorsOf(draft))
const unmet = computed(() => unmetDealConditionsOf(draft))
const ready = computed(() => canDeal(draft))

const timerOptions = (phase: TimerPhase) =>
  TIMER_OPTIONS[phase].map((seconds) => {
    const label = timerLabelOf(seconds)
    return { value: seconds, label: label.unit === 'off' ? t('room.setup.off') : t(`room.setup.${label.unit}`, { value: label.value }) }
  })

const startOver = () => {
  table.abandon()
  savedRunning.value = false
}

const deal = async () => {
  if (table.deal({ ...draft, names: [...draft.names], deck: { ...draft.deck } })) await router.push({ name: 'table-deal' })
}
</script>

<template>
  <main class="phone ph-menu table-setup">
    <header class="table-setup-head">
      <span class="t-cap t-muted">{{ t('table.setup.eyebrow') }}</span>
      <h1 class="h1 table-setup-title">{{ t('table.setup.title') }}</h1>
      <p class="t-small t-muted">{{ t('table.setup.hint') }}</p>
    </header>

    <section v-if="savedRunning" class="card table-setup-saved" role="alert">
      <b class="h3">{{ t('table.setup.saved.title') }}</b>
      <span class="t-small">{{ t('table.setup.saved.body') }}</span>
      <div class="table-setup-actions">
        <RouterLink :to="{ name: 'table-resume' }" class="btn btn-primary">{{ t('table.setup.saved.resume') }}</RouterLink>
        <button type="button" class="btn btn-secondary" @click="startOver">{{ t('table.setup.saved.startOver') }}</button>
      </div>
    </section>

    <form v-else class="table-setup-body" @submit.prevent="deal">
      <section class="panel">
        <div class="panel-h">
          <div>
            <h2 class="h2">{{ t('table.setup.seats') }}</h2>
            <span class="t-small t-muted">{{ t('table.setup.seatsHint') }}</span>
          </div>
        </div>
        <div class="table-setup-count stack-on-phone">
          <span class="table-setup-label"><LunaIcon name="users" />{{ t('table.setup.players') }}</span>
          <LunaCounter
            v-model="seatCount"
            :min="ROOM_LIMITS.minPlayersToStart"
            :max="ROOM_LIMITS.maxPlayers"
            :fewer-label="t('table.setup.fewer')"
            :more-label="t('table.setup.more')"
          />
        </div>
        <ol class="table-setup-names">
          <li v-for="(_, index) in draft.names" :key="index" class="table-setup-name">
            <span class="sbadge">{{ index + 1 }}</span>
            <input
              v-model="draft.names[index]"
              class="input"
              type="text"
              :maxlength="ROOM_LIMITS.maxNameLength + 5"
              :placeholder="t('table.setup.namePlaceholder', { number: index + 1 })"
              :aria-label="t('table.setup.nameLabel', { number: index + 1 })"
              :aria-invalid="nameErrors[index] !== null"
            />
            <span v-if="nameErrors[index]" class="err">{{ t(`table.setup.errors.${nameErrors[index]}`) }}</span>
          </li>
        </ol>
      </section>

      <section class="panel">
        <div class="panel-h">
          <div>
            <h2 class="h2">{{ t('room.setup.timers') }}</h2>
            <span class="t-small t-muted">{{ t('room.setup.timersHint') }}</span>
          </div>
        </div>
        <div v-for="phase in TIMER_PHASES" :key="phase" class="table-setup-timer stack-on-phone">
          <span class="table-setup-label"><LunaIcon :name="PHASE_ICONS[phase]" />{{ t(`room.setup.phases.${phase}`) }}</span>
          <LunaSegmented v-model="draft.timers[phase]" :options="timerOptions(phase)" :label="t(`room.setup.phases.${phase}`)" />
        </div>
        <div class="table-setup-timer">
          <span class="table-setup-label">{{ t('room.setup.rules.revealRoleOnDeath.title') }}</span>
          <LunaToggle v-model="draft.revealRoleOnDeath" :label="t('room.setup.rules.revealRoleOnDeath.title')" />
        </div>
      </section>

      <DeckBuilder v-model:deck="draft.deck" :players="seatCount" players-fixed />

      <ul v-if="unmet.length" class="table-setup-unmet">
        <li v-for="condition in unmet" :key="condition" class="err">
          <LunaIcon name="info" size="sm" />{{ t(`table.setup.unmet.${condition}`) }}
        </li>
      </ul>
    </form>

    <footer v-if="!savedRunning" class="table-setup-foot stack-on-phone">
      <RouterLink :to="{ name: 'home' }" class="btn btn-secondary">{{ t('table.setup.cancel') }}</RouterLink>
      <button type="button" class="btn btn-primary btn-lg" :disabled="!ready" @click="deal">
        <LunaIcon name="card" />{{ t('table.setup.deal') }}
      </button>
    </footer>
  </main>
</template>

<style scoped>
.table-setup {
  max-width: 720px;
  overflow: visible;
}

.table-setup-head {
  padding: 20px 16px 8px;
}

.table-setup-title {
  margin: 4px 0;
}

.table-setup-head p {
  margin: 0;
}

.table-setup-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 16px 110px;
}

.table-setup-saved {
  margin: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-setup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.table-setup-count,
.table-setup-timer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.table-setup-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
}

.table-setup-names {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.table-setup-name {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
}

.table-setup-name .err {
  grid-column: 2;
}

.table-setup-unmet {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.table-setup-foot {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px 16px;
  background: linear-gradient(180deg, transparent, var(--bg-2) 40%);
}
</style>
