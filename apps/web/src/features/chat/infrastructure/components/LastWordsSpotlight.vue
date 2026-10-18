<script setup lang="ts">
import { CHAT_LIMITS } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMatchStore } from '@/features/match/application/useMatchStore'
import { clockText } from '@/features/match/domain/phases'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import { memberWithId } from '@/features/room/domain/lobby'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useLastWords } from '../../application/useLastWords'

const RING_CIRCUMFERENCE = 490

const { t } = useI18n()
const room = useRoomStore()
const match = useMatchStore()
const { spotlight } = useLastWords()

const speaker = computed(() =>
  room.snapshot === null || spotlight.value === null ? null : memberWithId(room.snapshot, spotlight.value.message.authorId)
)
const name = computed(() => speaker.value?.name ?? '')
const revealedRole = computed(
  () => match.view?.players.find((player) => player.id === spotlight.value?.message.authorId)?.revealedRole ?? null
)
const ringOffset = computed(() => {
  const left = spotlight.value?.secondsLeft ?? 0
  return RING_CIRCUMFERENCE * (1 - Math.min(1, left / CHAT_LIMITS.lastWordsSeconds))
})
</script>

<template>
  <div v-if="spotlight" class="phone ph-dawn chat-spotlight" role="status">
    <div class="banner">
      <span class="ph-badge"><LunaIcon name="feather" /></span>
      <div class="chat-spotlight-heading">
        <div class="ph-name">{{ t('chat.lastWords.spotlightTitle') }}</div>
        <div class="ph-sub">{{ t('chat.lastWords.hasTheFloor', { name }) }}</div>
      </div>
    </div>
    <div class="chat-spotlight-speaker">
      <div class="chat-spotlight-ring">
        <svg viewBox="0 0 168 168" width="168" height="168" class="chat-spotlight-svg" aria-hidden="true">
          <circle cx="84" cy="84" r="78" fill="none" stroke="rgba(255,236,220,.18)" stroke-width="6" />
          <circle
            cx="84"
            cy="84"
            r="78"
            fill="none"
            stroke="#FFD08A"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="RING_CIRCUMFERENCE"
            :stroke-dashoffset="ringOffset"
            transform="rotate(-90 84 84)"
          />
        </svg>
        <LunaAvatar :avatar="speaker?.avatar ?? null" :name="name" size="xl" class="is-ghost" />
        <span class="sbadge chat-spotlight-clock">{{ clockText(spotlight.secondsLeft) }}</span>
      </div>
      <div class="t-center">
        <div class="h2 chat-spotlight-name">{{ name }}</div>
        <div class="t-small t-muted">
          <template v-if="revealedRole">{{ t(`roles.${revealedRole}`) }} · </template>{{ t('chat.lastWords.fame', { seconds: CHAT_LIMITS.lastWordsSeconds }) }}
        </div>
      </div>
    </div>
    <blockquote class="parch a-poof chat-spotlight-quote">“{{ spotlight.message.text }}”</blockquote>
    <div class="chat-spotlight-foot">
      <div class="t-center t-small t-muted">{{ t('chat.lastWords.listen') }}</div>
      <div v-if="spotlight.paused" class="locked-note chat-spotlight-note">
        <LunaIcon name="hourglass" size="sm" />{{ t('chat.notes.paused') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-spotlight {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: radial-gradient(ellipse 70% 45% at 50% 34%, #6e4a6e 0%, #2e2552 55%, #16122e 100%);
}

.chat-spotlight-heading {
  flex: 1;
}

.chat-spotlight-speaker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 34px;
}

.chat-spotlight-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 168px;
  height: 168px;
}

.chat-spotlight-svg {
  position: absolute;
  inset: 0;
}

.chat-spotlight-clock {
  position: absolute;
  bottom: -6px;
  background: #2e2552;
  font-weight: 800;
}

.chat-spotlight-name {
  font-size: 28px;
}

.chat-spotlight-quote {
  margin: 24px 18px 0;
  font-size: 28px;
  line-height: 1.25;
  text-align: center;
  padding: 26px 22px;
  overflow-wrap: anywhere;
}

.chat-spotlight-foot {
  margin-top: auto;
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-spotlight-note {
  min-height: 56px;
  border-radius: 18px;
}
</style>
