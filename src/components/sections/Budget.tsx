import { useState } from 'react';
import { Transaction } from '../../types';
import ConfirmDialog from '../ConfirmDialog';
import Modal from '../Modal';

interface Props {
  transactions: Transaction[];
  setTransactions: (val: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  memberNames: string[];
}

const categories = ['Wynagrodzenie', 'Zakupy', 'Rachunki', 'Rozrywka', 'Transport', 'Zdrowie', 'Jedzenie', 'Inne'];

const categoryIcons: Record<string, string> = {
  Wynagrodzenie: '💼', Zakupy: '🛍️', Rachunki: '🔌', Rozrywka: '🎬',
  Transport: '⛽', Zdrowie: '💊', Jedzenie: '🍽️', Inne: '📌',
};

const categoryColors: Record<string, string> = {
  Wynagrodzenie: 'from-emerald-400 to-green-500',
  Zakupy: 'from-orange-400 to-amber-500',
  Rachunki: 'from-blue-400 to-blue-600',
  Rozrywka: 'from-pink-400 to-rose-500',
  Transport: 'from-purple-400 to-purple-600',
  Zdrowie: 'from-red-400 to-red-600',
  Jedzenie: 'from-yellow-400 to-orange-400',
  Oszczędności: 'from-teal-400 to-teal-600',
  Inne: 'from-gray-400 to-gray-500',
};

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

const emptyForm = (): Omit<Transaction, 'id'> => {
  // Always use today's date as default
  const today = new Date();
  return {
    type: 'expense',
    category: 'Inne',
    description: '',
    amount: 0,
    date: today.toISOString().split('T')[0],
    addedBy: '',
  };
};

export default function Budget({ transactions, setTransactions, memberNames }: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Transaction, 'id'>>(emptyForm());
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Navigate months
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const isFutureMonth = viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth > now.getMonth());

  // Filter transactions for selected month
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  // Cumulative balance up to (and including) selected month
  const cumulativeBalance = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() < viewYear || (d.getFullYear() === viewYear && d.getMonth() <= viewMonth);
    })
    .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

  const filtered = monthTransactions
    .filter(t => filterType === 'all' ? true : t.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const byCategory = categories.map(cat => ({
    cat,
    amount: monthTransactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0),
  })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  // Last 6 months data for mini chart
  const last6 = Array.from({ length: 6 }, (_, i) => {
    let m = viewMonth - 5 + i;
    let y = viewYear;
    while (m < 0) { m += 12; y--; }
    const monthT = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
    const inc = monthT.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = monthT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { label: MONTHS_PL[m].slice(0, 3), income: inc, expense: exp, isActive: m === viewMonth && y === viewYear };
  });
  const maxBar = Math.max(...last6.flatMap(m => [m.income, m.expense]), 1);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm());
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (t: Transaction) => {
    setEditId(t.id);
    setForm({ type: t.type, category: t.category, description: t.description, amount: t.amount, date: t.date });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDelete = (id: string) => {
    setConfirmId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!form.description || form.amount <= 0) return;
    if (editId) {
      setTransactions(prev => prev.map(t => t.id === editId ? { ...form, id: editId } : t));
    } else {
      setTransactions(prev => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setForm(emptyForm());
    setEditId(null);
    setShowForm(false);
  };

  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setConfirmId(null);
  };

  const fmt = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pl-PL');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Budżet domowy</h2>
          <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">Śledź przychody i wydatki rodziny</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold shadow transition flex-shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">Dodaj transakcję</span>
          <span className="sm:hidden">Dodaj</span>
        </button>
      </div>

      {/* Month Navigator */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg transition"
          >‹</button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl font-bold text-gray-900">
                {MONTHS_PL[viewMonth]} {viewYear}
              </span>
              {isCurrentMonth && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  Bieżący miesiąc
                </span>
              )}
              {isFutureMonth && (
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  Przyszły miesiąc
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {monthTransactions.length === 0
                ? 'Brak transakcji w tym miesiącu'
                : `${monthTransactions.length} transakcj${monthTransactions.length === 1 ? 'a' : monthTransactions.length < 5 ? 'e' : 'i'}`}
            </p>
          </div>

          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg transition"
          >›</button>
        </div>

        {/* Mini bar chart – last 6 months */}
        <div className="mt-4 flex items-end justify-center gap-2 h-16">
          {last6.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center gap-0.5 h-12">
                <div
                  className={`w-2 rounded-t transition-all duration-300 ${m.isActive ? 'bg-emerald-500' : 'bg-emerald-200'}`}
                  style={{ height: `${(m.income / maxBar) * 100}%`, minHeight: m.income > 0 ? '3px' : '0' }}
                  title={`Przychody: ${fmt(m.income)}`}
                />
                <div
                  className={`w-2 rounded-t transition-all duration-300 ${m.isActive ? 'bg-red-500' : 'bg-red-200'}`}
                  style={{ height: `${(m.expense / maxBar) * 100}%`, minHeight: m.expense > 0 ? '3px' : '0' }}
                  title={`Wydatki: ${fmt(m.expense)}`}
                />
              </div>
              <span className={`text-xs font-medium ${m.isActive ? 'text-gray-900' : 'text-gray-400'}`}>{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> Przychody</span>
          <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> Wydatki</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
          <p className="text-emerald-100 text-xs font-medium">Przychody</p>
          <p className="text-base sm:text-2xl font-bold mt-1 truncate">{fmt(income)}</p>
          <p className="text-emerald-200 text-xs mt-1 sm:mt-2">📈 Ten miesiąc</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
          <p className="text-red-100 text-xs font-medium">Wydatki</p>
          <p className="text-base sm:text-2xl font-bold mt-1 truncate">{fmt(expense)}</p>
          <p className="text-red-200 text-xs mt-1 sm:mt-2">📉 Ten miesiąc</p>
        </div>
        <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600'} rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg`}>
          <p className="text-blue-100 text-xs font-medium">Bilans miesiąca</p>
          <p className="text-base sm:text-2xl font-bold mt-1 truncate">{fmt(balance)}</p>
          <p className="text-blue-200 text-xs mt-1 sm:mt-2">{balance >= 0 ? '✅ Dodatni' : '⚠️ Ujemny'}</p>
        </div>
        <div className={`bg-gradient-to-br ${cumulativeBalance >= 0 ? 'from-violet-500 to-purple-600' : 'from-rose-600 to-red-700'} rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg`}>
          <p className="text-violet-100 text-xs font-medium">Saldo łączne</p>
          <p className="text-base sm:text-2xl font-bold mt-1 truncate">{fmt(cumulativeBalance)}</p>
          <p className="text-violet-200 text-xs mt-1 sm:mt-2">📊 Do końca miesiąca</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Transactions list */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-gray-900">
              Historia — {MONTHS_PL[viewMonth]} {viewYear}
            </h3>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-medium">
              {(['all', 'income', 'expense'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1.5 transition ${filterType === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {f === 'all' ? 'Wszystkie' : f === 'income' ? 'Przychody' : 'Wydatki'}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="py-14 text-center">
                <p className="text-4xl mb-3">💸</p>
                <p className="text-gray-400 text-sm font-medium">Brak transakcji w {MONTHS_PL[viewMonth]} {viewYear}</p>
                <button
                  onClick={openAdd}
                  className="mt-3 text-emerald-600 hover:text-emerald-700 text-xs font-semibold underline underline-offset-2"
                >
                  Dodaj pierwszą transakcję
                </button>
              </div>
            )}
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition group">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                  {categoryIcons[t.category] || '💳'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                  <p className="text-xs text-gray-400">
                    {t.category} · {fmtDate(t.date)}
                    {t.addedBy && <span className="ml-1 text-gray-500">· 👤 {t.addedBy}</span>}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </p>
                </div>
                <div className="opacity-100 flex items-center gap-1 transition">
                  <button
                    onClick={() => openEdit(t)}
                    className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center text-xs transition"
                    title="Edytuj"
                  >✏️</button>
                   <button
                     onClick={() => openDelete(t.id)}
                     className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 flex items-center justify-center text-sm transition"
                     title="Usuń"
                   >×</button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>{filtered.length} transakcj{filtered.length === 1 ? 'a' : filtered.length < 5 ? 'e' : 'i'}</span>
              <span className={`font-semibold ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                Bilans: {fmt(balance)}
              </span>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Wydatki wg kategorii</h3>
          <p className="text-xs text-gray-400 mb-4">{MONTHS_PL[viewMonth]} {viewYear}</p>
          <div className="space-y-3">
            {byCategory.map(({ cat, amount }) => {
              const pct = expense > 0 ? (amount / expense) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{categoryIcons[cat]} {cat}</span>
                    <div className="text-right">
                      <span className="text-gray-900 font-semibold">{fmt(amount)}</span>
                      <span className="text-gray-400 ml-1">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${categoryColors[cat] || 'from-gray-400 to-gray-500'} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {byCategory.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-gray-400 text-sm">Brak wydatków w tym miesiącu</p>
              </div>
            )}
          </div>

          {/* Income vs Expense summary */}
          {(income > 0 || expense > 0) && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-3">Przychody vs Wydatki</p>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                {income > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                    style={{ width: `${(income / (income + expense)) * 100}%` }}
                  />
                )}
                {expense > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-500"
                    style={{ width: `${(expense / (income + expense)) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                <span className="text-emerald-600 font-medium">{income > 0 ? ((income / (income + expense)) * 100).toFixed(0) : 0}% przychody</span>
                <span className="text-red-500 font-medium">{expense > 0 ? ((expense / (income + expense)) * 100).toFixed(0) : 0}% wydatki</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal — Add / Edit */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'Edytuj transakcję' : 'Nowa transakcja'}
      >
            <div className="p-5 space-y-4">
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                <button
                  onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
                  className={`flex-1 py-2.5 text-sm font-semibold transition ${form.type === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >💸 Wydatek</button>
                <button
                  onClick={() => setForm(f => ({ ...f, type: 'income' }))}
                  className={`flex-1 py-2.5 text-sm font-semibold transition ${form.type === 'income' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >💰 Przychód</button>
              </div>
               <div>
                 <label className="block text-xs text-gray-500 mb-1 ml-1">Opis *</label>
                 <input
                   type="text"
                   placeholder="np. Zakupy spożywcze"
                   value={form.description}
                   onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                   className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                 />
               </div>
              <div className="grid grid-cols-2 gap-3">
              <div>
                 <label className="block text-xs text-gray-500 mb-1 ml-1">Kwota (PLN) *</label>
                 <input
                   type="number"
                   placeholder="0.00"
                   min="0"
                   step="0.01"
                   value={form.amount || ''}
                   onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                   className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                 />
               </div>
               <div>
                 <label className="block text-xs text-gray-500 mb-1 ml-1">Data *</label>
                 <input
                   type="date"
                   value={form.date}
                   onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                   className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                 />
               </div>
              </div>
               <div>
                 <label className="block text-xs text-gray-500 mb-1 ml-1">Kategoria *</label>
                 <select
                   value={form.category}
                   onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                   className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                 >
                   {categories.map(c => <option key={c} value={c}>{categoryIcons[c]} {c}</option>)}
                 </select>
               </div>

               <div>
                 <label className="block text-xs text-gray-500 mb-1 ml-1">Przypisz do osoby (opcjonalnie)</label>
                 {memberNames.length > 0 ? (
                   <select
                     value={form.addedBy || ''}
                     onChange={e => setForm(f => ({ ...f, addedBy: e.target.value }))}
                     className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                   >
                     <option value="">Wybierz osobę</option>
                     {memberNames.map(name => (
                       <option key={name} value={name}>{name}</option>
                     ))}
                   </select>
                 ) : (
                   <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 italic">
                     Brak członków rodziny — pole opcjonalne
                   </div>
                 )}
               </div>

            </div>
            <div className="p-5 pt-0 flex gap-3">
               <button
                 onClick={() => { setShowForm(false); setEditId(null); }}
                 className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
               >Anuluj</button>
               <button
                 onClick={handleSave}
                 disabled={!form.description || form.amount <= 0}
                 className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition shadow"
               >{editId ? 'Zapisz zmiany' : 'Dodaj'}</button>
            </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Usuń transakcję"
        message="Czy na pewno chcesz usunąć tę transakcję? Tej operacji nie można cofnąć."
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
