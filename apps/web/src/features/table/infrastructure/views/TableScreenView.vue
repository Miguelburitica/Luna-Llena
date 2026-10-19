<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAtmosphereStore } from '@/features/atmosphere/application/useAtmosphereStore'
import ScreenEffects from '@/features/atmosphere/infrastructure/components/ScreenEffects.vue'
import { clockText, phaseLook, sceneBackgroundOf } from '@/features/match/domain/phases'
import DawnAnnouncement from '@/features/match/infrastructure/components/DawnAnnouncement.vue'
import VerdictReveal from '@/features/match/infrastructure/components/VerdictReveal.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useTableCountdown } from '../../application/useTableCountdown'
import { useTableGuard } from '../../application/useTableGuard'
import { useTableScene } from '../../application/useTableScene'
import { useTableStore } from '../../application/useTableStore'
import HoldButton from '../components/HoldButton.vue'
import { useTableSeats } from '../useTableSeats'

const { t } = useI18n()
const router = useRouter()
const table = useTableStore()
const atmosphere = useAtmosphereStore()
useTableGuard(['table'])
useTableScene()
const { seconds, timeUp } = useTableCountdown(() => atmosphere.alertTimeUp())
const { seats } = useTableSeats()

const view = computed(() => table.view)
const look = computed(() => (view.value === null ? null : phaseLook(view.value.phase)))
const publicSeats = computed(() => seats.value.map((seat) => ({ ...seat, isPack: false })))
</script>

<template>
  <main v-if="view && look" class="phone stage" :class="[look.phaseClass, { 'a-shake': atmosphere.shaking }]">
    <div class="stage-scene" aria-hidden="true">
      <span class="scene-bg" :class="sceneBackgroundOf(view.phase)" />
      <div class="fog stage-fog" />
      <span class="firefly stage-firefly" />
    </div>
    <header class="stage-head">
      <span class="sbadge stage-phase">
        <LunaIcon :name="look.icon" size="sm" />{{ t('table.logbook.phaseRound', { phase: t(`match.phases.${view.phase}`), round: view.round }) }}
      </span>
      <b v-if="seconds !== null" class="t-display stage-clock" role="timer">{{ clockText(seconds) }}</b>
      <b v-if="timeUp" class="h2" role="alert">{{ t('table.logbook.timeUp') }}</b>
    </header>
    <section class="stage-news">
      <DawnAnnouncement v-if="view.phase === 'dawn' && view.dawn" :view="view" :seats="publicSeats" />
      <VerdictReveal v-else-if="view.phase === 'execution' && view.verdict" :view="view" :seats="publicSeats" />
    </section>
    <footer class="stage-foot">
      <HoldButton :label="t('table.stage.back')" icon="scroll" @held="router.push({ name: 'table' })" />
    </footer>
    <ScreenEffects />
  </main>
</template>

<style scoped>
.stage {
  padding: 16px;
  gap: 16px;
}

.stage-scene {
  position: absolute;
  inset: 0;
}

.stage-fog {
  bottom: 120px;
}

.stage-firefly {
  left: 30%;
  top: 40%;
}

.stage-head,
.stage-news,
.stage-foot {
  position: relative;
  z-index: 5;
}

.stage-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 24px;
  text-align: center;
}

.stage-clock {
  font-size: 72px;
}

.stage-news {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
