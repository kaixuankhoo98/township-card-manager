import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROSTER } from '../lib/catalog'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [member, setMember] = useState(ROSTER[0] ?? '')
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(member, passphrase)
      navigate('/catalog', { replace: true })
    } catch {
      setError('Incorrect passphrase — ask a co-op member for it.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-300 dark:border-neutral-700 p-6"
      >
        <h1 className="text-xl font-semibold">Township Card Manager</h1>

        <div className="space-y-1">
          <label htmlFor="member" className="block text-sm font-medium">
            Who are you?
          </label>
          <select
            id="member"
            value={member}
            onChange={(e) => setMember(e.target.value)}
            className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent p-2"
          >
            {ROSTER.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="passphrase" className="block text-sm font-medium">
            Co-op passphrase
          </label>
          <input
            id="passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent p-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 p-2 font-medium disabled:opacity-50"
        >
          {submitting ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
