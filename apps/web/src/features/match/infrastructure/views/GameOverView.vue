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
import { teamClassFor, teamClassOf } from '@/shared/infrastructure/ui/teamClass'
import { flavorLineOf, orderedAwards, plotTwistOf, timelineChapters } from '../../domain/endGame'
import { seatsOf, trueRoleOf } from '../../domain/seating'
import EndAwards from '../components/EndAwards.vue'
import EndStory from '../components/EndStory.vue'

const SCENES: Readonly<Record<TeamId, { phone: string; scene: string }>> = {
  village: { phone: 'ph-day', scene: 'bg-day' },
  wolves: { phone: 'ph-night', scene: 'bg-night' },
  solo: { phone: 'ph-day', scene: 'bg-dawn' }
}

const props = defineProps<{ view: MatchView; outcome: MatchOutcome }>()
const { t } = useI18n()
const room = useRoomStore()
const chat = useChatStore()
const playAgain = useRoomAction()

const seats = computed(() => seatsOf(props.view, room.snapshot?.members ?? [], room.session?.memberId))
const roleOf = (memberId: string) => trueRoleOf(props.view, memberId)
const rows = computed(() => seats.value.map((seat) => ({ ...seat, role: roleOf(seat.id) })))
const soloWinners = computed(() => rows.value.filter((row) => props.view.soloWinnerIds.includes(row.id)))
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
    <header class="over-head">
      <span class="scene-bg a-rise" :class="SCENES[outcome.winner].scene" />
      <div class="over-hero">
        <span class="t-cap t-muted">{{ t('match.over.eyebrow') }}</span>
        <div class="banner-lg over-banner" :class="teamClassFor(outcome.winner)">
          <LunaIcon name="trophy" size="xl" class="over-trophy" />
          <h1 class="h1">{{ t(`match.win.${outcome.winner}`) }}</h1>
        </div>
        <p class="t-story over-flavor">{{ t(flavorLineOf(outcome.winner)) }}</p>
        <ul v-if="soloWinners.length" class="over-solo">
          <li v-for="winner in soloWinners" :key="winner.id" class="over-solo-winner team-solo">
            <LunaAvatar :avatar="winner.avatar" :name="winner.name" size="md" :you="winner.isYou" />
            <b>{{ winner.name }}</b>
            <span v-if="winner.role" class="tbadge">
              <LunaIcon name="sparkles" size="sm" />{{ t('match.over.soloAlso', { role: t(`roles.${winner.role}`) }) }}
            </span>
          </li>
        </ul>
      </div>
    </header>

    <section v-if="twist" class="card over-twist">
      <RoleCard :role="twist.was" variant="mini" />
      <div>
        <div class="t-cap over-twist-eyebrow">{{ t('match.over.twist.eyebrow') }}</div>
        <div class="h2 over-twist-title">{{ t('match.over.twist.title', { role: t(`roles.${twist.was}`) }) }}</div>
        <div class="t-small over-twist-body">{{ t('match.over.twist.body', { seen: t(`roles.${twist.seen}`) }) }}</div>
      </div>
    </section>

    <section class="over-roles">
      <h2 class="h2">{{ t('match.over.roles') }}</h2>
      <ul class="over-grid">
        <li v-for="row in rows" :key="row.id" class="over-tile" :class="{ 'is-you': row.isYou }">
          <LunaAvatar :avatar="row.avatar" :name="row.name" size="md" :you="row.isYou" :class="{ 'is-dead': !row.alive }" />
          <b class="t-small">{{ row.isYou ? t('match.reveal.you', { name: row.name }) : row.name }}</b>
          <span v-if="row.role" class="tbadge over-role" :class="teamClassOf(row.role)">{{ t(`roles.${row.role}`) }}</span>
        </li>
      </ul>
    </section>

    <EndStory :chapters="chapters" :seats="seats" :role-of="roleOf" />

    <EndAwards :awards="awards" :seats="seats" />

    <footer class="over-foot">
      <template v-if="room.isNarrator">
        <button type="button" class="btn btn-primary btn-lg btn-block" :disabled="playAgain.pending.value" @click="playAgain.run(room.playAgain)">
          <LunaIcon name="refresh" />{{ t('match.over.playAgain') }}
        </button>
        <span v-if="playAgain.failure.value" class="err" role="alert">
          <LunaIcon name="info" size="sm" />{{ t(`room.errors.${playAgain.failure.value.code}`) }}
        </span>
        <span v-else class="t-small t-center t-muted">{{ t('match.over.playAgainHint') }}</span>
      </template>
      <RouterLink :to="{ name: 'home' }" class="btn btn-secondary btn-block"><LunaIcon name="logout" />{{ t('match.over.leave') }}</RouterLink>
    </footer>
  </main>
</template>

<style scoped>
.over-head {
  position: relative;
  flex: none;
  overflow: hidden;
  padding: 32px 20px 40px;
}

.over-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.over-banner {
  align-items: center;
  background: var(--team);
  color: #fff;
  border: 0;
}

.over-trophy {
  color: #fff;
}

.over-flavor {
  margin: 0;
  font-size: 18px;
  font-style: italic;
  color: var(--ink);
}

.over-solo {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.over-solo-winner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: inset 0 0 0 1.5px var(--team);
}

.over-solo-winner .av {
  margin: 0;
}

.over-solo-winner .tbadge {
  margin-left: auto;
}

.over-twist {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: -24px 12px 0;
  position: relative;
  z-index: 2;
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
  padding: 26px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.over-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 8px;
}

.over-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.over-tile .av {
  margin: 0;
}

.over-role {
  font-size: 9px;
  padding: 3px 7px;
}

.over-foot {
  margin-top: auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
