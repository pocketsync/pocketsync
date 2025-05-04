<template>
    <div>
        <!-- Auth Tokens Section -->
        <div class="mt-8">
            <div class="sm:flex sm:items-center">
                <div class="sm:flex-auto">
                    <h2 class="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">Authentication Tokens</h2>
                    <p class="mt-2 text-sm text-gray-700 dark:text-gray-400">Manage authentication tokens for your application.</p>
                </div>
                <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button @click="$emit('create-token')"
                        class="rounded-md bg-primary-600 dark:bg-primary-700 px-3 py-2 space-x-2 flex flex-inline text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
                        <PhPlus :size="20" />
                        <span>Create auth token</span>
                    </button>
                </div>
            </div>

            <div class="mt-8 flow-root">
                <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div class="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div class="px-4 sm:px-6 lg:px-8 py-4">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead class="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th scope="col"
                                                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-0">
                                                Name</th>
                                            <th scope="col"
                                                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-0">
                                                Token</th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                Created At</th>
                                            <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                <span class="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                        <tr v-for="token in authTokens" :key="token.id">
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {{ token.name }}
                                            </td>

                                            <td class="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-0">
                                                <div class="flex items-center">
                                                    <div class="flex-shrink-0">
                                                        <component :is="KeyIcon" class="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <div class="ml-4 flex items-center space-x-2">
                                                        <code
                                                            class="text-sm text-gray-600">{{ maskToken(token.token) }}</code>
                                                        <button @click="copyToken(token.token)"
                                                            class="text-primary-600 hover:text-primary-500 cursor-pointer">
                                                            <component :is="CopyIcon" class="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {{ formatDate(token.createdAt) }}
                                            </td>
                                            <td
                                                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button @click="revokeTokenWithConfirmation(token.id)"
                                                    class="text-red-600 hover:text-red-900 cursor-pointer">Revoke</button>
                                            </td>
                                        </tr>

                                        <tr v-if="authTokens.length === 0">
                                            <td colspan="4" class="px-6 py-8 text-center dark:text-gray-300">
                                                <component :is="KeyIcon" class="mx-auto h-12 w-12 text-gray-400" />
                                                <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No authentication
                                                    tokens</h3>
                                                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new
                                                    authentication token.</p>
                                                <div class="mt-6">
                                                    <button @click="$emit('create-token')"
                                                        class="items-center rounded-md bg-primary-600 space-x-2 flex flex-inline px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
                                                        <PhPlus :size="20" />
                                                        Create auth token
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Token Modal -->
        <CreateTokenModal v-if="showCreateTokenModal" @close="showCreateTokenModal = false" />

        <!-- Confirmation Dialog -->
        <ConfirmationDialog v-if="showConfirmDialog" show title="Revoke Authentication Token"
            message="Are you sure you want to revoke this authentication token? This action cannot be undone. Note if you are using this token in your application, this will break sync for all users."
            confirm-text="Revoke Token" cancel-text="Cancel" @confirm="handleConfirmRevoke" @cancel="handleCancelRevoke"
            :loading="isRevoking" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PhKey, PhCopy, PhPlus } from '@phosphor-icons/vue'
import CreateTokenModal from './create-token-modal.vue'
import ConfirmationDialog from '../common/confirmation-dialog.vue'
import type { AuthTokenResponseDto } from '~/api-client'
import { useProjects } from '~/composables/useProjects'

const { revokeToken } = useProjects()

const KeyIcon = PhKey
const CopyIcon = PhCopy

const showCreateTokenModal = ref(false)
const showConfirmDialog = ref(false)
const tokenToRevoke = ref<string | null>(null)
const isRevoking = ref(false)

const props = defineProps<{
    authTokens: AuthTokenResponseDto[]
}>()

const emit = defineEmits<{
    'create-token': []
    'token-revoked': [string]
}>();

function maskToken(token: string) {
    return `${token.slice(0, 8)}...${token.slice(-8)}`
}

function copyToken(token: string) {
    navigator.clipboard.writeText(token)
}

function revokeTokenWithConfirmation(id: string) {
    tokenToRevoke.value = id
    showConfirmDialog.value = true
}

async function handleConfirmRevoke() {
    if (tokenToRevoke.value) {
        isRevoking.value = true
        try {
            const success = await revokeToken(tokenToRevoke.value)
            if (success) {
                emit('token-revoked', tokenToRevoke.value)
            }
        } finally {
            isRevoking.value = false
        }
    }
    showConfirmDialog.value = false
    tokenToRevoke.value = null
}

function handleCancelRevoke() {
    showConfirmDialog.value = false
    tokenToRevoke.value = null
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}
</script>