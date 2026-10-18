<script setup lang="ts">
import { ROOM_LIMITS } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeRoomCode } from '../../domain/roomCode'

const code = defineModel<string>({ required: true })
const { t } = useI18n()
const fields = ref<HTMLInputElement[]>([])

const letters = computed(() => Array.from({ length: ROOM_LIMITS.codeLength }, (_, index) => code.value[index] ?? ''))

const focusAt = (index: number) => fields.value[Math.max(0, Math.min(index, ROOM_LIMITS.codeLength - 1))]?.focus()

const typeAt = (index: number, event: Event) => {
  const field = event.target as HTMLInputElement
  const typed = normalizeRoomCode(field.value)
  const next = normalizeRoomCode(code.value.slice(0, index) + typed + code.value.slice(index + 1))
  field.value = letters.value[index] ?? ''
  code.value = next
  if (typed.length > 0) focusAt(Math.min(next.length, index + typed.length))
}

const eraseAt = (index: number, event: KeyboardEvent) => {
  if (event.key !== 'Backspace' || (letters.value[index] ?? '') !== '' || index === 0) return
  event.preventDefault()
  code.value = code.value.slice(0, index - 1) + code.value.slice(index)
  focusAt(index - 1)
}

const paste = (event: ClipboardEvent) => {
  event.preventDefault()
  code.value = normalizeRoomCode(event.clipboardData?.getData('text') ?? '')
  focusAt(code.value.length)
}
</script>

<template>
  <div class="code room-code">
    <input
      v-for="(letter, index) in letters"
      :key="index"
      ref="fields"
      :value="letter"
      :class="{ 'is-filled': letter !== '' }"
      :aria-label="t('room.join.codeLetter', { position: index + 1 })"
      autocapitalize="characters"
      autocomplete="off"
      spellcheck="false"
      inputmode="text"
      @input="typeAt(index, $event)"
      @keydown="eraseAt(index, $event)"
      @paste="paste"
    >
  </div>
</template>

<style scoped>
.room-code {
  justify-content: space-between;
}

.room-code input {
  flex: 1 1 0;
  min-width: 0;
  max-width: 50px;
}
</style>
