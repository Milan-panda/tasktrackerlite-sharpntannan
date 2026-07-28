export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f6f4ef] px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Task Tracker Lite
        </h1>
        {children}
      </div>
    </main>
  )
}
