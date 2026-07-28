import type { Metadata } from "next"

import { RegisterForm } from "@/components/register-form"

export const metadata: Metadata = {
  title: "Create account · Task Tracker Lite",
}

export default function RegisterPage() {
  return <RegisterForm />
}
