<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SettingsOverlay from '@/features/atmosphere/infrastructure/components/SettingsOverlay.vue'
import LanguageSwitch from '@/shared/infrastructure/ui/components/LanguageSwitch.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'

const { t } = useI18n()
</script>

<template>
  <main class="phone ph-night">
    <header class="home-top">
      <LanguageSwitch />
      <SettingsOverlay />
    </header>
    <section class="home-hero">
      <span class="art f-logo a-bob home-moon" role="img" :aria-label="t('room.home.moon')" />
      <h1 class="t-display home-title">Luna<br>Llena</h1>
      <p class="t-story home-tagline">{{ t('room.home.tagline') }}</p>
    </section>
    <div class="home-scene" aria-hidden="true">
      <span class="scene-bg bg-night" />
      <div class="fog home-fog" />
      <span class="firefly home-firefly-a" />
      <span class="firefly home-firefly-b" />
      <span class="firefly home-firefly-c" />
    </div>
    <nav class="home-actions">
      <RouterLink :to="{ name: 'host' }" class="btn btn-primary btn-lg btn-block">
        <LunaIcon name="quill" />{{ t('room.home.create') }}
      </RouterLink>
      <RouterLink :to="{ name: 'join' }" class="btn btn-secondary btn-lg btn-block home-join">
        <LunaIcon name="link" />{{ t('room.home.join') }}
      </RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.home-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 0;
}

.home-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
  position: relative;
  z-index: 2;
}

.home-moon {
  width: 150px;
  height: 150px;
}

.home-title {
  margin: 0;
  font-size: 58px;
  font-weight: 900;
  color: var(--moon);
  text-align: center;
  line-height: 0.95;
}

.home-tagline {
  margin: 8px 0 0;
  font-size: 19px;
  font-style: italic;
  color: var(--muted);
  text-align: center;
  max-width: 280px;
}

.home-scene {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 330px;
}

.home-fog {
  bottom: 70px;
}

.home-firefly-a {
  left: 15%;
  top: 120px;
}

.home-firefly-b {
  left: 77%;
  top: 90px;
  animation-delay: 1s;
}

.home-firefly-c {
  left: 51%;
  top: 150px;
  animation-delay: 1.8s;
}

.home-actions {
  margin-top: auto;
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 5;
}

.home-join {
  background: rgba(14, 18, 48, 0.85);
}
</style>
