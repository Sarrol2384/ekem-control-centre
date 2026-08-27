import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import {
  AuthContext,
  LOCAL_DEMO_PROFILE,
  LOCAL_DEMO_STORAGE_KEY,
  type AuthContextValue,
  type Profile,
} from './AuthContext'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as Profile
}

function readLocalDemoFlag(): boolean {
  if (isSupabaseConfigured) return false
  return localStorage.getItem(LOCAL_DEMO_STORAGE_KEY) === '1'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLocalDemo, setIsLocalDemo] = useState(() => readLocalDemoFlag())
  const [profile, setProfile] = useState<Profile | null>(() =>
    readLocalDemoFlag() ? LOCAL_DEMO_PROFILE : null,
  )
  const [loading, setLoading] = useState(() => isSupabaseConfigured)

  const refreshProfile = useCallback(async () => {
    const currentUserId = session?.user?.id
    if (!currentUserId) {
      if (isLocalDemo) {
        setProfile(LOCAL_DEMO_PROFILE)
        return
      }
      setProfile(null)
      return
    }
    const nextProfile = await fetchProfile(currentUserId)
    setProfile(nextProfile)
  }, [session?.user?.id, isLocalDemo])

  useEffect(() => {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return
    }

    let mounted = true

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) {
        const nextProfile = await fetchProfile(data.session.user.id)
        if (mounted) setProfile(nextProfile)
      }
      if (mounted) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setIsLocalDemo(false)
      localStorage.removeItem(LOCAL_DEMO_STORAGE_KEY)
      setSession(nextSession)
      if (!nextSession?.user) {
        setProfile(null)
        setLoading(false)
        return
      }

      void fetchProfile(nextSession.user.id).then((nextProfile) => {
        setProfile(nextProfile)
        setLoading(false)
      })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return {
        error:
          'Supabase is not configured. Copy .env.example to .env.local and add project credentials, or use local demonstration mode.',
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const enterLocalDemo = useCallback(() => {
    if (isSupabaseConfigured) return
    localStorage.setItem(LOCAL_DEMO_STORAGE_KEY, '1')
    setIsLocalDemo(true)
    setProfile(LOCAL_DEMO_PROFILE)
    setSession(null)
    setLoading(false)
  }, [])

  const signOut = useCallback(async () => {
    localStorage.removeItem(LOCAL_DEMO_STORAGE_KEY)
    setIsLocalDemo(false)
    setProfile(null)

    const supabase = getSupabaseClient()
    if (!supabase) {
      setSession(null)
      return
    }
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile: isLocalDemo ? LOCAL_DEMO_PROFILE : profile,
      loading,
      isConfigured: isSupabaseConfigured,
      isLocalDemo,
      signIn,
      enterLocalDemo,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      isLocalDemo,
      signIn,
      enterLocalDemo,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
