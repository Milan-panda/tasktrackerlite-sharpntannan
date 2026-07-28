import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function Page() {
  const cookieStore = await cookies()
  const cookieName = process.env.SESSION_COOKIE_NAME ?? "session"
  redirect(cookieStore.has(cookieName) ? "/dashboard" : "/login")
}
