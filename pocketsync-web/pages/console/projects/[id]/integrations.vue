<template>
    <PageBreadcrumb page-title="Integrations" :items="[
        { label: 'Projects', path: '/console/projects' },
        { label: 'Integrations', path: `/console/projects/${projectId}/integrations` }
    ]" />

    <div class="w-full px-4 py-4">
        <div class="w-full">
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                <div class="px-6 py-5">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Authentication Tokens</h2>
                        <button 
                            @click="showCreateTokenModal = true"
                            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Create Token
                        </button>
                    </div>

                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Authentication tokens are used to authenticate your applications with the PocketSync API when syncing changes.
                        Keep your tokens secure and never share them in public repositories or client-side code.
                    </p>

                    <div v-if="isLoading" class="flex justify-center py-8">
                        <svg class="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>

                    <div v-else-if="authTokens.length === 0" class="flex flex-col items-center justify-center py-8 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">No authentication tokens found</p>
                        <button 
                            @click="showCreateTokenModal = true"
                            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200"
                        >
                            Create your first token
                        </button>
                    </div>

                    <div v-else class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                <tr v-for="token in authTokens" :key="token.id" class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ token.name }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatDate(token.createdAt) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button 
                                            @click="openRevokeTokenModal(token)"
                                            class="inline-flex items-center justify-center rounded-md bg-red-100 dark:bg-red-900/20 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                                        >
                                            Revoke
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <CreateTokenModal 
        :is-open="showCreateTokenModal" 
        :is-creating="isCreatingToken" 
        @close="showCreateTokenModal = false" 
        @create="handleCreateToken" 
    />

    <TokenCreatedModal 
        :is-open="showTokenCreatedModal" 
        :token="createdToken" 
        @close="showTokenCreatedModal = false" 
    />

    <RevokeTokenModal 
        :is-open="showRevokeTokenModal" 
        :token="tokenToRevoke" 
        :is-revoking="isRevokingToken" 
        @close="showRevokeTokenModal = false" 
        @revoke="handleRevokeToken" 
    />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue';
import { useRoute } from 'vue-router';
import { onMounted, ref, computed } from 'vue';
import { useProjectsStore } from '~/stores/projectsStore';
import { useProjects } from '~/composables/useProjects';
import { useToast } from '~/composables/useToast';
import { useUtils } from '~/composables/useUtils';
import type { AuthTokenResponseDto, CreateAuthTokenDto } from '~/api-client';

// Import modal components
import CreateTokenModal from '~/components/auth-tokens/create-token-modal.vue';
import TokenCreatedModal from '~/components/auth-tokens/token-created-modal.vue';
import RevokeTokenModal from '~/components/auth-tokens/revoke-token-modal.vue';

definePageMeta({
    layout: 'dashboard'
})

const route = useRoute()
const projectId = computed(() => {
    return (route.params.id as string) || 'default';
})

const { formatDate } = useUtils()

const projectsStore = useProjectsStore()
const { currentProject } = storeToRefs(projectsStore)
const { generateAuthToken, revokeToken: revokeAuthToken } = useProjects()
const { success, error: errorToast } = useToast()

const authTokens = ref<AuthTokenResponseDto[]>([])
const isLoading = ref(false)
const isCreatingToken = ref(false)
const isRevokingToken = ref(false)
const createdToken = ref<AuthTokenResponseDto | null>(null)
const tokenToRevoke = ref<AuthTokenResponseDto | null>(null)

// Modal visibility states
const showCreateTokenModal = ref(false)
const showTokenCreatedModal = ref(false)
const showRevokeTokenModal = ref(false)

onMounted(async () => {
    if (projectId) {
        await projectsStore.fetchProjectById(projectId.value)
    }
})

watch(() => currentProject.value, () => {
    authTokens.value = currentProject.value?.authTokens || []
})
    

// Handle token creation from modal
const handleCreateToken = async (tokenData: CreateAuthTokenDto) => {
    isCreatingToken.value = true
    try {
        const result = await generateAuthToken(projectId.value, tokenData)
        if (result) {
            showCreateTokenModal.value = false
            createdToken.value = result
            await projectsStore.fetchProjectById(projectId.value)
            showTokenCreatedModal.value = true
        }
    } finally {
        isCreatingToken.value = false
    }
}

// Open the revoke token modal
const openRevokeTokenModal = (token: AuthTokenResponseDto) => {
    tokenToRevoke.value = token
    showRevokeTokenModal.value = true
}

// Handle token revocation from modal
const handleRevokeToken = async (token: AuthTokenResponseDto) => {
    isRevokingToken.value = true
    try {
        const result = await revokeAuthToken(token.id)
        if (result) {
            showRevokeTokenModal.value = false
            await projectsStore.fetchProjectById(projectId.value)
            success('Token revoked successfully')
        }
    } finally {
        isRevokingToken.value = false
    }
}
</script>
