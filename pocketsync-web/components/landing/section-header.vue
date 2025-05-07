<template>
  <div class="flex items-start justify-start z-1 relative">
    <common-grid-shape />
    <div class="text-start mb-12 md:mb-16 z-10">
      <div class="absolute -top-10 -left-10 w-20 h-20 bg-primary-600/10 rounded-full blur-xl"></div>
      <div class="absolute top-1/2 -right-5 w-16 h-16 bg-primary-500/10 rounded-full blur-lg"></div>
      <div class="absolute -bottom-8 left-1/3 w-24 h-12 bg-primary-400/10 rounded-full blur-xl"></div>
      <h2
        class="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 relative z-10">
        {{ title }}</h2>
      <p class="text-lg md:text-lg text-gray-700 dark:text-gray-300 opacity-90 max-w-3xl mx-auto relative z-10">
        {{ description }}</p>
    </div>
  </div>
</template>

<script setup>
import CommonGridShape from '../common/common-grid-shape.vue';
defineProps({
  title: String,
  description: String
});
</script>
