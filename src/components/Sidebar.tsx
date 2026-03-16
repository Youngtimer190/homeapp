import { Section } from '../types';

type NavSection = Section | 'dashboard';

interface NavItem {
  id: NavSection;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',      icon: '🏠', color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  { id: 'budget',    label: 'Budżet',         icon: '💰', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'tasks',     label: 'Zadania',        icon: '✅', color: 'text-blue-600',    bg: 'bg-blue-50' },
  { id: 'shopping',  label: 'Lista zakupów',  icon: '🛒', color: 'text-teal-600',    bg: 'bg-teal-50' },
  { id: 'meals',     label: 'Posiłki',        icon: '🍽️', color: 'text-orange-600',  bg: 'bg-orange-50' },
  { id: 'vehicles',  label: 'Pojazdy',        icon: '🚗', color: 'text-violet-600',  bg: 'bg-violet-50' },
  { id: 'pets',      label: 'Zwierzęta',      icon: '🐾', color: 'text-amber-600',   bg: 'bg-amber-50' },
  { id: 'members',   label: 'Członkowie',     icon: '👨‍👩‍👧‍👦', color: 'text-rose-600',    bg: 'bg-rose-50' },
];

interface Props {
  active: NavSection;
  onChange: (s: NavSection) => void;
  mobileOpen: boolean;
  onClose: () => void;
  familyName: string;
}

export default function Sidebar({ active, onChange, mobileOpen, onClose, familyName }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40 flex flex-col
          bg-white border-r border-gray-100 shadow-2xl
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:shadow-none lg:z-auto lg:flex-shrink-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow flex-shrink-0">
            🏠
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-900 leading-tight truncate">Dom Manager</h1>
            <p className="text-xs text-gray-400 truncate">{familyName}</p>
          </div>
          {/* Close button mobile */}
          <button
            onClick={onClose}
            className="ml-auto lg:hidden w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 transition"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onChange(item.id); onClose(); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                  transition-all duration-150 font-medium text-sm
                  ${isActive
                    ? `${item.bg} ${item.color} shadow-sm`
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-base leading-none flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-4 rounded-full bg-current opacity-70 flex-shrink-0" />
                )}
              </button>
            );
          })}

          {/* Separator */}
          <div className="pt-2 mt-2 border-t border-gray-100">
            <button
              onClick={() => { onChange('settings'); onClose(); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                transition-all duration-150 font-medium text-sm
                ${active === 'settings'
                  ? 'bg-gray-100 text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }
              `}
            >
              <span className="text-base leading-none flex-shrink-0">⚙️</span>
              <span className="truncate">Ustawienia</span>
              {active === 'settings' && (
                <span className="ml-auto w-1.5 h-4 rounded-full bg-current opacity-70 flex-shrink-0" />
              )}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
