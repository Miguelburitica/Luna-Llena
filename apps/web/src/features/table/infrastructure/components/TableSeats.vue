<script setup lang="ts">
import type { RoleId } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { teamClassOf } from '@/shared/infrastructure/ui/teamClass'
import { useTableStore } from '../../application/useTableStore'
import { useTableSeats } from '../useTableSeats'
import RoleConsult from './RoleConsult.vue'

const { t } = useI18n()
const table = useTableStore()
const { seats } = useTableSeats()
const consulting = ref<{ name: string; role: RoleId } | null>(null)

const rows = computed(() => seats.value.map((seat) => ({ ...seat, role: table.view?.roles[seat.id] ?? null })))

const consult = (name: string, role: RoleId | null) => {
  if (role !== null) consulting.value = { name, role }
}
</script>

<template>
  <section class="panel seats">
    <div class="panel-h">
      <h2 class="h3 seats-heading">{{ t('table.logbook.players') }}</h2>
      <span class="t-small t-muted"><LunaIcon name="eye" size="sm" />{{ t('table.logbook.playersHint') }}</span>
    </div>
    <ul class="seats-list">
      <li v-for="row in rows" :key="row.id" class="prow seats-row" :class="{ 'is-dead': !row.alive }">
        <button type="button" class="seats-consult" @click="consult(row.name, row.role)">
          <b>{{ row.name }}</b>
          <span v-if="row.role" class="tbadge" :class="teamClassOf(row.role)">{{ t(`roles.${row.role}`) }}</span>
        </button>
        <span class="t-small" :class="{ 't-muted': !row.alive }">
          {{ row.alive ? t('table.logbook.alive') : t('table.logbook.dead') }}
        </span>
        <button
          type="button"
          class="btn btn-sm btn-secondary"
          :aria-label="row.alive ? t('table.logbook.killLabel', { name: row.name }) : t('table.logbook.reviveLabel', { name: row.name })"
          @click="table.setAlive(row.id, !row.alive)"
        >
          <LunaIcon :name="row.alive ? 'x' : 'heart'" size="sm" />{{ row.alive ? t('table.logbook.kill') : t('table.logbook.revive') }}
        </button>
      </li>
    </ul>
    <RoleConsult v-if="consulting" :name="consulting.name" :role="consulting.role" @close="consulting = null" />
  </section>
</template>

<style scoped>
.seats-heading {
  margin: 0;
}

.seats .panel-h {
  flex-wrap: wrap;
}

.seats-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seats-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seats-consult {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  min-height: var(--touch);
  padding: 0;
}
</style>
