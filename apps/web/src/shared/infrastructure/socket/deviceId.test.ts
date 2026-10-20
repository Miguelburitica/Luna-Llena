import { DEVICE_ID_PATTERN } from '@luna/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEVICE_ID_KEY, deviceIdOfThisBrowser } from './deviceId'

beforeEach(() => {
  localStorage.clear()
})

describe('device id', () => {
  it('creates one id and keeps it across loads', () => {
    const first = deviceIdOfThisBrowser()
    expect(DEVICE_ID_PATTERN.test(first)).toBe(true)
    expect(deviceIdOfThisBrowser()).toBe(first)
    expect(JSON.parse(localStorage.getItem(DEVICE_ID_KEY) ?? 'null')).toBe(first)
  })

  it('replaces a tampered id', () => {
    localStorage.setItem(DEVICE_ID_KEY, JSON.stringify('<script>'))
    expect(deviceIdOfThisBrowser()).not.toBe('<script>')
  })
})
