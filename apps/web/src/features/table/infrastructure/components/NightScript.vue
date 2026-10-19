<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Target } from '@/features/match/domain/night'
import TargetPicker from '@/features/match/infrastructure/components/TargetPicker.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useTableStore } from '../../application/useTableStore'
import { nightScriptOf, PRETEND_SECONDS, type NightPower, type ScriptStep } from '../../domain/nightScript'
import { useTableSeats } from '../useTableSeats'
import VisionCard from './VisionCard.vue'

const POWER_ICONS: Readonly<Record<NightPower, string>> = {
  hunt: 'paw',
  seer: 'eye',
  drunk: 'beer',
  protect: 'shield',
  potions: 'flask'
}

const { t } = useI18n()
const table = useTableStore()
const { seats, nameOf } = useTableSeats()

const script = computed(() => (table.view === null ? [] : nightScriptOf(table.view)))
const chosen = ref<NightPower | null>(null)
const openPower = computed(() => chosen.value ?? script.value.find((step) => step.status === 'pending')?.power ?? null)
const showing = ref<{ name: string; isWolf: boolean } | null>(null)
const pretendLeft = ref<number | null>(null)
let pretendTimer: ReturnType<typeof setInterval> | undefined

const steps = computed(() =>
  script.value.map((step: ScriptStep) => {
    const holderId = step.playerIds[0] ?? ''
    return { ...step, holderId, action: actionOf(holderId) }
  })
)
const living = computed(() => seats.value.filter((seat) => seat.alive))
const actionOf = (id: string | undefined) => (id === undefined ? undefined : table.view?.night?.actions[id])
const offered = (filter: (id: string) => boolean, blockedId: string | null = null): Target[] =>
  living.value.filter((seat) => filter(seat.id)).map((seat) => ({ seat, blocked: seat.id === blockedId ? 'last-night' : null }))

const huntTargets = computed(() => offered((id) => table.view?.roles[id] !== 'werewolf'))
const victimId = computed(() => table.view?.night?.preview.victimId ?? null)

const toggle = (power: NightPower) => {
  chosen.value = openPower.value === power ? null : power
}

const stopPretend = () => {
  clearInterval(pretendTimer)
  pretendLeft.value = null
}

const pretend = () => {
  stopPretend()
  pretendLeft.value = PRETEND_SECONDS
  pretendTimer = setInterval(() => {
    pretendLeft.value = (pretendLeft.value ?? 1) - 1
    if (pretendLeft.value <= 0) stopPretend()
  }, 1000)
}

const showResult = (seerId: string) => {
  const action = actionOf(seerId)
  if (action?.targetId == null || action.visionIsWolf === null) return
  showing.value = { name: nameOf(action.targetId), isWolf: action.visionIsWolf }
}

const logVision = (seerId: string, targetId: string) => {
  if (table.logVision(seerId, targetId).ok) showResult(seerId)
}

const pastVisionsOf = (seerId: string) =>
  (table.match?.visionsOf(seerId) ?? []).filter((vision) => vision.round !== table.view?.round)

const spentOf = (witchId: string) => table.match?.potionsSpentBy(witchId) ?? { heal: false, poison: false }

const brew = (witchId: string, heal: boolean, poisonTargetId: string | null) => table.logPotions(witchId, heal, poisonTargetId)

onBeforeUnmount(stopPretend)
</script>

<template>
  <section class="panel script">
    <div class="panel-h">
      <div>
        <h2 class="h3 script-heading">{{ t('table.night.title') }}</h2>
        <span class="t-small t-muted">{{ t('table.night.hint') }}</span>
      </div>
    </div>
    <ol class="script-steps">
      <li v-for="step in steps" :key="step.power" class="card script-step" :class="`is-${step.status}`">
        <button type="button" class="script-step-head" :aria-expanded="openPower === step.power" @click="toggle(step.power)">
          <LunaIcon :name="POWER_ICONS[step.power]" />
          <span class="script-step-title">
            <b>{{ t(`table.night.powers.${step.power}`) }}</b>
            <span class="t-small t-muted">{{ t('table.night.wake', { names: step.playerIds.map(nameOf).join(', ') }) }}</span>
          </span>
          <span class="sbadge" :class="{ 'is-ok': step.status === 'logged', 'is-warn': step.status === 'pending' }">
            {{ t(`table.night.${step.status}`) }}
          </span>
        </button>

        <div v-if="openPower === step.power" class="script-step-body">
          <template v-if="step.status === 'pretend'">
            <p class="t-small t-muted">{{ t('table.night.pretendHint') }}</p>
            <button type="button" class="btn btn-secondary" :disabled="pretendLeft !== null" @click="pretend">
              <LunaIcon name="hourglass" size="sm" />{{
                pretendLeft === null
                  ? t('table.night.pretendStart', { seconds: PRETEND_SECONDS })
                  : t('table.night.pretendLeft', { seconds: pretendLeft })
              }}
            </button>
          </template>

          <template v-else-if="step.power === 'hunt'">
            <p class="t-small">{{ t('table.night.huntAsk') }}</p>
            <TargetPicker :targets="huntTargets" :selected-id="victimId" @pick="table.logHunt" />
          </template>

          <template v-else-if="step.power === 'seer' || step.power === 'drunk'">
            <p v-if="step.power === 'drunk'" class="sbadge is-warn">
              <LunaIcon name="beer" size="sm" />{{ t('table.night.drunkNote', { name: nameOf(step.holderId) }) }}
            </p>
            <p class="t-small">{{ t('table.night.inspectAsk', { name: nameOf(step.holderId) }) }}</p>
            <TargetPicker
              :targets="offered((id) => id !== step.holderId)"
              :selected-id="step.action?.targetId ?? null"
              :disabled="step.action?.acted === true"
              @pick="(id) => logVision(step.holderId, id)"
            />
            <button
              v-if="step.action?.acted"
              type="button"
              class="btn btn-primary btn-block"
              @click="showResult(step.holderId)"
            >
              <LunaIcon name="eye" />{{ t('table.night.showResult') }}
            </button>
            <div v-if="pastVisionsOf(step.holderId).length" class="script-visions">
              <b class="t-small">{{ t('table.night.pastVisions') }}</b>
              <span v-for="vision in pastVisionsOf(step.holderId)" :key="vision.round" class="t-small t-muted">
                {{
                  t('table.night.vision', {
                    round: vision.round,
                    name: nameOf(vision.targetId),
                    result: vision.isWolf ? t('table.night.isWolf') : t('table.night.notWolf')
                  })
                }}
              </span>
            </div>
          </template>

          <template v-else-if="step.power === 'protect'">
            <p class="t-small">{{ t('table.night.protectAsk', { name: nameOf(step.holderId) }) }}</p>
            <TargetPicker
              :targets="offered(() => true, table.match?.blockedPatientOf(step.holderId) ?? null)"
              :selected-id="step.action?.targetId ?? null"
              @pick="(id) => table.logProtect(step.holderId, id)"
            />
          </template>

          <template v-else-if="step.power === 'potions'">
            <p class="t-body script-victim">
              <LunaIcon name="paw" size="sm" />{{
                victimId ? t('table.night.victim', { name: nameOf(victimId) }) : t('table.night.noVictim')
              }}
            </p>
            <div class="script-potions">
              <button
                type="button"
                class="btn"
                :class="step.action?.heal ? 'btn-primary' : 'btn-secondary'"
                :aria-pressed="step.action?.heal === true"
                :disabled="spentOf(step.holderId).heal || victimId === null"
                @click="
                  brew(step.holderId, !step.action?.heal, step.action?.poisonTargetId ?? null)
                "
              >
                <LunaIcon :name="step.action?.heal ? 'check' : 'heart'" size="sm" />{{ t('table.night.heal') }}
                <span v-if="spentOf(step.holderId).heal" class="t-small t-muted">· {{ t('table.night.spent') }}</span>
              </button>
              <button type="button" class="btn btn-ghost" @click="brew(step.holderId, false, null)">
                {{ t('table.night.nothing') }}
              </button>
            </div>
            <p class="t-small">
              {{ t('table.night.poisonAsk') }}
              <span v-if="spentOf(step.holderId).poison" class="t-muted">· {{ t('table.night.spent') }}</span>
            </p>
            <TargetPicker
              :targets="offered((id) => id !== step.holderId)"
              :selected-id="step.action?.poisonTargetId ?? null"
              :disabled="spentOf(step.holderId).poison"
              @pick="
                (id) =>
                  brew(
                    step.holderId,
                    step.action?.heal ?? false,
                    step.action?.poisonTargetId === id ? null : id
                  )
              "
            />
          </template>
        </div>
      </li>
    </ol>
    <VisionCard v-if="showing" :name="showing.name" :is-wolf="showing.isWolf" @close="showing = null" />
  </section>
</template>

<style scoped>
.script-heading {
  margin: 0;
}

.script-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.script-step {
  padding: 0;
  overflow: hidden;
}

.script-step.is-logged {
  opacity: 0.85;
}

.script-step-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  min-height: var(--touch);
}

.script-step-title {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.script-step-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 14px 14px;
}

.script-step-body p {
  margin: 0;
}

.script-victim {
  display: flex;
  align-items: center;
  gap: 6px;
}

.script-potions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.script-visions {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
