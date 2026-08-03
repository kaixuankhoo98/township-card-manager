import { Link } from 'react-router-dom'
import { ROSTER } from '../lib/catalog'

export function MembersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Members</h1>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ROSTER.map((name) => (
          <li key={name}>
            <Link
              to={`/members/${encodeURIComponent(name)}`}
              className="block rounded border border-neutral-300 dark:border-neutral-700 p-3 font-medium hover:bg-neutral-100"
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
