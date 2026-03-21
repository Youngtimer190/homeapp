import { useState, useEffect } from 'react';
import { Section } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Budget from './components/sections/Budget';
import Tasks from './components/sections/Tasks';
import Shopping from './components/sections/Shopping';
import Meals from './components/sections/Meals';
import Vehicles from './components/sections/Vehicles';
import Pets from './components/sections/Pets';
import Members from './components/sections/Members';
import AuthScreen from './components/AuthScreen';
import Settings from './components/sections/Settings';
import { useAuth } from './lib/AuthContext';
import { useSupabaseData } from './lib/useSupabaseData';
import { useLocalData } from './lib/useLocalData';
import { isSupabaseConfigured } from './lib/supabase';
import { useScrollLock } from './hooks/useScrollLock';

type ActiveSection = Section | 'dashboard';
type AppMode = 'auth' | 'demo' | 'app';

const sectionTitles: Record<ActiveSection, { label: string; icon: string }> = {
  dashboard: { label: 'Przegląd',      icon: '🏠' },
  budget:    { label: 'Budżet',        icon: '💰' },
  tasks:     { label: 'Zadania',       icon: '✅' },
  shopping:  { label: 'Lista zakupów', icon: '🛒' },
  meals:     { label: 'Posiłki',       icon: '🍽️' },
  vehicles:  { label: 'Pojazdy',       icon: '🚗' },
  pets:      { label: 'Zwierzęta',     icon: '🐾' },
  members:   { label: 'Członkowie',    icon: '👨‍👩‍👧‍👦' },
  settings:  { label: 'Ustawienia',    icon: '⚙️' },
};

interface AppLayoutProps {
  data: ReturnType<typeof useLocalData>;
  isLocalMode: boolean;
  userEmail?: string;
  onSignOut?: () => void;
  onDeleteAccount?: (password: string) => Promise<{ error: string | null }>;
  onExitDemo?: () => void;
}

function AppLayout({ data, isLocalMode, userEmail, onSignOut, onDeleteAccount, onExitDemo }: AppLayoutProps) {
  const [active, setActive] = useState<ActiveSection>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock scroll when sidebar is open on mobile
  useScrollLock(mobileOpen);

  const memberNames = data.members.map(m => m.name.split(' ')[0]);
  const handleNavigate = (section: Section) => setActive(section);

  const handleSidebarChange = (s: ActiveSection) => {
    setActive(s);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-dvh bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Sidebar */}
      <Sidebar
        active={active}
        onChange={handleSidebarChange}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        familyName={data.familyName}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">

        {/* Header */}
        <header
          className="bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center gap-2 sm:gap-4 sticky top-0 z-30 shadow-sm"
          style={{
            paddingTop: `calc(env(safe-area-inset-top, 0px) + 0.625rem)`,
            paddingBottom: '0.625rem',
          }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition flex-shrink-0"
            aria-label="Menu"
          >
            <span className="text-gray-600 text-lg leading-none">{mobileOpen ? '✕' : '☰'}</span>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              onClick={() => setActive('dashboard')}
              className={`text-sm font-medium transition flex-shrink-0 ${active === 'dashboard' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
            >
              Dom Manager
            </button>
            {active !== 'dashboard' && (
              <>
                <span className="text-gray-300 flex-shrink-0">/</span>
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {sectionTitles[active].icon} {sectionTitles[active].label}
                </span>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
              <span>{data.tasks.filter(t => t.status !== 'done').length} zadań</span>
              <span className="text-gray-300">·</span>
              <span>{data.members.length} osób</span>
            </div>

            {isLocalMode ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                  <span>💾</span>
                  <span className="hidden sm:inline">Demo</span>
                </div>
                {onExitDemo && (
                  <button
                    onClick={onExitDemo}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
                  >
                    <span>🔑</span>
                    <span className="hidden sm:inline">Zaloguj</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-medium text-gray-700 truncate max-w-[140px]">{userEmail}</span>
                  <span className="text-xs text-gray-400">zalogowany</span>
                </div>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition"
                  >
                    🚪 <span className="hidden sm:inline">Wyloguj</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
        >
          <div className="max-w-5xl mx-auto w-full px-3 py-4 sm:px-6 sm:py-6">
            {active === 'dashboard' && (
              <Dashboard
                transactions={data.transactions}
                tasks={data.tasks}
                meals={data.meals}
                vehicles={data.vehicles}
                pets={data.pets}
                members={data.members}
                shoppingLists={data.shoppingLists}
                onNavigate={handleNavigate}
              />
            )}
            {active === 'budget' && (
              <Budget transactions={data.transactions} setTransactions={data.setTransactions} memberNames={memberNames} />
            )}
            {active === 'tasks' && (
              <Tasks tasks={data.tasks} setTasks={data.setTasks} members={memberNames} />
            )}
            {active === 'shopping' && (
              <Shopping lists={data.shoppingLists} setLists={data.setShoppingLists} />
            )}
            {active === 'meals' && (
              <Meals meals={data.meals} setMeals={data.setMeals} />
            )}
            {active === 'vehicles' && (
              <Vehicles vehicles={data.vehicles} setVehicles={data.setVehicles} />
            )}
            {active === 'pets' && (
              <Pets pets={data.pets} setPets={data.setPets} />
            )}
            {active === 'members' && (
              <Members
                members={data.members}
                setMembers={data.setMembers}
                familyName={data.familyName}
                setFamilyName={data.setFamilyName}
              />
            )}
            {active === 'settings' && (
              <Settings
                userEmail={userEmail}
                onSignOut={onSignOut}
                onDeleteAccount={onDeleteAccount}
                isLocalMode={isLocalMode}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Local / Demo mode ──────────────────────────────────────────────────────────
function LocalApp({ onExitDemo }: { onExitDemo: () => void }) {
  const data = useLocalData();
  return <AppLayout data={data} isLocalMode={true} onExitDemo={onExitDemo} />;
}

// ── Supabase mode ──────────────────────────────────────────────────────────────
function SupabaseApp({ onExitToAuth }: { onExitToAuth: () => void }) {
  const { user, signOut, deleteAccount } = useAuth();

  const {
    transactions, setTransactions,
    tasks, setTasks,
    meals, setMeals,
    vehicles, setVehicles,
    pets, setPets,
    members, setMembers,
    shoppingLists, setShoppingLists,
    familyName, setFamilyName,
    loading,
  } = useSupabaseData(user?.id);

  const handleSignOut = async () => {
    await signOut();
    onExitToAuth();
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh bg-gray-50 items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-full max-w-sm px-6 space-y-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-200 rounded-full w-32" />
              <div className="h-2 bg-gray-100 rounded-full w-24" />
            </div>
          </div>
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-gray-200 rounded-2xl" />
            <div className="h-24 bg-gray-200 rounded-2xl" />
            <div className="h-24 bg-gray-200 rounded-2xl" />
            <div className="h-24 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const supabaseData = {
    transactions, setTransactions,
    tasks, setTasks,
    meals, setMeals,
    vehicles, setVehicles,
    pets, setPets,
    members, setMembers,
    shoppingLists, setShoppingLists,
    familyName, setFamilyName,
    loading: false,
  } as unknown as ReturnType<typeof useLocalData>;

  return (
    <AppLayout
      data={supabaseData}
      isLocalMode={false}
      userEmail={user?.email}
      onSignOut={handleSignOut}
      onDeleteAccount={deleteAccount}
    />
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [appMode, setAppMode] = useState<AppMode>(() => {
    if (!isSupabaseConfigured) return 'auth';
    try {
      const raw = localStorage.getItem('dom-manager-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.expires_at && parsed.expires_at * 1000 > Date.now()) return 'app';
      }
      // fallback: stary klucz sb-...-auth-token (przed zmianą storageKey)
      const keys = Object.keys(localStorage);
      const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (authKey) {
        const raw2 = localStorage.getItem(authKey);
        if (raw2) {
          const parsed = JSON.parse(raw2);
          if (parsed?.expires_at && parsed.expires_at * 1000 > Date.now()) return 'app';
        }
      }
    } catch {}
    return 'auth';
  });

  useEffect(() => {
    if (authLoading) return;
    if (isSupabaseConfigured) {
      if (user && appMode !== 'app' && appMode !== 'demo') setAppMode('app');
      else if (!user && appMode === 'app') setAppMode('auth');
    } else {
      setAppMode('auth');
    }
  }, [user, authLoading]);

  if (appMode === 'demo') return <LocalApp onExitDemo={() => setAppMode('auth')} />;
  if (appMode === 'app' && isSupabaseConfigured && (user || authLoading)) return <SupabaseApp onExitToAuth={() => setAppMode('auth')} />;
  if (appMode === 'app' && !isSupabaseConfigured) return <LocalApp onExitDemo={() => setAppMode('auth')} />;

  // Podczas ładowania sesji (authLoading) — pokazuj ekran ładowania zamiast ekranu logowania
  if (authLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg mb-4 animate-pulse">
            <span className="text-3xl">🏠</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return <AuthScreen onSuccess={() => setAppMode('app')} onDemoMode={() => setAppMode('demo')} />;
}
