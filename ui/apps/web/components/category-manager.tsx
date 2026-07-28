"use client"

import * as React from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { AdminGuard, AppShell } from "@/components/app-shell"
import { Notice } from "@/components/dashboard"
import { ApiError, categoryApi, type Category } from "@/lib/api"

export function CategoryManager() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [name, setName] = React.useState("")
  const [editing, setEditing] = React.useState<Category | null>(null)
  const [notice, setNotice] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null)

  const load = React.useCallback(() => categoryApi.list().then(setCategories).catch((error: unknown) => setNotice({ kind: "error", text: error instanceof ApiError ? error.message : "Could not load categories" })), [])
  React.useEffect(() => { void load() }, [load])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    try {
      if (editing) await categoryApi.update(editing.id, name)
      else await categoryApi.create(name)
      setNotice({ kind: "ok", text: editing ? "Category updated." : "Category created." })
      setName(""); setEditing(null); await load()
    } catch (error) { setNotice({ kind: "error", text: error instanceof ApiError ? error.message : "Could not save category" }) }
  }

  async function deactivate(category: Category) {
    if (!window.confirm(`Deactivate “${category.name}”? Existing tasks will retain it.`)) return
    try { await categoryApi.deactivate(category.id); setNotice({ kind: "ok", text: "Category deactivated." }); await load() }
    catch (error) { setNotice({ kind: "error", text: error instanceof ApiError ? error.message : "Could not deactivate category" }) }
  }

  return <AdminGuard><AppShell eyebrow="Administration / taxonomy" title="Categories" description="Create the labels people use to organise tasks. Deactivated categories disappear from new assignments while remaining visible on historical work.">
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <form onSubmit={save} className="h-fit rounded-xl border bg-[#fffdfa] p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Rename category" : "New category"}</h2>{editing && <Button type="button" variant="ghost" size="sm" onClick={() => { setEditing(null); setName("") }}><X /> Cancel</Button>}</div>
        <label className="mb-4 block text-xs font-semibold uppercase tracking-wide"><span className="mb-1.5 block">Name</span><Input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Client work" /></label>
        <Button type="submit" className="w-full"><Plus /> {editing ? "Save name" : "Create category"}</Button>
      </form>
      <section>{notice && <Notice {...notice} />}<div className="overflow-hidden rounded-xl border bg-[#fffdfa] shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-[#eeeae2] text-xs font-semibold text-[#635e57]"><tr><th className="p-4">Category</th><th className="p-4">State</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#e5e1d9]">{categories.map((category) => <tr key={category.id} className="hover:bg-[#f9f7f2]"><td className="p-4 font-semibold">{category.name}</td><td className="p-4 text-xs text-[#4b5f4e]">Active</td><td className="p-4"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => { setEditing(category); setName(category.name) }}><Pencil /> Edit</Button><Button variant="destructive" size="sm" onClick={() => void deactivate(category)}><Trash2 /> Deactivate</Button></div></td></tr>)}{categories.length === 0 && <tr><td colSpan={3} className="p-12 text-center text-[#777169]">No active categories yet.</td></tr>}</tbody></table></div></section>
    </div>
  </AppShell></AdminGuard>
}
