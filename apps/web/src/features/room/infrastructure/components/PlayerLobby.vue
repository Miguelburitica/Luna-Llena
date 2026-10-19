<script setup lang="ts">
import { ROOM_LIMITS, type AvatarId, type RoomSnapshot } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import JoinCallButton from '@/shared/infrastructure/ui/components/JoinCallButton.vue'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import LunaToggle from '@/shared/infrastructure/ui/components/LunaToggle.vue'
import { useRoomAction } from '../../application/useRoomAction'
import { useRoomStore } from '../../application/useRoomStore'
import { avatarChoices, playersOf } from '../../domain/lobby'
import { useInviteLink } from '../useInviteLink'
import RoomFailureMessage from './RoomFailureMessage.vue'

const props = defineProps<{ snapshot: RoomSnapshot; memberId: string }>()
const { t } = useI18n()
const router = useRouter()
const store = useRoomStore()
const { failure, run } = useRoomAction()
const { copied, copy } = useInviteLink(computed(() => props.snapshot.code))

const choices = computed(() => avatarChoices(props.snapshot, props.memberId))
const me = computed(() => props.snapshot.members.find((member) => member.id === props.memberId))
const playerCount = computed(() => playersOf(props.snapshot).length)

const ready = computed({
  get: () => me.value?.ready ?? false,
  set: (value: boolean) => void run(() => store.setReady(value))
})

const pick = (avatar: AvatarId, mine: boolean) => run(() => store.chooseAvatar(mine ? null : avatar))

const leave = async () => {
  const result = await run(() => store.leave())
  if (result.ok) await router.push({ name: 'home' })
}
</script>

<template>
  <main class="phone ph-night">
    <header class="lobby-top">
      <div class="lobby-title">
        <div class="t-cap t-muted">{{ t('room.lobby.caption', { theme: t(`themes.${snapshot.settings.theme}.name`) }) }}</div>
        <h1 class="h2 lobby-name">{{ snapshot.name }}</h1>
      </div>
      <button type="button" class="btn btn-sm btn-secondary lobby-code" @click="copy">{{ snapshot.code }}</button>
      <button type="button" class="btn btn-icon btn-primary" :aria-label="t('room.lobby.copyInvite')" @click="copy">
        <LunaIcon name="copy" />
      </button>
      <button type="button" class="btn btn-icon btn-ghost" :aria-label="t('room.lobby.leave')" @click="leave">
        <LunaIcon name="logout" />
      </button>
    </header>
    <p v-if="copied" class="t-small lobby-copied" role="status">{{ t('room.lobby.copied') }}</p>
    <div v-if="snapshot.voiceCallUrl" class="lobby-call">
      <JoinCallButton :url="snapshot.voiceCallUrl" />
    </div>
    <div v-if="failure" class="lobby-error"><RoomFailureMessage :failure="failure" /></div>

    <section class="card lobby-looks">
      <div class="lobby-section-head">
        <h2 class="h3">{{ t('room.lobby.pickLook') }}</h2>
        <span class="t-small t-muted">{{ t('room.lobby.onePerPlayer') }}</span>
      </div>
      <div class="lobby-looks-grid">
        <button
          v-for="choice in choices"
          :key="choice.avatar"
          type="button"
          class="pick lobby-pick"
          :class="{ 'is-sel': choice.mine }"
          :disabled="choice.holder !== null && !choice.mine"
          :aria-pressed="choice.mine"
          :aria-label="
            choice.mine
              ? t('room.lobby.yourPick')
              : choice.holder
                ? t('room.lobby.takenBy', { name: choice.holder.name })
                : t('room.lobby.pickAvatar', { avatar: choice.avatar })
          "
          @click="pick(choice.avatar, choice.mine)"
        >
          <span class="av"><span class="face" :class="`f-${choice.avatar}`" /></span>
          <span v-if="choice.mine" class="chk"><LunaIcon name="check" size="sm" /></span>
        </button>
      </div>
    </section>

    <div class="lobby-section-head lobby-people-head">
      <h2 class="h3">{{ t('room.lobby.inVillage') }}</h2>
      <span class="sbadge">{{ playerCount }} / {{ ROOM_LIMITS.maxPlayers }}</span>
    </div>
    <ul class="lobby-people">
      <li
        v-for="member in snapshot.members"
        :key="member.id"
        class="prow lobby-row"
        :class="{ 'is-narrator': member.isNarrator, 'is-me': member.id === memberId }"
      >
        <LunaAvatar
          :avatar="member.avatar"
          :name="member.name"
          size="sm"
          :you="member.id === memberId"
          :bot="member.bot !== null"
          :offline="!member.connected"
          :ring="member.isNarrator ? 'var(--moon)' : undefined"
        />
        <b class="lobby-member">
          {{ member.name }}
          <span v-if="member.isNarrator" class="t-small t-muted">· {{ t('room.lobby.narrator') }}</span>
          <span v-else-if="member.bot" class="t-small t-muted">· {{ t(`room.bots.personalities.${member.bot.personality}`) }}</span>
          <span v-else-if="!member.connected" class="t-small t-muted">· {{ t('room.lobby.reconnecting') }}</span>
          <span v-else-if="member.id === memberId" class="t-small lobby-you">· {{ t('room.lobby.you') }}</span>
        </b>
        <LunaIcon v-if="member.isNarrator" name="quill" class="lobby-quill" />
        <LunaIcon v-else-if="!member.connected" name="wifi-off" class="lobby-offline" />
        <span v-else-if="member.ready" class="sbadge is-ok"><LunaIcon name="check" size="sm" />{{ t('room.lobby.ready') }}</span>
        <span v-else class="sbadge"><LunaIcon name="hourglass" size="sm" />{{ t('room.lobby.notYet') }}</span>
      </li>
    </ul>

    <footer class="lobby-footer">
      <span class="scene-bg bg-night lobby-footer-scene" aria-hidden="true" />
      <span class="firefly lobby-firefly-a" aria-hidden="true" />
      <span class="firefly lobby-firefly-b" aria-hidden="true" />
      <div class="lobby-footer-content">
        <span class="t-story t-center lobby-waiting">{{ t('room.lobby.waiting') }}</span>
        <div class="dock lobby-dock">
          <span class="h3 lobby-dock-label">{{ t('room.lobby.imReady') }}</span>
          <LunaToggle v-model="ready" :label="t('room.lobby.imReady')" />
        </div>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.lobby-top {
  padding: 14px 16px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lobby-title {
  flex: 1;
  min-width: 0;
}

.lobby-name {
  font-size: 22px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lobby-code {
  font: 800 16px var(--font-display);
  letter-spacing: 0.12em;
}

.lobby-copied {
  margin: 0 16px 8px;
  color: var(--ok);
}

.lobby-call {
  display: flex;
  margin: 0 12px 10px;
}

.lobby-call .btn {
  flex: 1;
}

.lobby-error {
  margin: 0 16px 8px;
}

.lobby-looks {
  margin: 0 12px;
  padding: 14px;
}

.lobby-section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.lobby-looks-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.lobby-pick {
  min-height: 64px;
  padding: 6px;
}

.lobby-people-head {
  padding: 14px 16px 6px;
  margin: 0;
}

.lobby-people {
  list-style: none;
  margin: 0;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lobby-row {
  grid-template-columns: 36px minmax(0, 1fr) auto;
  padding: 6px 10px;
}

.lobby-row.is-narrator {
  background: rgba(244, 235, 200, 0.08);
}

.lobby-row.is-me {
  box-shadow: inset 0 0 0 1.5px var(--accent);
}

.lobby-row .av {
  margin: 0;
}

.lobby-member {
  font-size: 15px;
}

.lobby-member .t-small {
  font-weight: 500;
}

.lobby-you {
  color: var(--accent);
}

.lobby-quill {
  color: var(--moon);
}

.lobby-offline {
  color: var(--warn);
}

.lobby-footer {
  margin-top: auto;
  position: relative;
  height: 134px;
  flex: none;
}

.lobby-footer-scene {
  background-size: cover;
  background-position: center 70%;
  opacity: 0.7;
}

.lobby-firefly-a {
  left: 23%;
  top: 40px;
}

.lobby-firefly-b {
  left: 72%;
  top: 30px;
  animation-delay: 1.2s;
}

.lobby-footer-content {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lobby-waiting {
  font-size: 16px;
  font-style: italic;
  color: var(--muted);
}

.lobby-dock {
  margin: 0;
  padding: 10px 10px 10px 18px;
  flex-direction: row;
  align-items: center;
  border-radius: 20px;
}

.lobby-dock-label {
  flex: 1;
}
</style>
