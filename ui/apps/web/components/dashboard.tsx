"use client"

import * as React from "react"
import { Check, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { AppShell } from "@/components/app-shell"
import {
  ApiError,
  categoryApi,
  taskApi,
  type Category,
  type Task,
  type TaskInput,
  type TaskStatus,
} from "@/lib/api"

const emptyForm: TaskInput = {
  title: "",
  description: "",
  category_id: "",
  status: "todo",
  due_date: "",
}
const statusLabel: Record<TaskStatus, string> = { todo: "To do", doing: "Doing", done: "Done" }
const nextStatus: Record<TaskStatus, TaskStatus> = { todo: "doing", doing: "done", done: "todo" }

function message(error: unknown) {
  return error instanceof ApiError ? error.message : "Something went wrong"
}

export function Dashboard() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [filters, setFilters] = React.useState({ status: "", category_id: "" })
  const [form, setForm] = React.useState<TaskInput>(emptyForm)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null)
  const [busy, setBusy] = React.useState(false)

  const loadTasks = React.useCallback(async () => {
    try {
      setTasks(await taskApi.list(filters))
    } catch (error) {
      setNotice({ kind: "error", text: message(error) })
    }
  }, [filters])

  React.useEffect(() => {
    taskApi.list(filters).then(setTasks).catch((error) => setNotice({ kind: "error", text: message(error) }))
  }, [filters])
  React.useEffect(() => {
    categoryApi.list().then(setCategories).catch((error) => setNotice({ kind: "error", text: message(error) }))
  }, [])

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setNotice(null)
    try {
      if (editingId) await taskApi.update(editingId, form)
      else await taskApi.create(form)
      setNotice({ kind: "ok", text: editingId ? "Task updated." : "Task created." })
      cancelEdit()
      await loadTasks()
    } catch (error) {
      setNotice({ kind: "error", text: message(error) })
    } finally { setBusy(false) }
  }

  function edit(task: Task) {
    setEditingId(task.id)
    setForm({
      title: task.title,
      description: task.description,
      category_id: task.category_id,
      status: task.status,
      due_date: task.due_date,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function changeStatus(task: Task) {
    try {
      await taskApi.setStatus(task.id, nextStatus[task.status])
      setNotice({ kind: "ok", text: `Moved “${task.title}” to ${statusLabel[nextStatus[task.status]]}.` })
      await loadTasks()
    } catch (error) { setNotice({ kind: "error", text: message(error) }) }
  }

  async function remove(task: Task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return
    try {
      await taskApi.remove(task.id)
      setNotice({ kind: "ok", text: "Task deleted." })
      await loadTasks()
    } catch (error) { setNotice({ kind: "error", text: message(error) }) }
  }

  return (
    <AppShell eyebrow="Personal workspace" title="Keep the day moving." description="Capture work, give it a deadline, and move it forward. Overdue tasks stay editable, but their status is locked until the date is corrected.">
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <form onSubmit={submit} className="h-fit rounded-xl border bg-[#fffdfa] p-5 shadow-sm lg:sticky lg:top-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editingId ? "Edit task" : "New task"}</h2>
            {editingId && <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}><X /> Cancel</Button>}
          </div>
          <div className="space-y-4">
            <Field label="Title"><Input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs doing?" /></Field>
            <Field label="Description"><textarea className="min-h-24 w-full rounded-lg border bg-[#fffdfa] px-3.5 py-2 text-sm outline-none focus:border-[#716c64] focus:ring-4 focus:ring-[#716c64]/10" maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional context" /></Field>
            <Field label="Category"><Select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
              <Field label="Due date"><Input required type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Field>
            </div>
            <Button className="w-full" disabled={busy || categories.length === 0} type="submit"><Plus /> {busy ? "Saving…" : editingId ? "Save changes" : "Add task"}</Button>
            {categories.length === 0 && <p className="text-xs text-[#9b3d25]">An admin needs to create an active category first.</p>}
          </div>
        </form>

        <section>
          {notice && <Notice {...notice} />}
          <div className="mb-4 flex flex-col gap-3 border-y border-[#dedad1] py-4 sm:flex-row sm:items-end">
            <Field label="Filter by status"><Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
            <Field label="Filter by category"><Select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field>
            <span className="ml-auto pb-2 text-xs font-medium text-[#777169]">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-[#fffdfa] shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#eeeae2] text-xs font-semibold text-[#635e57]"><tr><th className="p-4">Task</th><th className="p-4">Category</th><th className="p-4">Due</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-[#e5e1d9]">
                {tasks.map((task) => <tr key={task.id} className="group hover:bg-[#f9f7f2]"><td className="p-4"><p className="font-semibold">{task.title}</p>{task.description && <p className="mt-1 max-w-sm truncate text-xs text-[#777169]">{task.description}</p>}</td><td className="p-4"><span className="rounded-md bg-[#ece9e2] px-2.5 py-1 text-xs text-[#57524c]">{task.category.name}{!task.category.is_active && " · inactive"}</span></td><td className="p-4 text-xs tabular-nums">{task.due_date}</td><td className="p-4"><Status value={task.status} /></td><td className="p-4"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" onClick={() => edit(task)} aria-label={`Edit ${task.title}`}><Pencil /></Button><Button variant="ghost" size="icon-sm" onClick={() => void changeStatus(task)} aria-label={`Change status of ${task.title}`}>{task.status === "done" ? <Check /> : <ChevronRight />}</Button><Button variant="destructive" size="icon-sm" onClick={() => void remove(task)} aria-label={`Delete ${task.title}`}><Trash2 /></Button></div></td></tr>)}
                {tasks.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-[#777169]">No tasks match this view. Add one or adjust the filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block flex-1 text-xs font-medium text-[#625d56]"><span className="mb-1.5 block">{label}</span>{children}</label> }
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className="h-11 w-full min-w-0 rounded-lg border bg-[#fffdfa] px-3 text-sm font-normal outline-none focus:border-[#716c64] focus:ring-4 focus:ring-[#716c64]/10" /> }
export function Notice({ kind, text }: { kind: "ok" | "error"; text: string }) { return <p role={kind === "error" ? "alert" : "status"} className={`mb-4 rounded-lg border px-4 py-3 text-sm ${kind === "ok" ? "border-[#cbd8cd] bg-[#edf3ee] text-[#36533d]" : "border-[#e3c7c1] bg-[#f8ece9] text-[#7a382c]"}`}>{text}</p> }
export function Status({ value }: { value: TaskStatus }) { return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${value === "done" ? "bg-[#e6eee7] text-[#3f5944]" : value === "doing" ? "bg-[#f3ead8] text-[#69572f]" : "bg-[#eceae6] text-[#5e5952]"}`}>{statusLabel[value]}</span> }
