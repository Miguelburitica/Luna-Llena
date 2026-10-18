<script setup lang="ts">
import { SCREEN_EFFECTS, SOUND_CUES, type CueInput } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import LunaToggle from '@/shared/infrastructure/ui/components/LunaToggle.vue'
import { useAtmosphereStore } from '../../application/useAtmosphereStore'
import { EFFECT_ICONS, SOUND_ICONS } from '../../domain/soundboard'

const { t, te } = useI18n()
const atmosphere = useAtmosphereStore()

const ambientOn = computed({
  get: () => atmosphere.settings.ambientOn,
  set: (on: boolean) => atmosphere.setAmbientOn(on)
})
const master = computed(() => atmosphere.settings.master)
const failureText = computed(() => {
  const code = atmosphere.failure?.code
  if (code === undefined) return null
  return t(te(`atmosphere.errors.${code}`) ? `atmosphere.errors.${code}` : 'atmosphere.errors.generic')
})

const send = (input: CueInput) => atmosphere.sendCue(input)
const setMaster = (event: Event) => atmosphere.setVolume('master', Number((event.target as HTMLInputElement).value))
</script>

<template>
  <section class="panel soundboard">
    <div class="panel-h">
      <h2 class="h3 soundboard-heading">{{ t('atmosphere.soundboard.title') }}</h2>
      <div class="soundboard-ambient">
        <span class="t-small t-muted">{{ t('atmosphere.soundboard.ambient') }}</span>
        <LunaToggle v-model="ambientOn" :label="t('atmosphere.soundboard.ambientLabel')" />
      </div>
    </div>
    <span v-if="failureText" class="err" role="alert"><LunaIcon name="info" size="sm" />{{ failureText }}</span>
    <div class="soundboard-tiles">
      <button
        v-for="sound in SOUND_CUES"
        :key="sound"
        type="button"
        class="tile"
        :class="{ 'is-playing': atmosphere.playingSound === sound }"
        @click="send({ kind: 'sound', sound })"
      >
        <LunaIcon :name="SOUND_ICONS[sound]" size="lg" />{{ t(`atmosphere.soundboard.sounds.${sound}`) }}
      </button>
    </div>
    <div class="soundboard-volume">
      <LunaIcon name="volume" class="t-muted" />
      <input type="range" min="0" max="100" :value="master" :aria-label="t('atmosphere.soundboard.volume')" @input="setMaster" />
      <span class="t-small t-muted">{{ master }}%</span>
    </div>
  </section>

  <section class="panel soundboard">
    <div class="panel-h">
      <h2 class="h3 soundboard-heading">{{ t('atmosphere.soundboard.effectsTitle') }}</h2>
    </div>
    <div class="soundboard-effects">
      <button v-for="effect in SCREEN_EFFECTS" :key="effect" type="button" class="fx" @click="send({ kind: 'effect', effect })">
        <LunaIcon :name="EFFECT_ICONS[effect]" size="lg" />{{ t(`atmosphere.soundboard.effects.${effect}`) }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.soundboard {
  margin-top: 20px;
}

.soundboard-heading {
  font-size: 18px;
}

.soundboard-ambient {
  display: flex;
  align-items: center;
  gap: 10px;
}

.soundboard-tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.soundboard-volume {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.soundboard-volume input {
  flex: 1;
  accent-color: var(--lantern);
}

.soundboard-effects {
  display: flex;
  gap: 10px;
}

.fx {
  flex: 1;
  min-height: 64px;
  border-radius: 16px;
  border: 0;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 0 1px rgba(233, 230, 255, 0.12);
  color: #eeebff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font: 700 12px var(--font-ui);
  cursor: pointer;
}
</style>
