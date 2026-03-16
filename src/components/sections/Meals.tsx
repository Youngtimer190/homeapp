import { useState } from 'react';
import { Meal } from '../../types';
import ConfirmDialog from '../ConfirmDialog';
import Modal from '../Modal';

interface Props {
  meals: Meal[];
  setMeals: (val: Meal[] | ((prev: Meal[]) => Meal[])) => void;
}

const MONTH_NAMES = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
];
const DAY_NAMES = ['Pon','Wt','Śr','Czw','Pt','Sob','Niedz'];

function toYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYMD(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday = 0 ... Sunday = 6
function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7; // convert Sunday=0 to Monday=0
}

const emptyForm = (date: string): Omit<Meal, 'id'> => ({
  name: '',
  mealLabel: '',
  date,
  ingredients: '',
});

export default function Meals({ meals, setMeals }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toYMD(today));

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm(toYMD(today)));
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const todayYMD = toYMD(today);

  // --- Navigation ---
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(todayYMD);
  };

  // --- Calendar grid ---
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);
  const calendarCells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthMeals = meals.filter(m => m.date.startsWith(monthPrefix));
  const dayMeals = meals.filter(m => m.date === selectedDate);

  const mealsCountByDay = (day: number) => {
    const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    return meals.filter(m => m.date === dateStr).length;
  };

  // --- CRUD ---
  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm(selectedDate));
    setShowForm(true);
  };

  const openEdit = (meal: Meal) => {
    setEditId(meal.id);
    setForm({ name: meal.name, mealLabel: meal.mealLabel, date: meal.date, ingredients: meal.ingredients });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setMeals(prev => prev.map(m => m.id === editId ? { ...m, ...form } : m));
    } else {
      setMeals(prev => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setEditId(null);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
    setConfirmId(null);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditId(null);
  };

  // --- Grouping meals by label ---
  const groupedLabels = Array.from(new Set(dayMeals.map(m => m.mealLabel).filter(Boolean)));
  const unlabeledMeals = dayMeals.filter(m => !m.mealLabel);

  // --- Format selected date for display ---
  const selDateObj = parseYMD(selectedDate);
  const DAY_FULL = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];
  const selDayName = DAY_FULL[selDateObj.getDay()];
  const selDisplay = `${selDayName}, ${selDateObj.getDate()} ${MONTH_NAMES[selDateObj.getMonth()]} ${selDateObj.getFullYear()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Plan posiłków</h2>
          <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">Jadłospis rodziny według dat</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold shadow transition flex-shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">Dodaj posiłek</span>
          <span className="sm:hidden">Dodaj</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-orange-500">{dayMeals.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">posiłków tego dnia</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-purple-500">{monthMeals.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">posiłków w miesiącu</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-500">
            {Array.from(new Set(monthMeals.map(m => m.mealLabel).filter(Boolean))).length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">różnych kategorii</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition"
            >‹</button>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-sm">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </p>
              {isCurrentMonth && (
                <span className="text-xs text-orange-500 font-medium">Bieżący miesiąc</span>
              )}
            </div>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition"
            >›</button>
          </div>

          {!isCurrentMonth && (
            <div className="mb-3 text-center">
              <button
                onClick={goToday}
                className="text-xs text-orange-500 hover:text-orange-700 font-semibold underline underline-offset-2 transition"
              >
                Wróć do dziś
              </button>
            </div>
          )}

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarCells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayYMD;
              const count = mealsCountByDay(day);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 text-sm font-medium transition
                    ${isSelected
                      ? 'bg-orange-500 text-white shadow'
                      : isToday
                      ? 'bg-orange-50 text-orange-600 ring-2 ring-orange-300'
                      : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  {day}
                  {count > 0 && (
                    <span className={`text-[9px] font-bold leading-none mt-0.5 ${isSelected ? 'text-white/80' : 'text-orange-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> wybrany
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-100 ring-1 ring-orange-300 inline-block" /> dziś
            </span>
            <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
              3 <span className="text-gray-400 font-normal">= liczba posiłków</span>
            </span>
          </div>
        </div>

        {/* Meals for selected day */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">{selDisplay}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{dayMeals.length > 0 ? `${dayMeals.length} posiłków` : 'Brak posiłków'}</p>
            </div>
            <button
              onClick={openAdd}
              className="text-xs px-3 py-1.5 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-lg font-semibold transition"
            >
              + Dodaj
            </button>
          </div>

          {dayMeals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="text-gray-500 font-medium">Brak zaplanowanych posiłków</p>
              <p className="text-gray-400 text-sm mt-1">Kliknij „Dodaj posiłek", aby zaplanować jadłospis</p>
              <button
                onClick={openAdd}
                className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition"
              >
                + Dodaj posiłek
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedLabels.map(label => {
                const labelMeals = dayMeals.filter(m => m.mealLabel === label);
                return (
                  <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-2.5 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                      <span className="text-sm font-bold text-orange-700">{label}</span>
                      <span className="text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">{labelMeals.length}</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {labelMeals.map(meal => (
                        <MealCard key={meal.id} meal={meal} onEdit={openEdit} onDelete={id => setConfirmId(id)} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {unlabeledMeals.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600">Bez kategorii</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{unlabeledMeals.length}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {unlabeledMeals.map(meal => (
                      <MealCard key={meal.id} meal={meal} onEdit={openEdit} onDelete={id => setConfirmId(id)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showForm} onClose={closeModal} title={editId ? 'Edytuj posiłek' : 'Nowy posiłek'}>
            <div className="p-5 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Data *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Meal name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nazwa posiłku *</label>
                <input
                  type="text"
                  placeholder="np. Kurczak z ryżem"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Meal label */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Kategoria posiłku</label>
                <input
                  type="text"
                  placeholder="np. Śniadanie, II śniadanie, Obiad..."
                  value={form.mealLabel}
                  onChange={e => setForm(f => ({ ...f, mealLabel: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="text-xs text-gray-400 mt-1">Wpisz dowolną nazwę — np. Śniadanie, Lunch, Podwieczorek</p>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Składniki</label>
                <textarea
                  placeholder="np. Pierś z kurczaka, ryż, brokuły, oliwa z oliwek"
                  value={form.ingredients}
                  onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition shadow"
              >
                {editId ? 'Zapisz zmiany' : 'Dodaj posiłek'}
              </button>
            </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Usuń posiłek"
        message="Czy na pewno chcesz usunąć ten posiłek? Tej operacji nie można cofnąć."
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

function MealCard({
  meal,
  onEdit,
  onDelete,
}: {
  meal: Meal;
  onEdit: (m: Meal) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-start justify-between px-5 py-4 group hover:bg-gray-50 transition">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{meal.name}</p>
        {meal.ingredients && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{meal.ingredients}</p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onEdit(meal)}
          className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition"
        >
          ✏️ Edytuj
        </button>
        <button
          onClick={() => onDelete(meal.id)}
          className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium transition"
        >
          🗑 Usuń
        </button>
      </div>
    </div>
  );
}
