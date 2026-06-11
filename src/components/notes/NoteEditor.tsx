'use client'

import { useEffect, useState, useRef, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Note, Folder } from '@/types/database'
import { toast } from '@/components/ui/Toast'
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { Markdown, type MarkdownStorage } from 'tiptap-markdown'
import { WikiLinkDecorator } from './extensions/WikiLinkDecorator'
import { WikiLinkSuggestion } from './extensions/WikiLinkSuggestion'
import WikiLinkList, { type NoteRef, type WikiLinkListRef } from './WikiLinkList'
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Undo, Redo, Download, FolderOpen, Home,
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  paramsPromise: Promise<{ id: string }>
}

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g

export default function NoteEditor({ paramsPromise }: Props) {
  const { id } = use(paramsPromise)
  const [note, setNote] = useState<Note | null>(null)
  const [allNotes, setAllNotes] = useState<NoteRef[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const allNotesRef = useRef<NoteRef[]>([])
  const router = useRouter()

  // Keep ref in sync for use inside suggestion closure
  useEffect(() => { allNotesRef.current = allNotes }, [allNotes])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Inizia a scrivere… digita [[ per collegare una nota' }),
      Typography,
      Markdown.configure({ html: false, transformPastedText: true }),
      WikiLinkDecorator,
      WikiLinkSuggestion.configure({
        suggestion: {
          char: '[[',
          items: ({ query }: { query: string }) =>
            allNotesRef.current
              .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()) && n.id !== id)
              .slice(0, 10),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          command: ({ editor, range, props }: any) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent(`[[${(props as NoteRef).title}]] `)
              .run()
          },
          render: () => {
            let component: ReactRenderer<WikiLinkListRef> | null = null
            let popupEl: HTMLDivElement | null = null

            return {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onStart(props: any) {
                popupEl = document.createElement('div')
                popupEl.style.cssText =
                  'position:fixed;z-index:9999;min-width:220px;max-height:280px;overflow:auto;border-radius:10px;border:1px solid var(--border);background:var(--surface);box-shadow:0 8px 24px rgba(0,0,0,.12)'
                document.body.appendChild(popupEl)

                component = new ReactRenderer(WikiLinkList, { props, editor: props.editor })
                popupEl.appendChild(component.element)

                const rect = props.clientRect?.()
                if (rect) {
                  popupEl.style.top = `${rect.bottom + 6}px`
                  popupEl.style.left = `${rect.left}px`
                }
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onUpdate(props: any) {
                component?.updateProps(props)
                const rect = props.clientRect?.()
                if (rect && popupEl) {
                  popupEl.style.top = `${rect.bottom + 6}px`
                  popupEl.style.left = `${rect.left}px`
                }
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popupEl?.remove(); component?.destroy(); return true
                }
                return component?.ref?.onKeyDown(props) ?? false
              },
              onExit() {
                popupEl?.remove(); component?.destroy()
                popupEl = null; component = null
              },
            }
          },
        },
      }),
    ],
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none outline-none min-h-full px-8 py-6' },
    },
    onUpdate: ({ editor }) => {
      scheduleSave(title, getMarkdown(editor))
    },
  })

  // Navigate to note on wiki-link click
  useEffect(() => {
    async function handleWikiClick(e: Event) {
      const { title: linkTitle } = (e as CustomEvent<{ title: string }>).detail
      const supabase = createClient()
      const { data } = await supabase
        .from('notes')
        .select('id')
        .ilike('title', linkTitle)
        .limit(1)
        .single()
      if (data) router.push(`/notes/${data.id}`)
      else toast(`Nota "${linkTitle}" non trovata`)
    }
    window.addEventListener('wiki-link-click', handleWikiClick)
    return () => window.removeEventListener('wiki-link-click', handleWikiClick)
  }, [router])

  const loadNotes = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('notes').select('id, title').order('title')
    setAllNotes((data ?? []) as NoteRef[])
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: noteData }, { data: foldersData }] = await Promise.all([
        supabase.from('notes').select('*').eq('id', id).single(),
        supabase.from('folders').select('*').order('name'),
      ])
      if (!noteData) { router.replace('/notes/new'); return }
      setNote(noteData)
      setTitle(noteData.title)
      setFolders(foldersData ?? [])
      if (editor) editor.commands.setContent(noteData.content || '')
    }
    if (editor) load()
  }, [id, editor, router])

  useEffect(() => { loadNotes() }, [loadNotes])

  function getMarkdown(ed: typeof editor): string {
    if (!ed) return ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((ed.storage as any).markdown as MarkdownStorage).getMarkdown()
  }

  function scheduleSave(t: string, content: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(t, content), 1000)
  }

  async function save(t: string, content: string) {
    if (!note) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('notes').update({ title: t, content }).eq('id', note.id)
    await saveLinks(note.id, content)
    setSaving(false)
    window.dispatchEvent(new CustomEvent('notes-updated'))
  }

  async function saveLinks(sourceId: string, content: string) {
    const supabase = createClient()
    // Extract all [[title]] from content
    const titles: string[] = []
    WIKI_LINK_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = WIKI_LINK_RE.exec(content)) !== null) titles.push(m[1])

    if (titles.length === 0) {
      await supabase.from('note_links').delete().eq('source_id', sourceId)
      return
    }

    // Resolve titles to IDs
    const { data: targets } = await supabase
      .from('notes')
      .select('id, title')
      .in('title', titles)

    if (!targets?.length) {
      await supabase.from('note_links').delete().eq('source_id', sourceId)
      return
    }

    const links = targets.map((t) => ({ source_id: sourceId, target_id: t.id }))

    // Replace all links for this source atomically
    await supabase.from('note_links').delete().eq('source_id', sourceId)
    await supabase.from('note_links').insert(links)
  }

  async function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const t = e.target.value
    setTitle(t)
    if (editor) scheduleSave(t, getMarkdown(editor))
  }

  async function handleTitleBlur() {
    if (!note || !editor) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    await save(title, getMarkdown(editor))
  }

  async function moveToFolder(folderId: string | null) {
    if (!note) return
    const supabase = createClient()
    await supabase.from('notes').update({ folder_id: folderId }).eq('id', note.id)
    setNote((prev) => prev ? { ...prev, folder_id: folderId } : prev)
    window.dispatchEvent(new CustomEvent('notes-updated'))
    toast('Nota spostata')
  }

  function exportMarkdown() {
    if (!editor) return
    const md = getMarkdown(editor)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'nota'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!editor) return null

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center gap-1 px-4 py-2 border-b shrink-0 overflow-x-auto"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="w-8 shrink-0" />
        <ToolbarDivider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Grassetto"><Bold size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Corsivo"><Italic size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barrato"><Strikethrough size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Codice inline"><Code size={14} /></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Titolo 1"><Heading1 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titolo 2"><Heading2 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titolo 3"><Heading3 size={14} /></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista"><List size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerata"><ListOrdered size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citazione"><Quote size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Divisore"><Minus size={14} /></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Annulla"><Undo size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Ripeti"><Redo size={14} /></ToolbarBtn>
        <ToolbarDivider />
        {folders.length > 0 && (
          <div className="flex items-center gap-1">
            <FolderOpen size={13} style={{ color: 'var(--muted)' }} />
            <select
              value={note?.folder_id ?? ''}
              onChange={(e) => moveToFolder(e.target.value || null)}
              className="text-xs rounded px-1 py-0.5 border outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <option value="">Nessuna cartella</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {saving && <span className="text-xs" style={{ color: 'var(--muted)' }}>Salvo…</span>}
          <button onClick={exportMarkdown} title="Esporta Markdown" className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: 'var(--muted)' }}>
            <Download size={14} />
          </button>
          <Link href="/" className="p-1.5 rounded hover:bg-[var(--border)]" title="Home" style={{ color: 'var(--muted)' }}>
            <Home size={14} />
          </Link>
        </div>
      </div>

      {/* Title */}
      <div className="px-8 pt-6 pb-2 shrink-0" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
        <input
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="Titolo"
          className="w-full text-2xl font-bold outline-none bg-transparent"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  )
}

function ToolbarBtn({ onClick, active, title, children }: {
  onClick: () => void; active: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded transition-colors"
      style={{ background: active ? 'var(--accent-soft)' : 'transparent', color: active ? 'var(--accent)' : 'var(--muted)' }}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-4 mx-1 shrink-0" style={{ background: 'var(--border)' }} />
}
