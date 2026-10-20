<script setup lang="ts">
import type { MatchOutcome, MatchView, TeamId } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chatterboxOf } from '@/features/chat/domain/chatterbox'
import { useChatStore } from '@/features/chat/application/useChatStore'
import { useRoomAction } from '@/features/room/application/useRoomAction'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import RoleCard from '@/shared/infrastructure/ui/components/RoleCard.vue'
import { teamClassFor, teamClassOf, teamIconFor } from '@/shared/infrastructure/ui/teamClass'
import { flavorLineOf, gameSummaryOf, orderedAwards, plotTwistOf, rolesByTeam, timelineChapters } from '../../domain/endGame'
import { seatsOf, trueRoleOf } from '../../domain/seating'
import EndAwards from '../components/EndAwards.vue'
import EndStory from '../components/EndStory.vue'

const SCENES: Readonly<Record<TeamId, { phone: string; scene: string }>> = {
  village: { phone: 'ph-day', scene: 'bg-day' },
  wolves: { phone: 'ph-night', scene: 'bg-night' },
  solo: { phone: 'ph-day', scene: 'bg-dawn' }
}

const CONFETTI = ['#ff5fae', '#8fe34b', '#ffe27a', '#6ba3d6', '#d9a8f2', '#ff6b5e']

const props = defineProps<{ view: MatchView; outcome: MatchOutcome }>()
const { t } = useI18n()
const room = useRoomStore()
const chat = useChatStore()
const playAgain = useRoomAction()

const seats = computed(() => seatsOf(props.view, room.snapshot?.members ?? [], room.session?.memberId))
const roleOf = (memberId: string) => trueRoleOf(props.view, memberId)
const rows = computed(() => seats.value.map((seat) => ({ ...seat, role: roleOf(seat.id) })))
const teams = computed(() => rolesByTeam(rows.value))
const soloWinners = computed(() => rows.value.filter((row) => props.view.soloWinnerIds.includes(row.id)))
const summary = computed(() => gameSummaryOf(props.view))
const chapters = computed(() => timelineChapters(props.outcome))
const twist = computed(() => plotTwistOf(props.view, room.session?.memberId))
const awards = computed(() =>
  orderedAwards([
    ...props.outcome.awards,
    chatterboxOf(
      chat.messages.village,
      props.view.players.map((player) => player.id)
    )
  ])
)
</script>

<template>
  <main class="phone over" :class="SCENES[outcome.winner].phone">
    <header class="over-hero">
      <span class="scene-bg a-rise over-scene" :class="SCENES[outcome.winner].scene" />
      <span
        v-for="(color, index) in CONFETTI"
        :key="color"
        class="a-sway over-confetti"
        :class="`over-confetti-${index + 1}`"
        :style="{ background: color }"
      />
      <div class="over-hero-body">
        <span class="tbadge over-victory" :class="teamClassFor(outcome.winner)">
          <LunaIcon :name="teamIconFor(outcome.winner)" size="sm" />{{ t(`match.over.victory.${outcome.winner}`) }}
        </span>
        <div class="card over-headline">
          <h1 class="t-display over-banner">{{ t(`match.win.${outcome.winner}`) }}</h1>
          <p class="t-story over-flavor">{{ t(flavorLineOf(outcome.winner)) }}</p>
        </div>
        <ul class="over-summary" :aria-label="t('match.over.summary.label')">
          <li class="sbadge"><LunaIcon name="users" size="sm" />{{ t('match.over.summary.players', { count: summary.players }) }}</li>
          <li class="sbadge">
            <LunaIcon name="heart" size="sm" />{{ t('match.over.summary.survivors', { count: summary.survivors }, summary.survivors) }}
          </li>
          <li class="sbadge"><LunaIcon name="sun" size="sm" />{{ t('match.over.summary.days', { count: summary.days }, summary.days) }}</li>
        </ul>
      </div>
    </header>

    <div class="over-body">
      <ul v-if="soloWinners.length" class="over-solo">
        <li v-for="winner in soloWinners" :key="winner.id" class="card over-solo-winner team-solo">
          <LunaAvatar :avatar="winner.avatar" :name="winner.name" size="md" :you="winner.isYou" :bot="winner.bot" />
          <div class="over-solo-text">
            <b class="h3">{{ winner.name }}</b>
            <span v-if="winner.role" class="tbadge">
              <LunaIcon name="crown" size="sm" />{{ t('match.over.soloAlso', { role: t(`roles.${winner.role}`) }) }}
            </span>
          </div>
        </li>
      </ul>

      <section v-if="twist" class="card over-twist">
        <RoleCard :role="twist.was" variant="mini" />
        <div>
          <div class="t-cap over-twist-eyebrow">{{ t('match.over.twist.eyebrow') }}</div>
          <div class="h2 over-twist-title">{{ t('match.over.twist.title', { role: t(`roles.${twist.was}`) }) }}</div>
          <div class="t-small over-twist-body">{{ t('match.over.twist.body', { seen: t(`roles.${twist.seen}`) }) }}</div>
        </div>
      </section>

      <section class="card over-roles">
        <h2 class="h2">{{ t('match.over.roles') }}</h2>
        <div v-for="group in teams" :key="group.team ?? 'unknown'" class="over-team" :class="group.team && teamClassFor(group.team)">
          <span v-if="group.team" class="tbadge over-team-name">
            <LunaIcon :name="teamIconFor(group.team)" size="sm" />{{ t(`teams.${group.team}`) }}
          </span>
          <ul class="over-grid">
            <li
              v-for="row in group.rows"
              :key="row.id"
              class="over-tile"
              :class="{ 'is-you': row.isYou, 'is-fallen': !row.alive, 'is-winner': view.soloWinnerIds.includes(row.id) }"
            >
              <LunaAvatar :avatar="row.avatar" :name="row.name" size="md" :you="row.isYou" :bot="row.bot" :class="{ 'is-dead': !row.alive }" />
              <b class="over-name">{{ row.isYou ? t('match.reveal.you', { name: row.name }) : row.name }}</b>
              <span v-if="row.role" class="tbadge over-role" :class="teamClassOf(row.role)">{{ t(`roles.${row.role}`) }}</span>
              <span v-if="!row.alive" class="over-fallen">{{ t('match.over.fallen') }}</span>
            </li>
          </ul>
        </div>
      </section>

      <EndStory class="over-story" :chapters="chapters" :seats="seats" :role-of="roleOf" />

      <EndAwards class="over-awards" :awards="awards" :seats="seats" />
    </div>

    <footer class="card over-foot">
      <template v-if="room.isNarrator">
        <button type="button" class="btn btn-primary btn-lg btn-block" :disabled="playAgain.pending.value" @click="playAgain.run(room.playAgain)">
          <LunaIcon name="refresh" />{{ t('match.over.playAgain') }}
        </button>
        <span v-if="playAgain.failure.value" class="err" role="alert">
          <LunaIcon name="info" size="sm" />{{ t(`room.errors.${playAgain.failure.value.code}`) }}
        </span>
        <span v-else class="t-small t-center over-hint">{{ t('match.over.playAgainHint') }}</span>
      </template>
      <RouterLink :to="{ name: 'home' }" class="btn btn-secondary btn-block"><LunaIcon name="logout" />{{ t('match.over.leave') }}</RouterLink>
    </footer>
  </main>
</template>

<style scoped>
.over {
  max-width: none;
}

.over-hero {
  position: relative;
  flex: none;
  overflow: hidden;
  padding: 40px 12px 56px;
}

.over-scene {
  background-size: cover;
  background-position: center bottom;
}

.over-confetti {
  position: absolute;
  width: 9px;
  height: 14px;
  border-radius: 2px;
  border: 2px solid var(--outline);
}

.over-confetti-1 {
  left: 12%;
  top: 34px;
}

.over-confetti-2 {
  left: 84%;
  top: 70px;
  animation-delay: 0.5s;
}

.over-confetti-3 {
  left: 68%;
  top: 22px;
  animation-delay: 0.9s;
}

.over-confetti-4 {
  left: 24%;
  top: 120px;
  animation-delay: 0.3s;
}

.over-confetti-5 {
  left: 92%;
  top: 170px;
  animation-delay: 1.2s;
}

.over-confetti-6 {
  left: 5%;
  top: 200px;
  animation-delay: 0.7s;
}

.over-hero-body {
  position: relative;
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  text-align: center;
}

.over-victory {
  position: relative;
  z-index: 1;
  margin-bottom: -14px;
  font-size: 12px;
  padding: 6px 12px;
}

.over-headline {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 26px 20px 20px;
  color: var(--ink);
}

.over-banner {
  margin: 0;
  font-size: clamp(40px, 11vw, 68px);
  line-height: 0.95;
  color: var(--ink);
  text-wrap: balance;
}

.over-flavor {
  margin: 0;
  max-width: 34ch;
  font-size: 20px;
  font-style: italic;
  line-height: 1.25;
  color: var(--ink);
  text-wrap: balance;
}

.over-summary {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.over-summary .sbadge {
  padding: 6px 12px;
  font-size: 13px;
  background: var(--surface);
  border-color: var(--outline);
}

.over-body {
  width: 100%;
  max-width: 1080px;
  margin: -28px auto 0;
  padding: 0 12px;
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.over-solo {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.over-solo-winner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  box-shadow:
    0 0 0 2.5px var(--edge),
    inset 0 0 0 3px var(--team-soft),
    0 6px 0 2px rgba(12, 6, 20, 0.45);
}

.over-solo-winner .av {
  margin: 0;
  flex: none;
}

.over-solo-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.over-twist {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #3a2848;
  color: #fff4ea;
}

.over-twist-eyebrow,
.over-twist-body {
  color: #f6d9cc;
}

.over-twist-title {
  font-size: 22px;
  color: #fff4ea;
}

.over-twist-body {
  margin-top: 4px;
}

.over-roles {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.over-team {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.over-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
}

.over-tile {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 6px 10px;
  border-radius: 16px;
  border: 2.5px solid var(--line);
  background: var(--surface-2);
  text-align: center;
}

.over-tile.is-you {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent);
}

.over-tile.is-winner {
  border-color: var(--team-solo);
  box-shadow: 0 0 0 2px var(--team-solo-soft);
}

.over-tile .av {
  margin: 0;
}

.over-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 900 13px/1.2 var(--font-ui);
}

.over-role {
  font-size: 9px;
  padding: 3px 7px;
}

.over-fallen {
  font: 800 11px/1 var(--font-ui);
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.over-tile.is-fallen .over-name {
  color: var(--muted);
}

.over-foot {
  width: calc(100% - 24px);
  max-width: 480px;
  margin: 24px auto 32px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.over-hint {
  color: var(--muted);
}

@media (min-width: 900px) {
  .over-hero {
    padding: 72px 32px 84px;
  }

  .over-scene {
    background-size: auto 100%;
    background-repeat: repeat-x;
  }

  .over-body {
    padding: 0 24px;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: 24px;
  }

  .over-solo,
  .over-twist,
  .over-roles {
    grid-column: 1 / -1;
  }

  .over-grid {
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  }
}
</style>
