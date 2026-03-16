export default function SupabaseSetup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">⚙️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Konfiguracja Supabase</h1>
          <p className="text-gray-500 text-sm mt-1">Skonfiguruj połączenie z bazą danych</p>
        </div>

        <div className="space-y-4 text-sm text-gray-700">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-semibold text-amber-800 mb-2">⚠️ Brak konfiguracji Supabase</p>
            <p className="text-amber-700">Uzupełnij plik <code className="bg-amber-100 px-1 rounded">.env</code> swoimi danymi z Supabase.</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="font-semibold text-gray-800">📋 Kroki konfiguracji:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>Utwórz projekt na <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-medium hover:underline">supabase.com</a></li>
              <li>Skopiuj <strong>Project URL</strong> i <strong>anon key</strong> z Settings → API</li>
              <li>Uzupełnij plik <code className="bg-gray-200 px-1 rounded">.env</code>:</li>
            </ol>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs mt-2 overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...`}
            </pre>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="font-semibold text-gray-800">🗄️ Utwórz tabele w Supabase SQL Editor:</p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre">{`-- Włącz RLS i utwórz tabele
create table families (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  name text default 'Wpisz nazwę rodziny',
  created_at timestamptz default now()
);
alter table families enable row level security;
create policy "own family" on families
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table transactions (
  id text primary key, user_id uuid references auth.users not null,
  type text, category text, description text,
  amount numeric, date text, added_by text,
  created_at timestamptz default now()
);
alter table transactions enable row level security;
create policy "own" on transactions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table tasks (
  id text primary key, user_id uuid references auth.users not null,
  title text, description text, assigned_to text,
  priority text, status text, due_date text,
  created_at timestamptz default now()
);
alter table tasks enable row level security;
create policy "own" on tasks
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table meals (
  id text primary key, user_id uuid references auth.users not null,
  name text, meal_label text, date text, ingredients text,
  created_at timestamptz default now()
);
alter table meals enable row level security;
create policy "own" on meals
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table vehicles (
  id text primary key, user_id uuid references auth.users not null,
  name text, brand text, model text, year int,
  license_plate text, vin text, fuel_type text,
  last_service text, next_service text,
  unlimited_inspection boolean default false,
  mileage int, insurance text, policy_number text,
  created_at timestamptz default now()
);
alter table vehicles enable row level security;
create policy "own" on vehicles
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table pets (
  id text primary key, user_id uuid references auth.users not null,
  name text, species text, breed text, age numeric,
  weight numeric, color text, vet text,
  last_visit text, next_visit text,
  no_next_visit boolean default false,
  vaccinations text, vaccinations_date text,
  deworming text, deworming_date text,
  tick_protection text, tick_protection_date text, notes text,
  created_at timestamptz default now()
);
alter table pets enable row level security;
create policy "own" on pets
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table members (
  id text primary key, user_id uuid references auth.users not null,
  name text, role text, age int, email text,
  phone text, avatar text, birthday text, responsibilities text,
  created_at timestamptz default now()
);
alter table members enable row level security;
create policy "own" on members
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table shopping_lists (
  id text primary key, user_id uuid references auth.users not null,
  name text, items jsonb default '[]',
  created_at timestamptz default now()
);
alter table shopping_lists enable row level security;
create policy "own" on shopping_lists
  using (auth.uid() = user_id) with check (auth.uid() = user_id);`}
            </pre>
          </div>

          <p className="text-center text-xs text-gray-400">Po uzupełnieniu <code>.env</code> uruchom ponownie aplikację.</p>
        </div>
      </div>
    </div>
  );
}
