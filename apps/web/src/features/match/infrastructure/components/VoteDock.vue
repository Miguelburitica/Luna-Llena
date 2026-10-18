<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useMatchStore } from '../../application/useMatchStore'
import type { Seat } from '../../domain/seating'
import { voteProgressOf, voteTargetsFor } from '../../domain/voting'
import DockError from './DockError.vue'
import DockHeader from './DockHeader.vue'
import DockNote from './DockNote.vue'
import TargetPicker from './TargetPicker.vue'

const props = defineProps<{ view: PlayerMatchView; seats: readonly Seat[] }>()
const { t } = useI18n()
const match = useMatchStore()

const targets = computed(() => voteTargetsFor(props.view, props.seats))
const progress = computed(() => voteProgressOf(props.view))
const pickedId = computed(() => props.view.you.vote?.targetId ?? null)
const locked = computed(() => props.view.you.vote?.locked === true)
const pickedName = computed(() => props.seats.find((seat) => seat.id === pickedId.value)?.name ?? '')
</script>

<template>
  <div class="vote-dock">
    <div class="dock">
      <DockHeader icon="vote" :title="t('match.vote.title')">
        <span v-if="progress" class="sbadge">
          <LunaIcon name="users" size="sm" />{{ t('match.vote.progress', { voted: progress.voted, voters: progress.voters }) }}
        </span>
      </DockHeader>
      <TargetPicker :targets="targets" :selected-id="pickedId" :disabled="locked" @pick="(id) => match.vote(id)" />
      <template v-if="!locked">
        <button type="button" class="btn btn-primary btn-lg btn-block" :disabled="pickedId === null" @click="match.lockVote()">
          <LunaIcon name="lock" />{{ pickedId === null ? t('match.vote.lock') : t('match.vote.lockOn', { name: pickedName }) }}
        </button>
        <button v-if="pickedId !== null" type="button" class="btn btn-sm btn-ghost btn-block" @click="match.vote(null)">
          {{ t('match.vote.clear') }}
        </button>
        <span v-else class="t-small t-center t-muted">{{ t('match.vote.hint') }}</span>
      </template>
      <DockNote v-else icon="lock">{{ t('match.vote.locked', { name: pickedName }) }}</DockNote>
    </div>
    <DockError />
  </div>
</template>

<style scoped>
.vote-dock {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
</style>
