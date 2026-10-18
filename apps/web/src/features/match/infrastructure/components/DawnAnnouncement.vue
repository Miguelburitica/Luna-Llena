<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import RoleCard from '@/shared/infrastructure/ui/components/RoleCard.vue'
import { deathsAnnouncement } from '../../domain/night'
import type { Seat } from '../../domain/seating'

const props = defineProps<{ view: PlayerMatchView; seats: readonly Seat[] }>()
const { t } = useI18n()

const deaths = computed(() =>
  (deathsAnnouncement(props.view) ?? []).map((death) => ({
    ...death,
    seat: props.seats.find((seat) => seat.id === death.id)
  }))
)
</script>

<template>
  <div v-if="deaths.length" class="dawn-deaths">
    <div v-for="death in deaths" :key="death.id" class="card a-poof dawn-death">
      <LunaAvatar
        :avatar="death.seat?.avatar ?? null"
        :name="death.seat?.name ?? ''"
        size="md"
        class="is-dead a-drop dawn-tomb"
      />
      <div class="dawn-said">
        <b class="h3">{{ t('match.dawn.died', { name: death.seat?.name ?? '' }) }}</b>
        <div v-if="death.role" class="t-small t-muted">{{ t('match.dawn.wasThe') }}</div>
      </div>
      <RoleCard v-if="death.role" :role="death.role" variant="mini" />
    </div>
  </div>
  <div v-else class="card a-poof dawn-nobody">
    <span class="art f-rooster a-sway dawn-rooster" role="img" :aria-label="t('match.dawn.nobody')" />
    <h1 class="h1 dawn-nobody-title">{{ t('match.dawn.nobody') }}</h1>
    <p class="t-body dawn-nobody-hint">{{ t('match.dawn.nobodyHint') }}</p>
  </div>
</template>

<style scoped>
.dawn-deaths {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 8px 12px 0;
}

.dawn-death {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.dawn-tomb {
  margin: 0;
  flex: none;
}

.dawn-said {
  flex: 1;
  min-width: 0;
}

.dawn-nobody {
  margin: 8px 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.dawn-rooster {
  width: 140px;
  height: 140px;
}

.dawn-nobody-title {
  font-size: 34px;
}

.dawn-nobody-hint {
  margin: 0;
  color: var(--muted);
}
</style>
