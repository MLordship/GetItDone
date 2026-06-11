'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider } from '@/components/ui/Toast'
import { toast } from '@/components/ui/Toast'
import ThemeToggle from '@/components/ui/ThemeToggle'
import ContextMenu, { type ContextMenuItem } from './ContextMenu'
import type { Note, Folder } from '@/types/database'
import {
  Plus, FileText, Folder as FolderIcon, FolderOpen, ChevronLeft,
  ChevronRight, Trash2, FolderPlus, Home, Link2, MoreHorizontal,
} from 'lucide-react'
import { formatDateShort } from '@/lib/dateIt'

interface FolderNode extends Folder { children: FolderNode[] }
interface BacklinkNote { id: string; title: string }
interface MenuState { items: ContextMenuItem[]; position: { x: number; y: number } }

function buildTree(folders: Folder[], parentId: string | null = null): FolderNode[] {
  return folders
    .filter((f) => f.parent_id === parentId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => ({ ...f, children: buildTree(folders, f.id) }))
}

// Collect all descendant IDs to prevent circular moves
function descendantIds(folders: Folder[], id: string): string[] {
  const children = folders.filter((f) => f.parent_id === id)
  return [id, ...children.flatMap((c) => descendantIds(folders, c.id))]
}

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [backlinks, setBacklinks] = useState<BacklinkNote[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const activeNoteId = pathname.startsWith('/notes/') && pathname !== '/notes/new'
    ? pathname.replace('/notes/', '')
    : null

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: notesData }, { data: foldersData }] = await Promise.all([
      supabase.from('notes').select('id, title, folder_id, updated_at, created_at, user_id, content').order('updated_at', { ascending: false }),
      supabase.from('folders').select('*').order('name'),
    ])
    setNotes(notesData ?? [])
    setFolders(foldersData ?? [])
  }, [])

  const loadBacklinks = useCallback(async (noteId: string | null) => {
    if (!noteId) { setBacklinks([]); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('note_links')
      .select('source_id, notes!note_links_source_id_fkey(id, title)')
      .eq('target_id', noteId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bl = (data ?? []).map((row: any) => {
      const n = Array.isArray(row.notes) ? row.notes[0] : row.notes
      return n as BacklinkNote | null
    }).filter(Boolean) as BacklinkNote[]
    setBacklinks(bl)
  }, [])

  useEffect(() => {
    load()
    window.addEventListener('notes-updated', load)
    return () => window.removeEventListener('notes-updated', load)
  }, [load])

  useEffect(() => {
    loadBacklinks(activeNoteId)
  }, [activeNoteId, loadBacklinks])

  useEffect(() => {
    const handler = () => loadBacklinks(activeNoteId)
    window.addEventListener('notes-updated', handler)
    return () => window.removeEventListener('notes-updated', handler)
  }, [activeNoteId, loadBacklinks])

  // ── Folder actions ─────────────────────────────────────────────────────────

  async function createFolder(parentId: string | null = null) {
    const name = prompt('Nome cartella:')
    if (!name?.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('folders')
      .insert({ user_id: user.id, name: name.trim(), parent_id: parentId })
      .select('id')
      .single()
    if (data && parentId) setExpandedFolders((prev) => new Set([...prev, parentId]))
    load()
  }

  async function renameFolder(id: string, current: string) {
    const name = prompt('Nuovo nome:', current)
    if (!name?.trim() || name.trim() === current) return
    const supabase = createClient()
    await supabase.from('folders').update({ name: name.trim() }).eq('id', id)
    load()
  }

  async function moveFolder(id: string) {
    const invalid = new Set(descendantIds(folders, id))
    const options = [{ id: '', name: '— Nessuna cartella (root)' }, ...folders.filter((f) => !invalid.has(f.id))]
    const choice = prompt(
      `Sposta "${folders.find((f) => f.id === id)?.name}" in:\n` +
      options.map((o, i) => `${i}: ${o.name}`).join('\n') +
      '\n\nInserisci il numero:'
    )
    if (choice === null) return
    const idx = parseInt(choice)
    if (isNaN(idx) || idx < 0 || idx >= options.length) return
    const newParent = options[idx].id || null
    const supabase = createClient()
    await supabase.from('folders').update({ parent_id: newParent }).eq('id', id)
    if (newParent) setExpandedFolders((prev) => new Set([...prev, newParent]))
    load()
  }

  async function deleteFolder(id: string, name: string) {
    if (!confirm(`Eliminare la cartella "${name}"?\nLe note al suo interno verranno spostate nella root.`)) return
    const supabase = createClient()
    // Move child folders to root
    await supabase.from('folders').update({ parent_id: null }).eq('parent_id', id)
    // Unassign notes
    await supabase.from('notes').update({ folder_id: null }).eq('folder_id', id)
    await supabase.from('folders').delete().eq('id', id)
    if (selectedFolder === id) setSelectedFolder(null)
    load()
    toast(`Cartella "${name}" eliminata`)
  }

  // ── Note actions ────────────────────────────────────────────────────────────

  async function deleteNote(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Eliminare questa nota?')) return
    const supabase = createClient()
    await supabase.from('notes').delete().eq('id', id)
    if (activeNoteId === id) router.push('/notes/new')
    load()
  }

  async function moveNote(noteId: string) {
    const options = [{ id: '', name: '— Nessuna cartella (root)' }, ...folders]
    const choice = prompt(
      'Sposta nota in:\n' +
      options.map((o, i) => `${i}: ${o.name}`).join('\n') +
      '\n\nInserisci il numero:'
    )
    if (choice === null) return
    const idx = parseInt(choice)
    if (isNaN(idx) || idx < 0 || idx >= options.length) return
    const folderId = options[idx].id || null
    const supabase = createClient()
    await supabase.from('notes').update({ folder_id: folderId }).eq('id', noteId)
    load()
    window.dispatchEvent(new CustomEvent('notes-updated'))
    toast('Nota spostata')
  }

  // ── Context menus ───────────────────────────────────────────────────────────

  function openFolderMenu(e: React.MouseEvent, folder: Folder) {
    e.stopPropagation()
    e.preventDefault()
    setMenu({
      position: { x: e.clientX, y: e.clientY },
      items: [
        {
          label: 'Nuova sottocartella',
          icon: <FolderPlus size={14} />,
          onClick: () => createFolder(folder.id),
        },
        {
          label: 'Rinomina',
          icon: <FolderIcon size={14} />,
          onClick: () => renameFolder(folder.id, folder.name),
        },
        {
          label: 'Sposta in…',
          icon: <FolderOpen size={14} />,
          onClick: () => moveFolder(folder.id),
        },
        { label: '', separator: true, onClick: () => {} },
        {
          label: 'Elimina cartella',
          icon: <Trash2 size={14} />,
          danger: true,
          onClick: () => deleteFolder(folder.id, folder.name),
        },
      ],
    })
  }

  function openNoteMenu(e: React.MouseEvent, note: Note) {
    e.stopPropagation()
    e.preventDefault()
    setMenu({
      position: { x: e.clientX, y: e.clientY },
      items: [
        {
          label: 'Sposta in cartella…',
          icon: <FolderOpen size={14} />,
          onClick: () => moveNote(note.id),
        },
        { label: '', separator: true, onClick: () => {} },
        {
          label: 'Elimina nota',
          icon: <Trash2 size={14} />,
          danger: true,
          onClick: async () => {
            if (!confirm('Eliminare questa nota?')) return
            const supabase = createClient()
            await supabase.from('notes').delete().eq('id', note.id)
            if (activeNoteId === note.id) router.push('/notes/new')
            load()
          },
        },
      ],
    })
  }

  // ── Folder tree render ──────────────────────────────────────────────────────

  const tree = buildTree(folders)
  const visibleNotes = selectedFolder === null
    ? notes
    : notes.filter((n) => n.folder_id === selectedFolder)

  function FolderTreeNode({ node, depth = 0 }: { node: FolderNode; depth?: number }) {
    const isExpanded = expandedFolders.has(node.id)
    const isSelected = selectedFolder === node.id
    const hasChildren = node.children.length > 0
    const noteCount = notes.filter((n) => n.folder_id === node.id).length

    return (
      <div>
        <div
          className="group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer"
          style={{
            paddingLeft: `${8 + depth * 14}px`,
            background: isSelected ? 'var(--accent-soft)' : 'transparent',
          }}
          onClick={() => {
            setSelectedFolder(node.id)
            if (hasChildren) setExpandedFolders((prev) => {
              const next = new Set(prev)
              next.has(node.id) ? next.delete(node.id) : next.add(node.id)
              return next
            })
          }}
        >
          {hasChildren ? (
            <span style={{ color: 'var(--muted)' }}>
              {isExpanded ? <ChevronRight size={12} style={{ transform: 'rotate(90deg)' }} /> : <ChevronRight size={12} />}
            </span>
          ) : (
            <span style={{ width: 12, display: 'inline-block' }} />
          )}
          <FolderIcon size={13} style={{ color: isSelected ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }} />
          <span
            className="flex-1 text-xs font-medium truncate"
            style={{ color: isSelected ? 'var(--accent)' : 'var(--foreground)' }}
          >
            {node.name}
          </span>
          {noteCount > 0 && (
            <span className="text-[10px] shrink-0" style={{ color: 'var(--muted)' }}>{noteCount}</span>
          )}
          <button
            onClick={(e) => openFolderMenu(e, node)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded shrink-0"
            style={{ color: 'var(--muted)' }}
          >
            <MoreHorizontal size={13} />
          </button>
        </div>
        {isExpanded && node.children.map((child) => (
          <FolderTreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        className={`flex flex-col shrink-0 border-r transition-all duration-200 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            <Home size={14} style={{ color: 'var(--muted)' }} />
            Notes
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => createFolder(null)} title="Nuova cartella" className="p-1.5 rounded-lg hover:bg-[var(--border)]" style={{ color: 'var(--muted)' }}>
              <FolderPlus size={15} />
            </button>
            <button onClick={() => router.push('/notes/new')} title="Nuova nota" className="p-1.5 rounded-lg" style={{ background: 'var(--accent)', color: '#fff' }}>
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* All notes filter */}
        <div className="px-2 pt-2 shrink-0">
          <button
            onClick={() => setSelectedFolder(null)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: selectedFolder === null ? 'var(--accent-soft)' : 'transparent',
              color: selectedFolder === null ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            <FileText size={13} />
            Tutte le note
            <span className="ml-auto text-[10px]">{notes.length}</span>
          </button>
        </div>

        {/* Folder tree */}
        {tree.length > 0 && (
          <div className="px-2 pt-1 shrink-0">
            {tree.map((node) => (
              <FolderTreeNode key={node.id} node={node} />
            ))}
            <div className="mt-2 border-t" style={{ borderColor: 'var(--border)' }} />
          </div>
        )}

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1">
          {visibleNotes.length === 0 ? (
            <p className="text-xs px-2 py-4 text-center" style={{ color: 'var(--muted)' }}>Nessuna nota</p>
          ) : (
            visibleNotes.map((note) => {
              const active = note.id === activeNoteId
              return (
                <div key={note.id} className="group relative">
                  <Link
                    href={`/notes/${note.id}`}
                    className="flex items-start gap-2 px-2 py-2.5 rounded-lg pr-8"
                    style={{
                      background: active ? 'var(--accent-soft)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--foreground)',
                      display: 'flex',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{note.title || 'Senza titolo'}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {formatDateShort(note.updated_at)}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => openNoteMenu(e, note)}
                    className="absolute right-1.5 top-2.5 opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                    style={{ color: 'var(--muted)' }}
                  >
                    <MoreHorizontal size={13} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Backlinks */}
        {activeNoteId && backlinks.length > 0 && (
          <div className="px-2 pb-2 border-t pt-2 shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 px-2 pb-1">
              <Link2 size={12} style={{ color: 'var(--muted)' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Collegata da {backlinks.length}
              </span>
            </div>
            {backlinks.map((bl) => (
              <Link
                key={bl.id}
                href={`/notes/${bl.id}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
                style={{ color: 'var(--foreground)' }}
              >
                <div className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                <span className="truncate">{bl.title}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom */}
        <div className="px-3 pb-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute top-3 left-3 z-10 p-1.5 rounded-lg border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}
          title={sidebarOpen ? 'Nascondi sidebar' : 'Mostra sidebar'}
        >
          <ChevronLeft size={14} style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
        </button>
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>

      {menu && (
        <ContextMenu
          items={menu.items}
          position={menu.position}
          onClose={() => setMenu(null)}
        />
      )}
      <ToastProvider />
    </div>
  )
}
