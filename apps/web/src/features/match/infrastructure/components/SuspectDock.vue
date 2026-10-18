<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useMatchStore } from '../../application/useMatchStore'
import { offeredTargetsFor, type NightViewOf } from '../../domain/night'
import type { Seat } from '../../domain/seating'
import DockHeader from './DockHeader.vue'
import TargetPicker from './TargetPicker.vue'

const props = defineProps<{ view: PlayerMatchView; night: NightViewOf<'suspect'>; seats: readonly Seat[] }>()
const { t } = useI18n()
const match = useMatchStore()
const changing = ref(false)

const targets = computed(() => offeredTargetsFor(props.view, props.seats))
const suspect = computed(() => props.seats.find((seat) => seat.id === props.night.targetId))
const choosing = computed(() => suspect.value === undefined || changing.value)

const pick = async (id: string) => {
  const result = await match.act({ kind: 'suspect', targetId: id })
  if (result.ok) changing.value = false
}
</script>

<template>
  <div class="dock">
    <template v-if="choosing">
      <DockHeader icon="help" :title="t('match.night.suspect.title')" />
      <TargetPicker :targets="targets" :selected-id="night.targetId" @pick="pick" />
    </template>
    <div v-else class="suspect-done">
      <span class="a-bob suspect-moon"><LunaIcon name="zz" size="xl" /></span>
      <h2 class="h2 suspect-title">{{ t('match.night.suspect.done') }}</h2>
      <p class="t-small t-muted suspect-hint">{{ t('match.night.suspect.doneHint') }}</p>
      <div v-if="suspect" class="suspect-chosen">
        <LunaAvatar :avatar="suspect.avatar" :name="suspect.name" size="sm" class="suspect-avatar" />
        <span class="t-small">{{ t('match.night.suspect.suspecting', { name: suspect.name }) }}</span>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" @click="changing = true">
        <LunaIcon name="edit" size="sm" />{{ t('match.night.suspect.change') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.suspect-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 10px 0;
}

.suspect-moon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(244, 235, 200, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--moon);
}

.suspect-title {
  font-size: 26px;
}

.suspect-hint {
  margin: 0;
  max-width: 280px;
}

.suspect-chosen {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px 8px 8px;
  border-radius: 99px;
  background: var(--surface-2);
}

.suspect-avatar {
  margin: 0;
}
</style>
