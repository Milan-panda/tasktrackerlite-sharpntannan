import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import { AuthProvider } from "@/lib/auth-context"

export const metadata: Metadata = {
  title: "Task Tracker Lite",
  description: "A calm, focused place for the work that matters.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans antialiased">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
