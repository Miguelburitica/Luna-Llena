<script setup lang="ts">
import { ROLE_CATALOG, ROLE_IDS, ROLE_TEAMS, ROOM_LIMITS, TEAM_IDS, type RoleId } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaCounter from '@/shared/infrastructure/ui/components/LunaCounter.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { roleArtClassOf } from '@/shared/infrastructure/ui/roleArt'
import { teamClassFor, teamClassOf, teamIconFor } from '@/shared/infrastructure/ui/teamClass'
import { balanceVerdictOf, suggestedDeckFor } from '../../domain/deckAdvice'
import { deckSizeOf, teamCountsOf } from '../../domain/lobby'

const props = withDefaults(defineProps<{ playersFixed?: boolean }>(), { playersFixed: false })
const deck = defineModel<Record<RoleId, number>>('deck', { required: true })
const players = defineModel<number>('players', { required: true })
const { t } = useI18n()

const deckSize = computed(() => deckSizeOf(deck.value))
const teamCounts = computed(() => teamCountsOf(deck.value))
const cardsLeft = computed(() => ROOM_LIMITS.maxPlayers - deckSize.value)
const verdict = computed(() => balanceVerdictOf(deck.value, players.value))
const applySuggestedDeck = () => Object.assign(deck.value, suggestedDeckFor(players.value))
const maxCopiesOf = (role: RoleId) => Math.min(ROLE_CATALOG[role].maxCopies, deck.value[role] + cardsLeft.value)
</script>

<template>
  <section class="panel setup-deck">
    <div class="panel-h">
      <div>
        <h2 class="h2">{{ t('room.setup.deck') }}</h2>
        <span class="t-small t-muted">{{ t('room.setup.deckHint') }}</span>
      </div>
      <span class="sbadge">{{ t('room.setup.cards', { count: deckSize }) }}</span>
    </div>

    <div class="setup-suggest">
      <div v-if="!props.playersFixed" class="setup-suggest-count">
        <span class="setup-row-label"><LunaIcon name="users" />{{ t('room.setup.playersExpected') }}</span>
        <LunaCounter
          v-model="players"
          :min="ROOM_LIMITS.minPlayersToStart"
          :max="ROOM_LIMITS.maxPlayers"
          :fewer-label="t('room.setup.fewerPlayers')"
          :more-label="t('room.setup.morePlayers')"
        />
      </div>
      <button type="button" class="btn btn-secondary btn-sm" @click="applySuggestedDeck">
        <LunaIcon name="wand" size="sm" />{{ t('room.setup.suggestedDeck', { players }) }}
      </button>
    </div>

    <div class="setup-balance">
      <div class="setup-balance-head">
        <div class="setup-balance-title">
          <b>{{ t('room.setup.balance') }}</b>
          <span class="sbadge" :class="verdict === 'balanced' ? 'is-ok' : 'is-warn'">
            <LunaIcon :name="verdict === 'balanced' ? 'check' : 'info'" size="sm" />{{ t(`room.setup.verdicts.${verdict}`) }}
          </span>
        </div>
        <div class="setup-balance-legend">
          <span v-for="team in TEAM_IDS" :key="team" :class="`legend-${team}`">
            <LunaIcon :name="teamIconFor(team)" size="sm" />{{ t(`teams.${team}`) }} {{ teamCounts[team] }}
          </span>
        </div>
      </div>
      <div class="setup-balance-bar" aria-hidden="true">
        <i
          v-for="team in TEAM_IDS"
          :key="team"
          :class="teamClassFor(team)"
          :style="{ width: deckSize === 0 ? '0%' : `${(teamCounts[team] / deckSize) * 100}%` }"
        />
      </div>
    </div>

    <div class="setup-cards">
      <div
        v-for="role in ROLE_IDS"
        :key="role"
        class="setup-card"
        :class="[teamClassOf(role), { 'is-on': deck[role] > 0 }]"
      >
        <span class="rcard-art setup-card-art" :class="roleArtClassOf(role)" aria-hidden="true" />
        <div class="setup-card-text">
          <b>{{ t(`roles.${role}`) }}</b>
          <div class="t-small setup-card-team">{{ t(`teams.${ROLE_TEAMS[role]}`) }}</div>
        </div>
        <LunaCounter
          v-model="deck[role]"
          :min="0"
          :max="maxCopiesOf(role)"
          :fewer-label="t('room.setup.fewer', { role: t(`roles.${role}`) })"
          :more-label="t('room.setup.more', { role: t(`roles.${role}`) })"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.setup-row-label {
  display: flex;
  gap: 10px;
  align-items: center;
  font-weight: 700;
}

.setup-deck {
  flex: 999 1 560px;
  min-width: 0;
}

.setup-suggest {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.setup-suggest-count {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setup-balance-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.setup-balance {
  padding: 16px;
  border-radius: 18px;
  background: var(--tint);
  margin-bottom: 16px;
}

.setup-balance-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.setup-balance-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font: 700 13px var(--font-ui);
}

.setup-balance-legend span {
  display: flex;
  gap: 6px;
  align-items: center;
}

.legend-wolves {
  color: var(--team-wolf-text);
}

.legend-village {
  color: var(--team-village-text);
}

.legend-solo {
  color: var(--team-solo-text);
}

.setup-balance-bar {
  display: flex;
  height: 18px;
  border-radius: 99px;
  overflow: hidden;
  gap: 3px;
  background: var(--tint);
}

.setup-balance-bar i {
  background: var(--team);
  transition: width 0.3s;
}

.setup-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 12px;
}

.setup-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  background: var(--tint);
  box-shadow: inset 0 0 0 1px var(--tint-line);
}

.setup-card.is-on {
  box-shadow: inset 0 0 0 2px var(--team);
}

.setup-card-art {
  width: 56px;
  height: 56px;
  box-shadow: 0 0 0 3px var(--team);
}

.setup-card-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
  hyphens: manual;
}

@media (max-width: 420px) {
  .setup-card {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 8px 12px;
    padding: 10px;
  }

  .setup-card-art {
    width: 44px;
    height: 44px;
  }

  .setup-card .counter {
    grid-column: 2;
    justify-self: start;
  }
}

.setup-card-team {
  color: var(--team-text);
}
</style>
