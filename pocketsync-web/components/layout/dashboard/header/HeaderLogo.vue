<template>
  <NuxtLink to="/" :class="{ 'lg:hidden': !isDashboardIndex }">
    <img class="h-6 w-auto dark:hidden" src="/images/logo/logo_full-light.svg" alt="Logo" />
    <img class="h-6 w-auto hidden dark:block" src="/images/logo/logo_full-dark.svg" alt="Logo" />
  </NuxtLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

const props = defineProps({
  isDashboardIndex: {
    type: Boolean,
    default: false
  }
})
</script>
