import type { ReactNode } from 'react'
import type { Card } from '../lib/catalog'
import { RarityBadge } from './RarityBadge'

export function CardTile({ card, footer }: { card: Card; footer?: ReactNode }) {
  return (
    <div className="rounded border border-neutral-300 dark:border-neutral-700 p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">{card.name}</span>
        <RarityBadge rarity={card.rarity} />
      </div>
      {footer}
    </div>
  )
}
