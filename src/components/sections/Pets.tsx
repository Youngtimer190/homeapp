import { useState } from 'react';
import { Pet } from '../../types';
import ConfirmDialog from '../ConfirmDialog';
import Modal from '../Modal';

interface Props {
  pets: Pet[];
  setPets: (val: Pet[] | ((prev: Pet[]) => Pet[])) => void;
}

const speciesOptions = ['Pies', 'Kot', 'Ptak', 'Ryba', 'Królik', 'Chomik', 'Żółw', 'Inne'];
const speciesEmoji: Record<string, string> = {
  Pies: '🐶', Kot: '🐱', Ptak: '🐦', Ryba: '🐟', Królik: '🐰', Chomik: '🐹', Żółw: '🐢', Inne: '🐾'
};
const colors = ['#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#EF4444', '#EC4899', '#6B7280', '#78716C'];

const emptyForm = (): Omit<Pet, 'id'> => ({
  name: '', species: 'Pies', breed: '', age: 0, weight: 0,
  color: '#F59E0B', vet: '', lastVisit: '', nextVisit: '', noNextVisit: false,
  vaccinations: '', vaccinationsDate: '',
  deworming: '', dewormingDate: '',
  tickProtection: '', tickProtectionDate: '',
  notes: '',
});

export default function Pets({ pets, setPets }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [selected, setSelected] = useState<Pet | null>(pets[0] ?? null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (pet: Pet) => {
    setEditingId(pet.id);
    setForm({
      name: pet.name, species: pet.species, breed: pet.breed,
      age: pet.age, weight: pet.weight, color: pet.color,
      vet: pet.vet, lastVisit: pet.lastVisit, nextVisit: pet.nextVisit,
      noNextVisit: pet.noNextVisit,
      vaccinations: pet.vaccinations, vaccinationsDate: pet.vaccinationsDate,
      deworming: pet.deworming, dewormingDate: pet.dewormingDate,
      tickProtection: pet.tickProtection, tickProtectionDate: pet.tickProtectionDate,
      notes: pet.notes,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.species) return;
    if (editingId) {
      const updated = { ...form, id: editingId };
      setPets(prev => prev.map(p => p.id === editingId ? updated : p));
      setSelected(updated);
    } else {
      const p = { ...form, id: Date.now().toString() };
      setPets(prev => [...prev, p]);
      setSelected(p);
    }
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setPets(prev => {
      const next = prev.filter(p => p.id !== id);
      setSelected(next[0] ?? null);
      return next;
    });
    setConfirmId(null);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pl-PL') : '—';

  const daysUntil = (d: string) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  };

  const urgency = (d: string) => {
    const days = daysUntil(d);
    if (days === null) return 'neutral';
    if (days < 0) return 'overdue';
    if (days <= 30) return 'soon';
    return 'ok';
  };

  const urgencyBadge: Record<string, string> = {
    overdue: 'bg-red-50 border-red-200',
    soon: 'bg-amber-50 border-amber-200',
    ok: 'bg-emerald-50 border-emerald-200',
    neutral: 'bg-gray-50 border-gray-200',
  };
  const urgencyText: Record<string, string> = {
    overdue: 'text-red-600',
    soon: 'text-amber-600',
    ok: 'text-emerald-600',
    neutral: 'text-gray-500',
  };
  const urgencyIcon: Record<string, string> = {
    overdue: '🔴',
    soon: '🟡',
    ok: '🟢',
    neutral: '⚪',
  };

  const ageSuffix = (age: number) => {
    if (age === 1) return 'rok';
    if (age >= 2 && age <= 4) return 'lata';
    return 'lat';
  };

  // Karta profilaktyki — szczepienia / odrobaczenie / kleszcze
  const HealthTracker = ({ pet }: { pet: Pet }) => {
    const items = [
      {
        label: 'Szczepienia',
        icon: '💉',
        name: pet.vaccinations,
        date: pet.vaccinationsDate,
        color: 'blue',
      },
      {
        label: 'Odrobaczenie',
        icon: '🪱',
        name: pet.deworming,
        date: pet.dewormingDate,
        color: 'green',
      },
      {
        label: 'Ochrona przeciw kleszczom',
        icon: '🕷️',
        name: pet.tickProtection,
        date: pet.tickProtectionDate,
        color: 'orange',
      },
    ];

    const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
      blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-700' },
      green:  { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
    };

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">🛡️ Profilaktyka</h4>
        {items.map(item => {
          const c = colorMap[item.color];
          const urg = item.date ? urgency(item.date) : 'neutral';
          const days = item.date ? daysUntil(item.date) : null;
          return (
            <div key={item.label} className={`rounded-xl p-4 border ${item.date || item.name ? c.bg + ' ' + c.border : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{item.icon}</span>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                  </div>
                  {item.name ? (
                    <p className={`font-semibold text-sm ${c.text}`}>{item.name}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Nie uzupełniono</p>
                  )}
                </div>
                {item.date && (
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.badge}`}>
                      {urgencyIcon[urg]} {fmtDate(item.date)}
                    </span>
                    {days !== null && (
                      <p className={`text-xs mt-1 ${urgencyText[urg]}`}>
                        {days < 0
                          ? `${Math.abs(days)} dni po term.`
                          : days === 0
                          ? 'Dzisiaj!'
                          : `Za ${days} dni`}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {!item.date && (
                <p className="text-xs text-gray-400 mt-1">Brak daty ważności</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Pole daty profilaktyki w formularzu
  const HealthFormRow = ({
    label, icon,
    nameKey, dateKey,
    namePlaceholder,
  }: {
    label: string; icon: string;
    nameKey: keyof Omit<Pet, 'id'>;
    dateKey: keyof Omit<Pet, 'id'>;
    namePlaceholder: string;
  }) => (
    <div className="border border-gray-100 rounded-xl p-4 space-y-2 bg-gray-50">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{icon} {label}</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder={namePlaceholder}
          value={form[nameKey] as string}
          onChange={e => setForm(f => ({ ...f, [nameKey]: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
        <div>
          <label className="block text-xs text-gray-400 mb-1">Ważne do</label>
          <input
            type="date"
            value={form[dateKey] as string}
            onChange={e => setForm(f => ({ ...f, [dateKey]: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Zwierzęta domowe</h2>
          <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">Dbaj o zdrowie swoich pupili</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold shadow transition flex-shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">Dodaj zwierzę</span>
          <span className="sm:hidden">Dodaj</span>
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center text-gray-400">
          <div className="text-6xl mb-3">🐾</div>
          <p className="font-medium">Brak zwierząt</p>
          <p className="text-sm mt-1">Dodaj swojego pupila</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pet cards list */}
          <div className="space-y-3">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => setSelected(pet)}
                className={`w-full text-left rounded-2xl border p-4 transition hover:shadow-md ${selected?.id === pet.id ? 'border-amber-300 bg-amber-50 shadow' : 'border-gray-100 bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm flex-shrink-0"
                    style={{ backgroundColor: pet.color + '22', border: `2px solid ${pet.color}44` }}
                  >
                    {speciesEmoji[pet.species] || '🐾'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{pet.name}</p>
                    <p className="text-xs text-gray-500">{pet.species} · {pet.breed}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{pet.age} {ageSuffix(pet.age)} · {pet.weight} kg</p>
                    {/* Mini status profilaktyki */}
                    <div className="flex gap-1 mt-1.5">
                      {[
                        { date: pet.vaccinationsDate, icon: '💉' },
                        { date: pet.dewormingDate, icon: '🪱' },
                        { date: pet.tickProtectionDate, icon: '🕷️' },
                      ].map((item, i) => (
                        <span key={i} className={`text-xs px-1.5 py-0.5 rounded-full ${
                          !item.date ? 'bg-gray-100 text-gray-400' :
                          urgency(item.date) === 'overdue' ? 'bg-red-100 text-red-600' :
                          urgency(item.date) === 'soon' ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>{item.icon}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pet detail */}
          {selected && (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Top banner */}
                <div className="p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${selected.color}dd, ${selected.color}99)` }}>
                  <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white opacity-10" />
                  <div className="relative flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-5xl shadow">
                        {speciesEmoji[selected.species] || '🐾'}
                      </div>
                      <div className="text-white">
                        <h3 className="text-2xl font-bold">{selected.name}</h3>
                        <p className="text-white/80 mt-0.5">{selected.species} · {selected.breed}</p>
                        <div className="flex gap-4 mt-2 text-sm text-white/70">
                          <span>🎂 {selected.age} {ageSuffix(selected.age)}</span>
                          <span>⚖️ {selected.weight} kg</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => openEdit(selected)}
                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >✏️ Edytuj</button>
                      <button
                        onClick={() => setConfirmId(selected.id)}
                        className="bg-white/20 hover:bg-red-500/70 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >🗑 Usuń</button>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-5">
                  {/* Weterynarz + wizyty */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">🏥 Weterynarz</p>
                      <p className="font-semibold text-gray-900">{selected.vet || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">📅 Ostatnia wizyta</p>
                      <p className="font-semibold text-gray-900">{fmtDate(selected.lastVisit)}</p>
                    </div>
                  </div>

                  {/* Następna wizyta */}
                  {selected.noNextVisit ? (
                    <div className="rounded-xl p-4 border bg-gray-50 border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">⏰ Następna wizyta</p>
                      <p className="font-semibold text-gray-400 italic">Nie zaplanowano</p>
                    </div>
                  ) : (
                    <div className={`rounded-xl p-4 border ${urgencyBadge[urgency(selected.nextVisit)]}`}>
                      <p className="text-xs text-gray-500 mb-1">⏰ Następna wizyta</p>
                      <p className={`font-semibold ${urgencyText[urgency(selected.nextVisit)]}`}>
                        {fmtDate(selected.nextVisit)}
                      </p>
                      {daysUntil(selected.nextVisit) !== null && (
                        <p className="text-xs mt-0.5 text-gray-500">
                          {daysUntil(selected.nextVisit)! < 0
                            ? `⚠️ ${Math.abs(daysUntil(selected.nextVisit)!)} dni po terminie!`
                            : daysUntil(selected.nextVisit) === 0
                            ? '🔔 Dzisiaj!'
                            : `Za ${daysUntil(selected.nextVisit)} dni`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Profilaktyka */}
                  <HealthTracker pet={selected} />

                  {/* Notatki */}
                  {selected.notes && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-xs text-amber-500 mb-1">📝 Notatki</p>
                      <p className="text-sm text-amber-800">{selected.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal – dodaj / edytuj */}
      <Modal
        isOpen={showForm}
        onClose={closeModal}
        title={editingId ? '✏️ Edytuj zwierzę' : '🐾 Nowe zwierzę'}
      >
        <div className="p-5 space-y-4">

              {/* Podstawowe dane */}
              <input type="text" placeholder="Imię *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.species}
                  onChange={e => setForm(f => ({ ...f, species: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                  {speciesOptions.map(s => <option key={s} value={s}>{speciesEmoji[s]} {s}</option>)}
                </select>
                <input type="text" placeholder="Rasa" value={form.breed}
                  onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Wiek (lata)" value={form.age || ''}
                  onChange={e => setForm(f => ({ ...f, age: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                <input type="number" placeholder="Waga (kg)" step="0.1" value={form.weight || ''}
                  onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <input type="text" placeholder="Weterynarz" value={form.vet}
                onChange={e => setForm(f => ({ ...f, vet: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />

              {/* Wizyty */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🏥 Wizyty weterynaryjne</p>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Ostatnia wizyta</label>
                  <input type="date" value={form.lastVisit}
                    onChange={e => setForm(f => ({ ...f, lastVisit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1 ml-1">
                    <label className="block text-xs text-gray-400">Następna wizyta</label>
                    {/* Checkbox Nie zaplanowano */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        onClick={() => setForm(f => ({ ...f, noNextVisit: !f.noNextVisit, nextVisit: !f.noNextVisit ? '' : f.nextVisit }))}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${form.noNextVisit ? 'bg-amber-500' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.noNextVisit ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <span className="text-xs text-gray-500">Nie zaplanowano</span>
                    </label>
                  </div>
                  {!form.noNextVisit && (
                    <input type="date" value={form.nextVisit}
                      onChange={e => setForm(f => ({ ...f, nextVisit: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                  )}
                  {form.noNextVisit && (
                    <div className="w-full border border-dashed border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-400 italic bg-white">
                      Nie zaplanowano wizyty
                    </div>
                  )}
                </div>
              </div>

              {/* Profilaktyka */}
              <HealthFormRow
                label="Szczepienia" icon="💉"
                nameKey="vaccinations" dateKey="vaccinationsDate"
                namePlaceholder="Rodzaj szczepień (np. Wścieklizna)"
              />
              <HealthFormRow
                label="Odrobaczenie" icon="🪱"
                nameKey="deworming" dateKey="dewormingDate"
                namePlaceholder="Preparat (np. Milbemax)"
              />
              <HealthFormRow
                label="Ochrona przeciw kleszczom" icon="🕷️"
                nameKey="tickProtection" dateKey="tickProtectionDate"
                namePlaceholder="Preparat (np. Bravecto)"
              />

              {/* Notatki */}
              <textarea placeholder="Notatki" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />

              {/* Kolor profilu */}
              <div>
                <label className="block text-xs text-gray-500 mb-2 ml-1">Kolor profilu</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={closeModal} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Anuluj</button>
          <button onClick={handleSave} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold transition shadow">
            {editingId ? 'Zapisz zmiany' : 'Dodaj zwierzę'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Usuń zwierzę"
        message={`Czy na pewno chcesz usunąć "${pets.find(p => p.id === confirmId)?.name}"? Tej operacji nie można cofnąć.`}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
