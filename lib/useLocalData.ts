import { useState, useCallback } from 'react';
import { Transaction, Task, Meal, Vehicle, Pet, Member, ShoppingList } from '../types';

function useLocalStorage<T>(key: string, initial: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback((val: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [key]);

  return [state, set];
}

export function useLocalData() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('dm_transactions', []);
  const [tasks, setTasks] = useLocalStorage<Task[]>('dm_tasks', []);
  const [meals, setMeals] = useLocalStorage<Meal[]>('dm_meals', []);
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('dm_vehicles', []);
  const [pets, setPets] = useLocalStorage<Pet[]>('dm_pets', []);
  const [members, setMembers] = useLocalStorage<Member[]>('dm_members', []);
  const [shoppingLists, setShoppingLists] = useLocalStorage<ShoppingList[]>('dm_shopping', []);
  const [familyName, setFamilyNameState] = useLocalStorage<string>('dm_familyName', 'Wpisz nazwę rodziny');

  const setFamilyName = useCallback((name: string) => {
    setFamilyNameState(name);
  }, [setFamilyNameState]);

  // Wrap setters to return Promise (matching Supabase interface)
  const wrapSetter = <T>(setter: (val: T[] | ((prev: T[]) => T[])) => void) =>
    async (val: T[] | ((prev: T[]) => T[])) => setter(val);

  return {
    transactions, setTransactions: wrapSetter<Transaction>(setTransactions),
    tasks, setTasks: wrapSetter<Task>(setTasks),
    meals, setMeals: wrapSetter<Meal>(setMeals),
    vehicles, setVehicles: wrapSetter<Vehicle>(setVehicles),
    pets, setPets: wrapSetter<Pet>(setPets),
    members, setMembers: wrapSetter<Member>(setMembers),
    shoppingLists, setShoppingLists: wrapSetter<ShoppingList>(setShoppingLists),
    familyName, setFamilyName,
    loading: false,
  };
}
