/** Formats a date as a short relative-time string, e.g. "5m ago", "yesterday". */
export function timeAgo(dateInput) {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 45) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
