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
                <StatsGrid :stats="loadingStats" />
            </div>

            <!-- Content when loaded -->
            <div v-else>
                <div class="md:flex md:items-center md:justify-between">
                    <div class="min-w-0 flex-1">
                        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            {{ project.name }}</h2>
                    </div>
                </div>

                <StatsGrid :stats="stats" />
                
                <TabsNavigation v-model="currentTab" :tabs="tabs" />

                <!-- Tab Panels -->
                <div class="mt-8">
                    <OverviewTab v-if="currentTab === 'overview'" :project="project" :recent-changes="recentChanges" />
                    <UsersTab v-if="currentTab === 'users'" :users="users" :is-loading="isLoadingUsers" />
                    <div v-if="currentTab === 'tokens'">
                        <AuthTokensTab :auth-tokens="authTokens" @create-token="showCreateTokenModal = true" />
                    </div>
                    <SettingsTab v-if="currentTab === 'settings'" :project="project" />
                </div>
            </div>
        </div>

        <!-- Modals -->
        <CreateTokenModal :show="showCreateTokenModal" :project-id="project.id" @close="showCreateTokenModal = false"
            @token-created="handleTokenCreated" />

    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import OverviewTab from '~/components/projects/overview-tab.vue'
import UsersTab from '~/components/projects/users-tab.vue'
import AuthTokensTab from '~/components/projects/auth-tokens-tab.vue'
import SettingsTab from '~/components/projects/settings-tab.vue'
import CreateTokenModal from '~/components/projects/create-token-modal.vue'
import StatsGrid from '~/components/projects/stats-grid.vue'
import TabsNavigation from '~/components/projects/tabs-navigation.vue'
import ErrorAlert from '~/components/common/error-alert.vue'
import { useAppUsers } from '~/composables/useAppUsers'
import { useProjects } from '~/composables/useProjects'

definePageMeta({
    layout: 'dashboard'
})

const showCreateTokenModal = ref(false)
const route = useRoute()
const { fetchProjectById, currentProject, isLoading, error } = useProjects()
const { users, isLoading: isLoadingUsers, error: usersError, fetchProjectUsers } = useAppUsers()

// Fetch project data when component mounts
onMounted(async () => {
    try {
        await fetchProjectById(route.params.id as string)
        await fetchProjectUsers(route.params.id as string)
    } catch (err) {
        console.error('Failed to fetch project:', err)
    }
})

// Use the currentProject from the composable
const project = computed(() => currentProject.value || { id: '', name: '' })

// Define authTokens as a computed property that derives from project data
const authTokens = computed(() => currentProject.value?.authTokens || [])

const loadingStats = {
    totalUsers: 0,
    activeUsers: 0,
    totalDevices: 0,
    activeDevices: 0,
    changesCount: 0,
    pendingChanges: 0
}

const stats = ref({
    totalUsers: 1234,
    activeUsers: 856,
    totalDevices: 2891,
    activeDevices: 1567,
    changesCount: 45892,
    pendingChanges: 123
})

const recentChanges = ref([
    {
        id: 1,
        device_id: 'iphone13-xyz',
        user_identifier: 'user123',
        received_at: new Date(Date.now() - 1000 * 60 * 5),
        processed_at: new Date(Date.now() - 1000 * 60 * 4)
    },
    {
        id: 2,
        device_id: 'pixel6-abc',
        user_identifier: 'user456',
        received_at: new Date(Date.now() - 1000 * 60 * 15),
        processed_at: null
    }
])

const currentTab = ref('overview')
const tabs = computed(() => [
    { name: 'Overview', value: 'overview' },
    { name: 'Users', value: 'users', count: users.value?.length || 0 },
    { name: 'Auth Tokens', value: 'tokens', count: authTokens.value?.length || 0 },
    { name: 'Settings', value: 'settings' }
])

function handleTokenCreated() {
   
}
</script>