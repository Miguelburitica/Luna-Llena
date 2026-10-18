import { beforeEach, describe, expect, it } from 'vitest'
import { LocalSessionStore } from './LocalSessionStore'

const narrator = { code: 'LUNA42', memberId: 'id-Nico', token: 'token-Nico' }
const caro = { code: 'LUNA42', memberId: 'id-Caro', token: 'token-Caro' }

describe('LocalSessionStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('prefers the seat of this tab over the last seat used on the device', () => {
    const store = new LocalSessionStore()
    store.save(narrator)
    sessionStorage.setItem('luna-llena.session', JSON.stringify(narrator))
    localStorage.setItem('luna-llena.session', JSON.stringify(caro))
    expect(store.load()).toEqual(narrator)
  })

  it('falls back to the device seat when the tab has none', () => {
    localStorage.setItem('luna-llena.session', JSON.stringify(caro))
    expect(new LocalSessionStore().load()).toEqual(caro)
  })

  it('ignores corrupted entries and clears both areas', () => {
    sessionStorage.setItem('luna-llena.session', '{broken')
    expect(new LocalSessionStore().load()).toBeNull()
    const store = new LocalSessionStore()
    store.save(caro)
    store.clear()
    expect(store.load()).toBeNull()
  })
})
