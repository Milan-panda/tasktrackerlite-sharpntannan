"use client"

import * as React from "react"

import { AuthLoading } from "@/components/auth-loading"
import { useAuth } from "@/lib/auth-context"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) return <AuthLoading />
  if (!user) return <SessionExpiredRedirect />
  return children
}

function SessionExpiredRedirect() {
  React.useEffect(() => {
    window.location.replace("/login")
  }, [])

  return <AuthLoading />
}
