<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span class="mr-3 overflow-hidden rounded-full h-11 w-11">
        <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="User" />
        <div v-else
            class="h-full w-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 font-medium">
            {{ user ? getUserInitials(user) : '' }}
        </div>
      </span>

      <span class="block mr-1 font-medium text-theme-sm">{{ user?.firstName }} {{ user?.lastName }}</span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown Start -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ user?.firstName }} {{ user?.lastName }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ user?.email }}
        </span>
      </div>

      <ul class="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <li v-for="item in menuItems" :key="item.href">
          <NuxtLink
            :to="item.href"
            class="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <!-- SVG icon would go here -->
            <component
              :is="item.icon"
              class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
            />
            {{ item.text }}
          </NuxtLink>
        </li>
      </ul>
      <button
        @click="signOut"
        class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <LogoutIcon
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        Sign out
      </button>
    </div>
    <!-- Dropdown End -->
  </div>
</template>

<script setup>
import { UserCircleIcon, ChevronDownIcon, LogoutIcon, SettingsIcon } from '@/components/icons'
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useUtils } from '@/composables/useUtils'

const {getUserInitials} =  useUtils()

const dropdownOpen = ref(false)
const dropdownRef = ref(null)

const { user, signOut } = useAuth()

const menuItems = [
  { href: '/console/profile', icon: UserCircleIcon, text: 'Edit profile' },
  { href: '/console/profile/settings', icon: SettingsIcon, text: 'Account settings' },
]

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
