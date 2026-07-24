export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-ink-100 bg-white px-4 py-3 md:px-8">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-ink-400 sm:flex-row">
        <p>© {year} Veerbhadreshwar Trust · Gulbarga &amp; Bidar</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-ink-600 transition-colors">Privacy policy</a>
          <a href="#" className="hover:text-ink-600 transition-colors">Terms of use</a>
          <a href="#" className="hover:text-ink-600 transition-colors">Contact support</a>
        </div>
      </div>
    </footer>
  )
}
