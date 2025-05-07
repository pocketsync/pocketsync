<template>
  <div class="bg-gray-900 p-6 md:p-8 rounded-md border border-gray-700 
              transition-all duration-300 group flex flex-col items-start text-left h-full 
              hover:border-primary-500 hover:shadow-xl hover:shadow-primary-500/20">
    <div class="p-3 rounded-full bg-primary-600 text-white mb-6 inline-flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-300">
      <div v-html="icon" class="w-6 h-6 md:w-8 md:h-8"></div>
    </div>
    <h3 class="text-lg md:text-xl font-semibold mb-2 text-gray-100">{{ title }}</h3>
    <p class="text-sm md:text-base text-gray-400 group-hover:text-gray-300 transition-colors duration-300 flex-grow">{{ description }}</p>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  icon: String,
  title: String,
  description: String,
});
</script>
