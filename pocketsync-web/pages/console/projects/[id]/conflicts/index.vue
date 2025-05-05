<template>
  <div class="p-6 pb-16 space-y-6">
    <PageBreadcrumb :pageTitle="'Sync conflicts'" :items="[
      { label: 'Projects', path: '/console/projects' },
      { label: currentProject?.name || 'Project', path: `/console/projects/${projectId}` },
      { label: 'Sync conflicts', path: `/console/projects/${projectId}/conflicts` }
    ]" />

    <ErrorAlert v-if="error" :message="error?.message" class="mb-4" />
    
    <div class="border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] rounded-lg shadow">
      
      <div v-if="isLoading" class="animate-pulse space-y-4">
        <div v-for="i in 3" :key="i" class="h-16 bg-gray-200 rounded dark:bg-gray-700"></div>
      </div>
      
      <div v-else-if="conflicts && conflicts.length > 0" class="space-y-4">
        <!-- Conflicts list will go here -->
        <div v-for="conflict in conflicts" :key="conflict.id" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">{{ conflict.entityType }}: {{ conflict.entityId }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Created: {{ formatDate(conflict.createdAt) }}</p>
            </div>
            <div>
              <button class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                Resolve
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
        No conflicts found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { format } from 'date-fns'
import { useProjectsStore } from '~/stores/projectsStore'
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue'
import ErrorAlert from '~/components/common/error-alert.vue'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const projectId = route.params.id as string
const projectsStore = useProjectsStore()
const { currentProject, error } = storeToRefs(projectsStore)

const isLoading = ref(true)
const conflicts = ref([])

// Format date for display
const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy HH:mm')
}

// Function to view session logs
const viewSessionLogs = async (conflictId: string) => {
  // Implementation will go here
}

onMounted(async () => {
  try {
    isLoading.value = true
    await projectsStore.fetchProjectById(projectId)
    // Fetch conflicts data here
  } catch (err) {
    console.error('Error loading conflicts data:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
