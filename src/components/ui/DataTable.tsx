interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  page = 1,
  totalPages = 1,
  onPageChange,
  keyExtractor,
  emptyMessage = 'Aucun résultat trouvé',
}: DataTableProps<T>) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-card overflow-hidden transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-dark-700 transition-colors duration-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-dark-400 uppercase tracking-wider transition-colors duration-200 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-dark-700 transition-colors duration-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-dark-500 mb-2 transition-colors duration-200">inbox</span>
                  <p className="text-sm text-gray-400 dark:text-dark-400 transition-colors duration-200">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)} className="hover:bg-gray-50/50 dark:hover:bg-dark-700/50 transition-colors duration-200">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 text-sm text-gray-700 dark:text-dark-200 transition-colors duration-200 ${col.className || ''}`}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-dark-700 transition-colors duration-200">
          <p className="text-sm text-gray-500 dark:text-dark-400 transition-colors duration-200">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-dark-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    pageNum === page
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 dark:text-dark-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-dark-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
