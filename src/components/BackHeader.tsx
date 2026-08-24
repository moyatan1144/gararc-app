import { Link } from 'react-router-dom'

export default function BackHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Link
        to={to}
        aria-label="戻る"
        className="flex items-center justify-center w-9 h-9 -ml-2 rounded-full text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-800"
      >
        <span className="text-xl leading-none">←</span>
      </Link>
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  )
}
