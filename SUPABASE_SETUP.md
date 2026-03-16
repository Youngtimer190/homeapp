# Konfiguracja Supabase

## Krok 1 — Zmienne środowiskowe

Utwórz plik `.env` w głównym katalogu projektu:

```
VITE_SUPABASE_URL=https://TWOJ_PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJTWOJ_ANON_KEY
```

Klucze znajdziesz w: Supabase Dashboard → Settings → API

---

## Krok 2 — SQL (wklej w całości w SQL Editor → Run)

Supabase Dashboard → SQL Editor → New Query → wklej poniższy kod → kliknij RUN

```sql
-- =============================================
-- TABELE
-- =============================================

CREATE TABLE IF NOT EXISTS public.families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  family_name TEXT DEFAULT 'Wpisz nazwę rodziny',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  category TEXT,
  date TEXT,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  status TEXT,
  assigned_to TEXT,
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date TEXT,
  meal_label TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  make TEXT,
  model TEXT,
  year TEXT,
  fuel TEXT,
  vin TEXT,
  policy_number TEXT,
  insurance_date TEXT,
  last_inspection TEXT,
  next_inspection TEXT,
  unlimited_inspection BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  species TEXT,
  breed TEXT,
  age TEXT,
  weight TEXT,
  next_vet_visit TEXT,
  no_next_visit BOOLEAN DEFAULT FALSE,
  vaccination_name TEXT,
  vaccination_date TEXT,
  deworming_name TEXT,
  deworming_date TEXT,
  tick_protection_name TEXT,
  tick_protection_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  role TEXT,
  age TEXT,
  birthday TEXT,
  avatar TEXT,
  duties TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- Families
DROP POLICY IF EXISTS "families_select" ON public.families;
DROP POLICY IF EXISTS "families_insert" ON public.families;
DROP POLICY IF EXISTS "families_update" ON public.families;
DROP POLICY IF EXISTS "families_delete" ON public.families;
CREATE POLICY "families_select" ON public.families FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "families_insert" ON public.families FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "families_update" ON public.families FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "families_delete" ON public.families FOR DELETE USING (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Tasks
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Meals
DROP POLICY IF EXISTS "meals_select" ON public.meals;
DROP POLICY IF EXISTS "meals_insert" ON public.meals;
DROP POLICY IF EXISTS "meals_update" ON public.meals;
DROP POLICY IF EXISTS "meals_delete" ON public.meals;
CREATE POLICY "meals_select" ON public.meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "meals_insert" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meals_update" ON public.meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "meals_delete" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- Vehicles
DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete" ON public.vehicles;
CREATE POLICY "vehicles_select" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vehicles_insert" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vehicles_update" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "vehicles_delete" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- Pets
DROP POLICY IF EXISTS "pets_select" ON public.pets;
DROP POLICY IF EXISTS "pets_insert" ON public.pets;
DROP POLICY IF EXISTS "pets_update" ON public.pets;
DROP POLICY IF EXISTS "pets_delete" ON public.pets;
CREATE POLICY "pets_select" ON public.pets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pets_insert" ON public.pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pets_update" ON public.pets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pets_delete" ON public.pets FOR DELETE USING (auth.uid() = user_id);

-- Members
DROP POLICY IF EXISTS "members_select" ON public.members;
DROP POLICY IF EXISTS "members_insert" ON public.members;
DROP POLICY IF EXISTS "members_update" ON public.members;
DROP POLICY IF EXISTS "members_delete" ON public.members;
CREATE POLICY "members_select" ON public.members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "members_insert" ON public.members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_update" ON public.members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "members_delete" ON public.members FOR DELETE USING (auth.uid() = user_id);

-- Shopping Lists
DROP POLICY IF EXISTS "shopping_select" ON public.shopping_lists;
DROP POLICY IF EXISTS "shopping_insert" ON public.shopping_lists;
DROP POLICY IF EXISTS "shopping_update" ON public.shopping_lists;
DROP POLICY IF EXISTS "shopping_delete" ON public.shopping_lists;
CREATE POLICY "shopping_select" ON public.shopping_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shopping_insert" ON public.shopping_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shopping_update" ON public.shopping_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shopping_delete" ON public.shopping_lists FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- TRIGGER: automatyczne tworzenie rodziny
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNKCJA: usuwanie danych użytkownika
-- =============================================

CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user_id UUID;
BEGIN
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak zalogowanego użytkownika';
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
```

---

## Krok 3 — Edge Function do usunięcia konta (WYMAGANE do działania "Usuń konto")

Supabase nie pozwala usunąć konta z poziomu przeglądarki bez `service_role`.
Jedyna pewna metoda to Edge Function. Oto jak ją stworzyć:

### 3a. Zainstaluj Supabase CLI
```bash
npm install -g supabase
```

### 3b. Zaloguj się i połącz z projektem
```bash
supabase login
supabase link --project-ref TWOJ_PROJECT_REF
```
`TWOJ_PROJECT_REF` znajdziesz w URL: `https://supabase.com/dashboard/project/TUTAJ`

### 3c. Utwórz Edge Function
```bash
supabase functions new delete-account
```

### 3d. Wklej ten kod do pliku `supabase/functions/delete-account/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Klient z tokenem użytkownika (żeby pobrać user_id)
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Pobierz zalogowanego użytkownika
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Brak autoryzacji' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Klient z service_role (może usuwać konta)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Usuń konto użytkownika
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### 3e. Ustaw sekret SUPABASE_SERVICE_ROLE_KEY
W Supabase Dashboard → Settings → API → skopiuj **service_role key (secret)**

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJTWOJ_SERVICE_ROLE_KEY
```

### 3f. Wdróż Edge Function
```bash
supabase functions deploy delete-account
```

---

## Gotowe! ✅

Po wykonaniu wszystkich kroków:
- Rejestracja → nowa pusta przestrzeń rodziny
- Wszystkie dane synchronizują się między urządzeniami
- Usunięcie konta → usuwa dane + konto z auth.users
