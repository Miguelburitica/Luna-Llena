<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LANGUAGES, rememberLanguage, type Language } from '../../i18n/lunaI18n'

const { locale, t } = useI18n()

const choose = (language: Language) => {
  locale.value = language
  rememberLanguage(language)
}
</script>

<template>
  <div class="seg language-switch" role="radiogroup" :aria-label="t('common.language')">
    <button
      v-for="language in LANGUAGES"
      :key="language"
      type="button"
      role="radio"
      :aria-checked="locale === language"
      :class="{ 'is-on': locale === language }"
      @click="choose(language)"
    >
      {{ language.toUpperCase() }}
    </button>
  </div>
</template>

<style scoped>
.language-switch {
  width: 108px;
}
</style>
