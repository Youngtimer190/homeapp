# SQL do wklejenia w Supabase SQL Editor

## Krok 1 — Wklej to w SQL Editor i kliknij RUN:

```sql
-- Funkcja usuwająca wszystkie dane użytkownika z tabel aplikacji
CREATE OR REPLACE FUNCTION delete_user_data()
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
  DELETE FROM public.members       WHERE user_id = calling_user_id;
  DELETE FROM public.pets          WHERE user_id = calling_user_id;
  DELETE FROM public.vehicles      WHERE user_id = calling_user_id;
  DELETE FROM public.meals         WHERE user_id = calling_user_id;
  DELETE FROM public.tasks         WHERE user_id = calling_user_id;
  DELETE FROM public.transactions  WHERE user_id = calling_user_id;
  DELETE FROM public.families      WHERE user_id = calling_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user_data() TO authenticated;
```

## Krok 2 — Włącz usuwanie konta w Supabase Dashboard:

1. Wejdź w **Supabase Dashboard**
2. Kliknij **Authentication** w lewym menu
3. Kliknij **Providers** → przewiń na dół do sekcji **"User Management"** 
   LUB kliknij **Settings** (ikona zębatki przy Authentication)
4. Znajdź opcję **"Allow users to delete their own accounts"**
5. Włącz toggle → **Save**

To wszystko! Bez żadnego dodatkowego kodu ani Edge Function.
