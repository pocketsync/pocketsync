import { defineStore } from 'pinia'
import type { SyncLogDto } from '~/api-client/model'

interface SyncLogFilters {
  userIdentifier?: string
  deviceId?: string
  level?: string
  syncSessionId?: string
  startDate?: string
  endDate?: string
  searchQuery?: string
}

interface SyncLogsPagination {
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export const useSyncLogsStore = defineStore('syncLogs', {
  state: () => ({
    logs: [] as SyncLogDto[],
    isLoading: false,
    error: null as Error | null,
    filters: {} as SyncLogFilters,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false
    } as SyncLogsPagination,
    selectedLogId: null as string | null
  }),

  getters: {
    filteredLogs: (state) => {
      if (!state.logs.length) return []
      
      let result = [...state.logs]
      
      // Apply search filter (client-side)
      if (state.filters.searchQuery) {
        const query = state.filters.searchQuery.toLowerCase()
        result = result.filter(log => {
          return (
            log.message.toLowerCase().includes(query) ||
            (log.userIdentifier && log.userIdentifier.toLowerCase().includes(query)) ||
            (log.deviceId && log.deviceId.toLowerCase().includes(query)) ||
            (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(query))
          )
        })
      }
      
      return result
    },
    
    selectedLog: (state) => {
      if (!state.selectedLogId) return null
      return state.logs.find(log => log.id === state.selectedLogId) || null
    }
  },

  actions: {
    setLogs(logs: SyncLogDto[]) {
      this.logs = logs
    },
    
    addLogs(logs: SyncLogDto[]) {
      // Add logs without duplicates
      const existingIds = new Set(this.logs.map(log => log.id))
      const newLogs = logs.filter(log => !existingIds.has(log.id))
      this.logs = [...this.logs, ...newLogs]
    },
    
    setLoading(isLoading: boolean) {
      this.isLoading = isLoading
    },
    
    setError(error: Error | null) {
      this.error = error
    },
    
    setFilters(filters: Partial<SyncLogFilters>) {
      this.filters = { ...this.filters, ...filters }
      // Reset pagination when filters change
      this.pagination.page = 1
    },
    
    clearFilters() {
      this.filters = {}
    },
    
    setPagination(pagination: Partial<SyncLogsPagination>) {
      this.pagination = { ...this.pagination, ...pagination }
    },
    
    setSelectedLogId(id: string | null) {
      this.selectedLogId = id
    },
    
    reset() {
      this.logs = []
      this.isLoading = false
      this.error = null
      this.filters = {}
      this.pagination = {
        total: 0,
        page: 1,
        limit: 10,
        hasMore: false
      }
      this.selectedLogId = null
    }
  }
})
