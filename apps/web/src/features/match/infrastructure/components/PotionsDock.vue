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
import DockNote from './DockNote.vue'
import TargetPicker from './TargetPicker.vue'

const VICTIM_RING = '#ff6b5e'

const props = defineProps<{ view: PlayerMatchView; night: NightViewOf<'potions'>; seats: readonly Seat[] }>()
const { t } = useI18n()
const match = useMatchStore()
const choosingPoison = ref(false)

const seatOf = (id: string | null): Seat | undefined => props.seats.find((seat) => seat.id === id)
const victim = computed(() => seatOf(props.night.victimId))
const poisoned = computed(() => seatOf(props.night.poisonTargetId))
const targets = computed(() => offeredTargetsFor(props.view, props.seats))
const canHeal = computed(() => props.night.healAvailable && props.night.victimId !== null)
const healHint = computed(() => {
  if (!props.night.healAvailable) return t('match.night.potions.healSpent')
  if (victim.value === undefined) return t('match.night.potions.healNoVictim')
  return props.night.heal
    ? t('match.night.potions.healing', { name: victim.value.name })
    : t('match.night.potions.healReady')
})
const poisonHint = computed(() => {
  if (!props.night.poisonAvailable) return t('match.night.potions.poisonSpent')
  return poisoned.value
    ? t('match.night.potions.poisoning', { name: poisoned.value.name })
    : t('match.night.potions.poisonReady')
})
const decidedNothing = computed(
  () => props.night.acted && !props.night.heal && props.night.poisonTargetId === null
)

const choose = (heal: boolean, poisonTargetId: string | null) =>
  match.act({ kind: 'potions', heal, poisonTargetId })

const pickPoison = async (id: string) => {
  const result = await choose(props.night.heal, props.night.poisonTargetId === id ? null : id)
  if (result.ok) choosingPoison.value = false
}
</script>

<template>
  <div class="dock">
    <div class="result potions-victim">
      <LunaAvatar
        v-if="victim"
        :avatar="victim.avatar"
        :name="victim.name"
        size="md"
        :ring="VICTIM_RING"
        class="potions-avatar"
      />
      <div class="potions-said">
        <div class="t-story potions-coming">{{ t('match.night.potions.coming') }}</div>
        <b class="t-display potions-name">{{ victim?.name ?? t('match.night.potions.nobody') }}</b>
      </div>
    </div>

    <div class="potions-grid">
      <button
        type="button"
        class="potion potion-heal"
        :class="{ 'is-on': night.heal }"
        :disabled="!canHeal"
        :aria-pressed="night.heal"
        @click="choose(!night.heal, night.poisonTargetId)"
      >
        <LunaIcon name="heart" size="lg" />
        <b class="potion-name" :class="{ 'is-spent': !night.healAvailable }">{{ t('match.night.potions.heal') }}</b>
        <span class="t-small">{{ healHint }}</span>
      </button>
      <button
        type="button"
        class="potion potion-poison"
        :class="{ 'is-on': night.poisonTargetId !== null }"
        :disabled="!night.poisonAvailable"
        :aria-expanded="choosingPoison"
        @click="choosingPoison = !choosingPoison"
      >
        <LunaIcon name="flask" size="lg" />
        <b class="potion-name" :class="{ 'is-spent': !night.poisonAvailable }">{{ t('match.night.potions.poison') }}</b>
        <span class="t-small">{{ poisonHint }}</span>
      </button>
    </div>

    <template v-if="choosingPoison && night.poisonAvailable">
      <DockHeader icon="flask" :title="t('match.night.potions.poisonTitle')" icon-color="#d9a8f2" />
      <TargetPicker :targets="targets" :selected-id="night.poisonTargetId" @pick="pickPoison" />
    </template>

    <DockNote v-if="decidedNothing">{{ t('match.night.potions.chosenNothing') }}</DockNote>
    <button type="button" class="btn btn-ghost btn-block potions-nothing" @click="choose(false, null)">
      {{ t('match.night.potions.nothing') }}
    </button>
  </div>
</template>

<style scoped>
.potions-victim {
  padding: 10px 12px;
}

.potions-avatar {
  margin: 0;
}

.potions-said {
  flex: 1;
}

.potions-coming {
  font-size: 15px;
  font-style: italic;
  color: #6a4e30;
}

.potions-name {
  font-size: 22px;
}

.potions-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.potion {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  border: 0;
  text-align: left;
  cursor: pointer;
  min-height: 132px;
  font-family: var(--font-ui);
  background: rgba(255, 255, 255, 0.05);
  color: var(--ink);
  box-shadow: inset 0 0 0 1.5px var(--line);
}

.potion-heal.is-on {
  background: linear-gradient(160deg, #1f5a45, #123a2c);
  color: #e6fff3;
  box-shadow:
    inset 0 0 0 2px #5fd39a,
    0 4px 0 #0b2219;
}

.potion-poison {
  background: linear-gradient(160deg, #4a2a6e, #2e1a4a);
  color: #f4ecff;
  box-shadow:
    inset 0 0 0 2px #c98be8,
    0 4px 0 #1a0e2e;
}

.potion:disabled {
  background: rgba(255, 255, 255, 0.05);
  color: var(--muted);
  box-shadow: inset 0 0 0 1.5px var(--line);
  cursor: not-allowed;
  opacity: 0.6;
}

.potion-name {
  font-size: 17px;
}

.potion-name.is-spent {
  text-decoration: line-through;
}

.potions-nothing {
  min-height: 44px;
  color: var(--muted);
}
</style>
