<template>
  <div class="p-6 pb-16 space-y-6">
    <PageBreadcrumb :pageTitle="'Sync Sessions'" :items="[
      { label: 'Projects', path: '/console/projects' },
      { label: currentProject?.name || 'Project', path: `/console/projects/${projectId}` },
      { label: 'Sync Sessions', path: `/console/projects/${projectId}/monitoring/sessions` }
    ]" />

    <ErrorAlert v-if="error" :message="error?.message" class="mb-4" />
    
    <SessionsTable 
      ref="sessionsTableRef"
      :sessions="sessions" 
      :sessionLogs="sessionLogs" 
      :isLoading="isLoading" 
      :isLoadingLogs="isLoadingLogs" 
      :pagination="pagination"
      @load-logs="handleLoadLogs"
      @load-more="handleLoadMore"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '~/stores/projectsStore'
import { useSyncSessionsStore } from '~/stores/syncSessionsStore'
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue'
import ErrorAlert from '~/components/common/error-alert.vue'
import SessionsTable from '~/components/sync-sessions/sessions-table.vue'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const projectId = route.params.id as string
const projectsStore = useProjectsStore()
const { currentProject } = storeToRefs(projectsStore)
// Get sync sessions data
const syncSessionsStore = useSyncSessionsStore()
const {
  sessions,
  sessionLogs,
  isLoading,
  isLoadingLogs,
  error,
  pagination
} = storeToRefs(syncSessionsStore)

// Reference to the SessionsTable component with proper typing
const sessionsTableRef = ref<InstanceType<typeof SessionsTable> | null>(null)

// Load sessions on mount and check for syncSessionId in query params
onMounted(async () => {
  if (projectId) {
    await projectsStore.fetchProjectById(projectId)
    await syncSessionsStore.getSessionsByProject(projectId)
    
    // Check if we need to open a specific session
    checkForSessionIdInQuery()
  }
})

// Watch for changes in the sessions data to open the modal after data is loaded
watch(() => sessions.value, () => {
  checkForSessionIdInQuery()
}, { immediate: false })

// Function to check for syncSessionId in query and open the modal
const checkForSessionIdInQuery = () => {
  const syncSessionId = route.query.syncSessionId as string
  
  if (syncSessionId && sessions.value.length > 0 && sessionsTableRef.value) {
    // Find the session in the loaded sessions
    const session = sessions.value.find(s => s.id === syncSessionId)
    
    if (session) {
      // Access the openSessionDetails method on the SessionsTable component
      sessionsTableRef.value.openSessionDetails(syncSessionId)
    }
  }
}

// Handle loading session logs
const handleLoadLogs = async (sessionId: string) => {
  await syncSessionsStore.getSessionLogs(sessionId)
}

// Handle loading more sessions
const handleLoadMore = async () => {
  await syncSessionsStore.getSessionsByProject(projectId, pagination.value.page + 1, pagination.value.limit)
}
</script>


