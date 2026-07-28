import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/members', label: 'Members' },
  { to: '/history', label: 'History' },
]

export function Layout() {
  const { auth, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-300 dark:border-neutral-700 p-4 flex flex-wrap items-center gap-4">
        <span className="font-semibold">Township Card Manager</span>
        <nav className="flex gap-3 text-sm">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'font-semibold underline' : 'text-neutral-600 dark:text-neutral-400'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {auth && (
            <NavLink to={`/members/${encodeURIComponent(auth.member)}`} className="underline">
              {auth.member}
            </NavLink>
          )}
          <button type="button" onClick={logout} className="underline">
            Log out
          </button>
        </div>
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
