<script setup lang="ts">
import type { RoomSummary } from '@luna/contracts'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import type { RoomFailure } from '../../application/ports'
import { useRoomAction } from '../../application/useRoomAction'
import { useRoomStore } from '../../application/useRoomStore'
import { isCompleteRoomCode, normalizeRoomCode } from '../../domain/roomCode'
import RoomCodeInput from '../components/RoomCodeInput.vue'
import RoomFailureMessage from '../components/RoomFailureMessage.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useRoomStore()

const fromLink = typeof route.params.code === 'string' && route.params.code !== ''
const code = ref(normalizeRoomCode(fromLink ? String(route.params.code) : ''))
const name = ref('')
const summary = ref<RoomSummary | null>(null)
const lookUpFailure = ref<RoomFailure | null>(null)
const searching = ref(false)
const { failure: joinFailure, pending: joining, run: runJoin, clear: clearJoinFailure } = useRoomAction()

const closedReason = computed<RoomFailure | null>(() => {
  if (summary.value === null || summary.value.acceptingPlayers) return null
  return { code: summary.value.playerCount >= summary.value.capacity ? 'room-full' : 'game-already-started' }
})

const suggestions = computed(() => (joinFailure.value?.code === 'name-taken' ? joinFailure.value.suggestions : []))

const canContinue = computed(
  () => summary.value !== null && closedReason.value === null && name.value.trim() !== '' && !joining.value
)

watch(
  code,
  async (current) => {
    summary.value = null
    lookUpFailure.value = null
    if (!isCompleteRoomCode(current)) return
    searching.value = true
    const result = await store.lookUp(current)
    searching.value = false
    if (current !== code.value) return
    if (result.ok) summary.value = result.value
    else lookUpFailure.value = result.error
  },
  { immediate: true }
)

watch(name, () => clearJoinFailure())

const usePick = (suggestion: string) => {
  name.value = suggestion
}

const join = async () => {
  if (!canContinue.value) return
  const result = await runJoin(() => store.join(code.value, name.value))
  if (result.ok) await router.push({ name: 'lobby', params: { code: result.value.code } })
}
</script>

<template>
  <main class="phone ph-night">
    <header class="join-top">
      <RouterLink :to="{ name: 'home' }" class="btn btn-icon btn-ghost" :aria-label="t('common.back')">
        <LunaIcon name="arrow-left" />
      </RouterLink>
      <span class="t-cap t-muted">{{ t('room.join.step') }}</span>
    </header>

    <form id="join-form" class="join-body" @submit.prevent="join">
      <div>
        <h1 class="h1 join-title">{{ t('room.join.title') }}</h1>
        <p class="t-body t-muted join-intro">{{ fromLink ? t('room.join.introFromLink') : t('room.join.intro') }}</p>
      </div>

      <div class="field">
        <span class="label">{{ t('room.join.code') }}</span>
        <RoomCodeInput v-model="code" />
        <span v-if="searching" class="t-small t-muted">{{ t('room.join.searching') }}</span>
        <span v-else-if="summary" class="sbadge is-ok join-found">
          <LunaIcon name="check" size="sm" />{{ t('room.join.roomFound') }}
        </span>
        <RoomFailureMessage v-else-if="lookUpFailure" :failure="lookUpFailure" />
      </div>

      <div v-if="summary" class="card join-room">
        <span class="art bg-night join-room-art" aria-hidden="true" />
        <div class="join-room-info">
          <div class="h3">{{ summary.name }}</div>
          <div class="t-small t-muted join-room-meta">
            <LunaIcon name="quill" size="sm" />
            {{ t('room.join.narratedBy', { name: summary.narratorName, theme: t(`themes.${summary.theme}.name`) }) }}
          </div>
          <div class="join-room-people">
            <div class="join-room-faces">
              <LunaAvatar
                v-for="avatar in summary.avatarsInUse"
                :key="avatar"
                :avatar="avatar"
                :name="avatar"
                size="xs"
              />
            </div>
            <span class="t-small t-muted">
              {{ t('room.join.joined', { count: summary.playerCount, capacity: summary.capacity }) }}
            </span>
          </div>
        </div>
      </div>
      <RoomFailureMessage v-if="closedReason" :failure="closedReason" />

      <div class="field">
        <label class="label" for="join-name">{{ t('room.join.name') }}</label>
        <input
          id="join-name"
          v-model="name"
          class="input"
          :class="{ 'is-err': joinFailure }"
          :placeholder="t('room.join.namePlaceholder')"
          maxlength="20"
          autocomplete="nickname"
          :aria-invalid="joinFailure !== null"
        >
        <RoomFailureMessage v-if="joinFailure" :failure="joinFailure" :name="name.trim()" />
      </div>

      <div v-if="suggestions.length > 0" class="join-suggestions">
        <span class="label">{{ t('room.join.tryThese') }}</span>
        <div class="join-chips">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            type="button"
            class="chip"
            @click="usePick(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
    </form>

    <footer class="join-footer">
      <button type="submit" form="join-form" class="btn btn-primary btn-lg btn-block" :disabled="!canContinue">
        {{ t('room.join.continue') }}<LunaIcon name="arrow-right" />
      </button>
    </footer>
  </main>
</template>

<style scoped>
.join-top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 12px 0;
}

.join-body {
  padding: 12px 22px 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.join-title {
  font-size: 38px;
}

.join-intro {
  margin: 8px 0 0;
}

.join-found {
  align-self: flex-start;
  margin-top: 4px;
}

.join-room {
  display: flex;
  gap: 14px;
  align-items: center;
}

.join-room-art {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background-color: #1c1f4a;
  background-size: cover;
  flex: none;
}

.join-room-info {
  flex: 1;
  min-width: 0;
}

.join-room-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.join-room-people {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.join-room-faces {
  display: flex;
  padding-left: 7px;
}

.join-room-faces .av {
  margin: 0 0 0 -7px;
}

.join-suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.join-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.join-footer {
  margin-top: auto;
  padding: 20px 22px 22px;
}
</style>
