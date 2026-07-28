"use client"

import * as React from "react"

import { AdminGuard, AppShell } from "@/components/app-shell"
import { Notice, Select } from "@/components/dashboard"
import { useAuth } from "@/lib/auth-context"
import {
  adminApi,
  ApiError,
  type AdminUser,
  type UserRole,
} from "@/lib/api"

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Could not update the role"
}

export function UserManager() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<{
    kind: "ok" | "error"
    text: string
  } | null>(null)

  React.useEffect(() => {
    adminApi
      .users()
      .then(setUsers)
      .catch((error: unknown) =>
        setNotice({ kind: "error", text: errorMessage(error) })
      )
  }, [])

  async function updateRole(target: AdminUser, role: UserRole) {
    if (target.role === role) return
    setSavingId(target.id)
    setNotice(null)
    try {
      const updated = await adminApi.updateRole(target.id, role)
      setUsers((current) =>
        current.map((user) => (user.id === updated.id ? updated : user))
      )
      setNotice({
        kind: "ok",
        text: `${target.name} is now ${role === "admin" ? "an admin" : "a normal user"}.`,
      })
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error) })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <AdminGuard>
      <AppShell
        eyebrow="Administration / access"
        title="Users and roles"
        description="Review who can use administrative features and update access when responsibilities change."
      >
        {notice && <Notice {...notice} />}
        <div className="overflow-x-auto rounded-xl border bg-[#fffdfa] shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#eeeae2] text-xs font-semibold text-[#635e57]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Joined</th>
                <th className="w-52 p-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e1d9]">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUser?.id
                return (
                  <tr key={user.id} className="hover:bg-[#f9f7f2]">
                    <td className="p-4 font-semibold">
                      {user.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs font-normal text-[#777169]">
                          You
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-[#625d56]">{user.email}</td>
                    <td className="p-4 text-xs tabular-nums text-[#777169]">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Select
                        aria-label={`Role for ${user.name}`}
                        value={user.role}
                        disabled={isCurrentUser || savingId === user.id}
                        onChange={(event) =>
                          void updateRole(user, event.target.value as UserRole)
                        }
                      >
                        <option value="user">Normal user</option>
                        <option value="admin">Admin</option>
                      </Select>
                      {isCurrentUser && (
                        <p className="mt-1.5 text-xs text-[#777169]">
                          Your own role cannot be changed here.
                        </p>
                      )}
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[#777169]">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AppShell>
    </AdminGuard>
  )
}
