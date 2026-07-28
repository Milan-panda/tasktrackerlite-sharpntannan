"use client"

import * as React from "react"

import { AdminGuard, AppShell } from "@/components/app-shell"
import { Field, Notice, Select, Status } from "@/components/dashboard"
import { Input } from "@workspace/ui/components/input"
import { adminApi, ApiError, type AdminTask, type AdminUser } from "@/lib/api"

export function AdminDashboard() {
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [tasks, setTasks] = React.useState<AdminTask[]>([])
  const [error, setError] = React.useState("")
  const [filters, setFilters] = React.useState({ user_id: "", status: "", due_after: "", due_before: "" })

  React.useEffect(() => { adminApi.users().then(setUsers).catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Could not load users")) }, [])
  React.useEffect(() => { adminApi.tasks(filters).then(setTasks).catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Could not load tasks")) }, [filters])

  return <AdminGuard><AppShell eyebrow="Administration / oversight" title="Work across the team." description="A read-only view of every task. Combine owner, status, and inclusive date boundaries to inspect workload without changing anyone’s work.">
    {error && <Notice kind="error" text={error} />}
    <div className="mb-5 grid gap-3 border-y border-[#dedad1] py-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Owner"><Select value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}><option value="">Everyone</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} — {user.email}</option>)}</Select></Field>
      <Field label="Status"><Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option><option value="todo">To do</option><option value="doing">Doing</option><option value="done">Done</option></Select></Field>
      <Field label="Due on or after"><Input type="date" value={filters.due_after} onChange={(e) => setFilters({ ...filters, due_after: e.target.value })} /></Field>
      <Field label="Due on or before"><Input type="date" value={filters.due_before} onChange={(e) => setFilters({ ...filters, due_before: e.target.value })} /></Field>
    </div>
    <div className="overflow-x-auto rounded-xl border bg-[#fffdfa] shadow-sm"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-[#eeeae2] text-xs font-semibold text-[#635e57]"><tr><th className="p-4">Owner</th><th className="p-4">Task</th><th className="p-4">Category</th><th className="p-4">Due</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y divide-[#e5e1d9]">{tasks.map((task) => <tr key={task.id} className="hover:bg-[#f9f7f2]"><td className="p-4"><p className="font-semibold">{task.owner.name}</p><p className="text-xs text-[#777169]">{task.owner.email}</p></td><td className="p-4"><p className="font-semibold">{task.title}</p>{task.description && <p className="mt-1 max-w-xs truncate text-xs text-[#777169]">{task.description}</p>}</td><td className="p-4">{task.category.name}{!task.category.is_active && <span className="ml-1 text-xs text-[#8a493d]">(inactive)</span>}</td><td className="p-4 text-xs tabular-nums">{task.due_date}</td><td className="p-4"><Status value={task.status} /></td></tr>)}{tasks.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-[#777169]">No tasks match these filters.</td></tr>}</tbody></table></div>
  </AppShell></AdminGuard>
}
