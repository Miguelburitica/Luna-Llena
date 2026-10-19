<script setup lang="ts">
import {
  BOT_DIFFICULTIES,
  BOT_LANGUAGES,
  BOT_LIMITS,
  BOT_PERSONALITIES,
  ROOM_LIMITS,
  type BotDifficulty,
  type BotPersonality,
  type RoomSnapshot
} from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useRoomAction } from '../../application/useRoomAction'
import { useRoomStore } from '../../application/useRoomStore'
import { botsOf, playersOf } from '../../domain/lobby'
import RoomFailureMessage from './RoomFailureMessage.vue'

const props = defineProps<{ snapshot: RoomSnapshot }>()
const { t } = useI18n()
const store = useRoomStore()
const { failure, pending, run } = useRoomAction()

const personality = ref<BotPersonality | null>(null)
const difficulty = ref<BotDifficulty>('normal')

const botCount = computed(() => botsOf(props.snapshot).length)
const canAdd = computed(
  () => botCount.value < BOT_LIMITS.maxBots && playersOf(props.snapshot).length < ROOM_LIMITS.maxPlayers
)

const addBot = () =>
  run(() => store.addBot({ difficulty: difficulty.value, ...(personality.value === null ? {} : { personality: personality.value }) }))
</script>

<template>
  <section class="panel bot-panel">
    <div class="panel-h">
      <h2 class="h3"><LunaIcon name="sparkles" size="sm" /> {{ t('room.bots.title') }}</h2>
      <span class="sbadge">{{ t('room.bots.count', { count: botCount, max: BOT_LIMITS.maxBots }) }}</span>
    </div>
    <p class="t-small t-muted bot-hint">{{ t('room.bots.hint') }}</p>
    <p class="t-small bot-cast">
      <LunaIcon name="scroll" size="sm" />
      {{ snapshot.botCast === null ? t('room.bots.castNext') : t('room.bots.cast', { book: t(`room.bots.casts.${snapshot.botCast}`) }) }}
    </p>

    <span class="label">{{ t('room.bots.personality') }}</span>
    <div class="bot-chips" role="radiogroup" :aria-label="t('room.bots.personality')">
      <button
        type="button"
        role="radio"
        class="chip"
        :class="{ 'is-on': personality === null }"
        :aria-checked="personality === null"
        @click="personality = null"
      >
        {{ t('room.bots.surprise') }}
      </button>
      <button
        v-for="option in BOT_PERSONALITIES"
        :key="option"
        type="button"
        role="radio"
        class="chip"
        :class="{ 'is-on': personality === option }"
        :aria-checked="personality === option"
        @click="personality = option"
      >
        {{ t(`room.bots.personalities.${option}`) }}
      </button>
    </div>

    <span class="label">{{ t('room.bots.difficulty') }}</span>
    <div class="seg" role="radiogroup" :aria-label="t('room.bots.difficulty')">
      <button
        v-for="option in BOT_DIFFICULTIES"
        :key="option"
        type="button"
        role="radio"
        :class="{ 'is-on': difficulty === option }"
        :aria-checked="difficulty === option"
        @click="difficulty = option"
      >
        {{ t(`room.bots.difficulties.${option}`) }}
      </button>
    </div>

    <span class="label">{{ t('room.bots.language') }}</span>
    <div class="seg" role="radiogroup" :aria-label="t('room.bots.language')">
      <button
        v-for="option in BOT_LANGUAGES"
        :key="option"
        type="button"
        role="radio"
        :class="{ 'is-on': snapshot.settings.botLanguage === option }"
        :aria-checked="snapshot.settings.botLanguage === option"
        :disabled="pending"
        @click="run(() => store.updateSettings({ botLanguage: option }))"
      >
        {{ t(`room.bots.languages.${option}`) }}
      </button>
    </div>

    <RoomFailureMessage v-if="failure" :failure="failure" />
    <button type="button" class="btn btn-primary btn-block bot-add" :disabled="!canAdd || pending" @click="addBot">
      <LunaIcon name="plus" />{{ t('room.bots.add') }}
    </button>
  </section>
</template>

<style scoped>
.bot-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bot-panel .panel-h {
  margin-bottom: 0;
}

.bot-hint {
  margin: 0;
}

.bot-cast {
  margin: 0;
  display: flex;
  gap: 6px;
  align-items: center;
  font-weight: 800;
}

.bot-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bot-add {
  margin-top: 6px;
}
</style>
