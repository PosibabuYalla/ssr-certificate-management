import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { auth } from '../lib/api'
import type { Admin } from '../types'

interface AuthContextValue {
  admin: Admin | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      try {
        const res = await auth.me()
        setAdmin(res.data.data.admin)
      } catch {
        setAdmin(null)
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await auth.login(email, password)
    setAdmin(res.data.data.admin)
  }, [])

  const logout = useCallback(async () => {
    await auth.logout()
    setAdmin(null)
  }, [])

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
