<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LunaNotice from '@/shared/infrastructure/ui/components/LunaNotice.vue'
import { useRoomEntry } from '../../application/useRoomEntry'
import { useRoomStore } from '../../application/useRoomStore'
import { normalizeRoomCode } from '../../domain/roomCode'
import NarratorLobby from '../components/NarratorLobby.vue'
import PlayerLobby from '../components/PlayerLobby.vue'
import RoomEndedNotice from '../components/RoomEndedNotice.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useRoomStore()
const code = computed(() => normalizeRoomCode(String(route.params.code)))
const { failure, retry } = useRoomEntry(code)

const snapshot = computed(() => (store.snapshot?.code === code.value ? store.snapshot : null))
const inGame = computed(() => snapshot.value?.status === 'in-game')

watchEffect(() => {
  if (inGame.value) void router.replace({ name: 'game', params: { code: code.value } })
})

const memberId = computed(() => store.session?.memberId ?? '')
</script>

<template>
  <RoomEndedNotice v-if="store.ending" :code="code" :ending="store.ending" />
  <RoomEndedNotice v-else-if="failure && !snapshot" :code="code" :failure="failure" @retry="retry" />
  <LunaNotice v-else-if="!snapshot || inGame" icon="hourglass" :title="t('common.loading')" />
  <NarratorLobby v-else-if="store.isNarrator && snapshot" :snapshot="snapshot" :member-id="memberId" />
  <PlayerLobby v-else-if="snapshot" :snapshot="snapshot" :member-id="memberId" />
</template>
