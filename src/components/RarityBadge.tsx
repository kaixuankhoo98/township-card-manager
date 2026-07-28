import type { Rarity } from '../types/catalog'

const RARITY_LABELS: Record<Rarity, string> = {
  one_star: '1★',
  two_star: '2★',
  three_star: '3★',
  four_star: '4★',
  five_star: '5★',
  gold: 'Gold',
  diamond: 'Diamond',
}

const RARITY_CLASSES: Record<Rarity, string> = {
  one_star: 'bg-neutral-200 text-neutral-800',
  two_star: 'bg-lime-200 text-lime-900',
  three_star: 'bg-sky-200 text-sky-900',
  four_star: 'bg-violet-200 text-violet-900',
  five_star: 'bg-rose-200 text-rose-900',
  gold: 'bg-amber-300 text-amber-950',
  diamond: 'bg-cyan-200 text-cyan-950',
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${RARITY_CLASSES[rarity]}`}
    >
      {RARITY_LABELS[rarity]}
    </span>
  )
}
