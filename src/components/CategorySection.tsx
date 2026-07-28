import type { ReactNode } from 'react'
import type { Category } from '../lib/catalog'
import { CardTile } from './CardTile'

export function CategorySection({
  category,
  renderFooter,
}: {
  category: Category
  renderFooter?: (cardId: string) => ReactNode
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{category.name}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {category.cards.map((card) => (
          <CardTile key={card.id} card={card} footer={renderFooter?.(card.id)} />
        ))}
      </div>
    </section>
  )
}
