import { findCard } from '../lib/catalog'
import { useSendLogQuery, useUndoSend } from '../hooks/useSendLog'

export function HistoryPage() {
  const { data: sends, isLoading, isError } = useSendLogQuery()
  const undoSend = useUndoSend()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Send History</h1>
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Couldn't load send history.</p>}
      {sends && sends.length === 0 && (
        <p className="text-sm text-neutral-500">No cards have been sent yet.</p>
      )}

      <ul className="space-y-2">
        {sends?.map((send) => {
          const card = findCard(send.card_id)
          return (
            <li
              key={send.id}
              className="flex items-center justify-between gap-4 rounded border border-neutral-300 dark:border-neutral-700 p-3"
            >
              <div className={send.undone ? 'text-neutral-400 line-through' : ''}>
                <span className="font-medium">{send.sender_name}</span> sent{' '}
                <span className="font-medium">{card?.name ?? send.card_id}</span> to{' '}
                <span className="font-medium">{send.recipient_name}</span>
                <span className="ml-2 text-xs text-neutral-500">
                  {new Date(send.sent_at).toLocaleString()}
                </span>
              </div>
              {!send.undone && (
                <button
                  type="button"
                  onClick={() => undoSend.mutate(send.id)}
                  disabled={undoSend.isPending}
                  className="shrink-0 text-sm underline disabled:opacity-50"
                >
                  Undo
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {undoSend.isError && <p className="text-sm text-red-600">Couldn't undo that send.</p>}
    </div>
  )
}
