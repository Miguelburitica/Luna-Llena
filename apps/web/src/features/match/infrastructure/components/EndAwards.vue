<script setup lang="ts">
import type { Award, AwardId } from '@luna/contracts'
import { useI18n } from 'vue-i18n'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import type { Seat } from '../../domain/seating'

const props = defineProps<{ awards: readonly Award[]; seats: readonly Seat[] }>()
const { t } = useI18n()

const seatOf = (memberId: string): Seat | undefined => props.seats.find((seat) => seat.id === memberId)

const ICONS: Readonly<Record<AwardId, string>> = {
  'most-suspicious': 'eye',
  'worst-liar': 'paw',
  'betrayed-own-team': 'split',
  'silent-assassin': 'mic-off',
  chatterbox: 'chat'
}
</script>

<template>
  <section v-if="awards.length" class="awards">
    <h2 class="h2">{{ t('match.over.awards') }}</h2>
    <ul class="awards-list">
      <li v-for="award in awards" :key="award.award" class="award" :class="`award-${award.award}`">
        <span class="award-icon"><LunaIcon :name="ICONS[award.award]" /></span>
        <div class="award-text">
          <b class="h3">{{ t(`match.awards.title.${award.award}`) }}</b>
          <div class="t-small t-muted">
            {{ t(`match.awards.detail.${award.award}`, { count: award.count ?? 0 }, award.count ?? 1) }}
          </div>
        </div>
        <span v-if="seatOf(award.memberId)" class="award-who">
          <LunaAvatar
            :avatar="seatOf(award.memberId)?.avatar ?? null"
            :name="seatOf(award.memberId)?.name ?? ''"
            size="md"
            :you="seatOf(award.memberId)?.isYou"
          />
          <b class="t-small">{{ seatOf(award.memberId)?.name }}</b>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.awards {
  padding: 28px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.awards-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.award {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--line);
}

.award-icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6e6b4;
  color: #8a4f08;
}

.award-worst-liar .award-icon {
  background: #f6d0d2;
  color: #8a1f26;
}

.award-betrayed-own-team .award-icon {
  background: #e9d6f5;
  color: #5e2c80;
}

.award-silent-assassin .award-icon {
  background: #dcdff0;
  color: #2e3568;
}

.award-chatterbox .award-icon {
  background: #d3ece6;
  color: #1b5a4c;
}

.award-text {
  flex: 1;
  min-width: 0;
}

.award-who {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.award-who .av {
  margin: 0;
}
</style>
