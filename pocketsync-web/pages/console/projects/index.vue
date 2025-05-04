<template>
    <div>
        <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
                <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Projects</h1>
                <p class="mt-2 text-sm text-gray-700 dark:text-gray-400">A list of all your PocketSync apps and their registered users.</p>
            </div>
            <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button @click="showCreateProjectModal = true" v-if="!isLoading && projects.length > 0"
                    class="flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    <PlusIcon size="20" />
                    <span>Create project</span>
                </button>
            </div>
        </div>

        <!-- Error Alert -->
        <ErrorAlert v-if="error" :error="error" title="Error loading projects" />

        <!-- Loading State -->
        <div v-if="isLoading && !projects.length" class="mt-8">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="i in 3" :key="i" class="animate-pulse rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div class="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div class="mt-4 space-y-3">
                        <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div class="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Projects Grid -->
        <div v-else class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ProjectCard v-for="project in projects" :key="project.id" :project="project" />

            <!-- Empty state -->
            <div v-if="!isLoading && projects.length === 0"
                class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <component :is="FolderIcon" class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                <span class="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">No projects</span>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new project.</p>
                <button @click="showCreateProjectModal = true"
                    class="fc-addEventButton-button fc-button fc-button-primary">
                    <PlusIcon size="20" />
                    <span>Create project</span>
                </button>
            </div>
        </div>

        <!-- Create Project Modal -->
        <CreateProjectModal
            :show="showCreateProjectModal" 
            @close="closeModal()"
            @project-created="projects.push($event)"
        />
    </div>
</template>

<script setup>
import { PhFolder } from '@phosphor-icons/vue'
import { ref, onMounted, watch } from 'vue'
import CreateProjectModal from '~/components/projects/create-project-modal.vue'
import ProjectCard from '~/components/projects/project-card.vue'
import { useProjects } from '~/composables/useProjects'
import ErrorAlert from '~/components/common/error-alert.vue'
import { useRoute } from 'vue-router'
import { PlusIcon } from '~/components/icons'

definePageMeta({
    layout: 'dashboard'
})

const FolderIcon = PhFolder
const route = useRoute()
const router = useRouter()
const showCreateProjectModal = ref(route.query.action === 'create')

const { projects, isLoading, error, fetchProjects } = useProjects()

onMounted(async () => {
    try {
        await fetchProjects()
    } catch (err) {
    }
})

const closeModal = () => {
    showCreateProjectModal.value = false
    
    router.replace({ query: {} })
}

watch(() => route.query.action, () => {
    showCreateProjectModal.value = route.query.action === 'create'
})
</script>