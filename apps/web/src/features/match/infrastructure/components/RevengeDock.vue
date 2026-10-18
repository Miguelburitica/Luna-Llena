<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { roleArtClassOf } from '@/shared/infrastructure/ui/roleArt'
import { useMatchStore } from '../../application/useMatchStore'
import type { Seat } from '../../domain/seating'
import { revengeTargetsFor } from '../../domain/voting'
import DockError from './DockError.vue'
import DockHeader from './DockHeader.vue'
import TargetPicker from './TargetPicker.vue'

const AIM_COLOR = '#ff6b5e'

const props = defineProps<{ view: PlayerMatchView; seats: readonly Seat[] }>()
const { t } = useI18n()
const match = useMatchStore()
const aimedId = ref<string | null>(null)

const targets = computed(() => revengeTargetsFor(props.view, props.seats))
const aimedName = computed(() => props.seats.find((seat) => seat.id === aimedId.value)?.name ?? '')
const shoot = () => {
  if (aimedId.value !== null) match.avenge(aimedId.value)
}
</script>

<template>
  <section class="revenge">
    <div class="netbar revenge-bar"><LunaIcon name="target" size="sm" />{{ t('match.revenge.everyoneSees') }}</div>
    <div class="revenge-head">
      <span class="art revenge-art" :class="roleArtClassOf('hunter')" role="img" :aria-label="t('roles.hunter')" />
      <h1 class="h1 revenge-title">{{ t('match.revenge.youWere') }}</h1>
      <p class="t-body t-muted revenge-hint">{{ t('match.revenge.lastShot') }}</p>
    </div>
    <div class="dock revenge-dock">
      <DockHeader icon="target" :title="t('match.revenge.dockTitle')" :icon-color="AIM_COLOR" />
      <TargetPicker :targets="targets" :selected-id="aimedId" @pick="(id) => (aimedId = id)" />
      <button type="button" class="btn btn-danger btn-lg btn-block" :disabled="aimedId === null" @click="shoot">
        <LunaIcon name="target" />{{ aimedId === null ? t('match.revenge.choose') : t('match.revenge.take', { name: aimedName }) }}
      </button>
    </div>
    <DockError />
  </section>
</template>

<style scoped>
.revenge {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.revenge-bar {
  justify-content: center;
  background: #ff6b5e;
  color: #2a0a0a;
}

.revenge-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 20px 0;
  text-align: center;
}

.revenge-art {
  width: 140px;
  height: 130px;
}

.revenge-title {
  font-size: 30px;
}

.revenge-hint {
  margin: 0;
}

.revenge-dock {
  box-shadow:
    inset 0 0 0 2px #ff6b5e,
    var(--shadow-2);
}
</style>
