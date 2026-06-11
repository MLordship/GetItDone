-- Bidirectional note links

create table if not exists note_links (
  source_id uuid not null references notes(id) on delete cascade,
  target_id uuid not null references notes(id) on delete cascade,
  primary key (source_id, target_id)
);

alter table note_links enable row level security;

-- Legge solo i link dove l'utente possiede almeno la nota source
create policy "note_links: readable by owner" on note_links
  for select using (
    exists (select 1 from notes where notes.id = source_id and notes.user_id = auth.uid())
  );

create policy "note_links: writable by owner" on note_links
  for all using (
    exists (select 1 from notes where notes.id = source_id and notes.user_id = auth.uid())
  ) with check (
    exists (select 1 from notes where notes.id = source_id and notes.user_id = auth.uid())
  );

create index note_links_source_idx on note_links(source_id);
create index note_links_target_idx on note_links(target_id);
