import { cleanText } from '../../../shared/domain/plainText'

export const normalizeWhitespace = (raw: string): string => cleanText(raw)

export const caseInsensitiveKey = (text: string): string => text.toLocaleLowerCase()
