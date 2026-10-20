import type { ColorModePreference } from '../application/ports'
import type { MenuLook } from '../domain/colorMode'

const PREFERS_LIGHT_QUERY = '(prefers-color-scheme: light)'
const BROWSER_BAR_COLORS: Record<MenuLook, string> = { light: '#F4EEFF', dark: '#1E0F33' }

const lightQuery = (): MediaQueryList | null =>
  typeof window.matchMedia === 'function' ? window.matchMedia(PREFERS_LIGHT_QUERY) : null

export class DocumentColorModePreference implements ColorModePreference {
  prefersLight(): boolean {
    return lightQuery()?.matches ?? false
  }

  onChange(listener: (prefersLight: boolean) => void): void {
    lightQuery()?.addEventListener?.('change', (event) => listener(event.matches))
  }

  apply(look: MenuLook): void {
    document.documentElement.dataset.colorMode = look
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BROWSER_BAR_COLORS[look])
  }
}
