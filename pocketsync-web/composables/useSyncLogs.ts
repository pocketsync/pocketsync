import { ref, computed } from 'vue'
import type { SyncLogDto, SyncLogResponseDto } from '~/api-client/model'
import { SyncLogsApi } from '~/api-client/api'
import { useApi } from './useApi'
import { useToast } from './useToast'
import { format, parseISO } from 'date-fns'

interface SyncLogError {
  message: string
  code: SyncLogErrorCode
  details?: Record<string, string[]>
}

type SyncLogErrorCode =
  | 'NETWORK_ERROR'
  | 'ACCESS_DENIED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN_ERROR'

interface SyncLogFilters {
  userIdentifier?: string
  deviceId?: string
  level?: string
  syncSessionId?: string
  startDate?: string
  endDate?: string
  searchQuery?: string
}

export function useSyncLogs() {
  const { success, error: errorToast } = useToast()
  const logs = ref<SyncLogDto[]>([])
  const isLoading = ref(false)
  const error = ref<SyncLogError | null>(null)
  const filters = ref<SyncLogFilters>({})
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    hasMore: false
  })

  const { config, axiosInstance } = useApi()
  const syncLogsApi = new SyncLogsApi(config, undefined, axiosInstance)

  // Error handling
  const handleLogError = (err: any): SyncLogError => {
    if (!err.response || err.code === 'ECONNABORTED') {
      return {
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR'
      }
    }

    const status = err.response.status
    const data = err.response.data

    switch (status) {
      case 400:
        return {
          message: data.message || 'Invalid request. Please check your input.',
          code: 'VALIDATION_ERROR',
          details: data.errors
        }
      case 403:
        return {
          message: 'Access denied. You do not have permission to perform this action.',
          code: 'ACCESS_DENIED'
        }
      case 404:
        return {
          message: 'Logs not found.',
          code: 'NOT_FOUND'
        }
      default:
        return {
          message: data.message || 'An unexpected error occurred. Please try again.',
          code: 'UNKNOWN_ERROR'
        }
    }
  }

  // Get logs by project with filtering
  const getLogsByProject = async (projectId: string, page = 1, limit = 10) => {
    error.value = null
    try {
      isLoading.value = true
      const response = await syncLogsApi.syncLogsControllerGetLogsByProject(
        `Bearer ${localStorage.getItem('token')}`,
        projectId,
        filters.value.userIdentifier,
        filters.value.deviceId,
        filters.value.level as any,
        filters.value.syncSessionId,
        filters.value.startDate,
        filters.value.endDate,
        limit,
        (page - 1) * limit
      )
      
      if (response.data) {
        const responseData = response.data as SyncLogResponseDto
        
        if (page === 1) {
          logs.value = responseData.logs
        } else {
          logs.value = [...logs.value, ...responseData.logs]
        }
        
        pagination.value = {
          total: responseData.total,
          page,
          limit,
          hasMore: logs.value.length < responseData.total
        }
      }
      
      return response.data
    } catch (err: any) {
      error.value = handleLogError(err)
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  // Get logs for a specific session
  const getLogsBySession = async (sessionId: string, limit = 50) => {
    error.value = null
    try {
      isLoading.value = true
      const response = await syncLogsApi.syncLogsControllerGetLogsBySession(
        `Bearer ${localStorage.getItem('token')}`,
        sessionId,
        limit,
        0
      )
      
      if (response.data) {
        const responseData = response.data as SyncLogResponseDto
        logs.value = responseData.logs
      }
      
      return response.data
    } catch (err: any) {
      error.value = handleLogError(err)
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  // Get logs for a specific device
  const getLogsByDevice = async (deviceId: string, userIdentifier: string, limit = 50) => {
    error.value = null
    try {
      isLoading.value = true
      const response = await syncLogsApi.syncLogsControllerGetLogsByDevice(
        `Bearer ${localStorage.getItem('token')}`,
        deviceId,
        userIdentifier,
        limit,
        0
      )
      
      if (response.data) {
        const responseData = response.data as SyncLogResponseDto
        logs.value = responseData.logs
      }
      
      return response.data
    } catch (err: any) {
      error.value = handleLogError(err)
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  // Filter logs by search query (client-side filtering)
  const filteredLogs = computed(() => {
    if (!filters.value.searchQuery) return logs.value
    
    const query = filters.value.searchQuery.toLowerCase()
    return logs.value.filter(log => {
      return (
        log.message.toLowerCase().includes(query) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(query))
      )
    })
  })

  // Format log timestamp
  const formatLogDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy HH:mm:ss')
    } catch (err) {
      return dateString
    }
  }

  // Get CSS class for log level
  const getLogLevelClass = (level: string): string => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return {
    // State
    logs,
    filteredLogs,
    isLoading,
    error,
    pagination,
    filters,
    
    // Actions
    getLogsByProject,
    getLogsBySession,
    getLogsByDevice,
    setFilters: (newFilters: Partial<SyncLogFilters>) => {
      filters.value = { ...filters.value, ...newFilters }
      pagination.value.page = 1 // Reset pagination when filters change
    },
    clearFilters: () => {
      filters.value = {}
    },
    
    // Helper functions
    formatLogDate,
    getLogLevelClass
  }
}
