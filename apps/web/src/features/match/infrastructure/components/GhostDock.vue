<script setup lang="ts">
import { GHOST_LIMITS, type HauntKind, type PlayerMatchView } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useMatchStore } from '../../application/useMatchStore'
import { whisperProblem, whisperTargetsFor } from '../../domain/ghosts'
import type { Seat } from '../../domain/seating'
import DockError from './DockError.vue'
import DockHeader from './DockHeader.vue'
import DockNote from './DockNote.vue'
import TargetPicker from './TargetPicker.vue'

const CHOICES = [
  { kind: 'flicker', icon: 'zap' },
  { kind: 'whisper', icon: 'feather' }
] as const satisfies readonly { kind: HauntKind; icon: string }[]

const props = defineProps<{ view: PlayerMatchView; seats: readonly Seat[] }>()
const { t } = useI18n()
const match = useMatchStore()
const kind = ref<HauntKind>('whisper')
const word = ref('')
const targetId = ref<string | null>(null)

const available = computed(() => props.view.you.haunt?.available === true)
const targets = computed(() => whisperTargetsFor(props.seats))
const targetName = computed(() => props.seats.find((seat) => seat.id === targetId.value)?.name ?? '')
const problem = computed(() => whisperProblem(word.value))
const shownProblem = computed(() => (word.value.length === 0 ? null : problem.value))
const ready = computed(() => problem.value === null && targetId.value !== null)

const send = () => {
  if (kind.value === 'flicker') {
    match.haunt({ kind: 'flicker' })
    return
  }
  if (targetId.value !== null && problem.value === null) {
    match.haunt({ kind: 'whisper', targetId: targetId.value, word: word.value.trim() })
  }
}
</script>

<template>
  <section class="ghost">
    <DockNote v-if="!available" icon="ghost" tone="info">{{ t('match.ghost.spent') }}</DockNote>
    <div v-else class="dock ghost-dock">
      <DockHeader icon="ghost" :title="t('match.ghost.dockTitle')">
        <span class="sbadge">{{ t('match.ghost.once') }}</span>
      </DockHeader>
      <div class="ghost-choices">
        <button
          v-for="choice in CHOICES"
          :key="choice.kind"
          type="button"
          class="ghost-choice"
          :class="{ 'is-sel': kind === choice.kind }"
          :aria-pressed="kind === choice.kind"
          @click="kind = choice.kind"
        >
          <LunaIcon :name="choice.icon" size="lg" />{{ t(`match.ghost.${choice.kind}`) }}
          <span class="t-small t-muted ghost-hint">{{ t(`match.ghost.${choice.kind}Hint`) }}</span>
        </button>
      </div>
      <template v-if="kind === 'whisper'">
        <label class="field">
          <span class="label">{{ t('match.ghost.wordLabel') }}</span>
          <input
            v-model="word"
            class="input ghost-word"
            type="text"
            autocomplete="off"
            :maxlength="GHOST_LIMITS.maxWhisperLength"
            :aria-invalid="shownProblem !== null"
          />
        </label>
        <span v-if="shownProblem" class="err" role="alert">
          <LunaIcon name="info" size="sm" />{{ t(`match.ghost.problem.${shownProblem}`) }}
        </span>
        <div class="ghost-to">
          <span class="label">{{ t('match.ghost.to') }}</span>
          <TargetPicker :targets="targets" :selected-id="targetId" @pick="(id) => (targetId = id)" />
        </div>
        <button type="button" class="btn btn-primary btn-block" :disabled="!ready" @click="send">
          {{ ready ? t('match.ghost.send', { word: word.trim(), name: targetName }) : t('match.ghost.choose') }}
        </button>
      </template>
      <button v-else type="button" class="btn btn-primary btn-block" @click="send">
        <LunaIcon name="zap" />{{ t('match.ghost.flickerNow') }}
      </button>
    </div>
    <DockError />
  </section>
</template>

<style scoped>
.ghost {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.ghost-choices {
  display: flex;
  gap: 10px;
}

.ghost-choice {
  flex: 1;
  min-height: 84px;
  border: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--surface-2);
  color: var(--ink);
  font: 700 14px var(--font-ui);
  cursor: pointer;
  box-shadow: inset 0 0 0 1.5px var(--line);
}

.ghost-choice.is-sel {
  background: rgba(185, 195, 255, 0.16);
  box-shadow: inset 0 0 0 2px var(--accent);
}

.ghost-hint {
  font-weight: 500;
}

.ghost-word {
  font-family: var(--font-story);
  font-size: 19px;
  font-style: italic;
}

.ghost-to {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
