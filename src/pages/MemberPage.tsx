import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ALL_CARDS, CATALOG, ROSTER, findCard } from '../lib/catalog'
import { UNSENDABLE_RARITIES } from '../types/catalog'
import { CategorySection } from '../components/CategorySection'
import { useAuth } from '../context/AuthContext'
import { isOwnedBy, useOwnershipQuery, useSetOwnership } from '../hooks/useOwnership'
import { useLogSend } from '../hooks/useSendLog'
import { currentLap, useLapQuery, useResetCollection } from '../hooks/useCollectionReset'

const SENDABLE_CARD_IDS = new Set(
  ALL_CARDS.filter((card) => !UNSENDABLE_RARITIES.has(card.rarity)).map((card) => card.id),
)

// Only worth listing missing cards individually once the pile gets small enough to scan.
const CARD_VIEW_THRESHOLD = 30

export function MemberPage() {
  const { name = '' } = useParams<{ name: string }>()
  const memberName = decodeURIComponent(name)

  const { auth } = useAuth()
  const { data: ownership, isLoading, isError } = useOwnershipQuery()
  const { data: laps } = useLapQuery()
  const setOwnership = useSetOwnership()
  const logSend = useLogSend()
  const resetCollection = useResetCollection()
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

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
  const lap = laps ? currentLap(laps, memberName) : undefined

  const missingCards = ownership
    ? ALL_CARDS.filter(
        (card) => !UNSENDABLE_RARITIES.has(card.rarity) && !isOwnedBy(ownership, memberName, card.id),
      )
    : []

  const missingByCategory =
    missingCards.length > 0
      ? CATALOG.categories
          .map((category) => ({
            category,
            cards: category.cards.filter((card) =>
              missingCards.some((missing) => missing.id === card.id),
            ),
          }))
          .filter((group) => group.cards.length > 0)
      : []

  async function handleReset() {
    try {
      await resetCollection.mutateAsync()
      setConfirmingReset(false)
    } catch {
      // resetCollection.isError is rendered below
    }
  }

  function copyToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text)
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok ? Promise.resolve() : Promise.reject(new Error('execCommand copy failed'))
  }

  async function handleCopyMissing() {
    const text = [
      `Cards required for ${memberName}:`,
      '',
      ...missingByCategory.map(
        ({ category, cards }) => `${category.name}: ${cards.map((card) => card.name).join(', ')}`,
      ),
    ].join('\n')
    try {
      await copyToClipboard(text)
      setCopyError(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError(true)
    }
  }

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
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">
          {memberName}
          {isSelf && <span className="font-normal text-neutral-500"> (You)</span>}
        </h1>
        {lap !== undefined && lap > 1 && (
          <span className="text-xs font-semibold rounded bg-amber-200 text-amber-950 px-2 py-0.5">
            Lap {lap}
          </span>
        )}
      </div>

      {isSelf && (
        <div className="text-sm">
          {!confirmingReset ? (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="underline text-neutral-500"
            >
              Reset my collection
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span>Clear all your owned cards for this season and start lap {(lap ?? 1) + 1}?</span>
              <button
                type="button"
                disabled={resetCollection.isPending}
                onClick={handleReset}
                className="rounded bg-red-600 text-white px-2 py-1 text-xs font-medium disabled:opacity-50"
              >
                {resetCollection.isPending ? 'Resetting…' : 'Confirm reset'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="underline text-neutral-500"
              >
                Cancel
              </button>
            </div>
          )}
          {resetCollection.isError && (
            <p className="text-sm text-red-600">Couldn't reset — try again.</p>
          )}
        </div>
      )}

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

      {missingCards.length > 0 && (
        <details
          open={missingCards.length < CARD_VIEW_THRESHOLD}
          className="rounded-lg border-2 border-dashed border-neutral-400 dark:border-neutral-600 p-3"
        >
          <summary className="text-sm font-semibold cursor-pointer select-none">
            Still needed ({missingCards.length})
          </summary>
          <div className="space-y-2 mt-3">
            <button
              type="button"
              onClick={handleCopyMissing}
              className="text-xs rounded bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 px-2 py-1 font-medium"
            >
              {copied ? 'Copied!' : copyError ? 'Copy failed — try again' : 'Copy for WhatsApp'}
            </button>
            <div className="space-y-1">
              {missingByCategory.map(({ category, cards }) => (
                <p key={category.id} className="text-sm">
                  <span className="font-medium">{category.name}:</span>{' '}
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {cards.map((card) => card.name).join(', ')}
                  </span>
                </p>
              ))}
            </div>
          </div>
        </details>
      )}

      {ownership &&
        CATALOG.categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            isComplete={category.cards.every((card) => isOwnedBy(ownership, memberName, card.id))}
            isCardOwned={(cardId) => isOwnedBy(ownership, memberName, cardId)}
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
                return <p className="text-xs font-medium text-green-800">Owned</p>
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
