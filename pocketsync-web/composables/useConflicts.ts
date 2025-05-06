import { storeToRefs } from 'pinia'
import { useConflictsStore } from '~/stores/conflictsStore'
import type { ConflictDto } from '~/api-client/model'

export function useConflicts() {
  const conflictsStore = useConflictsStore()
  const { 
    conflicts, 
    currentConflict, 
    isLoading, 
    error, 
    pagination,
    filters
  } = storeToRefs(conflictsStore)

  /**
   * Format the resolution strategy for display
   */
  const formatResolutionStrategy = (strategy: string): string => {
    switch (strategy) {
      case 'LAST_WRITE_WINS':
        return 'Last Write Wins'
      case 'CLIENT_WINS':
        return 'Client Wins'
      case 'SERVER_WINS':
        return 'Server Wins'
      case 'CUSTOM':
        return 'Custom'
      default:
        return strategy
    }
  }

  /**
   * Check if a conflict has been resolved
   */
  const isResolved = (conflict: ConflictDto): boolean => {
    return !!conflict.resolvedAt
  }

  /**
   * Get the status of a conflict
   */
  const getConflictStatus = (conflict: ConflictDto): string => {
    return isResolved(conflict) ? 'Resolved' : 'Unresolved'
  }

  /**
   * Get the status class for styling
   */
  const getStatusClass = (conflict: ConflictDto): string => {
    return isResolved(conflict) 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
  }

  /**
   * Get a visual diff between client and server data
   * This is a simplified implementation - a real diff would be more complex
   */
  const getDataDiff = (clientData: object, serverData: object): { 
    added: Record<string, any>,
    removed: Record<string, any>,
    changed: Record<string, { client: any, server: any }>
  } => {
    const added: Record<string, any> = {}
    const removed: Record<string, any> = {}
    const changed: Record<string, { client: any, server: any }> = {}
    
    // Find fields in client data that are different or not in server data
    Object.entries(clientData).forEach(([key, value]) => {
      if (!(key in serverData)) {
        added[key] = value
      } else if (JSON.stringify(value) !== JSON.stringify((serverData as any)[key])) {
        changed[key] = {
          client: value,
          server: (serverData as any)[key]
        }
      }
    })
    
    // Find fields in server data that are not in client data
    Object.keys(serverData).forEach(key => {
      if (!(key in clientData)) {
        removed[key] = (serverData as any)[key]
      }
    })
    
    return { added, removed, changed }
  }

  return {
    // State
    conflicts,
    currentConflict,
    isLoading,
    error,
    pagination,
    filters,
    
    // Actions
    getConflictsByProject: conflictsStore.getConflictsByProject,
    getConflictById: conflictsStore.getConflictById,
    setFilters: conflictsStore.setFilters,
    clearFilters: conflictsStore.clearFilters,
    clearConflicts: conflictsStore.clearConflicts,
    
    // Helper functions
    formatResolutionStrategy,
    isResolved,
    getConflictStatus,
    getStatusClass,
    getDataDiff
  }
}
