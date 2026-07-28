import { CATALOG } from '../lib/catalog'
import { CategorySection } from '../components/CategorySection'
import { ownersOf, useOwnershipQuery } from '../hooks/useOwnership'

export function CatalogPage() {
  const { data: ownership, isLoading, isError } = useOwnershipQuery()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{CATALOG.label}</h1>
      {isLoading && <p className="text-sm text-neutral-500">Loading ownership…</p>}
      {isError && <p className="text-sm text-red-600">Couldn't load ownership data.</p>}
      {CATALOG.categories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          renderFooter={(cardId) => {
            if (!ownership) return null
            const owners = ownersOf(ownership, cardId)
            return (
              <p className="text-xs text-neutral-500">
                {owners.length > 0 ? `Owned by: ${owners.join(', ')}` : 'Nobody owns this yet'}
              </p>
            )
          }}
        />
      ))}
    </div>
  )
}
