<template>
  <section id="use-cases" class="py-16 md:py-24 bg-gray-950 text-white">
    <div class="container mx-auto px-4">
      <SectionHeader :title="headerTitle" :description="headerDescription" />
      <div class="overflow-hidden">
        <div 
          class="scroll-container flex gap-6 md:gap-8 py-4 hover:animation-play-state-paused"
        >
          <!-- First set of cards -->
          <div v-for="useCase in useCases" :key="`first-${useCase.title}`"
               class="flex-shrink-0 w-72 md:w-80 bg-slate-800/80 backdrop-blur-sm p-6 rounded-md border border-slate-700 
                      transition-all duration-300 group flex flex-col items-center text-center 
                      hover:border-primary-500 hover:bg-slate-700/70 hover:shadow-2xl hover:shadow-primary-500/25">
            <div v-html="useCase.icon" class="mb-4 w-16 h-16 text-primary-500 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"></div>
            <h3 class="text-xl font-semibold mb-2 text-gray-100 transition-colors duration-300 group-hover:text-primary-400">{{ useCase.title }}</h3>
            <p class="text-gray-400 text-sm mb-4 transition-opacity duration-300 group-hover:opacity-90">{{ useCase.description }}</p>
          </div>
          
          <!-- Duplicate set for seamless looping -->
          <div v-for="useCase in useCases" :key="`second-${useCase.title}`"
               class="flex-shrink-0 w-72 md:w-80 bg-slate-800/80 backdrop-blur-sm p-6 rounded-md border border-slate-700 
                      transition-all duration-300 group flex flex-col items-center text-center 
                      hover:border-primary-500 hover:bg-slate-700/70 hover:shadow-2xl hover:shadow-primary-500/25">
            <div v-html="useCase.icon" class="mb-4 w-16 h-16 text-primary-500 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"></div>
            <h3 class="text-xl font-semibold mb-2 text-gray-100 transition-colors duration-300 group-hover:text-primary-400">{{ useCase.title }}</h3>
            <p class="text-gray-400 text-sm mb-4 transition-opacity duration-300 group-hover:opacity-90">{{ useCase.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import SectionHeader from './section-header.vue';

const headerTitle = 'Adaptive sync solutions';
const headerDescription = 'PocketSync seamlessly adjusts to your app\'s needs, delivering reliable data synchronization across any use case or platform.';
const useCases = ref([
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>',
    title: 'Collaborative apps',
    description: 'Enable real-time data sharing and synchronization across multiple users and devices for seamless teamwork.'
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>',
    title: 'Field service applications',
    description: 'Equip your field workforce with reliable access to up-to-date information, even in offline scenarios.'
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg>',
    title: 'Data collection tools',
    description: 'Streamline data gathering from various sources, ensuring data integrity and availability across your systems.'
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125" /></svg>',
    title: 'Inventory management',
    description: 'Keep track of stock levels accurately across multiple locations with real-time updates and offline capabilities.'
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>',
    title: 'Disconnected environments',
    description: 'Ensure application functionality and data access in areas with poor or no internet connectivity.'
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75v-1.5m-4.631 8.332a23.842 23.842 0 0 1-5.454-1.31A8.967 8.967 0 0 1 6 9.75v-1.5M12 9.75v-1.5M8.25 9.75v-1.5M3 9.75v-1.5M21 9.75v-1.5m-18 0v-1.5m0 8.25v-1.5m0 1.5h18m-1.5-1.5v-1.5m0 1.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-3-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>',
    title: 'IoT data synchronization',
    description: 'Efficiently sync data from a multitude of IoT devices to your central platform for analysis and action.'
  }
]);
</script>

<style scoped>
.scroll-container {
  animation: scroll 40s linear infinite;
  width: fit-content;
}

.hover\:animation-play-state-paused:hover {
  animation-play-state: paused;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    /* Move to the negative width of the first set of cards */
    transform: translateX(calc(-100% / 2));
  }
}
</style>
