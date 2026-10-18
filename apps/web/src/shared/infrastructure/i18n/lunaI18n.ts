import { createI18n } from 'vue-i18n'
import { readStored, writeStored } from '../storage/deviceStorage'

export const LANGUAGES = ['es', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

const KEY = 'luna-llena.language'

const isLanguage = (value: unknown): value is Language => LANGUAGES.includes(value as Language)

export const preferredLanguage = (): Language =>
  readStored(KEY, isLanguage) ?? (navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en')

export const rememberLanguage = (language: Language): void => writeStored(KEY, language)

export type Messages = Record<Language, Record<string, unknown>>

export const createLunaI18n = (messages: Messages, locale: Language = preferredLanguage()) =>
  createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: messages as never })
