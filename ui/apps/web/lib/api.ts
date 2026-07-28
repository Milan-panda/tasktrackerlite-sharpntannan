export type UserRole = "admin" | "user"

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
}

export type LoginInput = { email: string; password: string }
export type RegisterInput = LoginInput & {
  name: string
  confirm_password: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      detail?: string | Array<{ msg?: string }>
    } | null
    const detail = payload?.detail
    const message = Array.isArray(detail)
      ? (detail[0]?.msg ?? "Please check the form and try again")
      : (detail ?? "Something went wrong")
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export type Category = {
  id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TaskStatus = "todo" | "doing" | "done"
export type Task = {
  id: string
  owner_id: string
  category_id: string
  title: string
  description: string
  status: TaskStatus
  due_date: string
  created_at: string
  updated_at: string
  category: Category
}
export type TaskInput = Pick<
  Task,
  "category_id" | "title" | "description" | "status" | "due_date"
>
export type AdminUser = User
export type AdminTask = Task & { owner: AdminUser }

function queryString(filters: Record<string, string>) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value)
  ).toString()
  return query ? `?${query}` : ""
}

export const authApi = {
  register: (input: RegisterInput) =>
    apiRequest<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  login: (input: LoginInput) =>
    apiRequest<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  logout: () =>
    apiRequest<{ message: string }>("/auth/logout", { method: "POST" }),
  me: () => apiRequest<User>("/auth/me"),
}

export const categoryApi = {
  list: () => apiRequest<Category[]>("/categories"),
  create: (name: string) =>
    apiRequest<Category>("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  update: (id: string, name: string) =>
    apiRequest<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),
  deactivate: (id: string) =>
    apiRequest<Category>(`/categories/${id}`, { method: "DELETE" }),
}

export const taskApi = {
  list: (filters: { status: string; category_id: string }) =>
    apiRequest<Task[]>(`/tasks${queryString(filters)}`),
  create: (input: TaskInput) =>
    apiRequest<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: TaskInput) =>
    apiRequest<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  setStatus: (id: string, status: TaskStatus) =>
    apiRequest<Task>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/tasks/${id}`, { method: "DELETE" }),
}

export const adminApi = {
  users: () => apiRequest<AdminUser[]>("/admin/users"),
  updateRole: (id: string, role: UserRole) =>
    apiRequest<AdminUser>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  tasks: (filters: Record<string, string>) =>
    apiRequest<AdminTask[]>(`/admin/tasks${queryString(filters)}`),
}
