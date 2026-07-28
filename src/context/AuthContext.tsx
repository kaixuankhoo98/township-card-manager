import { createContext, useContext, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

const STORAGE_KEY = 'township-auth'

export interface AuthState {
  member: string
  passphrase: string
}

interface AuthContextValue {
  auth: AuthState | null
  login: (member: string, passphrase: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredAuth(): AuthState | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthState
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(readStoredAuth)

  async function login(member: string, passphrase: string) {
    const { error } = await supabase.rpc('check_passphrase', { p_passphrase: passphrase })
    if (error) {
      throw new Error('Incorrect passphrase')
    }
    const next = { member, passphrase }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setAuth(next)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
  }

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
