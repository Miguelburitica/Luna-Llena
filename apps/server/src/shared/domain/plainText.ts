const INVISIBLE = /[\p{Cc}\p{Cf}]/gu

const LINK = /(https?:\/\/|www\.)/i

export const cleanText = (raw: string): string =>
  raw.normalize('NFKC').replace(/\s+/g, ' ').replace(INVISIBLE, '').replace(/ {2,}/g, ' ').trim()

export const containsLink = (text: string): boolean => LINK.test(text)
