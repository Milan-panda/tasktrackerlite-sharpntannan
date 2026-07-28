import type { Metadata } from "next"

import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = { title: "Sign in · Task Tracker Lite" }

export default function LoginPage() {
  return <LoginForm />
}
