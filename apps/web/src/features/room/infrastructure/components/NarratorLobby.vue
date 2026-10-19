<script setup lang="ts">
import { ROOM_LIMITS, type MemberView, type RoomSnapshot } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import DeskHeader from '@/shared/infrastructure/ui/components/DeskHeader.vue'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { teamClassOf } from '@/shared/infrastructure/ui/teamClass'
import { useRoomAction } from '../../application/useRoomAction'
import { useRoomStore } from '../../application/useRoomStore'
import { suggestedDeckFor } from '../../domain/deckAdvice'
import { cardsInDeck, namesOf, playersOf, readyPlayerCount } from '../../domain/lobby'
import { useInviteLink } from '../useInviteLink'
import BotPanel from './BotPanel.vue'
import RoomFailureMessage from './RoomFailureMessage.vue'
import VoiceCallPanel from './VoiceCallPanel.vue'

const props = defineProps<{ snapshot: RoomSnapshot; memberId: string }>()
const { t } = useI18n()
const router = useRouter()
const store = useRoomStore()
const { failure, pending, run } = useRoomAction()
const { copied, copy } = useInviteLink(computed(() => props.snapshot.code))
const kickCandidate = ref<MemberView | null>(null)

const readiness = computed(() => props.snapshot.startReadiness)
const players = computed(() => playersOf(props.snapshot))
const deck = computed(() => cardsInDeck(props.snapshot.settings.deck))
const deckMatches = computed(() => !readiness.value.unmet.includes('deck-mismatch'))
const notReadyNames = computed(() => namesOf(props.snapshot, readiness.value.notReadyMemberIds))

const checks = computed(() => [
  { key: 'deck', met: deckMatches.value, label: t('room.narratorLobby.checkDeck') },
  {
    key: 'ready',
    met: !readiness.value.unmet.includes('players-not-ready'),
    label:
      notReadyNames.value.length === 0
        ? t('room.narratorLobby.checkReady')
        : t('room.narratorLobby.checkReadyNamed', { names: notReadyNames.value.join(', ') })
  },
  {
    key: 'wolves',
    met: !readiness.value.unmet.includes('no-wolves'),
    label: t('room.narratorLobby.checkWolves')
  },
  {
    key: 'enough',
    met: !readiness.value.unmet.includes('not-enough-players'),
    label: t('room.narratorLobby.checkEnough', { min: ROOM_LIMITS.minPlayersToStart })
  }
])

const canSuggest = computed(() => readiness.value.playerCount >= ROOM_LIMITS.minPlayersToStart)
const useSuggestedDeck = () => run(() => store.updateSettings({ deck: suggestedDeckFor(readiness.value.playerCount) }))

const statusOf = (member: MemberView) => {
  if (member.bot !== null) {
    return {
      tone: 'ok',
      label: `${t(`room.bots.personalities.${member.bot.personality}`)} · ${t(`room.bots.difficulties.${member.bot.difficulty}`)}`
    }
  }
  if (!member.connected) return { tone: 'warn', label: t('room.narratorLobby.reconnecting') }
  if (member.ready) return { tone: 'ok', label: t('room.narratorLobby.ready') }
  return { tone: 'muted', label: t('room.narratorLobby.notReady') }
}

const confirmKick = async () => {
  const target = kickCandidate.value
  if (target === null) return
  const result = await run(() => store.kick(target.id))
  if (result.ok) kickCandidate.value = null
}

const closeRoom = async () => {
  const result = await run(() => store.leave())
  if (result.ok) await router.push({ name: 'home' })
}
</script>

<template>
  <div class="desk ph-night narrator-lobby">
    <DeskHeader :trail="`${snapshot.name} / ${t('room.narratorLobby.lobby')}`">
      <span class="sbadge narrator-code">{{ snapshot.code }}</span>
      <button type="button" class="btn btn-secondary btn-sm" @click="copy">
        <LunaIcon name="copy" size="sm" />{{ copied ? t('room.lobby.copied') : t('room.lobby.copyInvite') }}
      </button>
      <RouterLink :to="{ name: 'room-settings', params: { code: snapshot.code } }" class="btn btn-secondary btn-sm">
        <LunaIcon name="sliders" size="sm" />{{ t('room.narratorLobby.editSettings') }}
      </RouterLink>
      <button type="button" class="btn btn-ghost btn-sm" @click="closeRoom">
        <LunaIcon name="logout" size="sm" />{{ t('room.narratorLobby.closeRoom') }}
      </button>
    </DeskHeader>

    <div class="narrator-body">
      <section class="panel narrator-village">
        <div class="panel-h">
          <div>
            <h1 class="h2 narrator-heading">{{ t('room.lobby.inVillage') }}</h1>
            <span class="t-small t-muted">
              {{ t('room.narratorLobby.summary', { players: players.length, ready: readyPlayerCount(snapshot) }) }}
            </span>
          </div>
          <span class="t-small t-muted narrator-note">
            <LunaIcon name="info" size="sm" />{{ t('room.narratorLobby.playersSeeThis') }}
          </span>
        </div>
        <RoomFailureMessage v-if="failure" :failure="failure" />
        <ul class="narrator-grid">
          <li v-for="member in snapshot.members" :key="member.id" class="pcard" :class="{ 'is-narrator': member.isNarrator, 'is-offline': !member.connected }">
            <LunaAvatar
              :avatar="member.avatar"
              :name="member.name"
              size="md"
              :offline="!member.connected"
              :bot="member.bot !== null"
              :ring="member.isNarrator ? 'var(--moon)' : undefined"
            />
            <div class="pcard-text">
              <b>{{ member.name }}</b>
              <div v-if="member.isNarrator" class="t-small narrator-self">
                <LunaIcon name="quill" size="sm" />{{ t('room.narratorLobby.narratorYou') }}
              </div>
              <div v-else class="t-small" :class="`tone-${statusOf(member).tone}`">{{ statusOf(member).label }}</div>
            </div>
            <button
              v-if="member.bot !== null"
              type="button"
              class="btn btn-icon btn-ghost"
              :aria-label="t('room.bots.remove', { name: member.name })"
              :disabled="pending"
              @click="run(() => store.removeBot(member.id))"
            >
              <LunaIcon name="x" />
            </button>
            <button
              v-else-if="!member.isNarrator"
              type="button"
              class="btn btn-icon"
              :class="member.connected ? 'btn-ghost' : 'btn-danger'"
              :aria-label="t('room.narratorLobby.kick', { name: member.name })"
              @click="kickCandidate = member"
            >
              <LunaIcon name="user-x" />
            </button>
          </li>
          <li class="pcard narrator-waiting">
            <LunaIcon name="link" /><span class="t-small">{{ t('room.narratorLobby.waitingMore', { code: snapshot.code }) }}</span>
          </li>
        </ul>

        <div v-if="kickCandidate" class="modal narrator-kick" role="dialog" aria-modal="false" :aria-label="t('room.narratorLobby.kickTitle', { name: kickCandidate.name })">
          <h3 class="h3 narrator-kick-title">
            <LunaAvatar :avatar="kickCandidate.avatar" :name="kickCandidate.name" size="sm" />
            {{ t('room.narratorLobby.kickTitle', { name: kickCandidate.name }) }}
          </h3>
          <p class="t-small t-muted narrator-kick-body">{{ t('room.narratorLobby.kickBody') }}</p>
          <div class="narrator-kick-actions">
            <button type="button" class="btn btn-secondary btn-sm" @click="kickCandidate = null">{{ t('common.cancel') }}</button>
            <button type="button" class="btn btn-danger btn-sm" :disabled="pending" @click="confirmKick">
              {{ t('room.narratorLobby.kick', { name: kickCandidate.name }) }}
            </button>
          </div>
        </div>
      </section>

      <aside class="narrator-aside">
        <VoiceCallPanel :url="snapshot.voiceCallUrl" :code="snapshot.code" />

        <BotPanel :snapshot="snapshot" />

        <section class="panel" :class="{ 'is-mismatch': !deckMatches }">
          <div class="panel-h">
            <h2 class="h3">{{ t('room.narratorLobby.deckVsPlayers') }}</h2>
            <span v-if="deckMatches" class="sbadge is-ok"><LunaIcon name="check" size="sm" />{{ t('room.narratorLobby.match') }}</span>
            <span v-else class="sbadge is-warn"><LunaIcon name="x" size="sm" />{{ t('room.narratorLobby.mismatch') }}</span>
          </div>
          <div class="narrator-ratio">
            <b class="t-display">{{ readiness.deckSize }}</b><span class="t-muted">{{ t('room.narratorLobby.roles') }}</span>
            <span class="t-display narrator-slash">/</span>
            <b class="t-display">{{ readiness.playerCount }}</b><span class="t-muted">{{ t('room.narratorLobby.players') }}</span>
          </div>
          <p v-if="!deckMatches" class="t-small narrator-mismatch">
            {{ t('room.narratorLobby.mismatchHint', { deck: readiness.deckSize, players: readiness.playerCount }) }}
          </p>
          <div class="narrator-deck">
            <span v-for="card in deck" :key="card.role" class="tbadge" :class="teamClassOf(card.role)">
              {{ card.count > 1 ? `${card.count} ` : '' }}{{ t(`roles.${card.role}`) }}
            </span>
          </div>
          <div class="narrator-deck-actions">
            <button type="button" class="btn btn-secondary btn-sm" :disabled="!canSuggest || pending" @click="useSuggestedDeck">
              <LunaIcon name="wand" size="sm" />{{ t('room.narratorLobby.useSuggested', { players: readiness.playerCount }) }}
            </button>
            <RouterLink :to="{ name: 'room-settings', params: { code: snapshot.code } }" class="btn btn-ghost btn-sm">
              {{ t('room.narratorLobby.editDeck') }}
            </RouterLink>
          </div>
        </section>

        <section class="panel">
          <div class="panel-h"><h2 class="h3">{{ t('room.narratorLobby.beforeStart') }}</h2></div>
          <ul class="narrator-checks t-small">
            <li v-for="check in checks" :key="check.key" :class="check.met ? 'tone-ok' : 'tone-bad'">
              <LunaIcon :name="check.met ? 'check' : 'x'" size="sm" />{{ check.label }}
            </li>
          </ul>
          <button
            type="button"
            class="btn btn-primary btn-lg btn-block narrator-start"
            :disabled="!readiness.canStart || pending"
            @click="run(() => store.start())"
          >
            <LunaIcon name="play" />{{ t('room.narratorLobby.start') }}
          </button>
          <span class="t-small t-muted t-center narrator-start-hint">{{ t('room.narratorLobby.startHint') }}</span>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.narrator-lobby {
  min-height: 100dvh;
}

.narrator-code {
  font: 800 15px var(--font-display);
  letter-spacing: 0.12em;
  padding: 8px 14px;
}

.narrator-body {
  max-width: 1360px;
  margin: 0 auto;
  padding: 28px 32px 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}

.narrator-village {
  flex: 999 1 640px;
  min-width: 0;
}

.narrator-heading {
  font-size: 30px;
}

.narrator-note {
  display: flex;
  gap: 6px;
  align-items: center;
}

.narrator-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.pcard {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 0 0 1px rgba(233, 230, 255, 0.1);
}

.pcard .av {
  margin: 0;
}

.pcard.is-narrator {
  box-shadow: inset 0 0 0 1.5px var(--moon);
}

.pcard.is-offline {
  box-shadow: inset 0 0 0 1.5px var(--warn);
}

.pcard-text {
  flex: 1;
  min-width: 0;
}

.narrator-self {
  color: var(--moon);
  display: flex;
  gap: 4px;
  align-items: center;
}

.tone-ok {
  color: var(--ok);
}

.tone-warn {
  color: var(--warn);
}

.tone-muted {
  color: var(--muted);
}

.tone-bad {
  color: #ff9c92;
}

.narrator-waiting {
  border: 1.5px dashed rgba(233, 230, 255, 0.2);
  box-shadow: none;
  justify-content: center;
  color: var(--muted);
}

.narrator-kick {
  position: relative;
  left: auto;
  right: auto;
  margin-top: 16px;
  max-width: 420px;
  background: #1a1e48;
  padding: 18px;
  box-shadow: inset 0 0 0 1.5px var(--danger), var(--shadow-2);
}

.narrator-kick-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.narrator-kick-title .av {
  margin: 0;
}

.narrator-kick-body {
  margin: 6px 0 14px;
}

.narrator-kick-actions {
  display: flex;
  gap: 8px;
}

.narrator-kick-actions .btn {
  flex: 1;
}

.narrator-aside {
  flex: 1 1 360px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel.is-mismatch {
  box-shadow: inset 0 0 0 1.5px var(--warn);
}

.narrator-ratio {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.narrator-ratio b {
  font-size: 42px;
}

.narrator-slash {
  font-size: 28px;
  color: var(--muted);
}

.narrator-mismatch {
  margin: 8px 0 14px;
  color: #ff9c92;
}

.narrator-deck {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 14px 0;
}

.narrator-deck-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.narrator-checks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.narrator-checks li {
  display: flex;
  gap: 8px;
  align-items: center;
}

.narrator-start {
  margin-top: 18px;
}

.narrator-start-hint {
  display: block;
  margin-top: 8px;
}
</style>
