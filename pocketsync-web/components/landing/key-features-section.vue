<template>
  <section id="key-features" class="py-16 md:py-24 bg-gray-950 text-white">
    <div class="container mx-auto px-4">
      <SectionHeader :title="headerTitle" :description="headerDescription" />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-2">
        <FeatureCard
          v-for="(feature, index) in features"
          :key="feature.title"
          :title="feature.title"
          :description="feature.description"
          :icon="feature.icon"
          :class="[
            index === 0 ? 'md:col-span-2' : '',
            index === 1 ? 'md:col-span-1' : '',
            index === 2 ? 'md:col-span-1' : '',
            index === 3 ? 'md:col-span-2' : '',
          ]"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import SectionHeader from './section-header.vue';
import FeatureCard from './feature-card.vue';

const headerTitle = 'Core advantages';
const headerDescription = 'Explore the powerful features that make PocketSync the ideal choice for your offline-first applications.';
const features = ref([
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>',
    title: 'Cross-platform sync',
    description: 'One unified SDK that works consistently across iOS, Android, and Web, eliminating platform-specific synchronization issues.'
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" /></svg>',
    title: 'Conflict resolution',
    description: 'Automatic conflict detection with customizable resolution strategies that adapt to your application\'s specific needs.'
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5h-3a.75.75 0 0 1 0-1.5h3a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" /></svg>',
    title: 'Real-time sync',
    description: 'Changes synchronize instantly across all connected devices, ensuring users always have the most current data.'
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>',
    title: 'Simple integration',
    description: 'Clear documentation and intuitive APIs allow developers to implement offline-first capabilities in a fraction of the time.'
  }
]);
</script>

<style scoped>
/* Additional styling if needed */
</style>