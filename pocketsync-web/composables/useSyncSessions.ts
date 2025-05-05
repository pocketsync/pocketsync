import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSyncSessionsStore } from '~/stores/syncSessionsStore'

/**
 * Composable for managing sync sessions
 * This composable provides a convenient interface to the sync sessions store
 */
export const useSyncSessions = () => {
  const syncSessionsStore = useSyncSessionsStore()
  
  // Use storeToRefs to maintain reactivity when destructuring
  const {
    sessions,
    currentSession,
    sessionLogs,
    isLoading,
    isLoadingLogs,
    error,
    pagination
  } = storeToRefs(syncSessionsStore)

  // Format duration in a human-readable format
  const formatDuration = (durationMs: number | undefined) => {
    if (!durationMs) return 'N/A'
    
    const seconds = Math.floor(durationMs / 1000)
    if (seconds < 60) return `${seconds}s`
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`
  }

  // Get status badge color based on session status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'success'
      case 'FAILED':
        return 'danger'
      case 'IN_PROGRESS':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  // Expose store actions and computed properties
  return {
    // State (reactive)
    sessions,
    currentSession,
    sessionLogs,
    isLoading,
    isLoadingLogs,
    error,
    pagination,
    
    // Actions (from store)
    getSessionsByProject: syncSessionsStore.getSessionsByProject,
    getSessionById: syncSessionsStore.getSessionById,
    getSessionLogs: syncSessionsStore.getSessionLogs,
    clearSessions: syncSessionsStore.clearSessions,
    
    // Helper functions
    formatDuration,
    getStatusColor
  }
}
