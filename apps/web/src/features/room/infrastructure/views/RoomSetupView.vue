<script setup lang="ts">
import {
  DEFAULT_ROOM_SETTINGS,
  HOUSE_RULE_IDS,
  PLAYABLE_THEME_IDS,
  ROOM_LIMITS,
  THEME_IDS,
  TIMER_OPTIONS,
  TIMER_PHASES,
  type HouseRuleId,
  type RoleId,
  type RoomSettingsView,
  type ThemeId,
  type TimerPhase
} from '@luna/contracts'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import DeskHeader from '@/shared/infrastructure/ui/components/DeskHeader.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import LunaSegmented from '@/shared/infrastructure/ui/components/LunaSegmented.vue'
import LunaToggle from '@/shared/infrastructure/ui/components/LunaToggle.vue'
import { useRoomAction } from '../../application/useRoomAction'
import { useRoomEntry } from '../../application/useRoomEntry'
import { useRoomStore } from '../../application/useRoomStore'
import { deckSizeOf, timerLabelOf } from '../../domain/lobby'
import { normalizeRoomCode } from '../../domain/roomCode'
import DeckBuilder from '../components/DeckBuilder.vue'
import RoomFailureMessage from '../components/RoomFailureMessage.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useRoomStore()
const { failure, pending, run } = useRoomAction()

const editing = route.name === 'room-settings'
const code = computed(() => normalizeRoomCode(String(route.params.code ?? '')))
const entry = editing ? useRoomEntry(code) : null

const roomName = ref('')
const voiceCallUrl = ref('')
const narratorName = ref('')
const draftOf = (settings: RoomSettingsView) => ({
  theme: settings.theme as ThemeId,
  timers: { ...settings.timers } as Record<TimerPhase, number>,
  houseRules: { ...settings.houseRules } as Record<HouseRuleId, boolean>,
  deck: { ...settings.deck } as Record<RoleId, number>
})

const draft = reactive(draftOf(DEFAULT_ROOM_SETTINGS))

const clampPlayers = (count: number) => Math.min(ROOM_LIMITS.maxPlayers, Math.max(ROOM_LIMITS.minPlayersToStart, count))
const targetPlayers = ref(clampPlayers(deckSizeOf(DEFAULT_ROOM_SETTINGS.deck)))

const adopt = (settings: RoomSettingsView) => Object.assign(draft, draftOf(settings))

if (editing) {
  watch(
    () => store.me,
    (me) => {
      if (me !== null && !me.isNarrator) void router.replace({ name: 'lobby', params: { code: code.value } })
    },
    { immediate: true }
  )
  let adopted = false
  watch(
    () => store.snapshot,
    (snapshot) => {
      if (adopted || snapshot === null || snapshot.code !== code.value) return
      adopt(snapshot.settings)
      targetPlayers.value = clampPlayers(snapshot.startReadiness.playerCount || deckSizeOf(snapshot.settings.deck))
      roomName.value = snapshot.name
      adopted = true
    },
    { immediate: true }
  )
}

const timerOptions = (phase: TimerPhase) =>
  TIMER_OPTIONS[phase].map((seconds) => {
    const label = timerLabelOf(seconds)
    return {
      value: seconds,
      label: label.unit === 'off' ? t('room.setup.off') : t(`room.setup.${label.unit}`, { value: label.value })
    }
  })

const phaseIcons: Record<TimerPhase, string> = { night: 'moon', day: 'sun', vote: 'vote' }

const canSubmit = computed(
  () => !pending.value && (editing || (roomName.value.trim() !== '' && narratorName.value.trim() !== ''))
)

const settingsInput = () => draftOf(draft)

const submit = async () => {
  if (!canSubmit.value) return
  if (editing) {
    const result = await run(() => store.updateSettings(settingsInput()))
    if (result.ok) await router.push({ name: 'lobby', params: { code: code.value } })
    return
  }
  const result = await run(() =>
    store.createRoom({
      roomName: roomName.value,
      narratorName: narratorName.value,
      settings: settingsInput(),
      voiceCallUrl: voiceCallUrl.value.trim() || undefined
    })
  )
  if (result.ok) await router.push({ name: 'lobby', params: { code: result.value.code } })
}

const cancelTarget = computed(() => (editing ? { name: 'lobby', params: { code: code.value } } : { name: 'home' }))
</script>

<template>
  <div class="desk ph-night setup">
    <DeskHeader :trail="editing ? roomName : t('room.setup.newRoom')" />

    <RoomFailureMessage v-if="entry?.failure.value" class="setup-entry-error" :failure="entry.failure.value" />

    <form id="setup-form" class="setup-body" @submit.prevent="submit">
      <div>
        <span class="t-cap t-muted">{{ t('room.setup.step') }}</span>
        <h1 class="h1 setup-title">{{ editing ? t('room.setup.editTitle') : t('room.setup.title') }}</h1>
      </div>

      <div class="setup-columns">
        <div class="setup-side">
          <section v-if="!editing" class="panel setup-names">
            <label class="field">
              <span class="label">{{ t('room.setup.roomName') }}</span>
              <input
                v-model="roomName"
                class="input"
                :maxlength="ROOM_LIMITS.maxRoomNameLength"
                :placeholder="t('room.setup.roomNamePlaceholder')"
              >
            </label>
            <label class="field">
              <span class="label">{{ t('room.setup.yourName') }}</span>
              <input
                v-model="narratorName"
                class="input"
                :maxlength="ROOM_LIMITS.maxNameLength"
                :placeholder="t('room.setup.yourNamePlaceholder')"
                autocomplete="nickname"
              >
            </label>
            <label class="field">
              <span class="label">{{ t('voiceCall.optional') }}</span>
              <input
                v-model="voiceCallUrl"
                class="input"
                inputmode="url"
                autocomplete="off"
                :maxlength="ROOM_LIMITS.maxVoiceCallUrlLength"
                :placeholder="t('voiceCall.placeholder')"
              >
            </label>
          </section>

          <section class="panel">
            <div class="panel-h"><h2 class="h3">{{ t('room.setup.theme') }}</h2></div>
            <div class="setup-themes">
              <button
                v-for="theme in THEME_IDS"
                :key="theme"
                type="button"
                class="setup-theme"
                :class="[`setup-theme-${theme}`, { 'is-on': draft.theme === theme }]"
                :aria-pressed="draft.theme === theme"
                :disabled="!PLAYABLE_THEME_IDS.includes(theme)"
                @click="draft.theme = theme"
              >
                <span v-if="theme === 'classic'" class="art bg-night setup-theme-art" aria-hidden="true" />
                <span v-if="!PLAYABLE_THEME_IDS.includes(theme)" class="is-locked-card setup-theme-art" aria-hidden="true" />
                <span v-if="draft.theme === theme" class="setup-theme-check"><LunaIcon name="check" size="sm" /></span>
                <span v-if="!PLAYABLE_THEME_IDS.includes(theme)" class="sbadge setup-theme-lock">
                  <LunaIcon name="lock" size="sm" />{{ t('room.setup.comingSoon') }}
                </span>
                <b class="t-display setup-theme-name">{{ t(`themes.${theme}.name`) }}</b>
                <span class="t-small setup-theme-tagline">{{ t(`themes.${theme}.tagline`) }}</span>
              </button>
            </div>
          </section>

          <section class="panel">
            <div class="panel-h">
              <h2 class="h3">{{ t('room.setup.timers') }}</h2>
              <span class="t-small t-muted">{{ t('room.setup.timersHint') }}</span>
            </div>
            <div v-for="phase in TIMER_PHASES" :key="phase" class="row-set">
              <span class="setup-row-label"><LunaIcon :name="phaseIcons[phase]" />{{ t(`room.setup.phases.${phase}`) }}</span>
              <LunaSegmented
                v-model="draft.timers[phase]"
                class="setup-seg"
                :options="timerOptions(phase)"
                :label="t(`room.setup.phases.${phase}`)"
              />
            </div>
          </section>

          <section class="panel">
            <div class="panel-h"><h2 class="h3">{{ t('room.setup.houseRules') }}</h2></div>
            <div v-for="rule in HOUSE_RULE_IDS" :key="rule" class="row-set">
              <div>
                <b>{{ t(`room.setup.rules.${rule}.title`) }}</b>
                <div class="t-small t-muted">{{ t(`room.setup.rules.${rule}.hint`) }}</div>
              </div>
              <LunaToggle v-model="draft.houseRules[rule]" :label="t(`room.setup.rules.${rule}.title`)" />
            </div>
          </section>
        </div>

        <DeckBuilder v-model:deck="draft.deck" v-model:players="targetPlayers" />
      </div>
      <RoomFailureMessage v-if="failure" :failure="failure" />
    </form>

    <footer class="setup-footer">
      <span class="t-small t-muted setup-footer-hint">{{ t('room.setup.footerHint') }}</span>
      <RouterLink :to="cancelTarget" class="btn btn-secondary">{{ t('common.cancel') }}</RouterLink>
      <button type="submit" form="setup-form" class="btn btn-primary btn-lg" :disabled="!canSubmit">
        <LunaIcon name="quill" />{{ editing ? t('room.setup.save') : t('room.setup.create') }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.setup {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.setup-entry-error {
  margin: 16px 32px 0;
}

.setup-body {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setup-title {
  font-size: 44px;
  margin-top: 6px;
}

.setup-columns {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}

.setup-side {
  flex: 1 1 380px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setup-names {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setup-themes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.setup-theme {
  position: relative;
  flex: 1 1 220px;
  min-height: 140px;
  border-radius: 20px;
  overflow: hidden;
  border: 0;
  padding: 16px;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  cursor: pointer;
  color: #fff;
}

.setup-theme-classic {
  background: linear-gradient(180deg, #0e1230, #2a2463);
}

.setup-theme-colombia {
  background: linear-gradient(180deg, #0d1e2c, #22483c);
  cursor: not-allowed;
}

.setup-theme.is-on {
  box-shadow: inset 0 0 0 3px var(--lantern);
}

.setup-theme-art {
  position: absolute;
  inset: 0;
  background-size: cover;
  opacity: 0.9;
}

.setup-theme-check {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--lantern);
  color: #1e1230;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setup-theme-lock {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(8, 10, 28, 0.7);
}

.setup-theme-name {
  font-size: 22px;
  position: relative;
}

.setup-theme-tagline {
  position: relative;
  color: #d9d6f5;
}

.setup-theme:disabled .setup-theme-name,
.setup-theme:disabled .setup-theme-tagline {
  opacity: 0.7;
}

.setup-row-label {
  display: flex;
  gap: 10px;
  align-items: center;
  font-weight: 700;
}

.setup-seg {
  width: 260px;
  max-width: 100%;
}

.setup-footer {
  position: sticky;
  bottom: 0;
  margin-top: auto;
  padding: 16px 32px;
  background: rgba(10, 12, 34, 0.92);
  border-top: 1px solid rgba(233, 230, 255, 0.12);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.setup-footer-hint {
  margin-right: auto;
}
</style>
