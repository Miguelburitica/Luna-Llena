import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SlimeWordmark from './SlimeWordmark.vue'

describe('SlimeWordmark', () => {
  it('is the "Luna Llena" heading with dripping slime', () => {
    const wordmark = mount(SlimeWordmark)
    const heading = wordmark.find('h1')
    expect(heading.text()).toBe('Luna Llena')
    expect(heading.findAll('.wordmark-drip').length).toBeGreaterThan(0)
    expect(heading.find('svg').attributes('aria-hidden')).toBe('true')
  })

  it('sits inline in the narrator header', () => {
    const wordmark = mount(SlimeWordmark, { props: { tag: 'b', size: 'desk' } })
    expect(wordmark.find('h1').exists()).toBe(false)
    expect(wordmark.find('b').classes()).toContain('wordmark-desk')
  })
})
