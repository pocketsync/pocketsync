import { defineStore } from 'pinia'
import type { SyncSessionDto, SyncLogDto, SyncLogResponseDto } from '~/api-client/model'
import { SyncSessionsApi, SyncLogsApi } from '~/api-client/api'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

interface SyncSessionsState {
  sessions: SyncSessionDto[]
  currentSession: SyncSessionDto | null
  sessionLogs: Record<string, SyncLogResponseDto>
  isLoading: boolean
  isLoadingLogs: boolean
  error: Error | null
  pagination: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

export const useSyncSessionsStore = defineStore('syncSessions', {
  state: (): SyncSessionsState => ({
    sessions: [],
    currentSession: null,
    sessionLogs: {},
    isLoading: false,
    isLoadingLogs: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false
    }
  }),

  actions: {
    async getSessionsByProject(projectId: string, page = 1, limit = 10) {
      this.isLoading = true
      this.error = null
      
      try {
        const { config, axiosInstance } = useApi()
        const sessionsApi = new SyncSessionsApi(config, undefined, axiosInstance)
        
        const offset = (page - 1) * limit
        const response = await sessionsApi.syncSessionsControllerGetSessionsByProject(
          'Bearer ' + localStorage.getItem('token'),
          projectId,
          limit,
          offset
        )
        
        if (response.data) {
          if (page === 1) {
            // Replace sessions if it's the first page
            this.sessions = response.data as SyncSessionDto[]
          } else {
            // Append sessions if it's a subsequent page
            this.sessions = [...this.sessions, ...(response.data as SyncSessionDto[])]
          }
          
          this.pagination = {
            total: response.headers['x-total-count'] ? parseInt(response.headers['x-total-count']) : this.sessions.length,
            page,
            limit,
            hasMore: (response.data as SyncSessionDto[]).length === limit
          }
        }
        
        return response.data
      } catch (err: any) {
        const { error } = useToast()
        this.error = err
        error(err.message || 'Failed to fetch sync sessions')
        throw err
      } finally {
        this.isLoading = false
      }
    },
    
    async getSessionById(sessionId: string) {
      this.isLoading = true
      this.error = null
      
      try {
        const { config, axiosInstance } = useApi()
        const sessionsApi = new SyncSessionsApi(config, undefined, axiosInstance)
        
        const response = await sessionsApi.syncSessionsControllerGetSessionById(
          'Bearer ' + localStorage.getItem('token'),
          sessionId
        )
        
        if (response.data) {
          this.currentSession = response.data
        }
        
        return response.data
      } catch (err: any) {
        const { error } = useToast()
        this.error = err
        error(err.message || 'Failed to fetch sync session details')
        throw err
      } finally {
        this.isLoading = false
      }
    },
    
    async getSessionLogs(sessionId: string, limit = 50) {
      this.isLoadingLogs = true
      
      try {
        const { config, axiosInstance } = useApi()
        const logsApi = new SyncLogsApi(config, undefined, axiosInstance)
        
        const response = await logsApi.syncLogsControllerGetLogsBySession(
          'Bearer ' + localStorage.getItem('token'),
          sessionId,
          limit
        )
        
        if (response.data) {
          this.sessionLogs = {
            ...this.sessionLogs,
            [sessionId]: response.data
          }
        }
        
        return response.data
      } catch (err: any) {
        const { error } = useToast()
        error(err.message || 'Failed to fetch session logs')
        throw err
      } finally {
        this.isLoadingLogs = false
      }
    },
    
    clearSessions() {
      this.sessions = []
      this.currentSession = null
      this.sessionLogs = {}
      this.pagination = {
        total: 0,
        page: 1,
        limit: 10,
        hasMore: false
      }
    }
  }
})
