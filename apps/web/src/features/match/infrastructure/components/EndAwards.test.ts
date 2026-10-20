import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const styles = (readFileSync('src/features/match/infrastructure/components/EndAwards.vue', 'utf8').split('<style scoped>')[1] ?? '')
  .replace(/\s+/g, ' ')
const smallPhone = styles.split('@media (max-width: 420px)')[1] ?? ''

describe('EndAwards on a small phone', () => {
  it('keeps the icon beside a full-width title and puts the winner below it', () => {
    expect(smallPhone).toContain('.award { display: grid; grid-template-columns: 40px minmax(0, 1fr);')
    expect(smallPhone).toContain('.award-who { grid-column: 2; flex-direction: row;')
    expect(smallPhone).toContain('.award-who b { min-width: 0; overflow-wrap: break-word; }')
  })
})
