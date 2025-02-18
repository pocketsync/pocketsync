<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Toast from '~/components/common/toast.vue'
import { useAuth } from '~/composables/useAuth'

const { initAuth } = useAuth()

onMounted(async () => {
  await initAuth()
})
</script>
