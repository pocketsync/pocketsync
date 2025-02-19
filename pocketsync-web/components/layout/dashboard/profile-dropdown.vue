<template>
    <div class="relative ml-3" ref="dropdownContainer">
        <div>
            <button @click="userMenuOpen = !userMenuOpen" type="button"
                class="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                <span class="sr-only">Open user menu</span>
                <ClientOnly>
                    <div class="h-8 w-8 rounded-full overflow-hidden">
                        <img v-if="user?.avatarUrl" :src="user.avatarUrl" :alt="user?.firstName ?? ''"
                            class="h-full w-full rounded-full object-cover" />
                        <div v-else
                            class="h-full w-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 font-medium">
                            {{ user ? getUserInitials(user) : '' }}
                        </div>
                    </div>
                    <template #fallback>
                        <div class="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200"></div>
                    </template>
                </ClientOnly>
            </button>
        </div>
        <div v-if="userMenuOpen"
            class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transform transition-all duration-200 ease-out z-50">
            <NuxtLink to="/console/profile"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</NuxtLink>
            <NuxtLink to="/console/settings"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</NuxtLink>
            <button @click="handleSignOut"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUtils } from '~/composables/useUtils'

const { user, signOut } = useAuth()
const { getUserInitials } = useUtils()

const userMenuOpen = ref(false)
const dropdownContainer = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
    if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
        userMenuOpen.value = false
    }
}

const handleSignOut = async () => {
    await signOut()
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>