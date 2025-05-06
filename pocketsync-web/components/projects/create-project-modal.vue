<template>
  <Modal v-if="isOpen" fullScreenBackdrop @close="$emit('close')">
    <template #body>
      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0 w-[500px]">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Create new project
            </h3>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <form @submit.prevent="handleSubmit">
              <div class="mb-4">
                <label for="projectName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project name</label>
                <input 
                  type="text" 
                  id="projectName" 
                  v-model="projectName"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-700 dark:text-white"
                  placeholder="My awesome project" 
                  required
                  :disabled="isCreating"
                />
                <p v-if="validationError" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ validationError }}</p>
                <p v-else class="mt-1 text-sm text-gray-500 dark:text-gray-400">Give your project a descriptive name.</p>
              </div>
            </form>
          </div>
          <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              @click="handleSubmit" 
              :disabled="!projectName || isCreating"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3"
            >
              <span v-if="isCreating" class="mr-1">
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              Create project
            </button>
            <button 
              type="button" 
              @click="$emit('close')"
              class="mt-3 inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:ml-3 transition-colors duration-200"
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
import type { CreateProjectDto } from '~/api-client'

const props = defineProps<{
  isOpen: boolean
  isCreating: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', projectData: CreateProjectDto): void
}>()

const projectName = ref('')
const validationError = ref('')

const handleSubmit = () => {
  if (!projectName.value.trim()) {
    validationError.value = 'Project name is required'
    return
  }

  validationError.value = ''
  emit('create', { name: projectName.value.trim() })
}

// Reset form when modal is opened
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    projectName.value = ''
    validationError.value = ''
  }
})
</script>
