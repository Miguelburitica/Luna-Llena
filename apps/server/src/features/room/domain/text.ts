export const normalizeWhitespace = (raw: string): string => raw.trim().replace(/\s+/g, ' ')

export const caseInsensitiveKey = (text: string): string => text.toLocaleLowerCase()
