import { forgetStored, forgetStoredWithPrefix } from '@/shared/infrastructure/storage/deviceStorage'

export const REVEALED_KEY_PREFIX = 'luna-llena.revealed.'
export const FOOL_KEY_PREFIX = 'luna-llena.fool.'

export const forgetMatchMemory = (code: string): void => {
  forgetStored(`${REVEALED_KEY_PREFIX}${code}`, 'tab')
  forgetStoredWithPrefix(`${FOOL_KEY_PREFIX}${code}.`, 'tab')
}
