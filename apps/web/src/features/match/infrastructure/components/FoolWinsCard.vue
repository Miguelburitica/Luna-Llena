<script setup lang="ts">
import type { Verdict } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { readStored, writeStored } from '@/shared/infrastructure/storage/deviceStorage'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { roleArtClassOf } from '@/shared/infrastructure/ui/roleArt'
import { teamClassFor, teamIconFor } from '@/shared/infrastructure/ui/teamClass'
import type { Seat } from '../../domain/seating'
import { FOOL_KEY_PREFIX } from '../matchMemory'

const CONFETTI = [
  { left: 40, top: 90, color: '#ffe27a', delay: 0 },
  { left: 320, top: 120, color: '#5fb3a1', delay: 0.4 },
  { left: 80, top: 300, color: '#e0565b', delay: 0.8 },
  { left: 300, top: 340, color: '#f2a541', delay: 0.2 },
  { left: 190, top: 60, color: '#d9a8f2', delay: 1 },
  { left: 350, top: 230, color: '#ffe27a', delay: 0.6 }
]

const isDismissed = (value: unknown): value is true => value === true

const props = defineProps<{ code: string; verdict: Verdict; seats: readonly Seat[] }>()
const { t } = useI18n()

const dismissedKey = computed(() => `${FOOL_KEY_PREFIX}${props.code}.${props.verdict.round}`)
const dismissed = ref(readStored(dismissedKey.value, isDismissed, 'tab') === true)
const fool = computed(() => props.seats.find((seat) => seat.id === props.verdict.executedId))

const dismiss = () => {
  writeStored(dismissedKey.value, true, 'tab')
  dismissed.value = true
}
</script>

<template>
  <div v-if="!dismissed" class="fool" role="dialog" aria-modal="true" :aria-label="t('match.win.solo')">
    <div class="phone fool-stage">
      <span
        v-for="piece in CONFETTI"
        :key="piece.left"
        class="a-sway fool-confetti"
        aria-hidden="true"
        :style="{ left: `${piece.left}px`, top: `${piece.top}px`, background: piece.color, animationDelay: `${piece.delay}s` }"
      />
      <div class="fool-badge">
        <span class="tbadge" :class="teamClassFor('solo')"><LunaIcon :name="teamIconFor('solo')" size="sm" />{{ t('match.fool.badge') }}</span>
      </div>
      <div class="fool-hero">
        <span class="art a-bob fool-art" :class="roleArtClassOf('fool')" role="img" :aria-label="t('roles.fool')" />
        <h1 class="t-display fool-title">{{ t('match.win.solo') }}</h1>
      </div>
      <div v-if="fool" class="fool-who">
        <LunaAvatar :avatar="fool.avatar" :name="fool.name" size="lg" class="fool-avatar">
          <span class="av-badge b-left fool-crown"><LunaIcon name="crown" size="sm" /></span>
        </LunaAvatar>
        <div>
          <div class="h2 fool-name">{{ fool.name }}</div>
          <div class="t-small t-muted">{{ t('match.fool.wanted', { name: fool.name }) }}</div>
        </div>
      </div>
      <footer class="fool-foot">
        <div class="card fool-note">
          <LunaIcon name="quill" class="fool-quill" />
          <span class="t-small">{{ t('match.fool.continues') }}</span>
        </div>
        <button type="button" class="btn btn-primary btn-lg btn-block" @click="dismiss">{{ t('match.fool.back') }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.fool {
  position: fixed;
  inset: 0;
  z-index: 40;
  overflow-y: auto;
  background: #1a0a2a;
}

.fool-stage {
  --accent: #ffe27a;
  --accent-ink: #2a1040;
  background: radial-gradient(ellipse at 50% 35%, #7a3fa0 0%, #3a1a52 55%, #1a0a2a 100%);
}

.fool-confetti {
  position: absolute;
  display: block;
  width: 9px;
  height: 14px;
  border-radius: 2px;
}

.fool-badge {
  display: flex;
  justify-content: center;
  padding: 20px 20px 0;
}

.fool-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  text-align: center;
}

.fool-art {
  width: 230px;
  height: 230px;
}

.fool-title {
  margin: 0;
  font-size: 52px;
  font-weight: 900;
  color: #ffe27a;
}

.fool-who {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 22px 20px 0;
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1.5px #d9a8f2;
}

.fool-avatar {
  margin: 0;
  flex: none;
  --ring: #d9a8f2;
}

.fool-crown {
  background: #ffe27a;
}

.fool-name {
  font-size: 24px;
}

.fool-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding: 24px 16px 18px;
}

.fool-note {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(20, 10, 40, 0.6);
}

.fool-quill {
  color: #ffe27a;
}
</style>
