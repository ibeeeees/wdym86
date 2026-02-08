export default function EnterpriseFooter() {
  return (
    <footer className="mt-12 border-t border-neutral-200 dark:border-neutral-800 pt-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">wdym86</span>
          <span className="text-neutral-300 dark:text-neutral-600">|</span>
          <span>AI-Powered Restaurant Intelligence</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Privacy</span>
          <span className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Terms</span>
          <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700">v0.1.0</span>
        </div>
      </div>
    </footer>
  )
}
