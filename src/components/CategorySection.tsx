import type { ReactNode } from 'react'
import type { Category } from '../lib/catalog'
import { CardTile } from './CardTile'

export function CategorySection({
  category,
  renderFooter,
  isComplete,
  isCardOwned,
}: {
  category: Category
  renderFooter?: (cardId: string) => ReactNode
  isComplete?: boolean
  isCardOwned?: (cardId: string) => boolean
}) {
  return (
    <details
      open={!isComplete}
      className={`rounded-lg border p-3 ${
        isComplete
          ? 'border-neutral-300 bg-neutral-100 dark:border-neutral-700'
          : 'border-neutral-300 dark:border-neutral-700'
      }`}
    >
      <summary className="text-lg font-semibold cursor-pointer select-none">
        {category.name}
        {isComplete && <span className="ml-2">✅</span>}
      </summary>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
        {category.cards.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            footer={renderFooter?.(card.id)}
            owned={isCardOwned?.(card.id)}
          />
        ))}
      </div>
    </details>
  )
}
