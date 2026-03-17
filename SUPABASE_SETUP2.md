# Supabase SQL Setup - HomeApp

Kompletny skrypt SQL do wdrożenia bazy danych Supabase dla aplikacji HomeApp.

## 📋 Wymagania
- Projekt Supabase utworzony na [supabase.com](https://supabase.com)
- Dostęp do **SQL Editor** w panelu Supabase

## 🚀 Instalacja
1. Wejdź w **SQL Editor** w panelu Supabase
2. Wklej poniższy skrypt
3. Kliknij **RUN**

## 🛠️ Kompletny skrypt SQL (idempotentny)

```sql
-- ============================================
-- HOMEAPP - SUPABASE DATABASE SETUP
-- Skrypt idempotentny (można uruchamiać wielokrotnie)
-- ============================================

-- ============================================
-- 1. TABELA: families (rodzina użytkownika)
-- ============================================
CREATE TABLE IF NOT EXISTS families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  name TEXT DEFAULT 'Wpisz nazwę rodziny',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Włącz RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Polityka RLS: użytkownik ma dostęp tylko do swojego rekordu
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'families' AND policyname = 'own family'
  ) THEN
    CREATE POLICY "own family" ON families
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Dodaj brakujące kolumny (dla istniejących tabel)
ALTER TABLE families ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE families ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE families ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Wpisz nazwę rodziny';
ALTER TABLE families ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================
-- 2. TABELA: transactions (transakcje budżetowe)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT,
  description TEXT,
  amount NUMERIC,
  date TEXT,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transactions' AND policyname = 'own transactions'
  ) THEN
    CREATE POLICY "own transactions" ON transactions
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Dodaj brakujące kolumny
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS added_by TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================
-- 3. TABELA: tasks (zadania)
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT,
  description TEXT,
  assigned_to TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT CHECK (status IN ('todo', 'in-progress', 'done')),
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' AND policyname = 'own tasks'
  ) THEN
    CREATE POLICY "own tasks" ON tasks
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Dodaj brakujące kolumny
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================
-- 4. TABELA: meals (posiłki)
-- ============================================
CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT,
  meal_label TEXT,
  date TEXT,
  ingredients TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'meals' AND policyname = 'own meals'
  ) THEN
    CREATE POLICY "own meals" ON meals
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Dodaj brakujące kolumny
ALTER TABLE meals ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_label TEXT;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================
-- 5. TABELA: vehicles (pojazdy)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT,
  brand TEXT,
  model TEXT,
  year INTEGER,
  license_plate TEXT,
  vin TEXT,
  fuel_type TEXT,
  last_service TEXT,
  next_service TEXT,
  unlimited_inspection BOOLEAN DEFAULT FALSE,
  mileage INTEGER,
  insurance TEXT,
  policy_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vehicles' AND policyname = 'own vehicles'
  ) THEN
    CREATE POLICY "own vehicles" ON vehicles
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Dodaj brakujące kolumny
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS license_plate TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_service TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS next_service TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS unlimited_inspection BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mileage INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS policy_number TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================
-- 6. TABELA: pets (zwierzęta)
-- ============================================
CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT,
  species TEXT,
  breed TEXT,
  birth_date TEXT,
  age NUMERIC,
  weight NUMERIC,
  color TEXT,
  vet TEXT,
  last_visit TEXT,
  next_visit TEXT,
  no_next_visit BOOLEAN DEFAULT FALSE,
  vaccinations TEXT,
  vaccinations_date TEXT,
  deworming TEXT,
  deworming_date TEXT,
  tick_protection TEXT,
  tick_protection_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pets' AND policyname = 'own pets'
  ) THEN
    CREATE POLICY "own pets" ON pets
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Dodaj brakujące kolumny (krytyczne dla synchronizacji)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS species TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS breed TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS age NUMERIC;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vet TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS last_visit TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS next_visit TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS no_next_visit BOOLEAN DEFAULT FALSE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vaccinations TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vaccinations_date TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS deworming TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS deworming_date TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS tick_protection TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS tick_protection_date TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================
-- 7. TABELA: members (członkowie rodziny)
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT,
  role TEXT,
  age INTEGER,
  email TEXT,
  phone TEXT,
  avatar TEXT,
  birthday TEXT,
  responsibilities TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'members' AND policyname = 'own members'
  ) THEN
    CREATE POLICY "own members" ON members
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Dodaj brakujące kolumny
ALTER TABLE members ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE members ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS birthday TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS responsibilities TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================
-- 8. TABELA: shopping_lists (listy zakupów)
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_lists' AND policyname = 'own shopping_lists'
  ) THEN
    CREATE POLICY "own shopping_lists" ON shopping_lists
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Dodaj brakujące kolumny
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS created_at TIMESTAMptz DEFAULT now();

-- ============================================
-- 9. INDEKSY dla poprawy wydajności
-- ============================================

-- Indeksy na user_id (wszystkie tabele)
CREATE INDEX IF NOT EXISTS idx_families_user_id ON families(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);

-- Dodatkowe indeksy na często wyszukiwanych kolumnach
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);

-- ============================================
-- 10. FUNKCJE pomocnicze (opcjonalnie)
-- ============================================

-- Funkcja do automatycznego tworzenia rekordu families przy rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.families (user_id, name)
  VALUES (NEW.id, 'Wpisz nazwę rodziny');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger automatycznie tworzący rodzinę dla nowego użytkownika
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ✅ SKRYPT ZAKOŃCZONY
-- ============================================

-- Sprawdzenie utworzonych tabel
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t 
WHERE table_schema = 'public' 
  AND table_name IN ('families', 'transactions', 'tasks', 'meals', 'vehicles', 'pets', 'members', 'shopping_lists')
ORDER BY table_name;
```

## 📊 Weryfikacja instalacji

Po uruchomieniu skryptu wykonaj poniższe zapytanie, aby sprawdzić, czy wszystkie tabele zostały utworzone:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('families', 'transactions', 'tasks', 'meals', 'vehicles', 'pets', 'members', 'shopping_lists')
ORDER BY table_name;
```

## 🔧 Rozwiązywanie problemów

### 1. Błąd "permission denied for schema auth"
- Upewnij się, że jesteś zalogowany jako administrator projektu
- Uruchom skrypt w **SQL Editor** z uprawnieniami administratora

### 2. Błąd "relation already exists"
- Skrypt używa `CREATE TABLE IF NOT EXISTS`, więc jest bezpieczny
- Możesz uruchamiać go wielokrotnie

### 3. Synchronizacja nie działa
- Sprawdź, czy kolumna `user_id` w każdej tabeli ma wartość `REFERENCES auth.users`
- Upewnij się, że RLS jest włączone dla wszystkich tabel
- Sprawdź, czy polityki RLS zostały utworzone (policy "own ...")

### 4. Brak danych po zalogowaniu
- Nowy użytkownik powinien automatycznie dostać rekord w tabeli `families`
- Jeśli trigger nie działa, ręcznie dodaj rekord:
  ```sql
  INSERT INTO families (user_id, name) 
  VALUES ('user-uuid-here', 'Wpisz nazwę rodziny');
  ```

## 🎯 Uwagi

1. **Polityki RLS** zabezpieczają, że użytkownik widzi tylko swoje dane
2. **Indeksy** znacznie przyspieszają zapytania przy większej ilości danych
3. **Trigger** automatycznie tworzy rekord rodziny dla nowych użytkowników
4. **JSONB** w tabeli `shopping_lists` przechowuje zagnieżdżone struktury danych

## 🔄 Aktualizacje

W przypadku aktualizacji aplikacji, wystarczy ponownie uruchomić ten skrypt - dodane kolumny zostaną uzupełnione, a brakujące indeksy utworzone.

---

**HomeApp** - Kompletny system zarządzania domem 🏠