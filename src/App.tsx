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

type ActiveSection = Section | 'dashboard';
type AppMode = 'loading' | 'auth' | 'demo' | 'app';

const sectionTitles: Record<ActiveSection, { label: string; icon: string }> = {
  dashboard: { label: 'Przegląd',        icon: '🏠' },
  budget:    { label: 'Budżet',          icon: '💰' },
  tasks:     { label: 'Zadania',         icon: '✅' },
  shopping:  { label: 'Lista zakupów',   icon: '🛒' },
  meals:     { label: 'Posiłki',         icon: '🍽️' },
  vehicles:  { label: 'Pojazdy',         icon: '🚗' },
  pets:      { label: 'Zwierzęta',       icon: '🐾' },
  members:   { label: 'Członkowie',      icon: '👨‍👩‍👧‍👦' },
  settings:  { label: 'Ustawienia',      icon: '⚙️' },
};

// ── Shared App Layout ─────────────────────────────────────────────────────────
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

  const memberNames = data.members.map(m => m.name.split(' ')[0]);
  const handleNavigate = (section: Section) => setActive(section);

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar
        active={active}
        onChange={(s) => setActive(s)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        familyName={data.familyName}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-4 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition flex-shrink-0"
          >
            <span className="text-gray-600 text-lg">☰</span>
          </button>
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
              <span>{data.tasks.filter(t => t.status !== 'done').length} zadań</span>
              <span className="text-gray-300">·</span>
              <span>{data.members.length} osób</span>
            </div>

            {isLocalMode ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                  <span>💾</span>
                  <span className="hidden sm:inline">Tryb demo</span>
                </div>
                {onExitDemo && (
                  <button
                    onClick={onExitDemo}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
                    title="Wróć do ekranu logowania"
                  >
                    <span>🔑</span>
                    <span className="hidden sm:inline">Zaloguj się</span>
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
                    title="Wyloguj się"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition"
                  >
                    🚪 <span className="hidden sm:inline">Wyloguj</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {active === 'dashboard' && (
              <Dashboard
                transactions={data.transactions}
                tasks={data.tasks}
                meals={data.meals}
                vehicles={data.vehicles}
                pets={data.pets}
                members={data.members}
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
              <Shopping lists={data.shoppingLists} setLists={data.setShoppingLists} members={memberNames} />
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

// ── Loading Screen ─────────────────────────────────────────────────────────────
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg mb-4 animate-pulse">
          <span className="text-3xl">🏠</span>
        </div>
        <p className="text-gray-500 text-sm mt-2">{message}</p>
      </div>
    </div>
  );
}

// ── Local / Demo mode ─────────────────────────────────────────────────────────
function LocalApp({ onExitDemo }: { onExitDemo: () => void }) {
  const data = useLocalData();
  return (
    <AppLayout
      data={data}
      isLocalMode={true}
      onExitDemo={onExitDemo}
    />
  );
}

// ── Supabase mode ─────────────────────────────────────────────────────────────
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
    loading: dataLoading,
  } = useSupabaseData(user?.id);

  const handleSignOut = async () => {
    await signOut();
    onExitToAuth();
  };

  if (dataLoading) {
    return <LoadingScreen message="Synchronizowanie danych..." />;
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

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [appMode, setAppMode] = useState<AppMode>('loading');

  useEffect(() => {
    if (authLoading) return;

    if (isSupabaseConfigured) {
      if (user) {
        // Zalogowany użytkownik — pokaż aplikację
        setAppMode('app');
      } else {
        // Niezalogowany — pokaż ekran auth
        setAppMode('auth');
      }
    } else {
      // Brak Supabase — pokaż ekran auth z opcją demo
      setAppMode('auth');
    }
  }, [authLoading, user]);

  // Nasłuchuj zmian auth state (login/logout)
  useEffect(() => {
    if (!authLoading && isSupabaseConfigured) {
      if (user && appMode === 'auth') {
        setAppMode('app');
      } else if (!user && appMode === 'app') {
        setAppMode('auth');
      }
    }
  }, [user, authLoading, appMode]);

  if (appMode === 'loading' || authLoading) {
    return <LoadingScreen message="Ładowanie..." />;
  }

  if (appMode === 'demo') {
    return <LocalApp onExitDemo={() => setAppMode('auth')} />;
  }

  if (appMode === 'app' && isSupabaseConfigured && user) {
    return <SupabaseApp onExitToAuth={() => setAppMode('auth')} />;
  }

  // Ekran logowania/rejestracji
  return (
    <AuthScreen
      onSuccess={() => setAppMode('app')}
      onDemoMode={() => setAppMode('demo')}
    />
  );
}
