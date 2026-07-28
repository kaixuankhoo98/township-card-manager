import catalog2026_07 from '../data/catalog/2026-07.json'
import rosterJson from '../data/roster.json'
import type { CatalogFile, Rarity } from '../types/catalog'
import { cardId, categoryId } from './slugify'

// Update this pointer whenever a new month's catalog file is added.
export const CURRENT_CATALOG_VERSION = '2026-07'

const CATALOG_FILES: Record<string, CatalogFile> = {
  '2026-07': catalog2026_07 as CatalogFile,
}

export interface Card {
  id: string
  name: string
  rarity: Rarity
  categoryId: string
}

export interface Category {
  id: string
  name: string
  cards: Card[]
}

export interface Catalog {
  version: string
  label: string
  categories: Category[]
}

function buildCatalog(file: CatalogFile): Catalog {
  return {
    version: file.version,
    label: file.label,
    categories: file.categories.map((category) => {
      const catId = categoryId(file.version, category.name)
      return {
        id: catId,
        name: category.name,
        cards: category.cards.map((card) => ({
          id: cardId(file.version, category.name, card.name),
          name: card.name,
          rarity: card.rarity,
          categoryId: catId,
        })),
      }
    }),
  }
}

export const CATALOG: Catalog = buildCatalog(CATALOG_FILES[CURRENT_CATALOG_VERSION])

export const ALL_CARDS: Card[] = CATALOG.categories.flatMap((c) => c.cards)

export function findCard(cardId: string): Card | undefined {
  return ALL_CARDS.find((c) => c.id === cardId)
}

export const ROSTER: string[] = rosterJson as string[]
