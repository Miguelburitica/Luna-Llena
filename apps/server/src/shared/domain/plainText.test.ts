import { describe, expect, it } from 'vitest'
import { cleanText, containsLink } from './plainText'

describe('Clean text', () => {
  it('drops zero-width characters', () => {
    expect(cleanText('Ca​ro')).toBe('Caro')
  })

  it('drops direction overrides', () => {
    expect(cleanText('hola‮odnum')).toBe('holaodnum')
  })

  it('turns line breaks and tabs into single spaces', () => {
    expect(cleanText('  uno\n\tdos   tres ')).toBe('uno dos tres')
  })

  it('folds compatibility forms', () => {
    expect(cleanText('Ｃａｒｏ')).toBe('Caro')
  })

  it('leaves nothing from invisible-only input', () => {
    expect(cleanText('​‌‍')).toBe('')
  })

  it('spots links', () => {
    expect(containsLink('Free coins at www.spam.example')).toBe(true)
    expect(containsLink('see https://x.example')).toBe(true)
    expect(containsLink('Los Primos · Viernes')).toBe(false)
  })
})
