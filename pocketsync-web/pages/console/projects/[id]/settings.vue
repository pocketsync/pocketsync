<template>
  <PageBreadcrumb page-title="Project Settings" :items="[
    { label: 'Projects', path: '/console/projects' },
    { label: 'Settings', path: `/console/projects/${projectId}/settings` }
  ]" />

  <div class="w-full px-4 py-4 space-y-6">
    <!-- Project Details Section -->
    <div class="w-full">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div class="px-6 py-5">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Project Details</h2>
          
          <div v-if="isLoading" class="flex justify-center py-8">
            <svg class="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          <div v-else-if="!currentProject" class="py-4 text-center">
            <p class="text-gray-500 dark:text-gray-400">Project not found</p>
          </div>

          <div v-else>
            <form @submit.prevent="updateProject">
              <div class="space-y-4">
                <div>
                  <label for="projectName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                  <input 
                    type="text" 
                    id="projectName" 
                    v-model="projectData.name"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Project Name" 
                    required
                    :disabled="isSaving"
                  />
                </div>

                <div class="flex justify-end space-x-3 pt-4">
                  <button 
                    type="submit" 
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="isSaving || !isFormChanged"
                  >
                    <span v-if="isSaving" class="mr-1">
                      <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone Section -->
    <div class="w-full">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div class="px-6 py-5">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Danger Zone</h2>
          
          <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Warning</h3>
                <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>Deleting a project is permanent and cannot be undone. All data associated with this project will be permanently removed.</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            @click="showDeleteConfirmation = true"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
            :disabled="isDeleting"
          >
            <span v-if="isDeleting" class="mr-1">
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            Delete project
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <DeleteProjectModal
    :is-open="showDeleteConfirmation"
    :is-deleting="isDeleting"
    :project="currentProject"
    @close="showDeleteConfirmation = false"
    @delete="deleteProject"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '~/stores/projectsStore'
import { useToast } from '~/composables/useToast'
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue'
import DeleteProjectModal from '~/components/projects/delete-project-modal.vue'
import type { UpdateProjectDto } from '~/api-client'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const router = useRouter()
const projectId = computed(() => route.params.id as string)
const { success, error: errorToast } = useToast()

const projectsStore = useProjectsStore()
const { currentProject, isLoading } = storeToRefs(projectsStore)

// Project update state
const projectData = ref<UpdateProjectDto>({ name: '' })
const isSaving = ref(false)

// Delete project state
const showDeleteConfirmation = ref(false)
const isDeleting = ref(false)

// Check if form has been changed
const isFormChanged = computed(() => {
  if (!currentProject.value) return false
  return projectData.value.name !== currentProject.value.name
})

// Initialize form data when project is loaded
watch(() => currentProject.value, (project) => {
  if (project) {
    projectData.value.name = project.name
  }
}, { immediate: true })

// Load project data
onMounted(async () => {
  if (projectId.value) {
    try {
      await projectsStore.fetchProjectById(projectId.value)
    } catch (err) {
      errorToast('Failed to load project')
    }
  }
})

// Update project
const updateProject = async () => {
  if (!projectId.value || !isFormChanged.value) return
  
  isSaving.value = true
  try {
    await projectsStore.updateProject(projectId.value, projectData.value)
    // Refresh the project data to ensure we have the latest version
    await projectsStore.fetchProjectById(projectId.value, true)
    success('Project updated successfully')
  } catch (err: any) {
    errorToast(err.message || 'Failed to update project')
  } finally {
    isSaving.value = false
  }
}

// Delete project
const deleteProject = async () => {
  if (!projectId.value) return
  
  isDeleting.value = true
  try {
    await projectsStore.deleteProject(projectId.value)
    success('Project deleted successfully')
    showDeleteConfirmation.value = false
    router.push('/console')
  } catch (err: any) {
    errorToast(err.message || 'Failed to delete project')
  } finally {
    isDeleting.value = false
  }
}
</script>
