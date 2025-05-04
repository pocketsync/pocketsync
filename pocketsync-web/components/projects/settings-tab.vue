<template>
    <div>
        <div class="space-y-12">
            <div class="grid grid-cols-1 gap-x-8 gap-y-10 pb-12 md:grid-cols-3">
                <div>
                    <h2 class="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">Project Settings</h2>
                    <p class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">Update your project settings and preferences.</p>
                </div>

                <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
                    <div class="sm:col-span-8">
                        <label for="project-name" class="block text-sm font-medium leading-6 text-gray-900">Project
                            name</label>
                        <div class="mt-2">
                            <div class="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-600"
                                :class="{ 'ring-red-300': errors.name.length > 0 }">
                                <input type="text" name="project-name" id="project-name" v-model="projectName"
                                    class="block flex-1 border-0 bg-transparent py-1.5 pl-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                    :placeholder="project.name" @blur="validateForm" :disabled="isLoading" />
                            </div>
                            <p v-if="errors.name.length > 0" class="mt-2 text-sm text-red-600">{{ errors.name.join(', ')
                                }}</p>
                        </div>
                    </div>
                </div>
                <div class="sm:col-span-8 flex items-center justify-end gap-x-8 mt-4">
                    <button type="button" class="text-sm font-semibold leading-6 text-gray-900"
                        :disabled="isLoading">Cancel</button>
                    <button type="submit" @click="saveSettings" :disabled="isLoading"
                        class="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span v-if="isLoading">Saving...</span>
                        <span v-else>Save</span>
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-x-8 gap-y-10 border-t border-gray-900/10 pt-12 md:grid-cols-3">
                <div>
                    <h2 class="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">Danger Zone</h2>
                    <p class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">Destructive actions that cannot be undone.</p>
                </div>

                <div class="max-w-2xl space-y-6 md:col-span-2">
                    <div class="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-700 p-4">
                        <div>
                            <h3 class="text-sm font-medium leading-6 text-red-800 dark:text-red-100">Delete this project</h3>
                            <p class="mt-1 text-sm text-red-700 dark:text-red-400">Once you delete a project, there is no going back.
                                Please be certain.</p>
                        </div>
                        <button type="button" @click="confirmDelete"
                            class="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 dark:hover:bg-red-700 cursor-pointer">
                            Delete project
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <ConfirmationDialog :show="showDeleteConfirmation" title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and will permanently delete all project data."
        confirm-text="Delete" verification-text="Permanently delete" :loading="isDeletingProject"
        @confirm="handleProjectDelete" @cancel="showDeleteConfirmation = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProjects } from '@/composables/useProjects'
import { useToast } from '@/composables/useToast'
import ConfirmationDialog from '@/components/common/confirmation-dialog'

const props = defineProps({
    project: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['project-updated'])

const projectName = ref(props.project.name)
const description = ref(props.project.description)

const { updateProject, deleteProject } = useProjects()
const { success, error: errorToast } = useToast()
const isLoading = ref(false)
const errors = ref<{ name: string[] }>({
    name: []
})

function validateForm() {
    errors.value.name = []
    if (!projectName.value?.trim()) {
        errors.value.name.push('Project name is required')
        return false
    }
    return true
}

async function saveSettings() {
    if (!validateForm()) return

    try {
        isLoading.value = true
        await updateProject(props.project.id, {
            name: projectName.value.trim(),
            description: description.value
        })
        emit('project-updated')
        success('Project settings updated successfully')
    } catch (err: any) {
        if (err.code === 'VALIDATION_ERROR' && err.details?.name) {
            errors.value.name = err.details.name
        } else {
            errorToast(err.message || 'Failed to update project settings')
        }
    } finally {
        isLoading.value = false
    }
}

const showDeleteConfirmation = ref(false)
const isDeletingProject = ref(false)

function confirmDelete() {
    showDeleteConfirmation.value = true
}

async function handleProjectDelete() {
    try {
        isDeletingProject.value = true
        await deleteProject(props.project.id)
        success('Project deleted successfully')
        navigateTo('/console/projects')
    } catch (err: any) {
        errorToast(err.message || 'Failed to delete project')
    } finally {
        isDeletingProject.value = false
        showDeleteConfirmation.value = false
    }
}
</script>