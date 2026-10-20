<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useTableStore } from '../../application/useTableStore'
import { liveTallyOf, toggledVote, votersFor } from '../../domain/tableBallot'
import { useTableSeats } from '../useTableSeats'

const { t } = useI18n()
const table = useTableStore()
const { seats, nameOf } = useTableSeats()

const accusedId = ref<string | null>(null)
const votes = computed(() => table.view?.votes ?? null)
const living = computed(() => seats.value.filter((seat) => seat.alive))
const voters = computed(() => living.value.filter((seat) => seat.id !== accusedId.value))
const handsUp = computed(() => (accusedId.value === null ? [] : votersFor(votes.value, accusedId.value)))
const tally = computed(() => liveTallyOf(votes.value))

const countFor = (seatId: string) => votersFor(votes.value, seatId).length
const elsewhereOf = (voterId: string): string | null => {
  const targetId = votes.value?.[voterId]?.targetId ?? null
  return targetId === accusedId.value ? null : targetId
}

const tap = (voterId: string) => {
  if (accusedId.value !== null) table.logVote(voterId, toggledVote(votes.value, voterId, accusedId.value))
}
</script>

<template>
  <section class="panel votes">
    <div class="panel-h">
      <div>
        <h2 class="h3 votes-heading">{{ t('table.vote.title') }}</h2>
        <span class="t-small t-muted">{{ t('table.vote.hint') }}</span>
      </div>
    </div>
    <ol class="votes-steps">
      <li class="votes-step">
        <div class="votes-step-h">
          <span class="votes-num" aria-hidden="true">1</span>
          <div>
            <b>{{ t('table.vote.accused') }}</b>
            <span class="t-small t-muted votes-step-hint">{{ t('table.vote.accusedHint') }}</span>
          </div>
        </div>
        <div class="votes-chips">
          <button
            v-for="seat in living"
            :key="seat.id"
            type="button"
            class="chip"
            :class="{ 'is-sel': accusedId === seat.id }"
            :aria-pressed="accusedId === seat.id"
            @click="accusedId = seat.id"
          >
            <span class="votes-name">{{ seat.name }}</span>
            <span v-if="countFor(seat.id)" class="votes-count" :aria-label="t('table.vote.votes', { count: countFor(seat.id) }, countFor(seat.id))">
              {{ countFor(seat.id) }}
            </span>
          </button>
        </div>
      </li>
      <li class="votes-step votes-step-hands" :class="{ 'is-waiting': !accusedId }">
        <div class="votes-step-h">
          <span class="votes-num" aria-hidden="true">2</span>
          <div v-if="accusedId">
            <b>{{ t('table.vote.voters', { name: nameOf(accusedId) }) }}</b>
            <span class="t-small t-muted votes-step-hint">{{ t('table.vote.votersHint') }}</span>
          </div>
          <span v-else class="t-small t-muted">{{ t('table.vote.pickFirst') }}</span>
        </div>
        <div v-if="accusedId" class="votes-chips">
          <button
            v-for="seat in voters"
            :key="seat.id"
            type="button"
            class="chip"
            :class="{ 'is-sel': handsUp.includes(seat.id) }"
            :aria-pressed="handsUp.includes(seat.id)"
            @click="tap(seat.id)"
          >
            <LunaIcon v-if="handsUp.includes(seat.id)" name="hand" size="sm" />
            <span class="votes-name">{{ seat.name }}</span>
            <small v-if="elsewhereOf(seat.id)" class="votes-elsewhere">{{ t('table.vote.elsewhere', { name: nameOf(elsewhereOf(seat.id) ?? '') }) }}</small>
          </button>
        </div>
      </li>
    </ol>
    <b class="t-small">{{ t('table.vote.tally') }}</b>
    <ul v-if="tally.length" class="votes-tally">
      <li v-for="row in tally" :key="row.targetId" class="votes-row">
        <b>{{ nameOf(row.targetId) }}</b>
        <span class="sbadge">{{ t('table.vote.votes', { count: row.votes }, row.votes) }}</span>
        <span class="t-small t-muted">{{ (row.voterIds ?? []).map(nameOf).join(', ') }}</span>
      </li>
    </ul>
    <p v-else class="t-small t-muted">{{ t('table.vote.none') }}</p>
  </section>
</template>

<style scoped>
.votes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.votes .panel-h {
  margin-bottom: 0;
}

.votes-heading {
  margin: 0;
}

.votes-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.votes-step {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  background: var(--surface-2);
  border: 2px solid var(--line);
}

.votes-step-hands:not(.is-waiting) {
  border-color: var(--accent);
}

.votes-step-h {
  display: flex;
  align-items: center;
  gap: 10px;
}

.votes-step-hint {
  display: block;
}

.votes-num {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: var(--accent-ink);
  border: 2.5px solid var(--outline);
  font: 900 14px var(--font-ui);
}

.is-waiting .votes-num {
  background: var(--surface-2);
  color: var(--muted);
}

.votes-count {
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 99px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--outline);
  color: var(--sticker);
  font: 900 11px var(--font-ui);
}

.votes-elsewhere {
  font: 700 11px var(--font-ui);
  opacity: 0.75;
}

.votes-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.votes-chips .chip {
  cursor: pointer;
  min-height: var(--touch);
}

.votes-chips .chip.is-sel {
  background: var(--accent);
  color: var(--accent-ink);
}

.votes-tally {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.votes-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
