import { useState } from 'react';
import { Member } from '../../types';
import ConfirmDialog from '../ConfirmDialog';
import Modal from '../Modal';

interface Props {
  members: Member[];
  setMembers: (val: Member[] | ((prev: Member[]) => Member[])) => void;
  familyName: string;
  setFamilyName: (name: string) => void;
}

const avatarOptions = ['👨', '👩', '👦', '👧', '👴', '👵', '🧑', '👮', '👷', '🧑‍💼', '🧑‍🎓', '🧑‍🍳'];

const emptyForm = (): Omit<Member, 'id'> => ({
  name: '', role: '', age: 0, email: '', phone: '',
  avatar: '🧑', birthday: '', responsibilities: '',
});

export default function Members({ members, setMembers, familyName, setFamilyName }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selected, setSelected] = useState<Member | null>(members[0] ?? null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Family name editing
  const [editingFamilyName, setEditingFamilyName] = useState(false);
  const [familyNameDraft, setFamilyNameDraft] = useState(familyName);

  const handleSaveFamilyName = () => {
    if (familyNameDraft.trim()) {
      setFamilyName(familyNameDraft.trim());
    } else {
      setFamilyNameDraft(familyName);
    }
    setEditingFamilyName(false);
  };

  const handleAdd = () => {
    if (!form.name) return;
    const m = { ...form, id: Date.now().toString() };
    setMembers(prev => [...prev, m]);
    setSelected(m);
    setForm(emptyForm());
    setShowForm(false);
  };

  const handleEdit = () => {
    if (!editingMember || !form.name) return;
    setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...form, id: m.id } : m));
    setSelected({ ...form, id: editingMember.id });
    setEditingMember(null);
    setForm(emptyForm());
    setShowForm(false);
  };

  const openEdit = (member: Member) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      role: member.role,
      age: member.age,
      email: member.email,
      phone: member.phone,
      avatar: member.avatar,
      birthday: member.birthday,
      responsibilities: member.responsibilities,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setMembers(prev => {
      const next = prev.filter(m => m.id !== id);
      setSelected(next[0] ?? null);
      return next;
    });
    setConfirmId(null);
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pl-PL') : '—';

  const daysUntilBirthday = (birthday: string) => {
    if (!birthday) return null;
    const today = new Date();
    const bd = new Date(birthday);
    const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    return Math.ceil((next.getTime() - today.getTime()) / 86400000);
  };

  const roleColorList = [
    'bg-blue-100 text-blue-700',
    'bg-rose-100 text-rose-700',
    'bg-indigo-100 text-indigo-700',
    'bg-pink-100 text-pink-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-emerald-100 text-emerald-700',
    'bg-teal-100 text-teal-700',
    'bg-orange-100 text-orange-700',
  ];
  const getRoleColor = (role: string) => {
    if (!role) return 'bg-gray-100 text-gray-500';
    let hash = 0;
    for (let i = 0; i < role.length; i++) hash = role.charCodeAt(i) + ((hash << 5) - hash);
    return roleColorList[Math.abs(hash) % roleColorList.length];
  };

  const responsibilities = (r: string) => r ? r.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Członkowie rodziny</h2>
          <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">Zarządzaj rodziną i jej nazwą</p>
        </div>
        <button
          onClick={() => { setEditingMember(null); setForm(emptyForm()); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold shadow transition flex-shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">Dodaj członka</span>
          <span className="sm:hidden">Dodaj</span>
        </button>
      </div>

      {/* Family Name Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow flex-shrink-0">
              🏠
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Nazwa rodziny</p>
              {editingFamilyName ? (
                <input
                  type="text"
                  value={familyNameDraft}
                  onChange={e => setFamilyNameDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveFamilyName(); if (e.key === 'Escape') { setFamilyNameDraft(familyName); setEditingFamilyName(false); } }}
                  autoFocus
                  className="border border-indigo-300 rounded-lg px-3 py-1 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full max-w-xs"
                />
              ) : (
                <p className="text-base font-bold text-gray-900 truncate">{familyName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {editingFamilyName ? (
              <>
                <button
                  onClick={handleSaveFamilyName}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  ✓ Zapisz
                </button>
                <button
                  onClick={() => { setFamilyNameDraft(familyName); setEditingFamilyName(false); }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  Anuluj
                </button>
              </>
            ) : (
              <button
                onClick={() => { setFamilyNameDraft(familyName); setEditingFamilyName(true); }}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                ✏️ Edytuj nazwę
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-rose-500">{members.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Członków</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-500">
            {members.filter(m => {
              const days = daysUntilBirthday(m.birthday);
              return days !== null && days <= 30;
            }).length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Urodziny w mies.</p>
        </div>
      </div>

      {/* Members grid / detail */}
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center text-gray-400">
          <div className="text-6xl mb-3">👨‍👩‍👧‍👦</div>
          <p className="font-medium">Brak członków</p>
          <p className="text-sm mt-1">Dodaj pierwszego członka rodziny</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="space-y-3">
            {members.map(member => {
              const days = daysUntilBirthday(member.birthday);
              return (
                <button
                  key={member.id}
                  onClick={() => setSelected(member)}
                  className={`w-full text-left rounded-2xl border p-4 transition hover:shadow-md ${selected?.id === member.id ? 'border-rose-300 bg-rose-50 shadow' : 'border-gray-100 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">{member.name}</p>
                        {days !== null && days <= 7 && (
                          <span className="text-xs">🎂</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{member.role}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{member.age} lat</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          {selected && (() => {
            const days = daysUntilBirthday(selected.birthday);
            const resp = responsibilities(selected.responsibilities);
            // sync selected with latest data
            const current = members.find(m => m.id === selected.id) ?? selected;
            return (
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Top banner */}
                  <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white opacity-10" />
                    <div className="relative flex items-start gap-5 justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-5xl shadow">
                          {current.avatar}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{current.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${getRoleColor(current.role)}`}>
                              {current.role || 'Brak typu'}
                            </span>
                            <span className="text-white/70 text-sm">{current.age} lat</span>
                          </div>
                          {days !== null && (
                            <p className="text-white/70 text-xs mt-1">
                              {days === 0 ? '🎉 Dziś urodziny!' : days <= 7 ? `🎂 Urodziny za ${days} dni!` : `🎂 Urodziny za ${days} dni`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(current)}
                          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0"
                        >✏️ Edytuj</button>
                        <button
                          onClick={() => setConfirmId(current.id)}
                          className="bg-white/20 hover:bg-red-500/70 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0"
                        >🗑 Usuń</button>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {current.email && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">📧 Email</p>
                          <p className="font-semibold text-gray-900 text-sm break-all">{current.email}</p>
                        </div>
                      )}
                      {current.phone && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">📱 Telefon</p>
                          <p className="font-semibold text-gray-900 text-sm">{current.phone}</p>
                        </div>
                      )}
                      {current.birthday && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">🎂 Data urodzin</p>
                          <p className="font-semibold text-gray-900 text-sm">{fmtDate(current.birthday)}</p>
                        </div>
                      )}
                    </div>

                    {resp.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">🏠 Obowiązki domowe</p>
                        <div className="flex flex-wrap gap-2">
                          {resp.map((r, i) => (
                            <span key={i} className="bg-rose-50 text-rose-700 text-xs px-3 py-1.5 rounded-xl font-medium border border-rose-100">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingMember(null); setForm(emptyForm()); }}
        title={editingMember ? '✏️ Edytuj członka' : '👤 Nowy członek rodziny'}
        maxWidth="max-w-lg"
      >
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-2 ml-1">Avatar</label>
            <div className="flex gap-2 flex-wrap">
              {avatarOptions.map(a => (
                <button key={a} onClick={() => setForm(f => ({ ...f, avatar: a }))}
                  className={`w-10 h-10 rounded-xl text-xl transition ${form.avatar === a ? 'bg-rose-100 ring-2 ring-rose-400 scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <input type="text" placeholder="Imię i nazwisko *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Typ członka (np. Tata)" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
            <input type="number" placeholder="Wiek" value={form.age || ''}
              onChange={e => setForm(f => ({ ...f, age: parseInt(e.target.value) || 0 }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="email" placeholder="Email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
            <input type="tel" placeholder="Telefon" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-1">Data urodzin</label>
            <input type="date" value={form.birthday}
              onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
          <input type="text" placeholder="Obowiązki (oddzielone przecinkiem)" value={form.responsibilities}
            onChange={e => setForm(f => ({ ...f, responsibilities: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={() => { setShowForm(false); setEditingMember(null); setForm(emptyForm()); }}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Anuluj</button>
          <button onClick={editingMember ? handleEdit : handleAdd}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl text-sm font-semibold transition shadow">
            {editingMember ? 'Zapisz zmiany' : 'Dodaj'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Usuń członka"
        message={`Czy na pewno chcesz usunąć "${members.find(m => m.id === confirmId)?.name}"? Tej operacji nie można cofnąć.`}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
