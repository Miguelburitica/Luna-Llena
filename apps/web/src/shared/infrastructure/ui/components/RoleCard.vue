<script setup lang="ts">
import { ROLE_TEAMS, type RoleId, type TeamId } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { roleArtClassOf } from '../roleArt'
import { teamClassFor, teamIconFor } from '../teamClass'
import LunaIcon from './LunaIcon.vue'

const props = defineProps<{ role: RoleId; variant: 'back' | 'face' | 'mini'; team?: TeamId; large?: boolean }>()
const { t } = useI18n()
const teamId = computed(() => props.team ?? ROLE_TEAMS[props.role])
const teamClass = computed(() => teamClassFor(teamId.value))
</script>

<template>
  <span v-if="variant === 'back'" class="rcard-back f-cardback" :class="{ 'is-large': large }" />
  <span v-else-if="variant === 'mini'" class="rcard-mini" :class="teamClass">
    <span class="rcard-art" :class="roleArtClassOf(role)" role="img" :aria-label="t(`roles.${role}`)" />
    <b>{{ t(`roleStickers.${role}`) }}</b>
    <small>{{ t(`roles.${role}`) }}</small>
  </span>
  <div v-else class="rcard a-flip" :class="[teamClass, { 'is-large': large }]">
    <span class="rcard-art" :class="roleArtClassOf(role)" role="img" :aria-label="t(`roles.${role}`)" />
    <span class="rcard-sticker">{{ t(`roleStickers.${role}`) }}</span>
    <span class="rcard-tags">
      <span class="rcard-name">{{ t(`roles.${role}`) }}</span>
      <span class="tbadge"><LunaIcon :name="teamIconFor(teamId)" size="sm" />{{ t(`teams.${teamId}`) }}</span>
    </span>
    <span class="rcard-power">{{ t(`roleCards.${role}.power`) }}</span>
    <span class="rcard-win"><LunaIcon name="trophy" size="sm" />{{ t(`roleCards.${role}.win`) }}</span>
  </div>
</template>

<style scoped>
.rcard-back {
  display: block;
}

.rcard-mini {
  display: inline-block;
}

.rcard-mini .rcard-art {
  display: block;
  margin: 0 auto;
}

.is-large {
  width: 260px;
  height: 368px;
}

.is-large .rcard-art {
  width: 150px;
  height: 124px;
}

.is-large .rcard-sticker {
  font-size: 21px;
}

.is-large .rcard-power {
  font-size: 13px;
}
</style>
