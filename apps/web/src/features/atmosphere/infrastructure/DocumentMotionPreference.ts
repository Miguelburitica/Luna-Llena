import type { MotionPreference } from '../application/ports'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const REDUCED_CLASS = 'reduced'

export class DocumentMotionPreference implements MotionPreference {
  prefersReducedMotion(): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches
  }

  apply(reduced: boolean): void {
    document.documentElement.classList.toggle(REDUCED_CLASS, reduced)
  }
}
