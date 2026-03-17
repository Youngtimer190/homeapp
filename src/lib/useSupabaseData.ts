import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { Transaction, Task, Meal, Vehicle, Pet, Member, ShoppingList, ShoppingItem } from '../types';

function useTable<T extends { id: string }>(
  table: string,
  userId: string | undefined,
  transform?: (row: Record<string, unknown>) => T,
  reverseTransform?: (item: T) => Record<string, unknown>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const toRow = reverseTransform || ((item: T) => item as unknown as Record<string, unknown>);
  const fromRow = transform || ((row: Record<string, unknown>) => row as unknown as T);

  useEffect(() => {
    if (!userId) { setData([]); setLoading(false); return; }
    setLoading(true);
    console.log(`[${table}] fetching for user ${userId}`);
    supabase.from(table).select('*').eq('user_id', userId)
      .then(({ data: rows, error }) => {
        if (error) console.error(`[${table}] fetch error:`, error.message);
        else console.log(`[${table}] fetched ${rows?.length || 0} rows`);
        setData((rows || []).map(r => fromRow(r as Record<string, unknown>)));
        setLoading(false);
      });
  }, [userId, table]);

  const setItems = useCallback(async (updater: T[] | ((prev: T[]) => T[])) => {
    if (!userId) return;
    const newItems = typeof updater === 'function' ? updater(data) : updater;

    // Find added/updated/deleted
    const oldIds = new Set(data.map(d => d.id));
    const newIds = new Set(newItems.map(d => d.id));

    // Deleted
    const deleted = data.filter(d => !newIds.has(d.id));
    // Added
    const added = newItems.filter(d => !oldIds.has(d.id));
    // Updated
    const updated = newItems.filter(d => oldIds.has(d.id));

    try {
      console.log(`[${table}] sync: ${deleted.length} deleted, ${added.length} added, ${updated.length} updated`);
      for (const item of deleted) {
        console.log(`[${table}] delete:`, item.id);
        const { error } = await supabase.from(table).delete().eq('id', item.id).eq('user_id', userId);
        if (error) console.error(`[${table}] delete error:`, error.message);
      }
      for (const item of added) {
        console.log(`[${table}] upsert:`, item.id, toRow(item));
        const { error } = await supabase.from(table).upsert({ ...toRow(item), user_id: userId });
        if (error) console.error(`[${table}] upsert error:`, error.message);
      }
      for (const item of updated) {
        const old = data.find(d => d.id === item.id);
        if (JSON.stringify(old) !== JSON.stringify(item)) {
          console.log(`[${table}] update:`, item.id, toRow(item));
          const { error } = await supabase.from(table).update({ ...toRow(item), user_id: userId }).eq('id', item.id).eq('user_id', userId);
          if (error) console.error(`[${table}] update error:`, error.message);
        }
      }
    } catch (err) {
      console.error(`[${table}] sync error:`, err);
    }

    setData(newItems);
  }, [data, userId, table]);

  return { data, setData: setItems, loading };
}

// ── Transactions ──────────────────────────────────────────────────────────────
function txFromRow(r: Record<string, unknown>): Transaction {
  return {
    id: r.id as string,
    type: r.type as 'income' | 'expense',
    category: r.category as string,
    description: r.description as string,
    amount: r.amount as number,
    date: r.date as string,
    addedBy: r.added_by as string | undefined,
  };
}
function txToRow(t: Transaction): Record<string, unknown> {
  return { id: t.id, type: t.type, category: t.category, description: t.description, amount: t.amount, date: t.date, added_by: t.addedBy };
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
function taskFromRow(r: Record<string, unknown>): Task {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    assignedTo: r.assigned_to as string,
    priority: r.priority as Task['priority'],
    status: r.status as Task['status'],
    dueDate: r.due_date as string,
  };
}
function taskToRow(t: Task): Record<string, unknown> {
  return { id: t.id, title: t.title, description: t.description, assigned_to: t.assignedTo, priority: t.priority, status: t.status, due_date: t.dueDate };
}

// ── Meals ─────────────────────────────────────────────────────────────────────
function mealFromRow(r: Record<string, unknown>): Meal {
  return {
    id: r.id as string,
    name: r.name as string,
    mealLabel: r.meal_label as string,
    date: r.date as string,
    ingredients: r.ingredients as string,
  };
}
function mealToRow(m: Meal): Record<string, unknown> {
  return { id: m.id, name: m.name, meal_label: m.mealLabel, date: m.date, ingredients: m.ingredients };
}

// ── Vehicles ──────────────────────────────────────────────────────────────────
function vehicleFromRow(r: Record<string, unknown>): Vehicle {
  return {
    id: r.id as string,
    name: r.name as string,
    brand: r.brand as string,
    model: r.model as string,
    year: r.year as number,
    licensePlate: r.license_plate as string,
    vin: r.vin as string,
    fuelType: r.fuel_type as string,
    lastService: r.last_service as string,
    nextService: r.next_service as string,
    unlimitedInspection: r.unlimited_inspection as boolean,
    mileage: r.mileage as number,
    insurance: r.insurance as string,
    policyNumber: r.policy_number as string,
  };
}
function vehicleToRow(v: Vehicle): Record<string, unknown> {
  return { id: v.id, name: v.name, brand: v.brand, model: v.model, year: v.year, license_plate: v.licensePlate, vin: v.vin, fuel_type: v.fuelType, last_service: v.lastService, next_service: v.nextService, unlimited_inspection: v.unlimitedInspection, mileage: v.mileage, insurance: v.insurance, policy_number: v.policyNumber };
}

// ── Pets ──────────────────────────────────────────────────────────────────────
function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function petFromRow(r: Record<string, unknown>): Pet {
  // Calculate birthDate from age if birth_date not available
  let birthDate = r.birth_date as string;
  const ageValue = typeof r.age === 'number' ? r.age as number : typeof r.age === 'string' ? parseFloat(r.age) : 0;
  if (!birthDate && ageValue > 0) {
    const today = new Date();
    const birthYear = today.getFullYear() - ageValue;
    birthDate = `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  if (!birthDate) {
    birthDate = new Date().toISOString().split('T')[0]; // today as fallback
  }
  const age = calculateAge(birthDate);
  const weight = typeof r.weight === 'number' ? r.weight as number : typeof r.weight === 'string' ? parseFloat(r.weight) : 0;
  return {
    id: r.id as string,
    name: r.name as string,
    species: r.species as string,
    breed: r.breed as string,
    birthDate,
    age,
    weight,
    color: r.color as string,
    vet: r.vet as string,
    lastVisit: r.last_visit as string,
    nextVisit: r.next_visit as string,
    noNextVisit: r.no_next_visit as boolean,
    vaccinations: r.vaccinations as string,
    vaccinationsDate: r.vaccinations_date as string,
    deworming: r.deworming as string,
    dewormingDate: r.deworming_date as string,
    tickProtection: r.tick_protection as string,
    tickProtectionDate: r.tick_protection_date as string,
    notes: r.notes as string,
  };
}
function petToRow(p: Pet): Record<string, unknown> {
  const age = calculateAge(p.birthDate);
  return {
    id: p.id,
    name: p.name,
    species: p.species,
    breed: p.breed,
    birth_date: p.birthDate,
    age: age,
    weight: p.weight,
    color: p.color,
    vet: p.vet,
    last_visit: p.lastVisit,
    next_visit: p.nextVisit,
    no_next_visit: p.noNextVisit,
    vaccinations: p.vaccinations,
    vaccinations_date: p.vaccinationsDate,
    deworming: p.deworming,
    deworming_date: p.dewormingDate,
    tick_protection: p.tickProtection,
    tick_protection_date: p.tickProtectionDate,
    notes: p.notes,
  };
}

// ── Members ───────────────────────────────────────────────────────────────────
function memberFromRow(r: Record<string, unknown>): Member {
  return {
    id: r.id as string,
    name: r.name as string,
    role: r.role as string,
    age: r.age as number,
    email: r.email as string,
    phone: r.phone as string,
    avatar: r.avatar as string,
    birthday: r.birthday as string,
    responsibilities: r.responsibilities as string,
  };
}
function memberToRow(m: Member): Record<string, unknown> {
  return { id: m.id, name: m.name, role: m.role, age: m.age, email: m.email, phone: m.phone, avatar: m.avatar, birthday: m.birthday, responsibilities: m.responsibilities };
}

// ── Shopping Lists ─────────────────────────────────────────────────────────────
function shoppingListFromRow(r: Record<string, unknown>): ShoppingList {
  let items: ShoppingItem[] = [];
  try { items = JSON.parse(r.items as string) as ShoppingItem[]; } catch { items = []; }
  return {
    id: r.id as string,
    name: r.name as string,
    createdAt: r.created_at as string,
    items,
  };
}
function shoppingListToRow(s: ShoppingList): Record<string, unknown> {
  return { id: s.id, name: s.name, items: JSON.stringify(s.items) };
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useSupabaseData(userId: string | undefined) {
  const transactions = useTable<Transaction>('transactions', userId, txFromRow, txToRow);
  const tasks = useTable<Task>('tasks', userId, taskFromRow, taskToRow);
  const meals = useTable<Meal>('meals', userId, mealFromRow, mealToRow);
  const vehicles = useTable<Vehicle>('vehicles', userId, vehicleFromRow, vehicleToRow);
  const pets = useTable<Pet>('pets', userId, petFromRow, petToRow);
  const members = useTable<Member>('members', userId, memberFromRow, memberToRow);
  const shoppingLists = useTable<ShoppingList>('shopping_lists', userId, shoppingListFromRow, shoppingListToRow);

  const [familyName, setFamilyNameState] = useState('Wpisz nazwę rodziny');
  const [familyLoading, setFamilyLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setFamilyLoading(false); return; }
    supabase.from('families').select('name').eq('user_id', userId).single()
      .then(({ data }) => {
        if (data?.name) setFamilyNameState(data.name);
        setFamilyLoading(false);
      });
  }, [userId]);

  const setFamilyName = useCallback(async (name: string) => {
    setFamilyNameState(name);
    if (!userId) return;
    await supabase.from('families').update({ name: name }).eq('user_id', userId);
  }, [userId]);

  const loading = transactions.loading || tasks.loading || meals.loading ||
    vehicles.loading || pets.loading || members.loading ||
    shoppingLists.loading || familyLoading;

  return {
    transactions: transactions.data, setTransactions: transactions.setData,
    tasks: tasks.data, setTasks: tasks.setData,
    meals: meals.data, setMeals: meals.setData,
    vehicles: vehicles.data, setVehicles: vehicles.setData,
    pets: pets.data, setPets: pets.setData,
    members: members.data, setMembers: members.setData,
    shoppingLists: shoppingLists.data, setShoppingLists: shoppingLists.setData,
    familyName, setFamilyName,
    loading,
  };
}
