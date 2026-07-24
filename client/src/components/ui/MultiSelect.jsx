export default function MultiSelect({ options, selected, onChange }) {
  function toggle(id) {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id))
    else onChange([...selected, id])
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map(opt => {
        const isSelected = selected.includes(opt.id)
        return (
          <button
            type="button"
            key={opt.id}
            onClick={() => toggle(opt.id)}
            aria-pressed={isSelected}
            className={`chip ${isSelected ? 'chip-selected' : ''} focus-ring`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                isSelected ? 'border-clay-500 bg-clay-500' : 'border-ink-300 bg-white'
              }`}
            >
              {isSelected && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
