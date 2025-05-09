<template>
  <div>
    <ThemeProvider>
      <SidebarProvider>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </SidebarProvider>
    </ThemeProvider>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import Toast from '~/components/common/toast.vue'
import ThemeProvider from '~/components/layout/ThemeProvider.vue'
import SidebarProvider from '~/components/layout/dashboard/sidebar-provider.vue'

const { getCurrentUser, isAuthenticated, isSessionValidated } = useAuth()
const route = useRoute()

// Handle authentication on client-side only
onMounted(async () => {
  if (process.client) {
    try {
      await getCurrentUser()
      
      // If we're on the login page but authenticated, redirect to console
      if (route.path.startsWith('/auth') && isAuthenticated.value && isSessionValidated.value) {
        navigateTo('/console')
      }
    } catch (error) {
      // If we're on a protected route with an invalid token, redirect to login
      if (route.path.startsWith('/console')) {
        navigateTo('/auth/login')
      }
    }
  }
})
</script>
