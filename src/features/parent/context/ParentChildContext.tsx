// Context for parent child selection
// Fetches the parent's linked children and tracks which one is selected

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase-client'

interface ChildInfo {
  id: string
  name: string
  year_level: string | null
}

interface ParentChildContextValue {
  children: ChildInfo[]
  selectedChild: ChildInfo | null
  setSelectedChildId: (id: string) => void
  isLoading: boolean
}

const ParentChildContext = createContext<ParentChildContextValue | null>(null)

async function fetchParentChildren(): Promise<ChildInfo[]> {
  // Get the list of student IDs linked to the current parent
  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_parent_children')

  if (rpcError) throw rpcError

  const childIds: string[] = (rpcData ?? []).map((row: any) => row.student_id ?? row.id ?? row)

  if (childIds.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('students')
    .select('id, name, year_level')
    .in('id', childIds)

  if (error) throw error

  return (data ?? []) as ChildInfo[]
}

export function ParentChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

  const { data: childList = [], isLoading } = useQuery({
    queryKey: ['parent', 'children'],
    queryFn: fetchParentChildren,
  })

  // Auto-select first child when list loads and nothing is selected yet
  const firstChild = childList[0]
  const effectiveSelectedId = selectedChildId ?? (firstChild ? firstChild.id : null)

  const selectedChild = childList.find((c) => c.id === effectiveSelectedId) ?? null

  const value: ParentChildContextValue = {
    children: childList,
    selectedChild,
    setSelectedChildId,
    isLoading,
  }

  return <ParentChildContext.Provider value={value}>{reactChildren}</ParentChildContext.Provider>
}

export function useParentChild(): ParentChildContextValue {
  const ctx = useContext(ParentChildContext)
  if (!ctx) {
    throw new Error('useParentChild must be used within a ParentChildProvider')
  }
  return ctx
}
