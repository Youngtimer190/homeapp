import { useState } from 'react';
import { Vehicle } from '../../types';
import ConfirmDialog from '../ConfirmDialog';

interface Props {
  vehicles: Vehicle[];
  setVehicles: (val: Vehicle[] | ((prev: Vehicle[]) => Vehicle[])) => void;
}

const fuelTypes = ['Benzyna', 'Diesel', 'LPG', 'Benzyna+LPG', 'Elektryczny', 'Hybryda'];

const emptyForm = (): Omit<Vehicle, 'id'> => ({
  name: '', brand: '', model: '', year: new Date().getFullYear(),
  licensePlate: '', vin: '', fuelType: 'Benzyna', lastService: '', nextService: '',
  unlimitedInspection: false, mileage: 0, insurance: '', policyNumber: '',
});

export default function Vehicles({ vehicles, setVehicles }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [selected, setSelected] = useState<Vehicle | null>(vehicles[0] ?? null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      name: v.name, brand: v.brand, model: v.model, year: v.year,
      licensePlate: v.licensePlate, vin: v.vin, fuelType: v.fuelType,
      lastService: v.lastService, nextService: v.nextService,
      unlimitedInspection: v.unlimitedInspection, mileage: v.mileage,
      insurance: v.insurance, policyNumber: v.policyNumber,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.brand || !form.model) return;
    if (editingId) {
      setVehicles(prev => prev.map(v => v.id === editingId ? { ...form, id: editingId } : v));
      const updated = { ...form, id: editingId };
      setSelected(updated);
    } else {
      const v = { ...form, id: Date.now().toString() };
      setVehicles(prev => [...prev, v]);
      setSelected(v);
    }
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setVehicles(prev => {
      const next = prev.filter(v => v.id !== id);
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
  const fmt = (n: number) => new Intl.NumberFormat('pl-PL').format(n);

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

  const urgencyClass: Record<string, string> = {
    overdue: 'text-red-600 font-bold',
    soon: 'text-amber-600 font-semibold',
    ok: 'text-emerald-600',
    neutral: 'text-gray-500',
  };

  const urgencyBadge: Record<string, string> = {
    overdue: 'bg-red-100 text-red-700',
    soon: 'bg-amber-100 text-amber-700',
    ok: 'bg-emerald-100 text-emerald-700',
    neutral: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Pojazdy</h2>
          <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">Zarządzaj flotą rodziny</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold shadow transition flex-shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">Dodaj pojazd</span>
          <span className="sm:hidden">Dodaj</span>
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center text-gray-400">
          <div className="text-6xl mb-3">🚗</div>
          <p className="font-medium">Brak pojazdów</p>
          <p className="text-sm mt-1">Dodaj swój pierwszy pojazd</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle list */}
          <div className="space-y-3">
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                className={`w-full text-left rounded-2xl border p-4 transition hover:shadow-md ${selected?.id === v.id ? 'border-violet-300 bg-violet-50 shadow' : 'border-gray-100 bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-violet-100 border-2 border-violet-200">
                    🚗
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{v.name || `${v.brand} ${v.model}`}</p>
                    <p className="text-xs text-gray-500">{v.brand} {v.model} · {v.year}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.licensePlate}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Vehicle detail */}
          {selected && (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Top banner */}
                <div className="p-6 bg-gradient-to-br from-violet-600 to-violet-800 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
                    <div className="absolute -right-4 top-8 w-24 h-24 rounded-full bg-white" />
                  </div>
                  <div className="relative flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{selected.name || `${selected.brand} ${selected.model}`}</h3>
                      <p className="text-white/80 mt-1">{selected.brand} {selected.model} · {selected.year} · {selected.fuelType}</p>
                      <p className="text-white/70 text-sm mt-1">🔢 {selected.licensePlate}</p>
                    </div>
                    <div className="flex gap-2">
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
                  <div className="relative mt-4 flex gap-6">
                    <div>
                      <p className="text-white/70 text-xs">Przebieg</p>
                      <p className="text-xl font-bold">{fmt(selected.mileage)} km</p>
                    </div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">🔧 Ostatnie badanie techniczne</p>
                    <p className="font-semibold text-gray-900">{fmtDate(selected.lastService)}</p>
                  </div>
                  {selected.unlimitedInspection ? (
                    <div className="rounded-xl p-4 bg-violet-50">
                      <p className="text-xs mb-1 text-violet-500 opacity-70">⏰ Następne badanie techniczne</p>
                      <p className="font-semibold text-violet-700">Bezterminowe</p>
                      <p className="text-xs mt-0.5 text-violet-500">Brak wymaganego terminu</p>
                    </div>
                  ) : (
                    <div className={`rounded-xl p-4 ${urgencyBadge[urgency(selected.nextService)]}`}>
                      <p className="text-xs mb-1 opacity-70">⏰ Następne badanie techniczne</p>
                      <p className={`font-semibold ${urgencyClass[urgency(selected.nextService)]}`}>
                        {fmtDate(selected.nextService)}
                      </p>
                      {daysUntil(selected.nextService) !== null && (
                        <p className="text-xs mt-0.5 opacity-80">
                          {daysUntil(selected.nextService)! < 0
                            ? `${Math.abs(daysUntil(selected.nextService)!)} dni po terminie!`
                            : `Za ${daysUntil(selected.nextService)} dni`}
                        </p>
                      )}
                    </div>
                  )}
                  <div className={`rounded-xl p-4 ${urgencyBadge[urgency(selected.insurance)]}`}>
                    <p className="text-xs mb-1 opacity-70">🛡️ Ubezpieczenie do</p>
                    <p className={`font-semibold ${urgencyClass[urgency(selected.insurance)]}`}>
                      {fmtDate(selected.insurance)}
                    </p>
                    {daysUntil(selected.insurance) !== null && (
                      <p className="text-xs mt-0.5 opacity-80">
                        {daysUntil(selected.insurance)! < 0
                          ? `${Math.abs(daysUntil(selected.insurance)!)} dni po terminie!`
                          : `Za ${daysUntil(selected.insurance)} dni`}
                      </p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">⛽ Paliwo</p>
                    <p className="font-semibold text-gray-900">{selected.fuelType}</p>
                  </div>

                  {/* VIN */}
                  {selected.vin && (
                    <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                      <p className="text-xs text-gray-500 mb-1">🔑 Numer VIN</p>
                      <p className="font-semibold text-gray-900 font-mono tracking-wide text-sm">{selected.vin}</p>
                    </div>
                  )}

                  {/* Policy number */}
                  {selected.policyNumber && (
                    <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                      <p className="text-xs text-gray-500 mb-1">📄 Numer polisy ubezpieczeniowej</p>
                      <p className="font-semibold text-gray-900">{selected.policyNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal – dodaj / edytuj */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? '✏️ Edytuj pojazd' : '🚗 Nowy pojazd'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">

              {/* Nazwa / przezwisko */}
              <input type="text" placeholder="Nazwa / przezwisko (opcjonalnie)" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />

              {/* Marka i model */}
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Marka *" value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                <input type="text" placeholder="Model *" value={form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              {/* Rok i rejestracja */}
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Rok produkcji" value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || 2020 }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                <input type="text" placeholder="Nr rejestracyjny" value={form.licensePlate}
                  onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              {/* VIN */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 ml-1">Numer VIN</label>
                <input type="text" placeholder="np. JTDBL40E299012345" value={form.vin}
                  onChange={e => setForm(f => ({ ...f, vin: e.target.value.toUpperCase() }))}
                  maxLength={17}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              {/* Paliwo i przebieg */}
              <div className="grid grid-cols-2 gap-3">
                <select value={form.fuelType}
                  onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                  {fuelTypes.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                </select>
                <input type="number" placeholder="Przebieg (km)" value={form.mileage || ''}
                  onChange={e => setForm(f => ({ ...f, mileage: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              {/* Ostatnie badanie */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 ml-1">Ostatnie badanie techniczne</label>
                <input type="date" value={form.lastService}
                  onChange={e => setForm(f => ({ ...f, lastService: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              {/* Checkbox bezterminowe */}
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.unlimitedInspection}
                    onChange={e => setForm(f => ({ ...f, unlimitedInspection: e.target.checked, nextService: e.target.checked ? '' : f.nextService }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.unlimitedInspection ? 'bg-violet-500' : 'bg-gray-200'}`} />
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.unlimitedInspection ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Badanie bezterminowe</span>
                {form.unlimitedInspection && (
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">✓ Aktywne</span>
                )}
              </label>

              {/* Następne badanie (ukryte gdy bezterminowe) */}
              {!form.unlimitedInspection && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1 ml-1">Następne badanie techniczne</label>
                  <input type="date" value={form.nextService}
                    onChange={e => setForm(f => ({ ...f, nextService: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              )}

              {/* Ubezpieczenie do */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 ml-1">Ubezpieczenie do</label>
                <input type="date" value={form.insurance}
                  onChange={e => setForm(f => ({ ...f, insurance: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              {/* Numer polisy */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 ml-1">Numer polisy ubezpieczeniowej</label>
                <input type="text" placeholder="np. POL/2025/001234" value={form.policyNumber}
                  onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={closeModal} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Anuluj</button>
              <button onClick={handleSave} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition shadow">
                {editingId ? 'Zapisz zmiany' : 'Dodaj pojazd'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Usuń pojazd"
        message={`Czy na pewno chcesz usunąć pojazd "${vehicles.find(v => v.id === confirmId)?.name || vehicles.find(v => v.id === confirmId)?.brand + ' ' + vehicles.find(v => v.id === confirmId)?.model}"? Tej operacji nie można cofnąć.`}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
