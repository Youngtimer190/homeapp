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

const emptyForm = (): Omit<Task, 'id'> => ({
  title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo',
  dueDate: new Date().toISOString().split('T')[0],
});

export default function Tasks({ tasks, setTasks, members }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const handleAdd = () => {
    if (!form.title) return;
    setTasks(prev => [...prev, { ...form, id: Date.now().toString() }]);
    setForm(emptyForm());
    setShowForm(false);
  };

  const handleStatus = (id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setConfirmId(null);
  };

  const isOverdue = (d: string) => new Date(d) < new Date() ? true : false;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pl-PL');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Lista zadań</h2>
          <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">Organizuj zadania domowe</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold shadow transition flex-shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">Nowe zadanie</span>
          <span className="sm:hidden">Nowe</span>
        </button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {(['all', ...statuses] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition border ${filterStatus === s
              ? 'bg-blue-600 text-white border-blue-600 shadow'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {s === 'all' ? `Wszystkie (${counts.all})` : `${statusIcon[s]} ${statusLabel[s]} (${counts[s]})`}
          </button>
        ))}
      </div>

      {/* Tasks grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map(task => (
          <div
            key={task.id}
            className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 transition hover:shadow-md ${task.status === 'done' ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-semibold text-gray-900 leading-snug ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                {task.title}
              </h4>
              <button
                onClick={() => setConfirmId(task.id)}
                className="text-gray-300 hover:text-red-400 transition text-xl leading-none flex-shrink-0"
              >×</button>
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
                  onClick={() => handleStatus(task.id, s)}
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
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-medium">Brak zadań w tej kategorii</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nowe zadanie">
            <div className="p-5 space-y-4">
              <input
                type="text"
                placeholder="Tytuł zadania *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                placeholder="Opis (opcjonalnie)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.assignedTo}
                  onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="">Przypisz osobę</option>
                  {members.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  {priorities.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
                </select>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  {statuses.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                </select>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Anuluj</button>
              <button
                onClick={handleAdd}
                disabled={!form.title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition shadow"
              >Dodaj</button>
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
