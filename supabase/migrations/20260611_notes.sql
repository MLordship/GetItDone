-- Notes app schema

create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  title text not null default 'Senza titolo',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table folders enable row level security;
alter table notes enable row level security;

create policy "folders: own rows" on folders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes: own rows" on notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();

-- Indexes
create index notes_user_id_idx on notes(user_id);
create index notes_folder_id_idx on notes(folder_id);
create index notes_updated_at_idx on notes(updated_at desc);
create index folders_user_id_idx on folders(user_id);
