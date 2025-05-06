<template>
  <div class="p-6 pb-16 space-y-6">
    <PageBreadcrumb :pageTitle="'Sync Sessions'" :items="[
      { label: 'Projects', path: '/console/projects' },
      { label: currentProject?.name || 'Project', path: `/console/projects/${projectId}` },
      { label: 'Sync Sessions', path: `/console/projects/${projectId}/monitoring/sessions` }
    ]" />

    <ErrorAlert v-if="error" :message="error?.message" class="mb-4" />
    
    <SessionsTable 
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
import { onMounted } from 'vue'
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

// Load sessions on mount
onMounted(async () => {
  if (projectId) {
    await projectsStore.fetchProjectById(projectId)
    await syncSessionsStore.getSessionsByProject(projectId)
  }
})

// Handle loading session logs
const handleLoadLogs = async (sessionId: string) => {
  await syncSessionsStore.getSessionLogs(sessionId)
}

// Handle loading more sessions
const handleLoadMore = async () => {
  await syncSessionsStore.getSessionsByProject(projectId, pagination.value.page + 1, pagination.value.limit)
}
</script>


