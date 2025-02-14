<template>
    <div v-if="show" class="fixed inset-0 z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500/60 transition-opacity"></div>

        <!-- Modal panel -->
        <div class="fixed inset-0 z-[100] overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 sm:p-0">
                <div
                    class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div class="sm:flex sm:items-start">
                        <div
                            class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <component :is="WarningIcon" class="h-6 w-6 text-red-600" />
                        </div>
                        <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                                {{ title }}
                            </h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500">{{ message }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button type="button" @click="confirm"
                            class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto">
                            {{ confirmText }}
                        </button>
                        <button type="button" @click="cancel"
                            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                            {{ cancelText }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PhWarning } from '@phosphor-icons/vue'

const WarningIcon = PhWarning

defineProps<{
    show: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
}>()

const emit = defineEmits<{
    confirm: []
    cancel: []
}>()

function confirm() {
    emit('confirm')
}

function cancel() {
    emit('cancel')
}
</script>