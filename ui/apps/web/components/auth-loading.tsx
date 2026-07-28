export function AuthLoading() {
  return (
    <div
      className="grid min-h-svh place-items-center bg-background"
      role="status"
      aria-label="Loading session"
    >
      <div className="size-7 animate-spin rounded-full border-2 border-muted border-t-foreground" />
    </div>
  )
}
