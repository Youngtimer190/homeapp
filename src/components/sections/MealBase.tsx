import { useState } from 'react';
import { Meal, MealBaseItem } from '../../types';
import { newId } from '../../utils/id';
import ConfirmDialog from '../ConfirmDialog';
import MealDetailModal from '../MealDetailModal';
import Modal from '../Modal';

interface Props {
  mealBase: MealBaseItem[];
  setMealBase: (val: MealBaseItem[] | ((prev: MealBaseItem[]) => MealBaseItem[])) => void;
  meals: Meal[];
  setMeals: (val: Meal[] | ((prev: Meal[]) => Meal[])) => void;
  defaultDate: string; // dzień wybrany w zakładce planu
}

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

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// następny poniedziałek (dziś = poniedziałek → za tydzień)
function nextMonday() {
  const d = new Date();
  const diff = ((8 - d.getDay()) % 7) || 7;
  return addDays(d, diff);
}

// porównanie bez diakrytyków ("śniadanie" = "sniadanie")
function normalizeText(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function formatDate(ymd: string) {
  return parseYMD(ymd).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
}

interface BaseForm {
  name: string;
  mealLabel: string;
  ingredients: string;
  notes: string;
}

const emptyForm: BaseForm = {
  name: '',
  mealLabel: '',
  ingredients: '',
  notes: '',
};

export default function MealBase({ mealBase, setMealBase, meals, setMeals, defaultDate }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [targetItem, setTargetItem] = useState<MealBaseItem | null>(null);
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [repeatWeek, setRepeatWeek] = useState(false);

  // --- Podgląd szczegółów ---
  // trzymamy tylko id, aktualny wpis bierzemy z najświeższych danych
  const detailItem = detailId ? mealBase.find(i => i.id === detailId) ?? null : null;
  // podgląd jest widoczny tylko gdy nie jest otwarty żaden inny modal sekcji
  const previewOpen = detailItem !== null && !showForm && targetItem === null && confirmId === null;

  // --- Filtrowanie ---
  const categories = Array.from(new Set(mealBase.map(i => i.mealLabel).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'pl-PL')
  );

  const query = normalizeText(search.trim());
  const filtered = mealBase.filter(item => {
    if (category !== 'all' && item.mealLabel !== category) return false;
    if (!query) return true;
    return (
      normalizeText(item.name).includes(query) ||
      normalizeText(item.ingredients).includes(query) ||
      normalizeText(item.notes || '').includes(query)
    );
  });

  // --- Statystyki ---
  const baseNames = new Set(mealBase.map(i => i.name.trim().toLowerCase()));
  const thirtyDaysAgo = toYMD(addDays(new Date(), -30));
  const usedInPlan = meals.filter(
    m => m.date >= thirtyDaysAgo && baseNames.has(m.name.trim().toLowerCase())
  ).length;

  // --- CRUD bazy ---
  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: MealBaseItem) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      mealLabel: item.mealLabel,
      ingredients: item.ingredients,
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      mealLabel: form.mealLabel.trim(),
      ingredients: form.ingredients.trim(),
      notes: form.notes.trim() || undefined,
    };
    if (editId) {
      setMealBase(prev => prev.map(i => (i.id === editId ? { ...i, ...payload } : i)));
    } else {
      setMealBase(prev => [...prev, { ...payload, id: newId() }]);
    }
    setEditId(null);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setMealBase(prev => prev.filter(i => i.id !== id));
    setConfirmId(null);
  };

  // --- Dodanie do dnia ---
  const openAddToDay = (item: MealBaseItem) => {
    setTargetItem(item);
    setTargetDate(defaultDate || toYMD(new Date()));
    setRepeatWeek(false);
  };

  const closeAddToDay = () => {
    setTargetItem(null);
    setRepeatWeek(false);
  };

  const handleAddToDay = () => {
    if (!targetItem) return;
    const item = targetItem;
    const dates = [targetDate];
    if (repeatWeek) {
      for (let i = 1; i < 7; i++) dates.push(toYMD(addDays(parseYMD(targetDate), i)));
    }
    setMeals(prev => [
      ...prev,
      ...dates.map(date => ({
        id: newId(),
        name: item.name,
        mealLabel: item.mealLabel,
        date,
        ingredients: item.ingredients,
        notes: item.notes,
      })),
    ]);
    closeAddToDay();
  };

  const closeModal = () => {
    setShowForm(false);
    setEditId(null);
  };

  const quickDates = [
    { label: 'Dziś', date: toYMD(new Date()) },
    { label: 'Jutro', date: toYMD(addDays(new Date(), 1)) },
    { label: 'Pon', date: toYMD(nextMonday()) },
  ];

  const confirmItem = mealBase.find(i => i.id === confirmId);

  return (
    <div className="space-y-4">
      {/* Toolbar: wyszukiwarka + dodawanie */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj: nazwa, składniki, notatka..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow transition flex-shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          Dodaj do bazy
        </button>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-orange-500">{mealBase.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">posiłków w bazie</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-purple-500">{categories.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">różnych kategorii</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-500">{usedInPlan}</p>
          <p className="text-xs text-gray-500 mt-0.5">wykorzystanych (30 dni)</p>
        </div>
      </div>

      {/* Filtry kategorii */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              category === 'all' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Wszystkie ({mealBase.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                category === cat ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {cat} ({mealBase.filter(i => i.mealLabel === cat).length})
            </button>
          ))}
        </div>
      )}

      {/* Lista wpisów */}
      {mealBase.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-gray-500 font-medium">Baza posiłków jest pusta</p>
          <p className="text-gray-400 text-sm mt-1">
            Dodaj posiłki, które gotujesz często — potem dodasz je do planu jednym kliknięciem
          </p>
          <button
            onClick={openAdd}
            className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition"
          >
            + Dodaj pierwszy posiłek
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-gray-500 font-medium">Brak pasujących posiłków</p>
          <button
            onClick={() => { setSearch(''); setCategory('all'); }}
            className="mt-3 text-xs text-orange-500 hover:text-orange-700 font-semibold underline underline-offset-2 transition"
          >
            Wyczyść filtry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col transition hover:border-orange-200 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => setDetailId(item.id)}
                aria-label={`Pokaż szczegóły: ${item.name}`}
                className="w-full text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset"
              >
                <span className="block font-semibold text-gray-900 text-sm break-words">{item.name}</span>
                {item.mealLabel && (
                  <span className="inline-block mt-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    {item.mealLabel}
                  </span>
                )}

                {item.ingredients && (
                  <span className="text-xs text-gray-400 mt-2 line-clamp-2 break-words">🧺 {item.ingredients}</span>
                )}
                {item.notes && (
                  <span className="text-xs text-gray-500 mt-1 line-clamp-2 italic break-words">
                    📝 {item.notes}
                  </span>
                )}

                <span className="inline-block mt-2 text-xs font-semibold text-orange-500">Szczegóły ›</span>
              </button>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => openAddToDay(item)}
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 font-semibold transition shadow-sm"
                >
                  Dodaj do dnia
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition"
                  title="Edytuj"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setConfirmId(item.id)}
                  className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 font-medium transition"
                  title="Usuń"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal — dodanie / edycja wpisu bazy */}
      <Modal isOpen={showForm} onClose={closeModal} title={editId ? 'Edytuj posiłek w bazie' : 'Nowy posiłek w bazie'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-1">Nazwa posiłku *</label>
            <input
              type="text"
              placeholder="np. Kurczak z ryżem"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-1">Kategoria posiłku (opcjonalnie)</label>
            <input
              type="text"
              placeholder="np. Śniadanie, Obiad..."
              value={form.mealLabel}
              onChange={e => setForm(f => ({ ...f, mealLabel: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <p className="text-xs text-gray-400 mt-1 ml-1">Wpisz dowolną nazwę — np. Śniadanie, Lunch, Podwieczorek</p>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-1">Składniki</label>
            <textarea
              placeholder="np. Pierś z kurczaka, ryż, brokuły, oliwa z oliwek"
              value={form.ingredients}
              onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-1">Notatka / przepis (opcjonalnie)</label>
            <textarea
              placeholder="np. Smażyć 10 min, dodać koperku na koniec"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
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
            {editId ? 'Zapisz zmiany' : 'Dodaj do bazy'}
          </button>
        </div>
      </Modal>

      {/* Modal — dodanie posiłku z bazy do dnia */}
      <Modal isOpen={targetItem !== null} onClose={closeAddToDay} title={`Dodaj do dnia — ${targetItem?.name ?? ''}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-1">Data *</label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {quickDates.map(q => (
              <button
                key={q.label}
                onClick={() => setTargetDate(q.date)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  targetDate === q.date ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={repeatWeek}
              onChange={e => setRepeatWeek(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
            />
            <span className="text-sm text-gray-700">Powtórz przez 7 dni (codziennie)</span>
          </label>

          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
            <p className="text-xs text-orange-700">
              {repeatWeek
                ? `Zostanie dodany na 7 dni: od ${formatDate(targetDate)}`
                : `Zostanie dodany do planu posiłków na ${formatDate(targetDate)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={closeAddToDay}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
          >
            Anuluj
          </button>
          <button
            onClick={handleAddToDay}
            disabled={!targetDate}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition shadow"
          >
            {repeatWeek ? 'Dodaj na 7 dni' : 'Dodaj do dnia'}
          </button>
        </div>
      </Modal>

      {/* Modal — podgląd szczegółów posiłku z bazy */}
      {detailItem && (
        <MealDetailModal
          isOpen={previewOpen}
          onClose={() => setDetailId(null)}
          name={detailItem.name}
          mealLabel={detailItem.mealLabel}
          ingredients={detailItem.ingredients}
          notes={detailItem.notes}
          onAddToDay={() => openAddToDay(detailItem)}
          onEdit={() => openEdit(detailItem)}
          onDelete={() => setConfirmId(detailItem.id)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Usuń posiłek z bazy"
        message={`Czy na pewno chcesz usunąć „${confirmItem?.name ?? ''}" z bazy posiłków? Tej operacji nie można cofnąć.`}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

// ── Modal wyboru posiłku z bazy (używany w zakładce planu) ─────────────────────
interface PickerProps {
  isOpen: boolean;
  onClose: () => void;
  items: MealBaseItem[];
  onSelect: (item: MealBaseItem) => void;
  title?: string;
}

export function MealBasePicker({ isOpen, onClose, items, onSelect, title = 'Wybierz z bazy posiłków' }: PickerProps) {
  const [search, setSearch] = useState('');

  const query = normalizeText(search.trim());
  const filtered = items.filter(item => {
    if (!query) return true;
    return (
      normalizeText(item.name).includes(query) ||
      normalizeText(item.mealLabel).includes(query) ||
      normalizeText(item.ingredients).includes(query)
    );
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          Baza posiłków jest pusta. Dodaj posiłki w zakładce „Baza posiłków".
        </p>
      ) : (
        <>
          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj w bazie..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              autoFocus
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Brak pasujących posiłków</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item); onClose(); }}
                  className="w-full text-left px-4 py-3 hover:bg-orange-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm truncate">{item.name}</span>
                    {item.mealLabel && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        {item.mealLabel}
                      </span>
                    )}
                  </div>
                  {item.ingredients && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.ingredients}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
