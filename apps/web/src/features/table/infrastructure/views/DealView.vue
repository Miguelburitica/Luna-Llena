<script setup lang="ts">
import { ROLE_CATALOG, ROLE_TEAMS } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import RoleRevealOverlay from '@/features/match/infrastructure/components/RoleRevealOverlay.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useTableGuard } from '../../application/useTableGuard'
import { useTableStore } from '../../application/useTableStore'
import { packNamesOf } from '../../domain/tableSeats'
import { seatNameOf } from '../../domain/tableSetup'
import HoldButton from '../components/HoldButton.vue'

const { t } = useI18n()
const router = useRouter()
const table = useTableStore()
useTableGuard(['table-deal'])

const revealing = ref(false)
const fallbackName = (seatNumber: number) => t('table.seatName', { number: seatNumber })
const seatIndex = computed(() => (table.progress?.stage === 'dealing' ? table.progress.seatIndex : null))
const seat = computed(() => (seatIndex.value === null ? null : (table.journal?.seats[seatIndex.value] ?? null)))
const name = computed(() =>
  table.journal === null || seatIndex.value === null ? '' : (seatNameOf(table.journal.setup, seatIndex.value) ?? fallbackName(seatIndex.value + 1))
)
const perceived = computed(() => (seat.value === null ? null : ROLE_CATALOG[seat.value.role].appearsAs))
const pack = computed(() =>
  table.journal === null || seat.value === null
    ? []
    : packNamesOf(table.journal, seat.value.id, fallbackName).map((packName) => ({ id: packName, name: packName, avatar: null }))
)

const seen = () => {
  revealing.value = false
  table.markSeen()
}

const open = async () => {
  table.openLogbook()
  await router.replace({ name: 'table' })
}
</script>

<template>
  <RoleRevealOverlay
    v-if="revealing && perceived"
    :key="seatIndex ?? 'done'"
    :role="perceived"
    :team="ROLE_TEAMS[perceived]"
    :me="{ name, avatar: null }"
    :pack="pack"
    :done-label="t('table.deal.seen')"
    :peek-hint="false"
    @done="seen"
  />
  <main v-else-if="seat" class="phone ph-night deal">
    <span class="sbadge deal-progress">{{ t('table.deal.progress', { number: (seatIndex ?? 0) + 1, total: table.journal?.seats.length }) }}</span>
    <section class="deal-pass">
      <span class="art f-cardback a-bob deal-art" aria-hidden="true" />
      <h1 class="h1 deal-title">{{ t('table.deal.passTo', { name }) }}</h1>
      <p class="t-body t-muted">{{ t('table.deal.passHint', { name }) }}</p>
    </section>
    <footer class="deal-foot">
      <button type="button" class="btn btn-primary btn-lg btn-block" @click="revealing = true">
        <LunaIcon name="hand" />{{ t('table.deal.iAm', { name }) }}
      </button>
    </footer>
  </main>
  <main v-else-if="table.progress?.stage === 'hand-back'" class="phone ph-night deal">
    <section class="deal-pass">
      <span class="art f-logo a-wobble deal-art" aria-hidden="true" />
      <h1 class="h1 deal-title">{{ t('table.deal.handBack') }}</h1>
      <p class="t-body t-muted">{{ t('table.deal.handBackHint') }}</p>
    </section>
    <footer class="deal-foot">
      <HoldButton :label="t('table.deal.open')" icon="scroll" @held="open" />
    </footer>
  </main>
</template>

<style scoped>
.deal {
  padding: 20px 16px;
  gap: 16px;
}

.deal-progress {
  align-self: center;
}

.deal-pass {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
}

.deal-art {
  width: 150px;
  height: 150px;
}

.deal-title {
  margin: 0;
}

.deal-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
