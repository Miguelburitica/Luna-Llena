<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import SettingsOverlay from '@/features/atmosphere/infrastructure/components/SettingsOverlay.vue'
import { useTableStore } from '@/features/table/application/useTableStore'
import LanguageSwitch from '@/shared/infrastructure/ui/components/LanguageSwitch.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import SlimeWordmark from '@/shared/infrastructure/ui/components/SlimeWordmark.vue'
import { useRoomAction } from '../../application/useRoomAction'
import { useRoomStore } from '../../application/useRoomStore'
import RoomFailureMessage from '../components/RoomFailureMessage.vue'

const { t } = useI18n()
const router = useRouter()
const store = useRoomStore()
const table = useTableStore()
const { failure, pending, run } = useRoomAction()

const returnToSeat = async () => {
  const result = await run(() => store.returnToSeat())
  if (result.ok) await router.push({ name: 'lobby', params: { code: result.value.code } })
}
</script>

<template>
  <main class="phone ph-menu">
    <header class="home-top">
      <LanguageSwitch />
      <SettingsOverlay />
    </header>
    <section class="home-hero">
      <span class="art f-logo a-wobble home-moon" role="img" :aria-label="t('room.home.moon')" />
      <SlimeWordmark class="home-title" />
      <p class="t-story home-tagline">{{ t('room.home.tagline') }}</p>
    </section>
    <div class="home-scene" aria-hidden="true">
      <span class="scene-bg bg-menu" />
      <div class="fog home-fog" />
      <span class="firefly home-firefly-a" />
      <span class="firefly home-firefly-b" />
      <span class="firefly home-firefly-c" />
    </div>
    <nav class="home-actions">
      <RoomFailureMessage v-if="failure" :failure="failure" />
      <button
        v-if="store.savedSeat"
        type="button"
        class="btn btn-primary btn-lg btn-block home-return"
        :disabled="pending"
        @click="returnToSeat"
      >
        <LunaIcon name="arrow-right" />{{ t('room.home.returnToSeat') }}
        <span class="sbadge home-return-code">{{ t('room.home.seatRoom', { code: store.savedSeat.code }) }}</span>
      </button>
      <RouterLink :to="{ name: 'host' }" class="btn btn-lg btn-block" :class="store.savedSeat ? 'btn-secondary' : 'btn-primary'">
        <LunaIcon name="quill" />{{ t('room.home.create') }}
      </RouterLink>
      <RouterLink :to="{ name: 'public-games' }" class="btn btn-secondary btn-lg btn-block home-find">
        <LunaIcon name="globe" />{{ t('room.home.findGame') }}
      </RouterLink>
      <RouterLink :to="{ name: 'join' }" class="btn btn-secondary btn-lg btn-block home-join">
        <LunaIcon name="link" />{{ t('room.home.join') }}
      </RouterLink>
      <RouterLink v-if="table.hasSaved" :to="{ name: 'table-resume' }" class="btn btn-secondary btn-lg btn-block">
        <LunaIcon name="arrow-right" />{{ t('room.home.resumeTable') }}
      </RouterLink>
      <RouterLink :to="{ name: 'table-setup' }" class="btn btn-ghost btn-lg btn-block home-in-person">
        <LunaIcon name="users" />{{ t('room.home.inPerson') }}
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
  margin-top: -6px;
}

.home-tagline {
  margin: 22px 0 0;
  font-size: 22px;
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

.home-return-code {
  margin-left: auto;
}

.home-in-person {
  background: var(--surface);
  color: var(--ink);
  border-color: var(--outline);
  box-shadow: 0 0 0 2px var(--edge), 0 4px 0 var(--outline);
}

@media (max-width: 420px) {
  .home-return {
    flex-wrap: wrap;
    row-gap: 6px;
    padding-block: 10px;
  }

  .home-return-code {
    margin-left: 0;
  }
}
</style>
