<template>
    <header class="bg-gradient-to-r from-white to-gray-50 shadow-sm border-b border-gray-200">
        <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <h1 class="text-xl font-bold text-gray-900">Dashboard</h1>
            <div class="ml-4 flex items-center md:ml-6">
                <ProfileDropdown />
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useUtils } from '~/composables/useUtils'
import type { UserResponseDto } from '~/api-client'
import ProfileDropdown from './profile-dropdown.vue'

const { user: authUser, logout, ensureUserProfile } = useAuth()
const { getUserInitials } = useUtils()

const user = ref<UserResponseDto | null>(null)
const userMenuOpen = ref(false)

onMounted(async () => {
    await ensureUserProfile()
})

watch(() => authUser.value, (newUser) => {
    user.value = newUser
    if (!newUser) {
        userMenuOpen.value = false
    }
}, { immediate: true })

async function handleSignOut() {
    userMenuOpen.value = false
    await logout()
    await navigateTo('/auth/login')
}
</script>