import { defineStore } from 'pinia'
import type { ConflictDto, ConflictResponseDto } from '~/api-client/model'
import { ConflictsApi } from '~/api-client/api'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

interface ConflictsState {
  conflicts: ConflictDto[]
  currentConflict: ConflictDto | null
  isLoading: boolean
  error: Error | null
  pagination: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
  filters: {
    userIdentifier?: string
    deviceId?: string
    tableName?: string
    recordId?: string
    resolutionStrategy?: string
    startDate?: string
    endDate?: string
  }
}

export const useConflictsStore = defineStore('conflicts', {
  state: (): ConflictsState => ({
    conflicts: [],
    currentConflict: null,
    isLoading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false
    },
    filters: {}
  }),

  actions: {
    async getConflictsByProject(projectId: string, page = 1, limit = 10) {
      this.isLoading = true
      this.error = null
      
      try {
        const { config, axiosInstance } = useApi()
        const conflictsApi = new ConflictsApi(config, undefined, axiosInstance)
        
        const offset = (page - 1) * limit
        const response = await conflictsApi.conflictsControllerGetConflictsByProject(
          projectId,
          this.filters.userIdentifier,
          this.filters.deviceId,
          this.filters.tableName,
          this.filters.recordId,
          this.filters.resolutionStrategy as any,
          this.filters.startDate,
          this.filters.endDate,
          limit,
          offset,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )
        
        if (response.data) {
          const responseData = response.data as ConflictResponseDto
          
          if (page === 1) {
            // Replace conflicts if it's the first page
            this.conflicts = responseData.conflicts
          } else {
            // Append conflicts if it's a subsequent page
            this.conflicts = [...this.conflicts, ...responseData.conflicts]
          }
          
          this.pagination = {
            total: responseData.total,
            page,
            limit,
            hasMore: this.conflicts.length < responseData.total
          }
        }
        
        return response.data
      } catch (err: any) {
        const { error } = useToast()
        this.error = err
        error(err.message || 'Failed to fetch conflicts')
        throw err
      } finally {
        this.isLoading = false
      }
    },
    
    async getConflictById(conflictId: string) {
      this.isLoading = true
      this.error = null
      
      try {
        const { config, axiosInstance } = useApi()
        const conflictsApi = new ConflictsApi(config, undefined, axiosInstance)
        
        const response = await conflictsApi.conflictsControllerGetConflictById(
          conflictId,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )
        
        if (response.data) {
          this.currentConflict = response.data
        }
        
        return response.data
      } catch (err: any) {
        const { error } = useToast()
        this.error = err
        error(err.message || 'Failed to fetch conflict details')
        throw err
      } finally {
        this.isLoading = false
      }
    },
    
    setFilters(filters: Partial<ConflictsState['filters']>) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1 // Reset pagination when filters change
    },
    
    clearFilters() {
      this.filters = {}
    },
    
    clearConflicts() {
      this.conflicts = []
      this.currentConflict = null
      this.pagination = {
        total: 0,
        page: 1,
        limit: 10,
        hasMore: false
      }
    }
  }
})
