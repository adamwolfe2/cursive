// CRM State Management
// Zustand store for CRM module state

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  LeadFilters,
  ColumnVisibility,
  TableDensity,
  LeadStatus,
} from '@/types/crm.types'

interface CRMState {
  // Selection state
  selectedLeadIds: string[]
  setSelectedLeads: (ids: string[]) => void
  toggleLeadSelection: (id: string) => void
  clearSelection: () => void
  selectAll: (ids: string[]) => void

  // Filters
  filters: LeadFilters
  setFilters: (filters: Partial<LeadFilters>) => void
  clearFilters: () => void
  setSearch: (search: string) => void
  setStatus: (status: LeadStatus[]) => void

  // Column visibility
  columnVisibility: ColumnVisibility
  setColumnVisibility: (columns: ColumnVisibility) => void
  toggleColumnVisibility: (column: string) => void

  // Table density
  density: TableDensity
  setDensity: (density: TableDensity) => void

  // Detail panel
  detailPanelOpen: boolean
  detailPanelLeadId: string | null
  openDetailPanel: (leadId: string) => void
  closeDetailPanel: () => void

  // Bulk actions
  bulkActionInProgress: boolean
  setBulkActionInProgress: (inProgress: boolean) => void

  // View preferences
  savedView: string | null
  setSavedView: (viewId: string | null) => void
}

const defaultFilters: LeadFilters = {
  page: 1,
  pageSize: 20,
  orderBy: 'created_at',
  orderDirection: 'desc',
}

const defaultColumnVisibility: ColumnVisibility = {
  select: true,
  status: true,
  name: true,
  email: true,
  phone: true,
  company: true,
  job_title: true,
  industry: true,
  state: true,
  company_size: true,
  intent_score: true,
  freshness_score: true,
  price: true,
  owner: true,
  created_at: true,
  actions: true,
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      // Selection
      selectedLeadIds: [],
      setSelectedLeads: (ids) => set({ selectedLeadIds: ids }),
      toggleLeadSelection: (id) =>
        set((state) => {
          const isSelected = state.selectedLeadIds.includes(id)
          return {
            selectedLeadIds: isSelected
              ? state.selectedLeadIds.filter((selectedId) => selectedId !== id)
              : [...state.selectedLeadIds, id],
          }
        }),
      clearSelection: () => set({ selectedLeadIds: [] }),
      selectAll: (ids) => set({ selectedLeadIds: ids }),

      // Filters
      filters: defaultFilters,
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      clearFilters: () =>
        set({
          filters: {
            ...defaultFilters,
            // Preserve pagination settings
            pageSize: get().filters.pageSize,
          },
        }),
      setSearch: (search) =>
        set((state) => ({
          filters: { ...state.filters, search, page: 1 },
        })),
      setStatus: (status) =>
        set((state) => ({
          filters: { ...state.filters, status, page: 1 },
        })),

      // Column visibility
      columnVisibility: defaultColumnVisibility,
      setColumnVisibility: (columns) => set({ columnVisibility: columns }),
      toggleColumnVisibility: (column) =>
        set((state) => ({
          columnVisibility: {
            ...state.columnVisibility,
            [column]: !state.columnVisibility[column],
          },
        })),

      // Table density
      density: 'comfortable',
      setDensity: (density) => set({ density }),

      // Detail panel
      detailPanelOpen: false,
      detailPanelLeadId: null,
      openDetailPanel: (leadId) =>
        set({ detailPanelOpen: true, detailPanelLeadId: leadId }),
      closeDetailPanel: () =>
        set({ detailPanelOpen: false, detailPanelLeadId: null }),

      // Bulk actions
      bulkActionInProgress: false,
      setBulkActionInProgress: (inProgress) =>
        set({ bulkActionInProgress: inProgress }),

      // View preferences
      savedView: null,
      setSavedView: (viewId) => set({ savedView: viewId }),
    }),
    {
      name: 'crm-storage',
      // Only persist certain keys (not selection or detail panel state)
      partialize: (state) => ({
        filters: state.filters,
        columnVisibility: state.columnVisibility,
        density: state.density,
        savedView: state.savedView,
      }),
    }
  )
)
