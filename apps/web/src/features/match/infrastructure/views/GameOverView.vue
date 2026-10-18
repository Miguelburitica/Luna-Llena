<script setup lang="ts">
import type { MatchOutcome, MatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import RoleCard from '@/shared/infrastructure/ui/components/RoleCard.vue'
import { teamClassFor } from '@/shared/infrastructure/ui/teamClass'
import { seatsOf, trueRoleOf } from '../../domain/seating'

const props = defineProps<{ view: MatchView; outcome: MatchOutcome }>()
const { t } = useI18n()
const room = useRoomStore()

const soloWinners = computed(() =>
  seatsOf(props.view, room.snapshot?.members ?? [], room.session?.memberId)
    .filter((seat) => props.view.soloWinnerIds.includes(seat.id))
    .map((seat) => ({ ...seat, role: trueRoleOf(props.view, seat.id) }))
)

const rows = computed(() =>
  seatsOf(props.view, room.snapshot?.members ?? [], room.session?.memberId).map((seat) => ({
    ...seat,
    role: trueRoleOf(props.view, seat.id)
  }))
)
</script>

<template>
  <main class="phone ph-night over">
    <header class="over-head">
      <span class="t-cap t-muted">{{ t('match.over.eyebrow') }}</span>
      <div class="banner-lg over-banner" :class="teamClassFor(outcome.winner)">
        <LunaIcon name="trophy" size="xl" class="over-trophy" />
        <h1 class="h1">{{ t(`match.win.${outcome.winner}`) }}</h1>
      </div>
      <ul v-if="soloWinners.length" class="over-solo">
        <li v-for="winner in soloWinners" :key="winner.id" class="over-solo-winner team-solo">
          <LunaAvatar :avatar="winner.avatar" :name="winner.name" size="md" :you="winner.isYou" />
          <b>{{ winner.name }}</b>
          <span v-if="winner.role" class="tbadge">
            <LunaIcon name="sparkles" size="sm" />{{ t('match.over.soloAlso', { role: t(`roles.${winner.role}`) }) }}
          </span>
        </li>
      </ul>
    </header>

    <section class="over-roles">
      <h2 class="h3">{{ t('match.over.roles') }}</h2>
      <ul class="over-grid">
        <li v-for="row in rows" :key="row.id" class="over-tile" :class="{ 'is-you': row.isYou }">
          <LunaAvatar :avatar="row.avatar" :name="row.name" size="md" :you="row.isYou" :class="{ 'is-dead': !row.alive }" />
          <span class="av-name">{{ row.name }}</span>
          <RoleCard v-if="row.role" :role="row.role" variant="mini" />
        </li>
      </ul>
    </section>

    <footer class="over-foot">
      <RouterLink :to="{ name: 'home' }" class="btn btn-secondary btn-block">{{ t('common.backHome') }}</RouterLink>
    </footer>
  </main>
</template>

<style scoped>
.over-head {
  padding: 32px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.over-banner {
  align-items: center;
  background: var(--team);
  color: #fff;
  border: 0;
}

.over-trophy {
  color: #fff;
}

.over-solo {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.over-solo-winner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: inset 0 0 0 1.5px var(--team);
}

.over-solo-winner .av {
  margin: 0;
}

.over-solo-winner .tbadge {
  margin-left: auto;
}

.over-roles {
  padding: 24px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.over-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 14px 8px;
}

.over-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.over-tile .av {
  margin: 0;
}

.over-foot {
  margin-top: auto;
  padding: 24px 20px 28px;
}
</style>
