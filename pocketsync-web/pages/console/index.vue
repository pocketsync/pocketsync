<template>
    <!-- Header with Create Project Button -->
    <div class="mb-6 flex items-center justify-end">

        <button @click="createProject"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200">
            <PlusIcon size="16" class="mr-1" /> Create project
        </button>
    </div>


    <div>
        <!-- Error Alert -->
        <ErrorAlert v-if="error" :error="error" title="Error loading projects" />

        <!-- Loading State -->
        <div v-if="isLoading && !projects.length" class="mt-8">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="i in 2" :key="i"
                    class="animate-pulse rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div class="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div class="mt-4 space-y-3">
                        <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div class="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Projects Grid -->
        <div v-else>
            <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <ProjectCard v-for="project in projects" :key="project.id" :project="project" />

                <!-- Empty state -->
                <div v-if="!isLoading && projects.length === 0"
                    class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 transition-colors duration-200 dark:border-gray-700 dark:hover:border-gray-600 dark:bg-gray-800">
                    <component :is="FolderIcon" class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <h3 class="mt-4 text-base font-semibold text-gray-900 dark:text-white">No projects yet</h3>
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Create your first project to get started.
                    </p>
                    <button @click="createProject"
                        class="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200">
                        <PlusIcon size="18" /> <span>Create project</span>
                    </button>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="projects.length > 0 && paginationState.hasMore" class="mt-8 flex justify-center">
                <button @click="loadMore"
                    class="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200 dark:text-gray-300 dark:hover:text-white"
                    :disabled="loadingMore">
                    <span v-if="loadingMore" class="inline-flex items-center">
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg"
                            fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                        Loading more projects...
                    </span>
                    <span v-else>
                        <ChevronDownIcon size="18" class="mr-1" /> Load more projects
                    </span>
                </button>
            </div>
        </div>
        </div>

    <!-- Create Project Modal -->
    <CreateProjectModal 
        :is-open="showCreateProjectModal" 
        :is-creating="isCreatingProject" 
        @close="showCreateProjectModal = false" 
        @create="handleCreateProject" 
    />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { FolderIcon, PlusIcon, ChevronDownIcon } from '~/components/icons'
import ProjectCard from '~/components/projects/project-card.vue'
import ErrorAlert from '~/components/common/error-alert.vue'
import CreateProjectModal from '~/components/projects/create-project-modal.vue'
import type { CreateProjectDto } from '~/api-client'

const projectsStore = useProjectsStore()
const { projects, isLoading, error, paginationState } = storeToRefs(projectsStore)
const { fetchProjects, loadMoreProjects } = projectsStore
const loadingMore = ref(false)

definePageMeta({
    layout: 'dashboard-index',
    middleware: 'auth'
})

useHead({
    title: 'Dashboard - PocketSync'
})

// Project creation state
const showCreateProjectModal = ref(false)
const isCreatingProject = ref(false)

const createProject = () => {
    showCreateProjectModal.value = true
}

const handleCreateProject = async (projectData: CreateProjectDto) => {
    isCreatingProject.value = true
    try {
        const result = await projectsStore.createProject(projectData)
        if (result) {
            showCreateProjectModal.value = false
            // Navigate to the new project's dashboard
            navigateTo(`/console/projects/${result.id}`)
        }
    } catch (err: any) {
        console.error('Error creating project:', err)
    } finally {
        isCreatingProject.value = false
    }
}

const loadMore = async () => {
    if (loadingMore.value || !paginationState.value.hasMore) return

    loadingMore.value = true
    try {
        await loadMoreProjects()
    } catch (err) {
        console.error('Error loading more projects:', err)
    } finally {
        loadingMore.value = false
    }
}

onMounted(async () => {
    await fetchProjects()
})
</script>