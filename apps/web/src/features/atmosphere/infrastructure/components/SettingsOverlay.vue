<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/features/chat/application/useChatStore'
import { useMatchStore } from '@/features/match/application/useMatchStore'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import LanguageSwitch from '@/shared/infrastructure/ui/components/LanguageSwitch.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import LunaSegmented from '@/shared/infrastructure/ui/components/LunaSegmented.vue'
import LunaToggle from '@/shared/infrastructure/ui/components/LunaToggle.vue'
import { useAtmosphereStore } from '../../application/useAtmosphereStore'
import { COLOR_MODES, type ColorMode } from '../../domain/colorMode'

const SLIDERS = [
  { channel: 'master', icon: 'volume' },
  { channel: 'music', icon: 'music' },
  { channel: 'effects', icon: 'zap' }
] as const

const { t, tm, rt } = useI18n()
const router = useRouter()
const atmosphere = useAtmosphereStore()
const room = useRoomStore()
const match = useMatchStore()
const chat = useChatStore()

const open = ref(false)
const showingRules = ref(false)
const reducedMotion = computed({
  get: () => atmosphere.settings.reducedMotion,
  set: (reduced: boolean) => atmosphere.setReducedMotion(reduced)
})
const colorMode = computed({
  get: () => atmosphere.settings.colorMode,
  set: (mode: ColorMode) => atmosphere.setColorMode(mode)
})
const colorModeOptions = computed(() =>
  COLOR_MODES.map((value) => ({ value, label: t(`atmosphere.settings.appearanceModes.${value}`) }))
)
const inRoom = computed(() => room.session !== null)
const keepsSeat = computed(() => room.snapshot?.status === 'in-game' && !room.isNarrator)
const rules = computed(() => (tm('atmosphere.settings.howToPlayLines') as string[]).map((line) => rt(line)))

const setVolume = (channel: (typeof SLIDERS)[number]['channel'], event: Event) =>
  atmosphere.setVolume(channel, Number((event.target as HTMLInputElement).value))

const goHome = async () => {
  open.value = false
  await router.push({ name: 'home' })
}

const leave = async () => {
  if (keepsSeat.value) return goHome()
  const result = await room.leave()
  if (!result.ok) return
  match.reset()
  chat.reset()
  await goHome()
}
</script>

<template>
  <button
    type="button"
    class="btn btn-icon btn-ghost"
    :aria-label="t('atmosphere.settings.open')"
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click="open = true"
  >
    <LunaIcon name="sliders" />
  </button>
  <template v-if="open">
    <div class="scrim settings-scrim" @click="open = false" />
    <div class="sheet settings-sheet" role="dialog" aria-modal="true" :aria-label="t('atmosphere.settings.title')">
      <div class="grabber" />
      <div class="settings-head">
        <h1 class="h2">{{ t('atmosphere.settings.title') }}</h1>
        <button type="button" class="btn btn-icon btn-secondary" :aria-label="t('atmosphere.settings.close')" @click="open = false">
          <LunaIcon name="x" />
        </button>
      </div>
      <div class="settings-body">
        <div v-for="slider in SLIDERS" :key="slider.channel" class="field settings-field">
          <label class="h3 settings-label" :for="`atmosphere-${slider.channel}`">
            <LunaIcon :name="slider.icon" />{{ t(`atmosphere.settings.${slider.channel}`) }}
            <span class="t-small t-muted settings-percent">{{ atmosphere.settings[slider.channel] }}%</span>
          </label>
          <input
            :id="`atmosphere-${slider.channel}`"
            type="range"
            min="0"
            max="100"
            :value="atmosphere.settings[slider.channel]"
            @input="setVolume(slider.channel, $event)"
          />
        </div>
        <div class="row-set">
          <div>
            <div class="h3 settings-label"><LunaIcon name="sparkles" />{{ t('atmosphere.settings.reducedMotion') }}</div>
            <div class="t-small t-muted settings-hint">{{ t('atmosphere.settings.reducedMotionHint') }}</div>
          </div>
          <LunaToggle v-model="reducedMotion" :label="t('atmosphere.settings.reducedMotion')" />
        </div>
        <div class="row-set settings-appearance">
          <div class="h3 settings-label"><LunaIcon name="sun" />{{ t('atmosphere.settings.appearance') }}</div>
          <LunaSegmented v-model="colorMode" :options="colorModeOptions" :label="t('atmosphere.settings.appearance')" />
        </div>
        <div class="row-set">
          <div class="h3 settings-label"><LunaIcon name="globe" />{{ t('common.language') }}</div>
          <LanguageSwitch />
        </div>
        <div class="row-set settings-rules-row">
          <div class="h3 settings-label"><LunaIcon name="help" />{{ t('atmosphere.settings.howToPlay') }}</div>
          <button
            type="button"
            class="btn btn-icon btn-ghost"
            :aria-label="t('atmosphere.settings.howToPlayOpen')"
            :aria-expanded="showingRules"
            @click="showingRules = !showingRules"
          >
            <LunaIcon :name="showingRules ? 'chevron-up' : 'arrow-right'" />
          </button>
        </div>
        <ul v-if="showingRules" class="t-small t-muted settings-rules">
          <li v-for="line in rules" :key="line">{{ line }}</li>
        </ul>
      </div>
      <button v-if="inRoom" type="button" class="btn btn-secondary btn-block settings-leave" @click="leave">
        <LunaIcon name="logout" />{{ keepsSeat ? t('atmosphere.settings.backHome') : t('atmosphere.settings.leave') }}
      </button>
    </div>
  </template>
</template>

<style scoped>
.settings-scrim {
  position: fixed;
  z-index: 70;
}

.settings-sheet {
  position: fixed;
  z-index: 71;
  max-width: 480px;
  max-height: 90dvh;
  margin: 0 auto;
  overflow: hidden;
}

.settings-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
}

.settings-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  padding: 0 6px;
}

.settings-body > * {
  flex-shrink: 0;
  min-width: 0;
  max-width: 100%;
}

.settings-field {
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

.settings-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-percent {
  margin-left: auto;
}

.settings-hint {
  margin-left: 32px;
}

.settings-field input {
  width: 100%;
  height: 28px;
  accent-color: var(--lantern);
}

.settings-appearance {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 10px 0;
}

.settings-appearance .seg {
  width: 100%;
}

.settings-rules-row {
  border-bottom: 0;
}

.settings-rules {
  margin: 0 0 8px;
  padding-left: 22px;
}

.settings-leave {
  flex: none;
  margin-top: 8px;
}
</style>
