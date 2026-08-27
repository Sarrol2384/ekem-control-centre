import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, isLocalDemo, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-muted)]">
        Loading session…
      </div>
    )
  }

  if (!session && !isLocalDemo) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
