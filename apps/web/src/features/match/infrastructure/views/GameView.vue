<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAtmosphereStore } from '@/features/atmosphere/application/useAtmosphereStore'
import ScreenEffects from '@/features/atmosphere/infrastructure/components/ScreenEffects.vue'
import { useChatStore } from '@/features/chat/application/useChatStore'
import { useRoomEntry } from '@/features/room/application/useRoomEntry'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import { normalizeRoomCode } from '@/features/room/domain/roomCode'
import { readStored, writeStored } from '@/shared/infrastructure/storage/deviceStorage'
import LunaNotice from '@/shared/infrastructure/ui/components/LunaNotice.vue'
import { useMatchStore } from '../../application/useMatchStore'
import { forgetMatchMemory, REVEALED_KEY_PREFIX } from '../matchMemory'
import FlickerOverlay from '../components/FlickerOverlay.vue'
import NarratorDashboard from '../components/NarratorDashboard.vue'
import PlayerTable from '../components/PlayerTable.vue'
import RoleRevealOverlay from '../components/RoleRevealOverlay.vue'
import WhisperToast from '../components/WhisperToast.vue'
import { packMembersOf } from '../../domain/seating'
import GameOverView from './GameOverView.vue'

const isRevealed = (value: unknown): value is true => value === true

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const room = useRoomStore()
const match = useMatchStore()
const chat = useChatStore()
const atmosphere = useAtmosphereStore()
const code = computed(() => normalizeRoomCode(String(route.params.code)))
const entry = useRoomEntry(code)

const revealedKey = computed(() => `${REVEALED_KEY_PREFIX}${code.value}`)
const revealed = ref(readStored(revealedKey.value, isRevealed, 'tab') === true)

const view = computed(() => (match.view?.code === code.value ? match.view : null))
const failure = computed<{ readonly code: string } | null>(() => entry.failure.value ?? match.failure)

const packOf = (packIds: readonly string[]) => packMembersOf(room.snapshot?.members ?? [], packIds)

const dismissReveal = () => {
  writeStored(revealedKey.value, true, 'tab')
  revealed.value = true
}

const inRoom = computed(() => room.session?.code === code.value)

const backToLobby = async () => {
  match.reset()
  chat.reset()
  forgetMatchMemory(code.value)
  revealed.value = false
  await router.replace({ name: 'lobby', params: { code: code.value } })
}

const load = async () => {
  const result = await match.sync()
  if (!result.ok && result.error.code === 'match-not-found') await backToLobby()
}

const reopened = computed(() => room.snapshot?.code === code.value && room.snapshot.status === 'lobby')

const retry = () => (inRoom.value ? load() : entry.retry())

watch(inRoom, (entered) => entered && load(), { immediate: true })
watch(reopened, (isReopened) => isReopened && backToLobby())
</script>

<template>
  <div class="game-root" :class="{ 'a-shake': atmosphere.shaking }">
    <LunaNotice v-if="room.ending" icon="home" :title="t('match.lost.closedTitle')">
      {{ t('match.lost.closedBody') }}
      <template #actions>
        <RouterLink :to="{ name: 'home' }" class="btn btn-secondary btn-block">{{ t('common.backHome') }}</RouterLink>
      </template>
    </LunaNotice>
    <LunaNotice
      v-else-if="failure && !view"
      :icon="failure.code === 'unreachable' ? 'cloud' : 'ghost'"
      :title="failure.code === 'unreachable' ? t('match.lost.unreachableTitle') : t('match.lost.seatLostTitle')"
    >
      {{ failure.code === 'unreachable' ? t('match.lost.unreachableBody') : t('match.lost.seatLostBody', { code }) }}
      <template #actions>
        <button v-if="failure.code === 'unreachable'" type="button" class="btn btn-primary btn-block" @click="retry">
          {{ t('match.lost.tryAgain') }}
        </button>
        <RouterLink v-else :to="{ name: 'join', params: { code } }" class="btn btn-primary btn-block">
          {{ t('match.lost.joinAgain', { code }) }}
        </RouterLink>
        <RouterLink :to="{ name: 'home' }" class="btn btn-secondary btn-block">{{ t('common.backHome') }}</RouterLink>
      </template>
    </LunaNotice>
    <LunaNotice v-else-if="!view" icon="hourglass" :title="t('common.loading')" />
    <GameOverView v-else-if="view.outcome" :view="view" :outcome="view.outcome" />
    <NarratorDashboard v-else-if="view.perspective === 'narrator'" :view="view" />
    <RoleRevealOverlay
      v-else-if="!revealed"
      :role="view.you.role"
      :team="view.you.team"
      :me="room.me"
      :pack="packOf(view.you.packIds)"
      @done="dismissReveal"
    />
    <PlayerTable v-else :view="view" />
  </div>
  <template v-if="view && !view.outcome">
    <FlickerOverlay />
    <WhisperToast />
    <ScreenEffects />
  </template>
</template>
