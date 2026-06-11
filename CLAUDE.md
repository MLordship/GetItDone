# GetItDone — GTD Personal Productivity App

## Progetto
Applicazione web per la gestione personale secondo la metodologia **GTD (Getting Things Done)**.
Consultabile da desktop e mobile. Accesso protetto tramite autenticazione.

## Stack
- **Next.js 16** (App Router, `src/` directory) + TypeScript — usa `src/proxy.ts` (non middleware.ts, deprecato in v16)
- **Tailwind CSS v4**
- **Supabase** — PostgreSQL database + Auth (email/password + password reset)
- **Netlify** — deploy

## Architettura Auth
- Supabase Auth con **email/password** (+ flusso reset password via email)
- **Row Level Security (RLS)** su tutte le tabelle: ogni utente vede solo i propri dati
- `src/proxy.ts` reindirizza al login se non autenticato (sostituisce middleware.ts, deprecato in v16)
- `src/app/auth/callback/route.ts` gestisce sia PKCE (`?code=`) che OTP (`?token_hash=`)
- Cookie scritti direttamente sulla `NextResponse.redirect()` nel callback (non via `next/headers`)
- Progettato per multi-utente fin dall'inizio

## Schema Database

### `areas` — Aree di responsabilità
| colonna | tipo | note |
|---------|------|------|
| id | uuid PK | |
| user_id | uuid FK | auth.users |
| name | text | es. "Lavoro", "Personale" |
| color | text | hex color per UI |
| created_at | timestamptz | |

### `projects` — Progetti
| colonna | tipo | note |
|---------|------|------|
| id | uuid PK | |
| user_id | uuid FK | |
| area_id | uuid FK nullable | → areas |
| title | text | |
| description | text | |
| status | text | active \| completed \| someday |
| due_date | date nullable | |
| created_at | timestamptz | |

### `actions` — Tutte le azioni GTD
| colonna | tipo | note |
|---------|------|------|
| id | uuid PK | |
| user_id | uuid FK | |
| project_id | uuid FK nullable | → projects |
| area_id | uuid FK nullable | → areas |
| title | text | |
| notes | text | |
| type | text | next_action \| waiting_for \| someday_maybe \| scheduled |
| context | text nullable | @casa, @lavoro, @telefono, @computer... |
| scheduled_at | timestamptz nullable | per tipo scheduled |
| delegated_to | text nullable | per waiting_for |
| completed | boolean | default false |
| completed_at | timestamptz nullable | |
| created_at | timestamptz | |

### `inbox` — Cattura rapida
| colonna | tipo | note |
|---------|------|------|
| id | uuid PK | |
| user_id | uuid FK | |
| title | text | |
| notes | text | |
| created_at | timestamptz | |

## Struttura multi-app
L'app è organizzata come una suite di micro-app sotto-route. La root `/` è una landing page che mostra le app disponibili.

| App | Prefisso | Route file |
|-----|----------|------------|
| GTD | `/gtd/` | `src/app/gtd/` |
| Notes (futuro) | `/notes/` | `src/app/notes/` |

Auth e layout globale restano condivisi (`/login`, `/auth/`, `src/app/layout.tsx`).

## Viste dell'app GTD
| Percorso | Descrizione |
|----------|-------------|
| `/` | Landing page — selezione app |
| `/gtd` | Redirect a `/gtd/dashboard` |
| `/gtd/inbox` | Cattura rapida, svuota inbox — modifica inline titolo/note |
| `/gtd/projects` | Lista progetti per area con filtro |
| `/gtd/projects/[id]` | Dettaglio progetto: azioni, completamento, sezione completate collassabile |
| `/gtd/next-actions` | Azioni prossime, filtro contesto/area |
| `/gtd/calendar` | Vista mensile azioni schedulate, lunedì come primo giorno |
| `/gtd/waiting` | In attesa / delegato |
| `/gtd/someday` | Prima o poi |
| `/gtd/weekly-review` | Checklist guidata GTD settimanale in 7 step con dati reali |
| `/gtd/gtd-flow` | Diagramma di flusso GTD interattivo in italiano |
| `/gtd/settings` | Aree, contesti, profilo |
| `/login` | Login email/password + reset password |
| `/auth/reset` | Pagina cambio password dopo reset |

## Principi UI/UX
- **Mobile-first**: navigazione bottom bar su mobile (5 voci), sidebar su desktop (`w-64`)
- Design pulito e minimalista con CSS custom properties (`--background`, `--surface`, `--accent`, ecc.)
- **Dark mode**: classe `.dark` sull'`<html>`, 3 opzioni (Chiaro/Auto/Scuro) persistite in `localStorage`; script inline nel `<head>` previene il flash al caricamento
- Cattura rapida inbox accessibile ovunque (FAB su mobile, pulsante sidebar su desktop)
- Navigazione istantanea: `loading.tsx` + client-side fetching con `useEffect`
- Toast feedback (`src/components/ui/Toast.tsx`) — singleton, chiamabile con `toast('messaggio')`
- Aggiornamenti cross-componente via `CustomEvent` (es. `inbox-updated` dopo quick capture)
- Top bar desktop con titolo pagina corrente + ricerca ⌘K
- Contenuto centrato `max-w-3xl` su schermi larghi (gestito da `AppLayout`, non dai singoli componenti)
- Badge inbox count in tempo reale nella sidebar e nel bottom nav mobile

## Layout desktop
- Sidebar: `w-64`, sezione principale (Dashboard→Calendario) + sezione "Raccolta" (In attesa, Prima o poi, Review)
- Top bar: titolo pagina + pulsante ricerca ⌘K
- Contenuto: `max-w-3xl mx-auto` — **non aggiungere ulteriori max-width nei componenti figli**
- Dashboard: griglia `3×2` di stat card a sinistra + pannello 300px con alert e link rapidi a destra

## App Notes
Route: `src/app/notes/` — layout dedicato `NotesLayout`, senza AppLayout GTD.

| Percorso | Descrizione |
|----------|-------------|
| `/notes` | Redirect a `/notes/new` |
| `/notes/new` | Crea nota vuota e redirect all'id |
| `/notes/[id]` | Editor nota (Tiptap WYSIWYG + MD) |

**Dipendenze**: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-markdown`, `@tiptap/extension-placeholder`, `@tiptap/extension-typography`

**Schema**: tabelle `notes` e `folders` con RLS. Vedere `supabase/migrations/20260611_notes.sql`.

**Salvataggio**: auto-save con debounce 1s dopo ogni modifica. Dispatch `notes-updated` per aggiornare la sidebar.

**Export**: bottone toolbar esporta il contenuto come file `.md`.

## Convenzioni codice
- Componenti UI in `src/components/`
- Client Supabase in `src/lib/supabase/` — **senza generic `<Database>`** (causa `never` con `moduleResolution: "bundler"`)
- Tipi in `src/types/database.ts` — interfacce flat (Area, Project, Action, InboxItem)
- Formattazione date in italiano: usare `src/lib/dateIt.ts` — **mai** `toLocaleDateString`/`toLocaleTimeString` (dipende dalla lingua del browser)
- Theme hook: `src/lib/useTheme.ts` — esporta `useTheme()` con `{ theme, setTheme }`
- `PageHeader`: non passare `subtitle=" "` come spacer — viene ignorato se vuoto; su desktop titolo `text-2xl`
- Nessun commento salvo per logica non ovvia

## Aggiornamento CLAUDE.md
Aggiorna questo file ad ogni modifica significativa: nuove route, cambi schema, nuove dipendenze, decisioni architetturali rilevanti.
