# Konfiguracja Supabase dla Dom Manager

## Krok 1 — Utwórz projekt Supabase
1. Wejdź na [supabase.com](https://supabase.com) i załóż darmowe konto
2. Utwórz nowy projekt (zapamiętaj hasło do bazy danych)
3. Poczekaj ~2 minuty aż projekt się uruchomi

## Krok 2 — Pobierz klucze API
W panelu Supabase wejdź w: **Settings → API**
- Skopiuj **Project URL** (np. `https://abcdef.supabase.co`)
- Skopiuj **anon public** key

## Krok 3 — Skonfiguruj zmienne środowiskowe
Utwórz plik `.env` w głównym folderze projektu:
```
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Krok 4 — Utwórz tabele w bazie danych
W panelu Supabase wejdź w: **SQL Editor → New query**
Wklej poniższy kod i kliknij **Run**:

```sql
-- ============================================================
-- DOM MANAGER — Kompletny setup bazy danych
-- Wklej całość i kliknij RUN
-- ============================================================

-- 1. Tabela rodzin (jedna na konto)
CREATE TABLE IF NOT EXISTS families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  family_name TEXT DEFAULT 'Wpisz nazwę rodziny',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Transakcje budżetu
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  date TEXT,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Zadania
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Posiłki
CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  meal_label TEXT,
  date TEXT,
  ingredients TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pojazdy
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  mileage INTEGER DEFAULT 0,
  insurance TEXT,
  policy_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Zwierzęta
CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Członkowie rodziny
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  age INTEGER,
  email TEXT,
  phone TEXT,
  avatar TEXT,
  birthday TEXT,
  responsibilities TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Listy zakupów (items jako JSON)
CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY — każdy widzi tylko swoje dane
-- ============================================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- Polityki dla families
CREATE POLICY "families_select" ON families FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "families_insert" ON families FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "families_update" ON families FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "families_delete" ON families FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla transactions
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla tasks
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla meals
CREATE POLICY "meals_select" ON meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "meals_insert" ON meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meals_update" ON meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "meals_delete" ON meals FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla vehicles
CREATE POLICY "vehicles_select" ON vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vehicles_insert" ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vehicles_update" ON vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "vehicles_delete" ON vehicles FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla pets
CREATE POLICY "pets_select" ON pets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pets_insert" ON pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pets_update" ON pets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pets_delete" ON pets FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla members
CREATE POLICY "members_select" ON members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "members_insert" ON members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_update" ON members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "members_delete" ON members FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla shopping_lists
CREATE POLICY "shopping_lists_select" ON shopping_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shopping_lists_insert" ON shopping_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shopping_lists_update" ON shopping_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shopping_lists_delete" ON shopping_lists FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER — automatyczne tworzenie rodziny przy rejestracji
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.families (user_id, family_name)
  VALUES (NEW.id, 'Wpisz nazwę rodziny')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNKCJA — usuwanie danych użytkownika (wywoływana przez aplikację)
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS void AS $$
DECLARE
  calling_user_id UUID;
BEGIN
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak zalogowanego użytkownika';
  END IF;

  DELETE FROM public.shopping_lists WHERE user_id = calling_user_id;
  DELETE FROM public.members WHERE user_id = calling_user_id;
  DELETE FROM public.pets WHERE user_id = calling_user_id;
  DELETE FROM public.vehicles WHERE user_id = calling_user_id;
  DELETE FROM public.meals WHERE user_id = calling_user_id;
  DELETE FROM public.tasks WHERE user_id = calling_user_id;
  DELETE FROM public.transactions WHERE user_id = calling_user_id;
  DELETE FROM public.families WHERE user_id = calling_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- GOTOWE! Możesz teraz uruchomić aplikację.
-- ============================================================
```

## Krok 5 — Uruchom aplikację
```bash
npm run dev
```

## Uwagi

### Potwierdzenie e-mail
Domyślnie Supabase wymaga potwierdzenia e-maila. Aby wyłączyć (na potrzeby testów):
**Authentication → Settings → Email Confirmations → wyłącz**

### Usuwanie konta
Funkcja `delete_user_data()` usuwa wszystkie dane z tabel aplikacji.
Samo konto (`auth.users`) jest usuwane przez REST API Supabase z poziomu aplikacji.

### Bezpieczeństwo
- Każdy użytkownik widzi **tylko swoje dane** dzięki Row Level Security
- Klucz `anon` jest bezpieczny do użycia po stronie klienta — RLS chroni dane
- Nigdy nie używaj klucza `service_role` po stronie klienta
