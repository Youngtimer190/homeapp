import { useState } from 'react';
import { ShoppingList, ShoppingItem } from '../../types';
import ConfirmDialog from '../ConfirmDialog';

interface Props {
  lists: ShoppingList[];
  setLists: (val: ShoppingList[] | ((prev: ShoppingList[]) => ShoppingList[])) => void;
}

const emptyItem = { name: '', quantity: '' };
const emptyList = { name: '' };

export default function Shopping({ lists, setLists }: Props) {
  const [selectedListId, setSelectedListId] = useState<string | null>(lists[0]?.id ?? null);
  const [showListModal, setShowListModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [listForm, setListForm] = useState(emptyList);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [confirmListId, setConfirmListId] = useState<string | null>(null);
  const [confirmItemId, setConfirmItemId] = useState<string | null>(null);

  const selectedList = lists.find(l => l.id === selectedListId) ?? null;

  // ── List actions ─────────────────────────────────────────────
  const handleAddList = () => {
    if (!listForm.name.trim()) return;
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: listForm.name.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      items: [],
    };
    setLists(prev => [...prev, newList]);
    setSelectedListId(newList.id);
    setListForm(emptyList);
    setShowListModal(false);
  };

  const handleDeleteList = (id: string) => {
    setLists(prev => prev.filter(l => l.id !== id));
    if (selectedListId === id) setSelectedListId(lists.find(l => l.id !== id)?.id ?? null);
    setConfirmListId(null);
  };

  // ── Item actions ─────────────────────────────────────────────
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemForm(emptyItem);
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setItemForm({ name: item.name, quantity: item.quantity });
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.name.trim() || !selectedList) return;
    if (editingItem) {
      setLists(prev => prev.map(l => l.id === selectedList.id
        ? { ...l, items: l.items.map(i => i.id === editingItem.id ? { ...i, name: itemForm.name.trim(), quantity: itemForm.quantity.trim() } : i) }
        : l));
    } else {
      const newItem: ShoppingItem = {
        id: Date.now().toString(),
        name: itemForm.name.trim(),
        quantity: itemForm.quantity.trim(),
        checked: false,
      };
      setLists(prev => prev.map(l => l.id === selectedList.id
        ? { ...l, items: [...l.items, newItem] }
        : l));
    }
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm(emptyItem);
  };

  const handleToggleItem = (itemId: string) => {
    if (!selectedList) return;
    setLists(prev => prev.map(l => l.id === selectedList.id
      ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
      : l));
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedList) return;
    setLists(prev => prev.map(l => l.id === selectedList.id
      ? { ...l, items: l.items.filter(i => i.id !== itemId) }
      : l));
    setConfirmItemId(null);
  };

  const handleUncheckAll = () => {
    if (!selectedList) return;
    setLists(prev => prev.map(l => l.id === selectedList.id
      ? { ...l, items: l.items.map(i => ({ ...i, checked: false })) }
      : l));
  };

  const handleDeleteChecked = () => {
    if (!selectedList) return;
    setLists(prev => prev.map(l => l.id === selectedList.id
      ? { ...l, items: l.items.filter(i => !i.checked) }
      : l));
  };

  // ── Filtered items ──────────────────────────────────────────
  const filteredItems = (selectedList?.items ?? []).filter(i => {
    if (filter === 'pending') return !i.checked;
    if (filter === 'done') return i.checked;
    return true;
  });

  const totalItems = selectedList?.items.length ?? 0;
  const checkedItems = selectedList?.items.filter(i => i.checked).length ?? 0;
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const confirmListName = lists.find(l => l.id === confirmListId)?.name ?? '';
  const confirmItemName = selectedList?.items.find(i => i.id === confirmItemId)?.name ?? '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🛒 Lista zakupów</h2>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Zarządzaj listami zakupów dla całej rodziny</p>
        </div>
        <button
          onClick={() => { setListForm(emptyList); setShowListModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition font-medium shadow-sm"
        >
          <span className="text-lg">+</span> Nowa lista
        </button>
      </div>

      {/* Lists tabs */}
      {lists.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          {lists.map(list => {
            const done = list.items.filter(i => i.checked).length;
            const total = list.items.length;
            const isActive = list.id === selectedListId;
            return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700'
                }`}
              >
                <span>🛒</span>
                <span>{list.name}</span>
                {total > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {done}/{total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Brak list zakupów</h3>
          <p className="text-gray-400 mb-6">Utwórz swoją pierwszą listę zakupów</p>
          <button
            onClick={() => { setListForm(emptyList); setShowListModal(true); }}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition font-medium"
          >
            + Nowa lista
          </button>
        </div>
      )}

      {/* Selected list content */}
      {selectedList && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* List header with controls */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedList.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Utworzona: {new Date(selectedList.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddItem}
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition font-medium"
                  >
                    <span>+</span> Dodaj produkt
                  </button>
                  <button
                    onClick={() => setConfirmListId(selectedList.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition font-medium"
                  >
                    Usuń
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {totalItems > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Postęp zakupów</span>
                    <span className="font-semibold text-teal-600">{checkedItems} / {totalItems} ({progress}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Filter tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'pending', 'done'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filter === f ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {f === 'all' ? `Wszystkie (${totalItems})` : f === 'pending' ? `Do kupienia (${totalItems - checkedItems})` : `Kupione (${checkedItems})`}
                  </button>
                ))}
                {checkedItems > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={handleUncheckAll}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition"
                    >
                      ↩ Odznacz wszystkie
                    </button>
                    <button
                      onClick={handleDeleteChecked}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      🗑 Usuń kupione
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Items list */}
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="text-4xl mb-3">{filter === 'done' ? '✅' : '🛍️'}</div>
                <p className="text-gray-500 font-medium">
                  {filter === 'done' ? 'Nic jeszcze nie kupione' : filter === 'pending' ? 'Wszystko kupione! 🎉' : 'Lista jest pusta'}
                </p>
                {filter === 'all' && (
                  <button
                    onClick={handleOpenAddItem}
                    className="mt-4 px-5 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition font-medium"
                  >
                    + Dodaj pierwszy produkt
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {filteredItems.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-5 py-3.5 group transition-colors ${item.checked ? 'bg-gray-50/60' : 'hover:bg-gray-50'}`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleItem(item.id)}
                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          item.checked
                            ? 'bg-teal-500 border-teal-500 text-white'
                            : 'border-gray-300 hover:border-teal-400'
                        }`}
                      >
                        {item.checked && <span className="text-xs">✓</span>}
                      </button>

                      {/* Name & quantity */}
                      <div className="flex-1 min-w-0">
                        <span className={`font-medium text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                        {item.quantity && (
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            item.checked ? 'bg-gray-100 text-gray-400' : 'bg-teal-50 text-teal-600'
                          }`}>
                            {item.quantity}
                          </span>
                        )}

                      </div>

                       {/* Actions */}
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                           <button
                             onClick={() => handleOpenEditItem(item)}
                             className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 font-medium transition shadow-sm"
                           >
                             ✏️ Edytuj
                           </button>
                          <button
                            onClick={() => setConfirmItemId(item.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium transition shadow-sm"
                          >
                            🗑 Usuń
                          </button>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — stats & all lists */}
          <div className="space-y-4">
            {/* Stats card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="font-semibold text-gray-800 mb-4">📊 Podsumowanie</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Wszystkich produktów</span>
                  <span className="font-bold text-gray-800">{totalItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Do kupienia</span>
                  <span className="font-bold text-amber-600">{totalItems - checkedItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Kupione</span>
                  <span className="font-bold text-teal-600">{checkedItems}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Ukończono</span>
                    <span className={`font-bold text-lg ${progress === 100 ? 'text-teal-600' : 'text-gray-800'}`}>
                      {progress}% {progress === 100 ? '🎉' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* All lists overview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="font-semibold text-gray-800 mb-4">🗂 Wszystkie listy</h4>
              <div className="space-y-2">
                {lists.map(list => {
                  const done = list.items.filter(i => i.checked).length;
                  const total = list.items.length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <button
                      key={list.id}
                      onClick={() => setSelectedListId(list.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        list.id === selectedListId
                          ? 'border-teal-300 bg-teal-50'
                          : 'border-gray-100 hover:border-teal-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">{list.name}</span>
                        <span className="text-xs text-gray-400">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{done}/{total} produktów</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — New List */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">🛒 Nowa lista zakupów</h3>
              <button onClick={() => setShowListModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-xs text-gray-500 mb-1 ml-1">Nazwa listy *</label>
                 <input
                   type="text"
                   value={listForm.name}
                   onChange={e => setListForm({ ...listForm, name: e.target.value })}
                   onKeyDown={e => e.key === 'Enter' && handleAddList()}
                   placeholder="np. Tygodniowe zakupy, Drogeria..."
                   className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                   autoFocus
                 />
               </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowListModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Anuluj
              </button>
              <button
                onClick={handleAddList}
                disabled={!listForm.name.trim()}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Utwórz listę
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Add/Edit Item */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingItem ? '✏️ Edytuj produkt' : '+ Dodaj produkt'}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-xs text-gray-500 mb-1 ml-1">Nazwa produktu *</label>
                 <input
                   type="text"
                   value={itemForm.name}
                   onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                   onKeyDown={e => e.key === 'Enter' && handleSaveItem()}
                   placeholder="np. Mleko, Chleb, Szampon..."
                   className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                   autoFocus
                 />
               </div>
               <div>
                 <label className="block text-xs text-gray-500 mb-1 ml-1">Ilość / jednostka (opcjonalnie)</label>
                 <input
                   type="text"
                   value={itemForm.quantity}
                   onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })}
                   placeholder="np. 2 l, 1 kg, 3 szt."
                   className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                 />
               </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowItemModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Anuluj
              </button>
              <button
                onClick={handleSaveItem}
                disabled={!itemForm.name.trim()}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {editingItem ? 'Zapisz zmiany' : 'Dodaj produkt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm — Delete list */}
      <ConfirmDialog
        isOpen={!!confirmListId}
        title="Usuń listę zakupów"
        message={`Czy na pewno chcesz usunąć listę „${confirmListName}" wraz ze wszystkimi produktami?`}
        onConfirm={() => handleDeleteList(confirmListId!)}
        onCancel={() => setConfirmListId(null)}
      />

      {/* Confirm — Delete item */}
      <ConfirmDialog
        isOpen={!!confirmItemId}
        title="Usuń produkt"
        message={`Czy na pewno chcesz usunąć „${confirmItemName}" z listy?`}
        onConfirm={() => handleDeleteItem(confirmItemId!)}
        onCancel={() => setConfirmItemId(null)}
      />
    </div>
  );
}
