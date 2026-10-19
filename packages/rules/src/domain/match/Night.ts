import type { NightAction, Vision } from '@luna/contracts'

export interface HuntPick {
  readonly wolfId: string
  readonly targetId: string
}

export interface Inspection extends Vision {
  readonly fromDrunk: boolean
}

export interface PotionChoice {
  readonly heal: boolean
  readonly poisonTargetId: string | null
}

export class Night {
  huntPicks: readonly HuntPick[] = []
  readonly inspections = new Map<string, Inspection>()
  readonly protections = new Map<string, string>()
  readonly potions = new Map<string, PotionChoice>()
  readonly suspicions = new Map<string, string>()

  pickPrey(wolfId: string, targetId: string): void {
    this.huntPicks = [...this.huntPicks.filter((pick) => pick.wolfId !== wolfId), { wolfId, targetId }]
  }

  hasActed(memberId: string, action: NightAction): boolean {
    switch (action) {
      case 'hunt':
        return this.huntPicks.some((pick) => pick.wolfId === memberId)
      case 'inspect':
        return this.inspections.has(memberId)
      case 'protect':
        return this.protections.has(memberId)
      case 'potions':
        return this.potions.has(memberId)
      case 'suspect':
        return this.suspicions.has(memberId)
    }
  }

  targetOf(memberId: string, action: NightAction): string | null {
    switch (action) {
      case 'hunt':
        return this.huntPicks.find((pick) => pick.wolfId === memberId)?.targetId ?? null
      case 'inspect':
        return this.inspections.get(memberId)?.targetId ?? null
      case 'protect':
        return this.protections.get(memberId) ?? null
      case 'potions':
        return null
      case 'suspect':
        return this.suspicions.get(memberId) ?? null
    }
  }
}
