<template>
    <div class="space-y-8">
        <!-- Project Configuration Section -->
        <div>
            <h2 class="text-base font-semibold leading-6 text-gray-900">Project Configuration</h2>
            <p class="mt-2 text-sm text-gray-700">Use these credentials to integrate PocketSync with your application.
            </p>

            <div class="mt-6 space-y-6">
                <!-- Project ID -->
                <div class="bg-white shadow-sm rounded-lg border border-gray-200">
                    <div class="px-4 py-5 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-medium text-gray-900">Project ID</h3>
                                <p class="mt-1 text-sm text-gray-500">Your unique project identifier</p>
                            </div>
                            <button @click="copyToClipboard(project.id)"
                                class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                <svg class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                            </button>
                        </div>
                        <div class="mt-2">
                            <code class="text-sm bg-gray-50 rounded px-2 py-1">{{ project.id }}</code>
                        </div>
                    </div>
                </div>

                <!-- Server URL -->
                <div class="bg-white shadow-sm rounded-lg border border-gray-200">
                    <div class="px-4 py-5 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-medium text-gray-900">Server URL</h3>
                                <p class="mt-1 text-sm text-gray-500">The base URL for API requests</p>
                            </div>
                            <button @click="copyToClipboard(serverUrl)"
                                class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer">
                                <svg class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                            </button>
                        </div>
                        <div class="mt-2">
                            <code class="text-sm bg-gray-50 rounded px-2 py-1">{{ serverUrl }}</code>
                        </div>
                    </div>
                </div>

                <!-- Auth Tokens -->
                <div class="bg-white shadow-sm rounded-lg border border-gray-200">
                    <div class="px-4 py-5 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-medium text-gray-900">Authentication Tokens</h3>
                                <p class="mt-1 text-sm text-gray-500">Your project's authentication tokens</p>
                            </div>
                        </div>
                        <div class="mt-4 space-y-4">
                            <div v-for="token in tokens" :key="token.id"
                                class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 truncate">{{ token.name }}</p>
                                    <p class="mt-1 text-sm text-gray-500">Created {{ formatDate(token.createdAt) }}</p>
                                </div>
                                <div class="ml-4 flex-shrink-0">
                                    <button @click="copyToClipboard(token.token)"
                                        class="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer">
                                        <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'
import { formatDistanceToNow } from 'date-fns'

const { success: showSuccessToast } = useToast()

defineProps<{
    project: {
        id: string
        name: string
    }
    tokens: Array<{
        id: string
        name: string
        token: string
        createdAt: string
    }>
}>()

// Server URL from environment variable
const serverUrl = process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.pocketsync.dev'

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    showSuccessToast('Copied to clipboard')
}

function formatDate(date: string) {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
}
</script>