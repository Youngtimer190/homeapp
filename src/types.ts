export type Section = 'budget' | 'tasks' | 'shopping' | 'meals' | 'vehicles' | 'pets' | 'members' | 'settings';

// Shopping
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  items: ShoppingItem[];
}

// Budget
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  addedBy?: string;
}

// Tasks
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string;
}

// Meals
export interface Meal {
  id: string;
  name: string;
  mealLabel: string;
  date: string; // YYYY-MM-DD
  ingredients: string;
}

// Vehicles
export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  fuelType: string;
  lastService: string;
  nextService: string;
  unlimitedInspection: boolean;
  mileage: number;
  insurance: string;
  policyNumber: string;
}

// Pets
export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  color: string;
  vet: string;
  lastVisit: string;
  nextVisit: string;
  noNextVisit: boolean;
  vaccinations: string;
  vaccinationsDate: string;
  deworming: string;
  dewormingDate: string;
  tickProtection: string;
  tickProtectionDate: string;
  notes: string;
}

// Members
export interface Member {
  id: string;
  name: string;
  role: string;
  age: number;
  email: string;
  phone: string;
  avatar: string;
  birthday: string;
  responsibilities: string;
}
