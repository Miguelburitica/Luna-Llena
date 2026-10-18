<script setup lang="ts">
import { useAtmosphereStore } from '../../application/useAtmosphereStore'

const FOG_LAYERS = ['18%', '46%', '74%']

const atmosphere = useAtmosphereStore()
</script>

<template>
  <div v-if="atmosphere.activeEffects.length" class="screen-effects" aria-hidden="true">
    <template v-for="active in atmosphere.activeEffects" :key="active.id">
      <div v-if="atmosphere.reducedMotion" class="screen-fade" />
      <div v-else-if="active.effect === 'lightning'" class="screen-lightning" />
      <div v-else-if="active.effect === 'fog'" class="screen-fog">
        <span v-for="top in FOG_LAYERS" :key="top" class="fog" :style="{ top }" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.screen-effects {
  position: fixed;
  inset: 0;
  z-index: 60;
  overflow: hidden;
  pointer-events: none;
}

.screen-lightning {
  position: absolute;
  inset: 0;
  background: #fff;
  animation: screen-flash 0.25s ease-out both;
}

.screen-fade {
  position: absolute;
  inset: 0;
  background: rgba(233, 230, 255, 0.18);
}

.screen-fog {
  position: absolute;
  inset: 0;
  animation: screen-fog 6s ease-in-out both;
}

.screen-fog .fog {
  height: 40dvh;
}

@keyframes screen-flash {
  0% {
    opacity: 0.95;
  }

  100% {
    opacity: 0;
  }
}

@keyframes screen-fog {
  0%,
  100% {
    opacity: 0;
  }

  20%,
  80% {
    opacity: 1;
  }
}
</style>
