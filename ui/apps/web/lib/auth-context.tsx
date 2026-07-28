"use client"

import * as React from "react"

import {
  ApiError,
  authApi,
  type LoginInput,
  type RegisterInput,
  type User,
} from "@/lib/api"

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    authApi
      .me()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch((error: unknown) => {
        if (active && (!(error instanceof ApiError) || error.status !== 401)) {
          console.error("Unable to restore session", error)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const login = React.useCallback(async (input: LoginInput) => {
    const currentUser = await authApi.login(input)
    setUser(currentUser)
    return currentUser
  }, [])

  const register = React.useCallback(async (input: RegisterInput) => {
    await authApi.register(input)
    const currentUser = await authApi.login({
      email: input.email,
      password: input.password,
    })
    setUser(currentUser)
    return currentUser
  }, [])

  const logout = React.useCallback(async () => {
    await authApi.logout()
    window.location.replace("/login")
  }, [])

  const value = React.useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
