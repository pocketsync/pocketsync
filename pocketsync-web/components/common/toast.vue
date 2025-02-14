<template>
    <div class="fixed top-4 right-4 z-100 space-y-4">
        <TransitionGroup name="toast" tag="div">
            <div v-for="toast in toasts" :key="toast.id"
                class="min-w-[320px] max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black/5 overflow-hidden transform transition-all duration-300 ease-in-out hover:shadow-xl"
                :class="{
                'border-l-4': true,
                'border-green-500': toast.type === 'success',
                'border-red-500': toast.type === 'error',
                'border-blue-500': toast.type === 'info',
                'border-yellow-500': toast.type === 'warning'
            }">
                <div class="p-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <component :is="getIcon(toast.type)" class="h-6 w-6" :class="{
                'text-green-400': toast.type === 'success',
                'text-red-400': toast.type === 'error',
                'text-blue-400': toast.type === 'info',
                'text-yellow-400': toast.type === 'warning'
            }" />
                        </div>
                        <div class="ml-3 flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 leading-5 break-words">{{ toast.message }}</p>
                        </div>
                        <div class="ml-4 flex-shrink-0 flex items-center">
                            <button @click="remove(toast.id)"
                                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer">
                                <span class="sr-only">Close</span>
                                <PhX class="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import { PhCheckCircle, PhWarning, PhInfo, PhX } from '@phosphor-icons/vue'
import { useToast } from '~/composables/useToast'

const { toasts, remove } = useToast()

function getIcon(type: string) {
    switch (type) {
        case 'success':
            return PhCheckCircle
        case 'error':
        case 'warning':
            return PhWarning
        case 'info':
        default:
            return PhInfo
    }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.toast-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>