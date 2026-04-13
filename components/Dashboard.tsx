import { Transaction, Task, Meal, Vehicle, Pet, Member, Section, ShoppingList, ShoppingItem } from '../types';

interface Props {
  transactions: Transaction[];
  tasks: Task[];
  meals: Meal[];
  vehicles: Vehicle[];
  pets: Pet[];
  members: Member[];
  shoppingLists: ShoppingList[];
  onNavigate: (s: Section) => void;
}

export default function Dashboard({ transactions, tasks, meals, vehicles, pets, members, shoppingLists, onNavigate }: Props) {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const fmt = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const todayMeals = (() => {
    const t = new Date();
    const ymd = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
    return meals.filter(m => m.date === ymd);
  })();

  // Tasks for current month
  const monthTasks = (() => {
    const t = new Date();
    const monthPrefix = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
    return tasks.filter(task => task.dueDate.startsWith(monthPrefix));
  })();

  const monthDoneTasks = monthTasks.filter(t => t.status === 'done');
  const monthPendingTasks = monthTasks.filter(t => t.status !== 'done');
  const monthHighPriorityTasks = monthTasks.filter(t => t.priority === 'high' && t.status !== 'done');

  // Tasks for today
  const todayTasks = (() => {
    const t = new Date();
    const ymd = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    return tasks.filter(task => task.dueDate === ymd);
  })();
  const todayDoneTasks = todayTasks.filter(t => t.status === 'done');

  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done');

  const daysUntil = (d: string) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  };

  // Products to buy (checked === false)
  const productsToBuy: { item: ShoppingItem; listName: string }[] = [];
  shoppingLists.forEach(list => {
    list.items.filter(item => !item.checked).forEach(item => {
      productsToBuy.push({ item, listName: list.name });
    });
  });
  const productsToBuyCount = productsToBuy.length;
  console.log('Products to buy:', productsToBuyCount);

  const upcomingVehicle = vehicles
    .filter(v => !v.unlimitedInspection && v.nextService)
    .sort((a, b) => new Date(a.nextService).getTime() - new Date(b.nextService).getTime())[0];

  const upcomingInsuranceVehicle = vehicles
    .filter(v => v.insurance)
    .sort((a, b) => new Date(a.insurance).getTime() - new Date(b.insurance).getTime())[0];

  const upcomingPet = pets
    .filter(p => !p.noNextVisit && p.nextVisit)
    .sort((a, b) => new Date(a.nextVisit).getTime() - new Date(b.nextVisit).getTime())[0];

  const upcomingBirthday = members
    .filter(m => m.birthday)
    .map(m => {
      const bd = new Date(m.birthday);
      const next = new Date(new Date().getFullYear(), bd.getMonth(), bd.getDate());
      if (next < new Date()) next.setFullYear(new Date().getFullYear() + 1);
      return { ...m, days: Math.ceil((next.getTime() - Date.now()) / 86400000) };
    })
    .sort((a, b) => a.days - b.days)[0];

  const alerts: { type: 'error' | 'warning' | 'info'; message: string; section: Section }[] = [];

  if (balance < 0) alerts.push({ type: 'error', message: `Budżet ujemny: ${fmt(balance)}`, section: 'budget' });
  if (highPriorityTasks.length > 0) alerts.push({ type: 'warning', message: `${highPriorityTasks.length} pilnych zadań do wykonania`, section: 'tasks' });

  // Tasks overdue and due within 7 days
  const overdueTasks = tasks.filter(task => {
    if (task.status === 'done') return false;
    const days = daysUntil(task.dueDate);
    return days !== null && days < 0;
  });
  const nearDeadlineTasks = tasks.filter(task => {
    if (task.status === 'done') return false;
    const days = daysUntil(task.dueDate);
    return days !== null && days >= 0 && days <= 7;
  });
  if (overdueTasks.length > 0) {
    alerts.push({
      type: 'error',
      message: `${overdueTasks.length} przeterminowanych zadań do wykonania`,
      section: 'tasks'
    });
  }
  if (nearDeadlineTasks.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${nearDeadlineTasks.length} zadań z terminem w ciągu 7 dni`,
      section: 'tasks'
    });
  }

  vehicles.forEach(v => {
    const d = v.unlimitedInspection ? null : daysUntil(v.nextService);
    if (d !== null && d <= 14) alerts.push({ type: d < 0 ? 'error' : 'warning', message: `Badanie techniczne ${v.brand} ${v.model}: ${d < 0 ? 'przekroczony!' : `za ${d} dni`}`, section: 'vehicles' });
    const di = daysUntil(v.insurance);
    if (di !== null && di <= 14) alerts.push({ type: di < 0 ? 'error' : 'warning', message: `Ubezpieczenie ${v.brand} ${v.model}: ${di < 0 ? 'wygasło!' : `wygasa za ${di} dni`}`, section: 'vehicles' });
  });

  pets.forEach(p => {
    if (!p.noNextVisit) {
      const d = daysUntil(p.nextVisit);
      if (d !== null && d <= 14) alerts.push({ type: d < 0 ? 'error' : 'warning', message: `Wizyta weterynarz ${p.name}: ${d < 0 ? 'przekroczona!' : `za ${d} dni`}`, section: 'pets' });
    }
    const dv = daysUntil(p.vaccinationsDate);
    if (dv !== null && dv <= 30) alerts.push({ type: dv < 0 ? 'error' : 'warning', message: `💉 Szczepienia ${p.name}: ${dv < 0 ? 'nieaktualne!' : `za ${dv} dni`}`, section: 'pets' });
    const dd = daysUntil(p.dewormingDate);
    if (dd !== null && dd <= 14) alerts.push({ type: dd < 0 ? 'error' : 'warning', message: `🪱 Odrobaczenie ${p.name}: ${dd < 0 ? 'nieaktualne!' : `za ${dd} dni`}`, section: 'pets' });
    const dt = daysUntil(p.tickProtectionDate);
    if (dt !== null && dt <= 14) alerts.push({ type: dt < 0 ? 'error' : 'warning', message: `🕷️ Ochrona kleszcze ${p.name}: ${dt < 0 ? 'nieaktualna!' : `za ${dt} dni`}`, section: 'pets' });
  });

  if (upcomingBirthday && upcomingBirthday.days <= 14) {
    alerts.push({ type: 'info', message: `🎂 Urodziny ${upcomingBirthday.name} za ${upcomingBirthday.days === 0 ? 'DZIŚ!' : `${upcomingBirthday.days} dni`}`, section: 'members' });
  }

  const alertStyle = { error: 'bg-red-50 border-red-200 text-red-800', warning: 'bg-amber-50 border-amber-200 text-amber-800', info: 'bg-blue-50 border-blue-200 text-blue-800' };
  const alertIcon = { error: '🚨', warning: '⚠️', info: 'ℹ️' };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white" />
          <div className="absolute right-20 bottom-0 w-40 h-40 rounded-full bg-white" />
        </div>
        <div className="relative">
          <h2 className="text-xl sm:text-3xl font-bold">Witaj w domu! 🏠</h2>
          <p className="text-white/80 mt-1 text-xs sm:text-sm">
            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
             <button onClick={() => onNavigate('budget')} className="bg-white/15 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm text-left hover:bg-white/25 active:bg-white/30 transition-colors cursor-pointer">
               <p className="text-white/70 text-xs">Saldo</p>
               <p className="text-base sm:text-xl font-bold mt-0.5 truncate">{fmt(balance)}</p>
             </button>
             <button onClick={() => onNavigate('tasks')} className="bg-white/15 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm text-left hover:bg-white/25 active:bg-white/30 transition-colors cursor-pointer">
               <p className="text-white/70 text-xs">Zadania dzisiaj</p>
               <p className="text-base sm:text-xl font-bold mt-0.5">{todayDoneTasks.length}/{todayTasks.length}</p>
             </button>
             <button onClick={() => onNavigate('meals')} className="bg-white/15 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm text-left hover:bg-white/25 active:bg-white/30 transition-colors cursor-pointer">
               <p className="text-white/70 text-xs">Posiłki dzisiaj</p>
               <p className="text-base sm:text-xl font-bold mt-0.5">{todayMeals.length}</p>
             </button>
             <button onClick={() => onNavigate('shopping')} className="bg-white/15 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm text-left hover:bg-white/25 active:bg-white/30 transition-colors cursor-pointer">
               <p className="text-white/70 text-xs">Do kupienia</p>
               <p className="text-base sm:text-xl font-bold mt-0.5">{productsToBuyCount}</p>
             </button>
           </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Powiadomienia</h3>
          {alerts.map((a, i) => (
            <button
              key={i}
              onClick={() => onNavigate(a.section)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm font-medium transition hover:shadow-sm ${alertStyle[a.type]}`}
            >
              <span>{alertIcon[a.type]}</span>
              <span>{a.message}</span>
              <span className="ml-auto text-xs opacity-60">→</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick overview grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {/* Budget card */}
        <button onClick={() => onNavigate('budget')} className="bg-white rounded-2xl border border-gray-100 p-5 text-left shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">💰</div>
            <span className="text-xs text-gray-400 group-hover:text-emerald-500 transition">Przejdź →</span>
          </div>
          <h4 className="font-semibold text-gray-900">Budżet</h4>
          <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(balance)}</p>
          <div className="flex gap-4 mt-3 text-sm text-gray-500">
            <span className="text-emerald-600">↑ {fmt(income)}</span>
            <span className="text-red-500">↓ {fmt(expense)}</span>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${income <= 0 ? 'bg-gray-300' : expense / income < 0.75 ? 'bg-emerald-400' : expense / income < 1 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${income > 0 ? Math.min((expense/income)*100, 100) : 0}%` }} />
          </div>
        </button>

        {/* Tasks card */}
        <button onClick={() => onNavigate('tasks')} className="bg-white rounded-2xl border border-gray-100 p-5 text-left shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">✅</div>
            <span className="text-xs text-gray-400 group-hover:text-blue-500 transition">Przejdź →</span>
          </div>
            <h4 className="font-semibold text-gray-900">Zadania w tym miesiącu</h4>
            <p className="text-2xl font-bold mt-1"><span className="text-emerald-500">{monthDoneTasks.length}</span><span className="text-red-400">/{monthTasks.length}</span></p>
            <p className="text-xs text-gray-500 mt-1">{monthPendingTasks.length} do wykonania w miesiącu · {monthHighPriorityTasks.length} pilnych</p>
           <div className="mt-3 space-y-1">
             {monthPendingTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                <span className="truncate">{t.title}</span>
              </div>
            ))}
          </div>
        </button>

        {/* Meals card */}
        <button onClick={() => onNavigate('meals')} className="bg-white rounded-2xl border border-gray-100 p-5 text-left shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🍽️</div>
            <span className="text-xs text-gray-400 group-hover:text-orange-500 transition">Przejdź →</span>
          </div>
          <h4 className="font-semibold text-gray-900">Dzisiejsze posiłki</h4>
          <p className="text-2xl font-bold text-orange-500 mt-1">{todayMeals.length}<span className="text-gray-400 text-base font-normal"> zaplanowanych</span></p>
          <p className="text-xs text-gray-500 mt-1">
            {Array.from(new Set(todayMeals.map(m => m.mealLabel).filter(Boolean))).join(', ') || 'Brak kategorii'}
          </p>
          <div className="mt-3 space-y-1">
            {todayMeals.map(m => (
              <div key={m.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                <span className="truncate">{m.name}</span>
                {m.mealLabel && <span className="text-gray-400 ml-auto flex-shrink-0">{m.mealLabel}</span>}
              </div>
            ))}
          </div>
        </button>

        {/* Vehicles card */}
        <button onClick={() => onNavigate('vehicles')} className="bg-white rounded-2xl border border-gray-100 p-5 text-left shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-xl">🚗</div>
            <span className="text-xs text-gray-400 group-hover:text-violet-500 transition">Przejdź →</span>
          </div>
          <h4 className="font-semibold text-gray-900">Pojazdy</h4>
          <p className="text-2xl font-bold text-violet-600 mt-1">{vehicles.length}<span className="text-gray-400 text-base font-normal"> pojazdów</span></p>
          {upcomingVehicle && (
            <p className="text-xs text-gray-500 mt-1">
              Badanie tech. {upcomingVehicle.brand}: {(() => {
                const d = daysUntil(upcomingVehicle.nextService);
                return d === null ? '—' : d < 0 ? 'Przekroczony!' : `za ${d} dni`;
              })()}
            </p>
          )}
          {upcomingInsuranceVehicle && (
            <p className="text-xs text-gray-500 mt-1">
              Ubezpieczenie {upcomingInsuranceVehicle.brand}: {(() => {
                const d = daysUntil(upcomingInsuranceVehicle.insurance);
                return d === null ? '—' : d < 0 ? 'Wygasło!' : `wygasa za ${d} dni`;
              })()}
            </p>
          )}
          <div className="mt-3 space-y-1">
            {vehicles.map(v => (
              <div key={v.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-violet-400" />
                <span className="truncate">{v.brand} {v.model}</span>
                <span className="text-gray-400 ml-auto flex-shrink-0">{v.year}</span>
              </div>
            ))}
          </div>
        </button>

        {/* Pets card */}
        <button onClick={() => onNavigate('pets')} className="bg-white rounded-2xl border border-gray-100 p-5 text-left shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">🐾</div>
            <span className="text-xs text-gray-400 group-hover:text-amber-500 transition">Przejdź →</span>
          </div>
          <h4 className="font-semibold text-gray-900">Zwierzęta</h4>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pets.length}<span className="text-gray-400 text-base font-normal"> pupili</span></p>
          {upcomingPet && (
            <p className="text-xs text-gray-500 mt-1">
              Weterynarz {upcomingPet.name}: {(() => {
                const d = daysUntil(upcomingPet.nextVisit);
                return d === null ? '—' : d < 0 ? 'Przekroczony!' : `za ${d} dni`;
              })()}
            </p>
          )}
          <div className="mt-3 space-y-1">
            {pets.map(p => (
              <div key={p.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="truncate">{p.name} ({p.species})</span>
                <span className="text-gray-400 ml-auto flex-shrink-0">{calculateAge(p.birthDate)} lat</span>
              </div>
            ))}
          </div>
        </button>

        {/* Shopping card */}
        <button onClick={() => onNavigate('shopping')} className="bg-white rounded-2xl border border-gray-100 p-5 text-left shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">🛒</div>
            <span className="text-xs text-gray-400 group-hover:text-green-500 transition">Przejdź →</span>
          </div>
          <h4 className="font-semibold text-gray-900">Lista zakupów</h4>
          <p className="text-2xl font-bold text-green-600 mt-1">{productsToBuyCount}<span className="text-gray-400 text-base font-normal"> produktów</span></p>
          <p className="text-xs text-gray-500 mt-1">
            {shoppingLists.length} list · {productsToBuyCount} do kupienia
          </p>
          <div className="mt-3 space-y-1">
            {productsToBuy.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <span className="truncate">{p.item.name}</span>
                <span className="text-gray-400 ml-auto flex-shrink-0 text-xs truncate max-w-[80px]" title={p.listName}>{p.listName}</span>
              </div>
            ))}
            {productsToBuy.length === 0 && (
              <div className="text-xs text-gray-400 italic">Brak produktów do kupienia</div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
