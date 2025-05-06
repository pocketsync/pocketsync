<template>
  <Modal v-if="isOpen && token" fullScreenBackdrop @close="$emit('close')">
    <template #body>
      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0 w-[500px]">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Token Created Successfully
            </h3>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <div class="mb-4">
              <label for="createdToken" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authentication Token</label>
              <div class="mt-1 flex rounded-md shadow-sm">
                <input type="text" id="createdToken" v-model="token.token" readonly
                  class="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-brand-500 focus:border-brand-500" />
                <button type="button" @click="copyToken"
                  class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500 transition-colors duration-150">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div class="px-4 py-3 sm:px-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-gray-700">
            <button type="button" @click="$emit('close')"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200">
              Done
            </button>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from '~/components/Modal.vue';
import type { AuthTokenResponseDto } from '~/api-client';
import { useToast } from '~/composables/useToast';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  token: {
    type: Object as () => AuthTokenResponseDto | null,
    default: null
  }
});

const emit = defineEmits(['close']);
const { success, error: errorToast } = useToast();

const copyToken = () => {
  if (!props.token?.token) return;
  
  navigator.clipboard.writeText(props.token.token)
    .then(() => {
      success('Token copied to clipboard');
    })
    .catch(() => {
      errorToast('Failed to copy token');
    });
};
</script>
