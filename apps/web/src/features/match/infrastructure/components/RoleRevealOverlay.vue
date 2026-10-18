<script setup lang="ts">
import type { RoleId, TeamId } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import { memberWithId } from '@/features/room/domain/lobby'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import RoleCard from '@/shared/infrastructure/ui/components/RoleCard.vue'

const props = defineProps<{ role: RoleId; team: TeamId; packIds: readonly string[] }>()
const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()
const room = useRoomStore()
const flipped = ref(false)

const isWolf = computed(() => props.team === 'wolves')
const packmates = computed(() =>
  props.packIds.flatMap((memberId) => {
    const member = room.snapshot === null ? null : memberWithId(room.snapshot, memberId)
    return member === null ? [] : [member]
  })
)
const me = computed(() => room.me)
</script>

<template>
  <main class="phone ph-night reveal" :class="{ 'is-wolf': isWolf && flipped }">
    <span class="firefly reveal-firefly-a" aria-hidden="true" />
    <span class="firefly reveal-firefly-b" aria-hidden="true" />
    <header class="reveal-head">
      <span class="t-cap t-muted">{{ t('match.reveal.eyebrow') }}</span>
      <h1 class="h1 reveal-title">{{ isWolf && flipped ? t('match.reveal.wolfTitle') : t('match.reveal.title') }}</h1>
      <p class="t-body t-muted reveal-hint">{{ flipped ? t('match.reveal.hintFace') : t('match.reveal.hintBack') }}</p>
    </header>

    <div class="reveal-stage">
      <button v-if="!flipped" type="button" class="reveal-flip a-bob" :aria-label="t('match.reveal.flip')" @click="flipped = true">
        <RoleCard :role="role" variant="back" large />
      </button>
      <RoleCard v-else :role="role" :team="team" variant="face" large />
    </div>

    <section v-if="flipped && isWolf" class="card reveal-pack">
      <div class="reveal-pack-head">
        <LunaIcon name="paw" class="reveal-pack-icon" />
        <span class="h3">{{ t('match.reveal.pack') }}</span>
        <span class="t-small t-muted reveal-pack-note">{{ t('match.reveal.packOnly') }}</span>
      </div>
      <div class="reveal-pack-members">
        <div v-if="me" class="reveal-pack-member">
          <LunaAvatar :avatar="me.avatar" :name="me.name" size="md" you />
          <span class="av-name">{{ t('match.reveal.you', { name: me.name }) }}</span>
        </div>
        <div v-for="member in packmates" :key="member.id" class="reveal-pack-member">
          <LunaAvatar :avatar="member.avatar" :name="member.name" size="md" ring="#FF8F94" />
          <span class="av-name">{{ member.name }}</span>
        </div>
        <span class="t-small t-muted reveal-pack-hint">{{ t('match.reveal.packHint') }}</span>
      </div>
    </section>

    <footer class="reveal-foot">
      <span v-if="!flipped" class="sbadge"><LunaIcon name="hand" size="sm" />{{ t('match.reveal.tapToFlip') }}</span>
      <template v-else>
        <div v-if="!isWolf" class="card reveal-peek">
          <span class="btn btn-icon btn-secondary" aria-hidden="true"><LunaIcon name="card" /></span>
          <span class="t-small">{{ t('match.reveal.peekHint') }}</span>
        </div>
        <button type="button" class="btn btn-primary btn-lg btn-block" @click="emit('done')">{{ t('match.reveal.gotIt') }}</button>
      </template>
    </footer>
  </main>
</template>

<style scoped>
.reveal {
  align-items: center;
}

.reveal.is-wolf {
  background: radial-gradient(ellipse at 50% 40%, #4a1e3a 0%, #0e1230 70%);
}

.reveal-firefly-a {
  left: 50px;
  top: 160px;
}

.reveal-firefly-b {
  left: 330px;
  top: 260px;
  animation-delay: 1.4s;
}

.reveal-head {
  padding: 36px 28px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reveal-title {
  font-size: 36px;
}

.reveal-hint {
  margin: 0;
}

.reveal-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}

.reveal-flip {
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  border-radius: 22px;
}

.reveal-pack {
  width: calc(100% - 40px);
  padding: 14px 16px;
  box-shadow: inset 0 0 0 1.5px rgba(255, 143, 148, 0.5);
}

.reveal-pack-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.reveal-pack-icon {
  color: #ff8f94;
}

.reveal-pack-note {
  margin-left: auto;
}

.reveal-pack-members {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.reveal-pack-member {
  text-align: center;
}

.reveal-pack-member .av-name {
  text-shadow: none;
}

.reveal-pack-hint {
  flex: 1;
  align-self: center;
}

.reveal-foot {
  width: 100%;
  padding: 0 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  margin-top: auto;
}

.reveal-peek {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  width: 100%;
}

.reveal-peek .btn {
  flex: none;
}
</style>
