'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, ChevronRight, Calendar, ChevronDown } from 'lucide-react'
import type { Project, Area } from '@/types/database'
import { formatDateShort } from '@/lib/dateIt'
import AddProjectModal from './AddProjectModal'
import { SkeletonList } from '@/components/ui/Skeleton'

interface ProjectWithArea extends Project {
  areas?: { name: string; color: string } | null
}

function ProjectRow({ project }: { project: ProjectWithArea }) {
  return (
    <li style={{ background: 'var(--surface)' }}>
      <Link href={`/projects/${project.id}`} className="flex items-center gap-3 px-4 py-3.5">
        {project.areas && <div className="w-2 h-10 rounded-full shrink-0" style={{ background: project.areas.color }} />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{project.title}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {project.areas && <span className="text-xs" style={{ color: project.areas.color }}>{project.areas.name}</span>}
            {project.due_date && (
              <span className="text-xs flex items-center gap-0.5" style={{ color: 'var(--muted)' }}>
                <Calendar size={11} />{formatDateShort(project.due_date)}
              </span>
            )}
            {project.status !== 'active' && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--border)', color: 'var(--muted)' }}>
                {project.status === 'completed' ? 'Completato' : 'Prima o poi'}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--border)' }} />
      </Link>
    </li>
  )
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<ProjectWithArea[]>([])
  const [archived, setArchived] = useState<ProjectWithArea[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [areaFilter, setAreaFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('projects').select('*, areas(name, color)').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('projects').select('*, areas(name, color)').in('status', ['completed', 'someday']).order('created_at', { ascending: false }),
      supabase.from('areas').select('*').order('name'),
    ]).then(([{ data: active }, { data: arch }, { data: a }]) => {
      setProjects(active ?? [])
      setArchived(arch ?? [])
      setAreas(a ?? [])
      setLoading(false)
    })
  }, [])

  function handleAdded(project: ProjectWithArea) {
    setProjects((prev) => [project, ...prev])
    setShowAdd(false)
  }

  const filtered = areaFilter === 'all' ? projects : projects.filter((p) => p.area_id === areaFilter)
  const filteredArchived = areaFilter === 'all' ? archived : archived.filter((p) => p.area_id === areaFilter)

  if (loading) return <SkeletonList rows={5} />

  return (
    <div>
      <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b overflow-x-auto scrollbar-none" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => setAreaFilter('all')} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border"
          style={{ background: areaFilter === 'all' ? 'var(--foreground)' : 'var(--surface)', borderColor: areaFilter === 'all' ? 'var(--foreground)' : 'var(--border)', color: areaFilter === 'all' ? '#fff' : 'var(--muted)' }}>
          Tutti
        </button>
        {areas.map((area) => (
          <button key={area.id} onClick={() => setAreaFilter(area.id)} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5"
            style={{ background: areaFilter === area.id ? area.color + '20' : 'var(--surface)', borderColor: areaFilter === area.id ? area.color : 'var(--border)', color: areaFilter === area.id ? area.color : 'var(--muted)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: area.color }} />
            {area.name}
          </button>
        ))}
        <button onClick={() => setShowAdd(true)} className="shrink-0 ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'var(--accent)', color: '#fff' }}>
          <Plus size={13} /> Nuovo
        </button>
      </div>

      {filtered.length === 0 && filteredArchived.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-4xl mb-3">📁</div>
          <p className="font-medium" style={{ color: 'var(--foreground)' }}>Nessun progetto</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Crea il tuo primo progetto</p>
        </div>
      ) : (
        <>
          {filtered.length > 0 && (
            <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {filtered.map((project) => <ProjectRow key={project.id} project={project} />)}
            </ul>
          )}

          {filteredArchived.length > 0 && (
            <div className="border-t mt-2" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setShowArchived((v) => !v)} className="w-full flex items-center gap-2 px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>
                {showArchived ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                {filteredArchived.length} archiviati
              </button>
              {showArchived && (
                <ul className="divide-y opacity-70" style={{ borderColor: 'var(--border)' }}>
                  {filteredArchived.map((project) => <ProjectRow key={project.id} project={project} />)}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {showAdd && <AddProjectModal areas={areas} onDone={handleAdded} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
