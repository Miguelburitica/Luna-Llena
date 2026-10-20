import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const SMALL_PHONE = '@media (max-width: 420px)'

const stylesOf = (path: string): string => {
  const source = readFileSync(path, 'utf8')
  return (source.split('<style scoped>')[1]?.split('</style>')[0] ?? '').replace(/\s+/g, ' ')
}

const templateOf = (path: string): string => readFileSync(path, 'utf8').split('<style')[0] ?? ''

const smallPhoneRulesOf = (path: string): string => stylesOf(path).split(SMALL_PHONE)[1] ?? ''

const fixedWidthsOf = (styles: string): number[] =>
  [...styles.matchAll(/(?:^|[;{ ])(?:min-)?width: (\d+)px/g)].map((match) => Number(match[1]))

const DECK_BUILDER = 'src/features/room/infrastructure/components/DeckBuilder.vue'
const ROOM_SETUP = 'src/features/room/infrastructure/views/RoomSetupView.vue'
const MENU_SCREENS = [
  'src/features/room/infrastructure/views/HomeView.vue',
  'src/features/room/infrastructure/views/JoinView.vue',
  'src/features/room/infrastructure/views/PublicGamesView.vue',
  ROOM_SETUP,
  DECK_BUILDER,
  'src/features/room/infrastructure/components/PlayerLobby.vue',
  'src/features/room/infrastructure/components/NarratorLobby.vue',
  'src/shared/infrastructure/ui/components/DeskHeader.vue'
]

describe('small phones', () => {
  it('keeps the Werewolf name whole and puts its counter below it', () => {
    const styles = stylesOf(DECK_BUILDER)
    expect(styles).not.toContain('overflow-wrap: anywhere')
    expect(styles).toContain('.setup-card-text { flex: 1; min-width: 0; overflow-wrap: break-word; hyphens: manual; }')
    expect(styles).toContain('minmax(min(220px, 100%), 1fr)')
    const small = smallPhoneRulesOf(DECK_BUILDER)
    expect(small).toContain('.setup-card { display: grid; grid-template-columns: 44px minmax(0, 1fr);')
    expect(small).toContain('.setup-card .counter { grid-column: 2;')
  })

  it('lets the setup footer scroll away with Cancel and Create side by side', () => {
    const small = smallPhoneRulesOf(ROOM_SETUP)
    expect(small).toContain('.setup-footer { position: static;')
    expect(small).toContain('.setup-footer-hint { flex-basis: 100%;')
    expect(small).toContain('.setup-footer .btn { flex: 1; min-width: 0; }')
  })

  it('stacks the timer label above full-width timer choices', () => {
    expect(templateOf(ROOM_SETUP)).toContain('class="row-set stack-on-phone"')
    expect(smallPhoneRulesOf(ROOM_SETUP)).toContain('.setup-seg { width: 100%; }')
    expect(templateOf('src/features/table/infrastructure/views/TableSetupView.vue')).toContain('class="table-setup-timer stack-on-phone"')
  })

  it('stacks expected players above the counter and the suggested deck button below', () => {
    const template = templateOf(DECK_BUILDER)
    expect(template).toContain('class="setup-suggest stack-on-phone"')
    expect(template).toContain('class="setup-suggest-count stack-on-phone"')
    expect(template).toContain('class="setup-balance-head stack-on-phone"')
  })

  it('stacks rows of action buttons and section heads', () => {
    expect(templateOf('src/features/room/infrastructure/views/PublicGamesView.vue')).toContain('games-report-actions stack-on-phone')
    expect(templateOf('src/features/room/infrastructure/components/NarratorLobby.vue')).toContain('narrator-kick-actions stack-on-phone')
    expect(templateOf('src/features/room/infrastructure/components/PlayerLobby.vue')).toContain('lobby-section-head stack-on-phone')
    expect(templateOf('src/features/table/infrastructure/views/TableSetupView.vue')).toContain('table-setup-foot stack-on-phone')
  })

  it('turns a stacked row into a column with full-width choices and wrapping button labels', () => {
    const designSystem = readFileSync('src/shared/infrastructure/ui/styles/design-system.css', 'utf8')
    const small = designSystem.split('@media (max-width:420px){')[1]?.split('}}')[0] ?? ''
    expect(small).toContain('.btn{white-space:normal;')
    expect(small).toContain('.stack-on-phone{flex-direction:column!important;align-items:stretch!important;')
    expect(small).toContain('.stack-on-phone>.seg,.stack-on-phone>.btn{width:100%;')
  })

  it('keeps the room code inside the return to seat button', () => {
    const small = smallPhoneRulesOf('src/features/room/infrastructure/views/HomeView.vue')
    expect(small).toContain('.home-return { flex-wrap: wrap;')
    expect(small).toContain('.home-return-code { margin-left: 0; }')
  })

  it.each(MENU_SCREENS)('fits a 320px phone in %s', (path) => {
    expect(fixedWidthsOf(stylesOf(path)).every((width) => width <= 320)).toBe(true)
  })

  it('keeps every control at least 44px tall', () => {
    const designSystem = readFileSync('src/shared/infrastructure/ui/styles/design-system.css', 'utf8')
    expect(designSystem).toContain('--touch:44px')
    expect(designSystem).not.toMatch(/@media \(max-width:420px\)\{[^@]*--touch/)
  })
})
