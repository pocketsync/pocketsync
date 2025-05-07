<template>
  <section id="key-features" class="py-16 md:py-24 bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
    <!-- Decorative blurs for the section - visible in both modes but with different opacities -->
    <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-600/5 dark:bg-primary-600/10 rounded-full blur-[100px] -z-1"></div>
    <div class="absolute bottom-1/4 right-1/3 w-64 h-64 bg-primary-400/5 dark:bg-primary-400/10 rounded-full blur-[100px] -z-1"></div>
    
    <div class="container mx-auto px-4 relative z-10">
      <SectionHeader :title="headerTitle" :description="headerDescription" />
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <div v-for="(feature, index) in features" :key="feature.title"
             :class="[
               'group relative bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden transition-all duration-300',
               'hover:border-primary-500/50 hover:shadow-inner hover:shadow-primary-500/10 dark:hover:shadow-primary-500/15',
               index === 0 ? 'md:col-span-2' : '',
               index === 1 ? 'md:col-span-1' : '',
               index === 2 ? 'md:col-span-1' : '',
               index === 3 ? 'md:col-span-2' : '',
             ]">
          
          <!-- Feature card content -->
          <div class="p-6 md:p-8 h-full flex flex-col relative z-10">
            <!-- Icon with decorative background -->
            <div class="relative mb-6">
              <div class="absolute -top-3 -left-3 w-12 h-12 bg-primary-500/10 rounded-full blur-md"></div>
              <div class="relative z-10 flex items-center justify-center w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 group-hover:border-primary-500/70 transition-colors duration-300">
                <div v-html="feature.icon" class="w-6 h-6 text-primary-600 dark:text-primary-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-all duration-300"></div>
              </div>
            </div>
            
            <!-- Text content -->
            <h3 class="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors duration-300">{{ feature.title }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">{{ feature.description }}</p>
            
            <!-- Decorative shapes inside each card - adjusted for light/dark modes -->
            <div class="absolute top-0 right-0 w-32 h-32 opacity-50 dark:opacity-50 -z-1 transition-transform duration-500 group-hover:scale-120">
              <img src="/images/shape/grid-01.svg" alt="" class="w-full h-full" />
            </div>
            
            <div class="absolute bottom-0 left-0 w-24 h-24 opacity-50 dark:opacity-50 rotate-180 -z-1 transition-transform duration-500 group-hover:scale-120">
              <img src="/images/shape/grid-01.svg" alt="" class="w-full h-full" />
            </div>
            
            <!-- Decorative blur inside card - different for light/dark modes -->
            <div class="absolute bottom-0 right-0 w-32 h-32 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-xl -z-1 group-hover:bg-primary-500/10 dark:group-hover:bg-primary-500/15 transition-colors duration-500"></div>
            
            <!-- Decorative corner accent - adjusted for light/dark modes -->
            <div class="absolute bottom-0 right-0 w-16 h-16 overflow-hidden z-0">
              <div class="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-transparent to-primary-500/5 dark:to-primary-500/10 transform rotate-45 translate-x-1/2 translate-y-1/2 group-hover:to-primary-500/10 dark:group-hover:to-primary-500/20 transition-colors duration-300"></div>
            </div>
            </div>
          </div>
        </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import SectionHeader from './section-header.vue';

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
    description: 'Designed for developer productivity with clear documentation, intuitive APIs, and minimal configuration requirements.'
  }
]);
</script>

<style scoped>
/* Additional styling if needed */
</style>