<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import Toast from '~/components/common/toast.vue'

const { getCurrentUser } = useAuth()

onMounted(() => {
  getCurrentUser()
})
</script>
