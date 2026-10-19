<script setup lang="ts">
import { ROLE_CATALOG, ROLE_TEAMS, type RoleId } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import RoleCard from '@/shared/infrastructure/ui/components/RoleCard.vue'

const props = defineProps<{ name: string; role: RoleId }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const deceived = computed(() => ROLE_CATALOG[props.role].appearsAs !== props.role)
</script>

<template>
  <div class="scrim consult-scrim" @click="emit('close')" />
  <section class="modal consult" role="dialog" :aria-label="t('table.consult.title', { name })">
    <h2 class="h2 consult-title">{{ t('table.consult.title', { name }) }}</h2>
    <RoleCard :role="role" :team="ROLE_TEAMS[role]" variant="face" />
    <span v-if="deceived" class="sbadge is-warn consult-note">
      <LunaIcon name="beer" size="sm" />{{ t('table.consult.thinks') }}
    </span>
    <button type="button" class="btn btn-secondary btn-block" @click="emit('close')">{{ t('table.consult.close') }}</button>
  </section>
</template>

<style scoped>
.consult-scrim {
  position: fixed;
}

.consult {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.consult-title {
  margin: 0;
}

.consult-note {
  align-self: center;
}
</style>
