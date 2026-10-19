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
    <b class="t-small">{{ t('table.vote.accused') }}</b>
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
        {{ seat.name }}
      </button>
    </div>
    <template v-if="accusedId">
      <b class="t-small">{{ t('table.vote.voters', { name: nameOf(accusedId) }) }}</b>
      <div class="votes-chips">
        <button
          v-for="seat in voters"
          :key="seat.id"
          type="button"
          class="chip"
          :class="{ 'is-sel': handsUp.includes(seat.id) }"
          :aria-pressed="handsUp.includes(seat.id)"
          @click="tap(seat.id)"
        >
          <LunaIcon v-if="handsUp.includes(seat.id)" name="hand" size="sm" />{{ seat.name }}
        </button>
      </div>
    </template>
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
