import { useLanguage } from '../../context/LanguageContext'
import { SUPPORTED_LANGUAGES } from '../../i18n/translations'

export default function LanguageSwitcher({ dark = false }) {
  const { lang, setLang } = useLanguage()

  return (
    <div
      className={`inline-flex rounded-lg border p-0.5 text-xs font-medium ${
        dark ? 'border-ink-700 bg-ink-800' : 'border-ink-200 bg-ink-50'
      }`}
      role="group"
      aria-label="Language"
    >
      {SUPPORTED_LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`rounded-md px-2.5 py-1 transition-colors focus-ring ${
            lang === code
              ? 'bg-clay-500 text-white'
              : dark
                ? 'text-ink-300 hover:text-white'
                : 'text-ink-500 hover:text-ink-800'
          }`}
          aria-pressed={lang === code}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
