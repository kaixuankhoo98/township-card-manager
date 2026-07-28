import { useState, type FormEvent } from 'react'
import { ALL_CARDS, ROSTER } from '../lib/catalog'
import { UNSENDABLE_RARITIES } from '../types/catalog'
import { useAuth } from '../context/AuthContext'
import { useLogSend } from '../hooks/useSendLog'

const SENDABLE_CARDS = ALL_CARDS.filter((card) => !UNSENDABLE_RARITIES.has(card.rarity))

export function SendCardPage() {
  const { auth } = useAuth()
  const logSend = useLogSend()
  const recipients = ROSTER.filter((name) => name !== auth?.member)

  const [cardId, setCardId] = useState(SENDABLE_CARDS[0]?.id ?? '')
  const [recipient, setRecipient] = useState(recipients[0] ?? '')
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSuccess(null)
    const card = SENDABLE_CARDS.find((c) => c.id === cardId)
    await logSend.mutateAsync({ recipient, cardId })
    setSuccess(`Sent "${card?.name}" to ${recipient}.`)
  }

  if (!auth) return null

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Send a Card</h1>
      <p className="text-sm text-neutral-500">
        Gold and Diamond cards can't be sent in Township, so they're not listed here.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="card" className="block text-sm font-medium">
            Card
          </label>
          <select
            id="card"
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent p-2"
          >
            {SENDABLE_CARDS.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="recipient" className="block text-sm font-medium">
            Send to
          </label>
          <select
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent p-2"
          >
            {recipients.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {logSend.isError && <p className="text-sm text-red-600">Couldn't log this send.</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={logSend.isPending || !recipient || !cardId}
          className="w-full rounded bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 p-2 font-medium disabled:opacity-50"
        >
          {logSend.isPending ? 'Sending…' : 'Send Card'}
        </button>
      </form>
    </div>
  )
}
