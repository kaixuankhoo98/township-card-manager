export const RARITIES = [
  'one_star',
  'two_star',
  'three_star',
  'four_star',
  'five_star',
  'gold',
  'diamond',
] as const

export type Rarity = (typeof RARITIES)[number]

export const UNSENDABLE_RARITIES: ReadonlySet<Rarity> = new Set(['gold', 'diamond'])

export interface CardDefinition {
  name: string
  rarity: Rarity
}

export interface CategoryDefinition {
  name: string
  cards: CardDefinition[]
}

export interface CatalogFile {
  version: string
  label: string
  categories: CategoryDefinition[]
}
