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

const { getCurrentUser } = useAuth()

onMounted(() => {
  getCurrentUser()
})
</script>
