# Konfiguracja Supabase — Dom Manager

## 1. Utwórz projekt w Supabase
Wejdź na https://supabase.com i utwórz nowy projekt.

## 2. Skonfiguruj zmienne środowiskowe
Utwórz plik `.env` w głównym katalogu projektu:
```
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj-anon-key
```

Klucze znajdziesz w: **Project Settings → API**

---

## 3. Uruchom SQL — Tabele, RLS i funkcje

Wejdź w **SQL Editor** w panelu Supabase i wklej poniższy kod:

```sql
-- ============================================================
-- TABELE
-- ============================================================

CREATE TABLE IF NOT EXISTS families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  family_name TEXT DEFAULT 'Wpisz nazwę rodziny',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  category TEXT,
  date TEXT,
  added_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  status TEXT,
  assigned_to TEXT,
  due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  meal_label TEXT,
  date TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year TEXT,
  fuel_type TEXT,
  vin TEXT,
  policy_number TEXT,
  last_inspection TEXT,
  next_inspection TEXT,
  unlimited_inspection BOOLEAN DEFAULT FALSE,
  insurance_expiry TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  age TEXT,
  weight TEXT,
  vaccine_name TEXT,
  vaccine_date TEXT,
  deworming_name TEXT,
  deworming_date TEXT,
  tick_name TEXT,
  tick_date TEXT,
  next_vet_visit TEXT,
  no_next_visit BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  age TEXT,
  birthday TEXT,
  avatar TEXT,
  duties TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
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
-- FUNKCJA USUWANIA DANYCH UŻYTKOWNIKA
-- ============================================================
-- Usuwa wszystkie dane użytkownika z tabel aplikacji.
-- Samo konto (auth.users) jest usuwane osobno przez aplikację.

CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_uid UUID;
BEGIN
  current_uid := auth.uid();

  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Brak autoryzacji';
  END IF;

  DELETE FROM shopping_lists WHERE user_id = current_uid;
  DELETE FROM members WHERE user_id = current_uid;
  DELETE FROM pets WHERE user_id = current_uid;
  DELETE FROM vehicles WHERE user_id = current_uid;
  DELETE FROM meals WHERE user_id = current_uid;
  DELETE FROM tasks WHERE user_id = current_uid;
  DELETE FROM transactions WHERE user_id = current_uid;
  DELETE FROM families WHERE user_id = current_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user_data() TO authenticated;

-- ============================================================
-- TRIGGER — automatyczne tworzenie rodziny przy rejestracji
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.families (user_id, family_name)
  VALUES (NEW.id, 'Wpisz nazwę rodziny')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 4. Włącz usuwanie konta przez użytkownika

Supabase nie pozwala zwykłemu użytkownikowi usunąć własnego konta przez standardowe API — wymaga to klucza `service_role`. Dlatego należy włączyć tę opcję w ustawieniach:

**Authentication → Policies → Allow users to delete their own accounts → włącz**

Lub wklej ten SQL:

```sql
-- Pozwól użytkownikom usuwać własne konta
CREATE OR REPLACE FUNCTION auth.delete_user()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;
```

---

## 5. Opcjonalne — wyłącz potwierdzenie e-mail (dla testów)

W panelu Supabase: **Authentication → Email → Confirm email → wyłącz**

Dzięki temu użytkownicy są od razu zalogowani po rejestracji.

---

## 6. Sprawdź konfigurację

Po wykonaniu powyższych kroków:
1. ✅ Użytkownicy mogą się rejestrować i logować
2. ✅ Każda rodzina ma izolowane dane (RLS)
3. ✅ Nowa rejestracja = nowa pusta przestrzeń dla rodziny
4. ✅ Trigger automatycznie tworzy rodzinę przy rejestracji
5. ✅ Użytkownik może usunąć swoje konto i wszystkie dane
6. ✅ Synchronizacja między urządzeniami działa automatycznie
