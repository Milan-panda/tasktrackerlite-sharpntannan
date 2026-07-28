"use client"

import Link from "next/link"
import { LayoutList, LogOut, ShieldCheck, Tags, Users } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { useAuth } from "@/lib/auth-context"

export function AppShell({
  children,
  eyebrow,
  title,
  description,
}: {
  children: React.ReactNode
  eyebrow: string
  title: string
  description: string
}) {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <main className="min-h-svh bg-[#f6f4ef] text-[#292724]">
      <header className="border-b border-[#dedad1] bg-[#f6f4ef]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-lg bg-[#34312d] text-sm text-[#f6f4ef]">TL</span>
            <span className="hidden sm:inline">Task Tracker Lite</span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            <Button aria-label="Tasks" nativeButton={false} render={<Link href="/dashboard" />} variant="ghost"><LayoutList /> <span className="hidden lg:inline">Tasks</span></Button>
            {user.role === "admin" && (
              <>
                <Button aria-label="Categories" nativeButton={false} render={<Link href="/admin/categories" />} variant="ghost"><Tags /> <span className="hidden lg:inline">Categories</span></Button>
                <Button aria-label="Users" nativeButton={false} render={<Link href="/admin/users" />} variant="ghost"><Users /> <span className="hidden lg:inline">Users</span></Button>
                <Button aria-label="Admin dashboard" nativeButton={false} render={<Link href="/admin/dashboard" />} variant="ghost"><ShieldCheck /> <span className="hidden lg:inline">Admin</span></Button>
              </>
            )}
            <Button variant="ghost" onClick={() => void logout()} aria-label="Sign out" className="cursor-pointer"><LogOut /></Button>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#777169]">{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6a63]">{description}</p>
        </div>
        {children}
      </section>
    </main>
  )
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== "admin") {
    if (typeof window !== "undefined") window.location.replace("/dashboard")
    return null
  }
  return children
}
