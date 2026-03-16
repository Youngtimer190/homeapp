# Konfiguracja Supabase — Dom Manager

## Krok 1 — Zmienne środowiskowe

Utwórz plik `.env` w głównym folderze projektu:

```
VITE_SUPABASE_URL=https://TWOJ_PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Wszystkie 3 klucze znajdziesz w:
**Supabase Dashboard → Project Settings → API**
- `VITE_SUPABASE_URL` → **Project URL**
- `VITE_SUPABASE_ANON_KEY` → **anon / public**
- `VITE_SUPABASE_SERVICE_ROLE_KEY` → **service_role / secret** ⚠️ (potrzebny do usuwania konta)

---

## Krok 2 — SQL Editor

Wejdź w **Supabase Dashboard → SQL Editor**, wklej poniższy SQL i kliknij **Run**:

```sql
-- TABELE

CREATE TABLE IF NOT EXISTS public.families (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  family_name text DEFAULT 'Wpisz nazwę rodziny',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  description text,
  category text,
  date text,
  added_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  date text,
  meal_label text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text,
  species text,
  breed text,
  birth_date text,
  weight text,
  next_vet_visit text,
  no_next_visit boolean DEFAULT false,
  vaccination_name text,
  vaccination_date text,
  deworming_name text,
  deworming_date text,
  tick_protection_name text,
  tick_protection_date text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text,
  role text,
  birth_date text,
  duties text[],
  avatar text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text,
  items jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- ROW LEVEL SECURITY

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- POLITYKI RLS

CREATE POLICY "Użytkownik widzi tylko swoje dane" ON public.families FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Użytkownik widzi tylko swoje dane" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Użytkownik widzi tylko swoje dane" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Użytkownik widzi tylko swoje dane" ON public.meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Użytkownik widzi tylko swoje dane" ON public.vehicles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Użytkownik widzi tylko swoje dane" ON public.pets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Użytkownik widzi tylko swoje dane" ON public.members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Użytkownik widzi tylko swoje dane" ON public.shopping_lists FOR ALL USING (auth.uid() = user_id);

-- TRIGGER — automatyczne tworzenie rekordu rodziny przy rejestracji

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.families (user_id, family_name)
  VALUES (new.id, 'Wpisz nazwę rodziny')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FUNKCJA usuwania danych użytkownika (wywoływana przez aplikację przed usunięciem konta)

CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user_id uuid;
BEGIN
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak autoryzacji';
  END IF;
  DELETE FROM public.shopping_lists WHERE user_id = calling_user_id;
  DELETE FROM public.members        WHERE user_id = calling_user_id;
  DELETE FROM public.pets           WHERE user_id = calling_user_id;
  DELETE FROM public.vehicles       WHERE user_id = calling_user_id;
  DELETE FROM public.meals          WHERE user_id = calling_user_id;
  DELETE FROM public.tasks          WHERE user_id = calling_user_id;
  DELETE FROM public.transactions   WHERE user_id = calling_user_id;
  DELETE FROM public.families       WHERE user_id = calling_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_data() TO authenticated;
```

---

## Jak działa usuwanie konta

Aplikacja używa **dwóch klientów Supabase**:
1. `anon key` — do normalnych operacji (odczyt/zapis danych)
2. `service_role key` — **tylko do usunięcia konta** (`auth.admin.deleteUser()`)

Klucz `service_role` jest przechowywany w zmiennej środowiskowej `VITE_SUPABASE_SERVICE_ROLE_KEY` i nigdy nie trafia do publicznego repozytorium (plik `.env` jest w `.gitignore`).

**Kolejność operacji przy usuwaniu konta:**
1. Weryfikacja hasła użytkownika
2. `delete_user_data()` — usuwa dane ze wszystkich 8 tabel
3. `supabaseAdmin.auth.admin.deleteUser(userId)` — usuwa konto z `auth.users`
4. Automatyczne wylogowanie
