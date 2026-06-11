export type ActionType = 'next_action' | 'waiting_for' | 'someday_maybe' | 'scheduled'
export type ProjectStatus = 'active' | 'completed' | 'someday'

export interface Area {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  area_id: string | null
  title: string
  description: string | null
  status: ProjectStatus
  due_date: string | null
  created_at: string
}

export interface Action {
  id: string
  user_id: string
  project_id: string | null
  area_id: string | null
  title: string
  notes: string | null
  type: ActionType
  context: string | null
  scheduled_at: string | null
  delegated_to: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface InboxItem {
  id: string
  user_id: string
  title: string
  notes: string | null
  created_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  content: string
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      areas: {
        Row: Area
        Insert: Omit<Area, 'id' | 'created_at'>
        Update: Partial<Omit<Area, 'id' | 'created_at'>>
        Relationships: []
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at'>>
        Relationships: []
      }
      actions: {
        Row: Action
        Insert: Omit<Action, 'id' | 'created_at'>
        Update: Partial<Omit<Action, 'id' | 'created_at'>>
        Relationships: []
      }
      inbox: {
        Row: InboxItem
        Insert: Omit<InboxItem, 'id' | 'created_at'>
        Update: Partial<Omit<InboxItem, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
