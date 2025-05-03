<template>
    <div>
        <div class="px-4 sm:px-6 lg:px-8">
            <!-- Error Alert -->
            <ErrorAlert v-if="error" :error="error" title="Error loading project" />

            <!-- Loading State -->
            <div v-if="isLoading" class="animate-pulse">
                <div class="md:flex md:items-center md:justify-between">
                    <div class="min-w-0 flex-1">
                        <div class="h-8 w-1/3 bg-gray-200 rounded"></div>
                    </div>
                </div>
                <StatsGrid :stats="stats" />
            </div>

            <!-- Content when loaded -->
            <div v-else>
                <div class="md:flex md:items-center md:justify-between">
                    <div class="min-w-0 flex-1">
                        <h2
                            class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            {{ project.name }}</h2>
                    </div>
                </div>

                <StatsGrid :stats="stats" />

                <TabsNavigation v-model="currentTab" :tabs="tabs" />

                <!-- Tab Panels -->
                <div class="mt-8">
                    <IntegrationTab v-if="currentTab === 'integration'" :project="project" :tokens="authTokens" />
                    <UsersTab v-if="currentTab === 'users'" :users="[]" :is-loading="false" />
                    <div v-if="currentTab === 'tokens'">
                        <AuthTokensTab :auth-tokens="authTokens" @create-token="showCreateTokenModal = true"
                            @token-revoked="handleTokenRevoked" />
                    </div>
                    <SettingsTab v-if="currentTab === 'settings'" :project="project"
                        @project-updated="handleProjectUpdated" />
                </div>
            </div>
        </div>

        <!-- Modals -->
        <CreateTokenModal :show="showCreateTokenModal" :project-id="project.id" @close="showCreateTokenModal = false"
            @token-created="handleTokenCreated" />

    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import IntegrationTab from '~/components/projects/integration-tab.vue'
import UsersTab from '~/components/projects/users-tab.vue'
import AuthTokensTab from '~/components/projects/auth-tokens-tab.vue'
import SettingsTab from '~/components/projects/settings-tab.vue'
import CreateTokenModal from '~/components/projects/create-token-modal.vue'
import StatsGrid from '~/components/projects/stats-grid.vue'
import TabsNavigation from '~/components/projects/tabs-navigation.vue'
import ErrorAlert from '~/components/common/error-alert.vue'
import { useProjects } from '~/composables/useProjects'

definePageMeta({
    layout: 'dashboard'
})

const showCreateTokenModal = ref(false)
const route = useRoute()
const { fetchProjectById, currentProject, isLoading, error } = useProjects()

onMounted(async () => {
    try {
        await fetchProjectById(route.params.id as string)
    } catch (err) {
    }
})

const project = computed(() => currentProject.value || { id: '', name: '' })

const authTokens = computed(() => currentProject.value?.authTokens || [])

const stats = computed(() => {
    return currentProject.value?.stats || {
        totalUsers: 0,
        activeUsersToday: 0,
        totalDevices: 0,
        onlineDevices: 0,
        totalChanges: 0,
        pendingChanges: 0,
    }
})


const currentTab = ref('integration')
const tabs = computed(() => [
    { name: 'Integration', value: 'integration' },
    { name: 'Users', value: 'users' },
    { name: 'Auth Tokens', value: 'tokens', count: authTokens.value?.length || 0 },
    { name: 'Settings', value: 'settings' }
])

async function handleTokenCreated() {
    await fetchProjectById(route.params.id as string)
}

async function handleTokenRevoked() {
    await fetchProjectById(route.params.id as string)
}

function handleProjectUpdated() {
    fetchProjectById(route.params.id as string)
}
</script>