<script setup lang="ts">
import type { MatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import RoleCard from '@/shared/infrastructure/ui/components/RoleCard.vue'
import type { Seat } from '../../domain/seating'
import { tallyBars, verdictOutcomeOf } from '../../domain/voting'

const BAR_STAGGER_SECONDS = 0.12

const props = defineProps<{ view: MatchView; seats: readonly Seat[] }>()
const { t } = useI18n()

const verdict = computed(() => props.view.verdict)
const seatOf = (id: string | null): Seat | undefined => props.seats.find((seat) => seat.id === id)
const outcome = computed(() => (verdict.value === null ? null : verdictOutcomeOf(verdict.value)))
const executed = computed(() => seatOf(verdict.value?.executedId ?? null))
const rows = computed(() =>
  verdict.value === null
    ? []
    : tallyBars(verdict.value).map((bar, index) => ({
        ...bar,
        seat: seatOf(bar.targetId),
        voters: (bar.voterIds ?? []).map(seatOf),
        delay: `${index * BAR_STAGGER_SECONDS}s`
      }))
)
const anonymous = computed(() => rows.value.length > 0 && rows.value.every((row) => row.voterIds === null))
</script>

<template>
  <section v-if="verdict" class="verdict">
    <div v-if="rows.length" class="card verdict-tally">
      <div class="tally">
        <div v-for="row in rows" :key="row.targetId" class="tally-row">
          <LunaAvatar :avatar="row.seat?.avatar ?? null" :name="row.seat?.name ?? ''" size="md" />
          <div class="bar">
            <i :class="{ 'is-top': row.isTop }" :style="{ width: `${row.percent}%`, animationDelay: row.delay }" />
          </div>
          <span class="tally-n">{{ row.votes }}</span>
          <span v-if="row.voters.length" class="verdict-stack">
            <LunaAvatar
              v-for="voter in row.voters"
              :key="voter?.id"
              :avatar="voter?.avatar ?? null"
              :name="voter?.name ?? ''"
              size="xs"
            />
          </span>
        </div>
      </div>
      <p v-if="anonymous" class="t-small t-muted verdict-anonymous">{{ t('match.verdict.anonymous') }}</p>
    </div>

    <template v-if="outcome === 'executed' && executed">
      <div class="card a-poof verdict-result">
        <LunaAvatar :avatar="executed.avatar" :name="executed.name" size="lg" class="is-dead a-drop verdict-tomb" />
        <div class="verdict-said">
          <b class="h3">{{ t('match.verdict.leaves', { name: executed.name }) }}</b>
          <div class="t-small t-muted">{{ t('match.verdict.spoken') }}</div>
        </div>
      </div>
      <div v-if="executed.revealedRole" class="verdict-was">
        <span class="h2">{{ t('match.verdict.was', { name: executed.name }) }}</span>
        <RoleCard :role="executed.revealedRole" variant="face" />
      </div>
      <p v-else class="t-small t-muted t-center">{{ t('match.verdict.roleHidden') }}</p>
    </template>

    <div v-else-if="outcome === 'tie'" class="card a-poof verdict-result verdict-tie">
      <LunaIcon name="split" size="xl" />
      <h1 class="h1">{{ t('match.verdict.tie') }}</h1>
      <b class="h3">{{ t('match.verdict.noExecution') }}</b>
      <p class="t-body t-muted">{{ t('match.verdict.tieHint') }}</p>
    </div>

    <div v-else class="card a-poof verdict-result verdict-tie">
      <LunaIcon name="vote" size="xl" />
      <h1 class="h1">{{ t('match.verdict.nobody') }}</h1>
      <b class="h3">{{ t('match.verdict.noExecution') }}</b>
      <p class="t-body t-muted">{{ t('match.verdict.nobodyHint') }}</p>
    </div>
  </section>
</template>

<style scoped>
.verdict {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 8px 12px 0;
}

.verdict-tally {
  padding: 18px 16px;
}

.verdict-stack {
  display: flex;
  grid-column: 2;
  margin-top: -4px;
  padding-left: 7px;
}

.verdict-stack .av {
  margin: 0 0 0 -7px;
}

.verdict-anonymous {
  margin: 12px 0 0;
}

.verdict-result {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
}

.verdict-tomb {
  margin: 0;
  flex: none;
}

.verdict-said {
  flex: 1;
  min-width: 0;
}

.verdict-was {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.verdict-tie {
  flex-direction: column;
  text-align: center;
}

.verdict-tie p {
  margin: 0;
}
</style>
