# Konfiguracja Supabase

## Krok 1 — Zmienne środowiskowe

Utwórz plik `.env` w głównym folderze projektu:

```
VITE_SUPABASE_URL=https://TWOJ_PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Klucze znajdziesz w: **Supabase Dashboard → Settings → API**

---

## Krok 2 — Tabele i funkcje (SQL Editor)

Wejdź na **Supabase Dashboard → SQL Editor**, wklej poniższy kod i kliknij **Run**:

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
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
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

-- POLITYKI RLS (każdy widzi tylko swoje dane)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'families' AND policyname = 'families_policy') THEN
    CREATE POLICY families_policy ON public.families FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'transactions_policy') THEN
    CREATE POLICY transactions_policy ON public.transactions FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_policy') THEN
    CREATE POLICY tasks_policy ON public.tasks FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meals' AND policyname = 'meals_policy') THEN
    CREATE POLICY meals_policy ON public.meals FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'vehicles_policy') THEN
    CREATE POLICY vehicles_policy ON public.vehicles FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pets' AND policyname = 'pets_policy') THEN
    CREATE POLICY pets_policy ON public.pets FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'members' AND policyname = 'members_policy') THEN
    CREATE POLICY members_policy ON public.members FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shopping_lists' AND policyname = 'shopping_lists_policy') THEN
    CREATE POLICY shopping_lists_policy ON public.shopping_lists FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- TRIGGER: automatyczne tworzenie rekordu rodziny przy rejestracji
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

-- FUNKCJA: usuwanie danych użytkownika (wywoływana przez aplikację)
CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  calling_user_id uuid := auth.uid();
BEGIN
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Nie jesteś zalogowany';
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
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_data() TO authenticated;
```

---

## Krok 3 — Edge Function do usuwania konta (WAŻNE!)

Aby użytkownik mógł usunąć swoje konto z `auth.users`, musisz stworzyć Edge Function.

### 3a — Wejdź w Supabase Dashboard → Edge Functions → New Function

Nazwij ją: **`delete-user`**

### 3b — Wklej ten kod:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Pobierz token użytkownika z nagłówka
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Klient z tokenem użytkownika — żeby poznać jego ID
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Pobierz zalogowanego użytkownika
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Nie można zidentyfikować użytkownika" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Klient z service_role — ma uprawnienia do usuwania z auth.users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Usuń konto
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### 3c — Dodaj sekret `SUPABASE_SERVICE_ROLE_KEY`

W Supabase Dashboard → **Edge Functions → delete-user → Secrets**:
- Kliknij **Add secret**
- Nazwa: `SUPABASE_SERVICE_ROLE_KEY`
- Wartość: skopiuj z **Settings → API → service_role (secret)**

### 3d — Deploy

Kliknij **Deploy** — gotowe! ✅

---

## Podsumowanie

| Co robi | Gdzie |
|---|---|
| Tworzy tabele + RLS + trigger + funkcję | SQL Editor (Krok 2) |
| Usuwa dane użytkownika z tabel | `delete_user_data()` — SQL |
| Usuwa konto z auth.users | Edge Function `delete-user` (Krok 3) |
