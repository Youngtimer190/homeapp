import { useState } from 'react';
import { Task } from '../../types';
import ConfirmDialog from '../ConfirmDialog';
import Modal from '../Modal';

interface Props {
  tasks: Task[];
  setTasks: (val: Task[] | ((prev: Task[]) => Task[])) => void;
  members: string[];
}

const priorities = ['low', 'medium', 'high'] as const;
const statuses = ['todo', 'in-progress', 'done'] as const;

const priorityLabel: Record<string, string> = { low: 'Niski', medium: 'Średni', high: 'Wysoki' };
const priorityColor: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-600',
};
const statusLabel: Record<string, string> = { todo: 'Do zrobienia', 'in-progress': 'W trakcie', done: 'Gotowe' };
const statusColor: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-500',
  'in-progress': 'bg-blue-100 text-blue-600',
  done: 'bg-emerald-100 text-emerald-700',
};
const statusIcon: Record<string, string> = { todo: '⭕', 'in-progress': '🔄', done: '✅' };

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

const emptyForm = (dueDate: string): Omit<Task, 'id'> => ({
  title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo',
  dueDate,
});

export default function Tasks({ tasks, setTasks, members }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toYMD(today));
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm(toYMD(today)));
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const todayYMD = toYMD(today);

  // --- Calendar navigation ---
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
  const monthTasks = tasks.filter(t => t.dueDate.startsWith(monthPrefix));
  const dayTasks = tasks.filter(t => t.dueDate === selectedDate);

  const tasksCountByDay = (day: number) => {
    const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.dueDate === dateStr).length;
  };

  // --- Filtering by status ---
  const filteredTasks = filterStatus === 'all' ? dayTasks : dayTasks.filter(t => t.status === filterStatus);
  const dayCounts = {
    all: dayTasks.length,
    todo: dayTasks.filter(t => t.status === 'todo').length,
    'in-progress': dayTasks.filter(t => t.status === 'in-progress').length,
    done: dayTasks.filter(t => t.status === 'done').length,
  };

  // --- CRUD ---
  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm(selectedDate));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (task: Task) => {
    setEditId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editId) {
      setTasks(prev => prev.map(t => t.id === editId ? { ...form, id: editId } : t));
    } else {
      setTasks(prev => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm(selectedDate));
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setConfirmId(null);
  };

  const openDelete = (id: string) => {
    setConfirmId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = (id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const isOverdue = (d: string) => new Date(d) < new Date();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pl-PL');

  // --- Selected date display ---
  const selDateObj = parseYMD(selectedDate);
  const selDisplay = selDateObj.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Zadania</h2>
          <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">Organizuj zadania domowe z kalendarzem</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold shadow transition flex-shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">Nowe zadanie</span>
          <span className="sm:hidden">Nowe</span>
        </button>
      </div>

      {/* Main content: calendar + tasks */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Calendar panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
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
                  <span className="text-xs text-blue-500 font-medium">Bieżący miesiąc</span>
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
                  className="text-xs text-blue-500 hover:text-blue-700 font-semibold underline underline-offset-2 transition"
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
                const count = tasksCountByDay(day);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 text-sm font-medium transition
                      ${isSelected
                        ? 'bg-blue-500 text-white shadow'
                        : isToday
                        ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-300'
                        : 'hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    {day}
                    {count > 0 && (
                      <span className={`text-[9px] font-bold leading-none mt-0.5 ${isSelected ? 'text-white/80' : 'text-blue-400'}`}>
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
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> wybrany
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-100 ring-1 ring-blue-300 inline-block" /> dziś
              </span>
              <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                3 <span className="text-gray-400 font-normal">= liczba zadań</span>
              </span>
            </div>
          </div>

          {/* Status filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Filtruj zadania</h4>
            <div className="flex flex-wrap gap-1.5">
              {(['all', ...statuses] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all' ? `Wszystkie (${dayCounts.all})` : `${statusIcon[s]} ${statusLabel[s]} (${dayCounts[s]})`}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
              <p>Łącznie zadań: <span className="font-bold text-gray-800">{tasks.length}</span></p>
              <p className="mt-1">W tym miesiącu: <span className="font-bold text-gray-800">{monthTasks.length}</span></p>
            </div>
          </div>
        </div>

        {/* Tasks list panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selDisplay}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {dayCounts.all > 0 ? `${dayCounts.all} zadań (${dayCounts.todo} do zrobienia)` : 'Brak zadań na ten dzień'}
                </p>
              </div>
              <button
                onClick={openAdd}
                className="text-xs px-3 py-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg font-semibold transition"
              >
                + Dodaj
              </button>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-gray-500 font-medium">Brak zadań w tej kategorii</p>
                <p className="text-gray-400 text-sm mt-1">Dodaj nowe zadanie lub zmień filtr</p>
                <button
                  onClick={openAdd}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
                >
                  + Dodaj zadanie
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 transition hover:shadow-md ${task.status === 'done' ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-semibold text-gray-900 leading-snug ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(task)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 font-medium transition shadow-sm"
                        >
                          ✏️ Edytuj
                        </button>
                        <button
                          onClick={() => openDelete(task.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium transition shadow-sm"
                        >
                          🗑 Usuń
                        </button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-500">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${priorityColor[task.priority]}`}>
                        {priorityLabel[task.priority]}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${statusColor[task.status]}`}>
                        {statusIcon[task.status]} {statusLabel[task.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      {task.assignedTo && (
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {task.assignedTo[0]}
                          </span>
                          {task.assignedTo}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`${task.status !== 'done' && isOverdue(task.dueDate) ? 'text-red-500 font-semibold' : ''}`}>
                          {task.status !== 'done' && isOverdue(task.dueDate) ? '⚠️ ' : '📅 '}
                          {fmtDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                    {/* Status changer */}
                    <div className="flex gap-1 pt-1 border-t border-gray-50">
                      {statuses.map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(task.id, s)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${task.status === s
                            ? statusColor[s] + ' font-bold'
                            : 'text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {statusIcon[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for add/edit task */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edytuj zadanie' : 'Nowe zadanie'}>
        <div className="p-5 space-y-4">
           <div>
             <label className="block text-xs text-gray-500 mb-1 ml-1">Tytuł zadania *</label>
             <input
               type="text"
               placeholder="np. Zrobić zakupy"
               value={form.title}
               onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
               className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
             />
           </div>
           <div>
             <label className="block text-xs text-gray-500 mb-1 ml-1">Opis (opcjonalnie)</label>
             <textarea
               placeholder="Dodatkowy opis zadania"
               value={form.description}
               onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
               rows={2}
               className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
             />
           </div>
          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="block text-xs text-gray-500 mb-1 ml-1">Przypisz osobę (opcjonalnie)</label>
               {members.length > 0 ? (
                 <select
                   value={form.assignedTo}
                   onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                   className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                 >
                   <option value="">Wybierz osobę</option>
                   {members.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
               ) : (
                 <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 italic">
                   Brak członków rodziny — pole opcjonalne
                 </div>
               )}
             </div>
             <div>
               <label className="block text-xs text-gray-500 mb-1 ml-1">Termin</label>
               <input
                 type="date"
                 value={form.dueDate}
                 onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                 className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
               />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="block text-xs text-gray-500 mb-1 ml-1">Priorytet</label>
               <select
                 value={form.priority}
                 onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
                 className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
               >
                 {priorities.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-xs text-gray-500 mb-1 ml-1">Status</label>
               <select
                 value={form.status}
                 onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))}
                 className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
               >
                 {statuses.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
               </select>
             </div>
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition shadow"
          >
            {editId ? 'Zapisz zmiany' : 'Dodaj'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Usuń zadanie"
        message="Czy na pewno chcesz usunąć to zadanie? Tej operacji nie można cofnąć."
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}