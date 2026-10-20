<script setup lang="ts">
import type { PublicRoomCard } from '@luna/contracts'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useRoomAction } from '../../application/useRoomAction'
import { usePublicGamesStore } from '../../application/usePublicGamesStore'
import { statusBadgeClassOf } from '../../domain/publicGames'
import RoomFailureMessage from '../components/RoomFailureMessage.vue'

const { t } = useI18n()
const router = useRouter()
const games = usePublicGamesStore()
const { failure: reportFailure, pending: reporting, run } = useRoomAction()
const reportCandidate = ref<PublicRoomCard | null>(null)

onMounted(() => {
  void games.watch()
})

onBeforeUnmount(() => {
  void games.unwatch()
})

const open = (room: PublicRoomCard) => {
  if (room.joinable) void router.push({ name: 'join', params: { code: room.code } })
}

const confirmReport = async () => {
  const target = reportCandidate.value
  if (target === null) return
  const result = await run(() => games.report(target.code))
  if (result.ok) reportCandidate.value = null
}
</script>

<template>
  <main class="phone ph-night">
    <header class="games-top">
      <RouterLink :to="{ name: 'home' }" class="btn btn-icon btn-ghost" :aria-label="t('common.back')">
        <LunaIcon name="arrow-left" />
      </RouterLink>
      <span class="t-cap t-muted">{{ t('room.publicGames.eyebrow') }}</span>
    </header>

    <section class="games-body">
      <div>
        <h1 class="h1 games-title">{{ t('room.publicGames.title') }}</h1>
        <p class="t-body t-muted games-intro">{{ t('room.publicGames.intro') }}</p>
      </div>

      <div class="games-filters">
        <button
          type="button"
          class="chip"
          :class="{ 'is-sel': games.filters.waitingOnly }"
          :aria-pressed="games.filters.waitingOnly"
          @click="games.toggle('waitingOnly')"
        >
          <LunaIcon v-if="games.filters.waitingOnly" name="check" size="sm" />{{ t('room.publicGames.waitingOnly') }}
        </button>
        <button
          type="button"
          class="chip"
          :class="{ 'is-sel': games.filters.freeSeatsOnly }"
          :aria-pressed="games.filters.freeSeatsOnly"
          @click="games.toggle('freeSeatsOnly')"
        >
          <LunaIcon v-if="games.filters.freeSeatsOnly" name="check" size="sm" />{{ t('room.publicGames.freeSeatsOnly') }}
        </button>
      </div>

      <RoomFailureMessage v-if="games.failure" :failure="games.failure" />
      <p v-else-if="!games.loaded" class="t-small t-muted">{{ t('room.publicGames.loading') }}</p>

      <ul v-if="games.visibleRooms.length > 0" class="games-list">
        <li v-for="room in games.visibleRooms" :key="room.code">
          <div
            class="card games-card"
            :class="{ 'is-closed': !room.joinable }"
            :role="room.joinable ? 'link' : undefined"
            :tabindex="room.joinable ? 0 : undefined"
            :aria-disabled="!room.joinable"
            :data-code="room.code"
            @click="open(room)"
            @keydown.enter="open(room)"
          >
            <span class="art bg-night games-card-art" aria-hidden="true" />
            <div class="games-card-info">
              <div class="h3 games-card-name">{{ room.name }}</div>
              <div class="t-small t-muted games-card-meta">
                <LunaIcon name="quill" size="sm" />{{ t('room.publicGames.narratedBy', { name: room.narratorName }) }}
              </div>
              <div class="games-card-facts t-small t-muted">
                <span class="sbadge" :class="statusBadgeClassOf(room.status)">{{ t(`room.publicGames.status.${room.status}`) }}</span>
                <span><LunaIcon name="users" size="sm" />{{ t('room.publicGames.players', { count: room.playerCount, capacity: room.capacity }) }}</span>
                <span v-if="room.botCount > 0"><LunaIcon name="zap" size="sm" />{{ t('room.publicGames.bots', room.botCount) }}</span>
                <span><LunaIcon name="card" size="sm" />{{ t('room.publicGames.cards', { count: room.deckSize }) }}</span>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-icon btn-ghost btn-sm games-report"
              :disabled="games.reported.has(room.code)"
              :aria-label="games.reported.has(room.code) ? t('room.publicGames.reported') : t('room.publicGames.report', { name: room.name })"
              @click.stop="reportCandidate = room"
            >
              <LunaIcon :name="games.reported.has(room.code) ? 'check' : 'hand'" size="sm" />
            </button>
          </div>
        </li>
      </ul>

      <div v-else-if="games.loaded && !games.failure" class="card games-empty" role="status">
        <span class="art f-logo games-empty-art" aria-hidden="true" />
        <div class="h3">{{ t('room.publicGames.emptyTitle') }}</div>
        <p class="t-small t-muted">{{ t('room.publicGames.emptyHint') }}</p>
        <RouterLink :to="{ name: 'host' }" class="btn btn-primary">
          <LunaIcon name="quill" />{{ t('room.publicGames.createRoom') }}
        </RouterLink>
      </div>
    </section>

    <div v-if="reportCandidate" class="modal games-report-modal" role="dialog" aria-modal="false" :aria-label="t('room.publicGames.reportTitle', { name: reportCandidate.name })">
      <h3 class="h3">{{ t('room.publicGames.reportTitle', { name: reportCandidate.name }) }}</h3>
      <p class="t-small t-muted">{{ t('room.publicGames.reportHint') }}</p>
      <RoomFailureMessage v-if="reportFailure" :failure="reportFailure" />
      <div class="games-report-actions">
        <button type="button" class="btn btn-secondary" @click="reportCandidate = null">{{ t('common.cancel') }}</button>
        <button type="button" class="btn btn-danger" :disabled="reporting" @click="confirmReport">
          <LunaIcon name="hand" />{{ t('room.publicGames.reportConfirm') }}
        </button>
      </div>
    </div>

    <footer class="games-footer">
      <RouterLink :to="{ name: 'host' }" class="btn btn-secondary btn-lg btn-block">
        <LunaIcon name="quill" />{{ t('room.publicGames.hostOwn') }}
      </RouterLink>
    </footer>
  </main>
</template>

<style scoped>
.games-top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 12px 0;
}

.games-body {
  padding: 12px 22px 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}

.games-title {
  font-size: 38px;
}

.games-intro {
  margin: 8px 0 0;
}

.games-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.games-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.games-card {
  display: flex;
  gap: 14px;
  align-items: center;
  cursor: pointer;
}

.games-card.is-closed {
  opacity: 0.55;
  cursor: default;
}

.games-card-art {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background-color: #1c1f4a;
  background-size: cover;
  flex: none;
}

.games-card-info {
  flex: 1;
  min-width: 0;
}

.games-card-name {
  min-width: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.games-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.games-card-facts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 8px;
}

.games-card-facts span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.games-report {
  flex: none;
}

.games-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.games-empty p {
  margin: 0;
}

.games-empty-art {
  width: 72px;
  height: 72px;
}

.games-report-modal {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 96px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.games-report-modal p {
  margin: 0;
}

.games-report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.games-footer {
  margin-top: auto;
  padding: 20px 22px 22px;
}
</style>
