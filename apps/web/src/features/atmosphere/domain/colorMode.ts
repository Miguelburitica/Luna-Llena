export const COLOR_MODES = ['system', 'light', 'dark'] as const
export type ColorMode = (typeof COLOR_MODES)[number]

export type MenuLook = 'light' | 'dark'

export const DEFAULT_COLOR_MODE: ColorMode = 'system'

export const isColorMode = (value: unknown): value is ColorMode => COLOR_MODES.some((mode) => mode === value)

export const menuLookOf = (mode: ColorMode, systemPrefersLight: boolean): MenuLook => {
  if (mode === 'system') return systemPrefersLight ? 'light' : 'dark'
  return mode
}
