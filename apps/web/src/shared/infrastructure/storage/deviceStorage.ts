export type StorageArea = 'tab' | 'device'

const areaOf = (area: StorageArea): Storage => (area === 'tab' ? sessionStorage : localStorage)

export const readStored = <T>(key: string, isValid: (value: unknown) => value is T, area: StorageArea = 'device'): T | null => {
  try {
    const raw = areaOf(area).getItem(key)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const writeStored = (key: string, value: unknown, area: StorageArea = 'device'): void => {
  try {
    areaOf(area).setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export const forgetStoredWithPrefix = (prefix: string, area: StorageArea = 'device'): void => {
  try {
    const storage = areaOf(area)
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    for (const key of keys) if (key !== null && key.startsWith(prefix)) storage.removeItem(key)
  } catch {
    return
  }
}

export const forgetStored = (key: string, area: StorageArea = 'device'): void => {
  try {
    areaOf(area).removeItem(key)
  } catch {
    return
  }
}
