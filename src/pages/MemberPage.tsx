import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ALL_CARDS, CATALOG, ROSTER, findCard } from '../lib/catalog'
import { UNSENDABLE_RARITIES } from '../types/catalog'
import { CategorySection } from '../components/CategorySection'
import { useAuth } from '../context/AuthContext'
import { isOwnedBy, useOwnershipQuery, useSetOwnership } from '../hooks/useOwnership'
import { useLogSend } from '../hooks/useSendLog'

const SENDABLE_CARD_IDS = new Set(
  ALL_CARDS.filter((card) => !UNSENDABLE_RARITIES.has(card.rarity)).map((card) => card.id),
)

export function MemberPage() {
  const { name = '' } = useParams<{ name: string }>()
  const memberName = decodeURIComponent(name)

  const { auth } = useAuth()
  const { data: ownership, isLoading, isError } = useOwnershipQuery()
  const setOwnership = useSetOwnership()
  const logSend = useLogSend()
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null)

  if (!auth) return null

  if (!ROSTER.includes(memberName)) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-500">No member named "{memberName}".</p>
        <Link to="/members" className="underline text-sm">
          Back to Members
        </Link>
      </div>
    )
  }

  const isSelf = auth.member === memberName

  async function handleSend(cardId: string) {
    setFeedback(null)
    const card = findCard(cardId)
    try {
      await logSend.mutateAsync({ recipient: memberName, cardId })
      setFeedback({ message: `Sent "${card?.name ?? cardId}" to ${memberName}.`, isError: false })
    } catch {
      setFeedback({ message: `Couldn't send "${card?.name ?? cardId}" — try again.`, isError: true })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        {memberName}
        {isSelf && <span className="font-normal text-neutral-500"> (You)</span>}
      </h1>

      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Couldn't load ownership data.</p>}
      {isSelf && setOwnership.isError && (
        <p className="text-sm text-red-600">Couldn't save that change — try again.</p>
      )}
      {!isSelf && feedback && (
        <p className={`text-sm ${feedback.isError ? 'text-red-600' : 'text-green-600'}`}>
          {feedback.message}
        </p>
      )}

      {ownership &&
        CATALOG.categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            renderFooter={(cardId) => {
              const owned = isOwnedBy(ownership, memberName, cardId)

              if (isSelf) {
                return (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={owned}
                      disabled={setOwnership.isPending}
                      onChange={(e) => setOwnership.mutate({ cardId, owned: e.target.checked })}
                    />
                    <span>{owned ? 'Owned' : 'Not owned'}</span>
                  </label>
                )
              }

              if (owned) {
                return <p className="text-xs font-medium text-green-600">Owned</p>
              }

              if (!SENDABLE_CARD_IDS.has(cardId)) {
                return <p className="text-xs text-neutral-500">Not owned</p>
              }

              return (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-neutral-500">Not owned</p>
                  <button
                    type="button"
                    disabled={logSend.isPending}
                    onClick={() => handleSend(cardId)}
                    className="ml-auto text-xs rounded bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 px-2 py-1 font-medium disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              )
            }}
          />
        ))}
    </div>
  )
}
