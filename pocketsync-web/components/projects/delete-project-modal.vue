<template>
  <Modal v-if="isOpen" fullScreenBackdrop @close="$emit('close')">
    <template #body>
      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0 w-[500px]">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Delete project
            </h3>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <p class="mb-4 text-gray-700 dark:text-gray-300">Are you sure you want to delete the project "<strong>{{ project?.name }}</strong>"?</p>
            <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Warning</h3>
                  <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>This action cannot be undone. All data associated with this project will be permanently deleted.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Confirmation input -->
            <div class="mt-4">
              <label for="confirmDelete" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To confirm, type the project name:</label>
              <input 
                type="text" 
                id="confirmDelete" 
                v-model="confirmDeleteText"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-white"
                placeholder="Project name" 
                :disabled="isDeleting"
              />
            </div>
          </div>
          <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              @click="deleteProject"
              :disabled="confirmDeleteText !== project?.name || isDeleting"
              class="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3"
            >
              <span v-if="isDeleting" class="mr-1">
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              Delete project
            </button>
            <button 
              type="button" 
              @click="$emit('close')"
              class="mt-3 inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200 sm:mt-0 sm:ml-3"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Modal from '~/components/Modal.vue'
import type { ProjectResponseDto } from '~/api-client'

const props = defineProps<{
  isOpen: boolean
  isDeleting: boolean
  project: ProjectResponseDto | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()

const confirmDeleteText = ref('')

// Reset confirmation text when modal is opened
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    confirmDeleteText.value = ''
  }
})

const deleteProject = () => {
  if (confirmDeleteText.value === props.project?.name) {
    emit('delete')
  }
}
</script>
