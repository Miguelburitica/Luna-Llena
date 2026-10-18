<script setup lang="ts">
import type { RoleId } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { factsOf, type Chapter, type Fact } from '../../domain/endGame'
import type { Seat } from '../../domain/seating'

const props = defineProps<{ chapters: readonly Chapter[]; seats: readonly Seat[]; roleOf: (memberId: string) => RoleId | null }>()
const { t, locale } = useI18n()

const open = ref<readonly string[]>([])
const allOpen = computed(() => props.chapters.every((chapter) => open.value.includes(chapter.id)))

const toggle = (id: string) => {
  open.value = open.value.includes(id) ? open.value.filter((openId) => openId !== id) : [...open.value, id]
}

const toggleAll = () => {
  open.value = allOpen.value ? [] : props.chapters.map((chapter) => chapter.id)
}

const nameOf = (memberId: string | undefined): string => props.seats.find((seat) => seat.id === memberId)?.name ?? ''

const listOf = (memberIds: readonly string[]): string =>
  new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(memberIds.map(nameOf))

const sentenceOf = (fact: Fact): string =>
  t(
    `match.timeline.${fact.key}`,
    {
      name: nameOf(fact.memberIds[0]),
      other: nameOf(fact.memberIds[1]),
      names: listOf(fact.memberIds),
      voters: listOf(fact.memberIds.slice(1)),
      count: fact.count,
      word: fact.word ?? '',
      role: fact.role === null ? '' : t(`roles.${fact.role}`)
    },
    fact.count
  )

const factsFor = (chapter: Chapter): Fact[] => chapter.entries.flatMap((entry) => factsOf(entry, props.roleOf))
</script>

<template>
  <section class="story">
    <div class="story-head">
      <h2 class="h2">{{ t('match.over.story') }}</h2>
      <button type="button" class="btn btn-ghost btn-sm" @click="toggleAll">
        {{ allOpen ? t('match.over.collapseAll') : t('match.over.expandAll') }}
      </button>
    </div>
    <ol class="story-chapters">
      <li v-for="chapter in chapters" :key="chapter.id" class="tl story-chapter" :class="`story-${chapter.period}`">
        <div class="story-rail">
          <span class="tl-dot"><LunaIcon :name="chapter.period === 'night' ? 'moon' : 'sun'" /></span>
          <i class="story-line" />
        </div>
        <div class="story-body">
          <button
            type="button"
            class="story-toggle"
            :aria-expanded="open.includes(chapter.id)"
            :aria-controls="`facts-${chapter.id}`"
            @click="toggle(chapter.id)"
          >
            <b class="h3">{{ t(`match.timeline.${chapter.period}`, { round: chapter.round }) }}</b>
            <LunaIcon :name="open.includes(chapter.id) ? 'chevron-up' : 'chevron-down'" />
          </button>
          <ul v-show="open.includes(chapter.id)" :id="`facts-${chapter.id}`" class="story-facts t-small">
            <li v-for="(fact, index) in factsFor(chapter)" :key="index" class="story-fact">{{ sentenceOf(fact) }}</li>
          </ul>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.story {
  padding: 30px 16px 0;
}

.story-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.story-chapters {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tl {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
}

.tl-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-night .tl-dot {
  background: var(--ink-800);
  color: var(--slime);
}

.story-day .tl-dot {
  background: #f6e6b4;
  color: #8a4f08;
}

.story-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.story-line {
  display: block;
  flex: 1;
  width: 2px;
  background: var(--line);
}

.story-chapter:last-child .story-line {
  display: none;
}

.story-body {
  padding-bottom: 16px;
}

.story-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 40px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.story-facts {
  list-style: none;
  margin: 2px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--muted);
}
</style>
