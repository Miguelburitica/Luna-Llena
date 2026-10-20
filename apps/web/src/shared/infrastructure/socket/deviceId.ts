import { DEVICE_ID_PATTERN } from '@luna/contracts'
import { readStored, writeStored } from '../storage/deviceStorage'

export const DEVICE_ID_KEY = 'luna.device'

const isDeviceId = (value: unknown): value is string => typeof value === 'string' && DEVICE_ID_PATTERN.test(value)

const freshDeviceId = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')

export const deviceIdOfThisBrowser = (): string => {
  const stored = readStored(DEVICE_ID_KEY, isDeviceId)
  if (stored !== null) return stored
  const created = freshDeviceId()
  writeStored(DEVICE_ID_KEY, created)
  return created
}
