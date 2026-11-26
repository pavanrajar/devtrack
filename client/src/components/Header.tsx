
import { ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const Header = () => {
  const location = useLocation()

  const pageTitles: Record<string, string> = {
    '/': 'Overview',
    '/projects': 'Projects',
    '/tasks': 'My Tasks',
    '/team': 'Team',
    '/settings': 'Settings',
  }

  const currentPage = pageTitles[location.pathname] ?? 'Overview'

  return (
    <header className="flex h-19 shrink-0 items-center justify-between border-b border-[#E7E9E3] bg-[#F8F9F5] px-8">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Workspace</span>
        <ChevronRight size={15} className="text-slate-300" />
        <h2 className="text-sm font-semibold text-[#14251D]">
          {currentPage}
        </h2>
      </div>

      <span className="text-xs font-medium text-[#7A857D]">
        Team workspace
      </span>
    </header>
  )
}

export default Header
