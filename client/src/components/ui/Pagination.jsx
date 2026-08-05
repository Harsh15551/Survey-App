import { useLanguage } from '../../context/LanguageContext'

export default function Pagination({ page, totalPages, totalItems, limit, onPageChange }) {
  const { t } = useLanguage()

  if (totalItems <= 0) return null

  const startIdx = (page - 1) * limit + 1
  const endIdx = Math.min(page * limit, totalItems)

  const statusText = t('pagination.status')
    .replace('{start}', startIdx)
    .replace('{end}', endIdx)
    .replace('{total}', totalItems)

  const pageOfText = t('pagination.pageOf')
    .replace('{page}', page)
    .replace('{total}', totalPages || 1)

  return (
    <div className="flex flex-col items-center justify-between gap-2 px-2 py-3 sm:flex-row text-sm text-ink-500">
      <div>
        {statusText}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg p-1.5 hover:bg-ink-100 hover:text-ink-900 transition-colors disabled:opacity-30 disabled:hover:bg-transparent focus-ring"
          aria-label="Previous page"
        >
          <i className="ti ti-chevron-left text-base" aria-hidden="true" />
        </button>

        <span className="font-medium text-ink-700">
          {pageOfText}
        </span>

        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg p-1.5 hover:bg-ink-100 hover:text-ink-900 transition-colors disabled:opacity-30 disabled:hover:bg-transparent focus-ring"
          aria-label="Next page"
        >
          <i className="ti ti-chevron-right text-base" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
