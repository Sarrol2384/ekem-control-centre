import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { UserRole } from '../lib/database.types'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: UserRole
}

export type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  isConfigured: boolean
  /** Local demonstration access when Supabase is not configured — not real authentication. */
  isLocalDemo: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  enterLocalDemo: () => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const LOCAL_DEMO_PROFILE: Profile = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo.manager@example.com',
  full_name: 'Demo Manager',
  role: 'manager',
}

export const LOCAL_DEMO_STORAGE_KEY = 'ekem.auth.localDemo'
