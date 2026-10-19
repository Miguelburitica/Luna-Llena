<script setup lang="ts">
import { ROLE_CATALOG, type RoleId } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { flavorLineOf, orderedAwards, timelineChapters } from '@/features/match/domain/endGame'
import EndAwards from '@/features/match/infrastructure/components/EndAwards.vue'
import EndStory from '@/features/match/infrastructure/components/EndStory.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import RoleCard from '@/shared/infrastructure/ui/components/RoleCard.vue'
import { teamClassFor, teamClassOf } from '@/shared/infrastructure/ui/teamClass'
import { useTableGuard } from '../../application/useTableGuard'
import { useTableScene } from '../../application/useTableScene'
import { useTableStore } from '../../application/useTableStore'
import { useTableSeats } from '../useTableSeats'

const { t } = useI18n()
const router = useRouter()
const table = useTableStore()
useTableGuard(['table-over'])
useTableScene()
const { seats, nameOf } = useTableSeats()

const view = computed(() => table.view)
const outcome = computed(() => view.value?.outcome ?? null)
const roleOf = (id: string): RoleId | null => view.value?.roles[id] ?? null
const chapters = computed(() => (outcome.value === null ? [] : timelineChapters(outcome.value)))
const awards = computed(() => (outcome.value === null ? [] : orderedAwards(outcome.value.awards)))
const twists = computed(() =>
  seats.value.flatMap((seat) => {
    const role = roleOf(seat.id)
    return role !== null && ROLE_CATALOG[role].appearsAs !== role ? [{ seat, role, seen: ROLE_CATALOG[role].appearsAs }] : []
  })
)

const playAgain = async () => {
  table.playAgain()
  await router.push({ name: 'table-deal' })
}

const leave = async () => {
  await router.push({ name: 'home' })
  table.abandon()
}
</script>

<template>
  <main v-if="view && outcome" class="phone ph-night over">
    <section class="card over-banner" :class="teamClassFor(outcome.winner)">
      <span class="t-cap">{{ t('table.over.eyebrow') }}</span>
      <LunaIcon name="trophy" size="xl" />
      <h1 class="h1 over-title">{{ t(`match.win.${outcome.winner}`) }}</h1>
      <p class="t-body">{{ t(flavorLineOf(outcome.winner)) }}</p>
      <span v-for="id in view.soloWinnerIds" :key="id" class="tbadge team-solo">
        <LunaIcon name="sparkles" size="sm" />{{ nameOf(id) }} · {{ t('match.win.solo') }}
      </span>
    </section>

    <section v-for="twist in twists" :key="twist.seat.id" class="card over-twist">
      <span class="t-cap t-muted">{{ t('match.over.twist.eyebrow') }}</span>
      <b class="h3">{{ t('table.over.twist', { name: twist.seat.name, role: t(`roles.${twist.role}`) }) }}</b>
      <span class="t-small t-muted">{{ t('table.over.twistBody', { seen: t(`roles.${twist.seen}`) }) }}</span>
    </section>

    <section class="panel">
      <h2 class="h2">{{ t('match.over.roles') }}</h2>
      <ul class="over-roles">
        <li v-for="seat in seats" :key="seat.id" class="over-role" :class="{ 'is-dead': !seat.alive }">
          <RoleCard v-if="roleOf(seat.id)" :role="roleOf(seat.id) ?? 'villager'" variant="mini" />
          <b class="over-role-name">{{ seat.name }}</b>
          <span v-if="roleOf(seat.id)" class="tbadge" :class="teamClassOf(roleOf(seat.id) ?? 'villager')">
            {{ t(`roles.${roleOf(seat.id)}`) }}
          </span>
        </li>
      </ul>
    </section>

    <EndStory :chapters="chapters" :seats="seats" :role-of="roleOf" />
    <EndAwards v-if="awards.length" :awards="awards" :seats="seats" />

    <footer class="over-foot">
      <button type="button" class="btn btn-primary btn-lg btn-block" @click="playAgain">
        <LunaIcon name="refresh" />{{ t('table.over.playAgain') }}
      </button>
      <span class="t-small t-muted over-hint">{{ t('table.over.playAgainHint') }}</span>
      <RouterLink :to="{ name: 'table-setup' }" class="btn btn-secondary btn-block">{{ t('table.over.backToSetup') }}</RouterLink>
      <button type="button" class="btn btn-ghost btn-block" @click="leave">{{ t('table.over.leave') }}</button>
    </footer>
  </main>
</template>

<style scoped>
.over {
  padding: 16px;
  gap: 14px;
  overflow: visible;
}

.over-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.over-title,
.over-banner p {
  margin: 0;
}

.over-twist {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.over-roles {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.over-role {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.over-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 8px;
}

.over-hint {
  text-align: center;
}
</style>
