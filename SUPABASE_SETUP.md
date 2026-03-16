# Konfiguracja Supabase

## Krok 1 — Zmienne środowiskowe

Utwórz plik `.env` w głównym folderze projektu:

```
VITE_SUPABASE_URL=https://TWOJ_PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Klucze znajdziesz w: **Supabase Dashboard → Project Settings → API**

---

## Krok 2 — Wklej SQL w Supabase Dashboard → SQL Editor → Run

```sql
-- =============================================
-- ROZSZERZENIA
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- =============================================
-- TABELE
-- =============================================

CREATE TABLE IF NOT EXISTS public.families (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  family_name text DEFAULT 'Wpisz nazwę rodziny',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  description text,
  category text,
  type text,
  date text,
  added_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  priority text,
  status text,
  assigned_to text,
  due_date text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  date text,
  meal_type text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  make text,
  model text,
  year text,
  fuel text,
  vin text,
  policy_number text,
  last_inspection text,
  next_inspection text,
  unlimited_inspection boolean DEFAULT false,
  insurance_expiry text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pets (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  species text,
  breed text,
  age text,
  weight text,
  vaccination_name text,
  vaccination_date text,
  deworming_name text,
  deworming_date text,
  tick_protection_name text,
  tick_protection_date text,
  next_vet_visit text,
  no_next_visit boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text,
  birth_date text,
  duties text[],
  avatar text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  items jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.families       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- Families
DROP POLICY IF EXISTS "families_policy" ON public.families;
CREATE POLICY "families_policy" ON public.families
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "transactions_policy" ON public.transactions;
CREATE POLICY "transactions_policy" ON public.transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tasks
DROP POLICY IF EXISTS "tasks_policy" ON public.tasks;
CREATE POLICY "tasks_policy" ON public.tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Meals
DROP POLICY IF EXISTS "meals_policy" ON public.meals;
CREATE POLICY "meals_policy" ON public.meals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vehicles
DROP POLICY IF EXISTS "vehicles_policy" ON public.vehicles;
CREATE POLICY "vehicles_policy" ON public.vehicles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pets
DROP POLICY IF EXISTS "pets_policy" ON public.pets;
CREATE POLICY "pets_policy" ON public.pets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Members
DROP POLICY IF EXISTS "members_policy" ON public.members;
CREATE POLICY "members_policy" ON public.members
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shopping Lists
DROP POLICY IF EXISTS "shopping_lists_policy" ON public.shopping_lists;
CREATE POLICY "shopping_lists_policy" ON public.shopping_lists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGER: automatyczne tworzenie rodziny
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNKCJA: usuwanie konta użytkownika
-- Używa pg_net do wywołania Supabase Admin API
-- =============================================

CREATE OR REPLACE FUNCTION public.delete_user_account(user_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  calling_user_id uuid;
  project_url text;
  service_key text;
BEGIN
  -- Pobierz ID zalogowanego użytkownika
  calling_user_id := auth.uid();

  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak autoryzacji';
  END IF;

  -- Usuń wszystkie dane użytkownika z tabel aplikacji
  DELETE FROM public.shopping_lists WHERE user_id = calling_user_id;
  DELETE FROM public.members        WHERE user_id = calling_user_id;
  DELETE FROM public.pets           WHERE user_id = calling_user_id;
  DELETE FROM public.vehicles       WHERE user_id = calling_user_id;
  DELETE FROM public.meals          WHERE user_id = calling_user_id;
  DELETE FROM public.tasks          WHERE user_id = calling_user_id;
  DELETE FROM public.transactions   WHERE user_id = calling_user_id;
  DELETE FROM public.families       WHERE user_id = calling_user_id;

  -- Pobierz URL projektu i service_role key z ustawień Supabase
  SELECT current_setting('app.supabase_url', true)    INTO project_url;
  SELECT current_setting('app.service_role_key', true) INTO service_key;

  -- Wywołaj Admin API przez pg_net żeby usunąć konto z auth.users
  IF project_url IS NOT NULL AND service_key IS NOT NULL THEN
    PERFORM net.http_delete(
      url := project_url || '/auth/v1/admin/users/' || calling_user_id::text,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_key,
        'apikey', service_key
      )
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account(text) TO authenticated;

-- =============================================
-- USTAW ZMIENNE KONFIGURACYJNE
-- Zastąp wartości swoimi danymi z:
-- Supabase Dashboard → Project Settings → API
-- =============================================

ALTER DATABASE postgres SET app.supabase_url = 'WKLEJ_TUTAJ_SWOJ_SUPABASE_URL';
ALTER DATABASE postgres SET app.service_role_key = 'WKLEJ_TUTAJ_SWOJ_SERVICE_ROLE_KEY';
```

---

## Ważne — uzupełnij zmienne przed uruchomieniem SQL

W ostatnich 2 liniach SQL zastąp:
- `WKLEJ_TUTAJ_SWOJ_SUPABASE_URL` → np. `https://abcdefgh.supabase.co`
- `WKLEJ_TUTAJ_SWOJ_SERVICE_ROLE_KEY` → klucz `service_role` z **Project Settings → API**

**Klucz `service_role` jest tajny** — nie umieszczaj go w kodzie aplikacji ani w `.env` po stronie frontendu. Jest bezpieczny tylko w konfiguracji bazy danych Supabase.
