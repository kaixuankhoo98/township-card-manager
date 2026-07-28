import { CATALOG } from '../lib/catalog'
import { RarityBadge } from '../components/RarityBadge'
import { useAuth } from '../context/AuthContext'
import { isOwnedBy, useOwnershipQuery, useSetOwnership } from '../hooks/useOwnership'

export function MyCollectionPage() {
  const { auth } = useAuth()
  const { data: ownership, isLoading, isError } = useOwnershipQuery()
  const setOwnership = useSetOwnership()

  if (!auth) return null

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">My Collection — {auth.member}</h1>
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Couldn't load ownership data.</p>}
      {setOwnership.isError && (
        <p className="text-sm text-red-600">Couldn't save that change — try again.</p>
      )}
      {ownership &&
        CATALOG.categories.map((category) => (
          <section key={category.id} className="space-y-2">
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {category.cards.map((card) => {
                const owned = isOwnedBy(ownership, auth.member, card.id)
                return (
                  <label
                    key={card.id}
                    className="flex items-center gap-2 rounded border border-neutral-300 dark:border-neutral-700 p-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={owned}
                      disabled={setOwnership.isPending}
                      onChange={(e) =>
                        setOwnership.mutate({ cardId: card.id, owned: e.target.checked })
                      }
                    />
                    <span className="flex-1">{card.name}</span>
                    <RarityBadge rarity={card.rarity} />
                  </label>
                )
              })}
            </div>
          </section>
        ))}
    </div>
  )
}
