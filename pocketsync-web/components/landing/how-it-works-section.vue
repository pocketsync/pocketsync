<template>
  <section id="how-it-works" class="py-16 md:py-24 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white relative overflow-hidden">
    <!-- Decorative blurs for the section -->
    <div class="absolute top-1/3 right-1/4 w-64 h-64 bg-primary-600/5 dark:bg-primary-600/10 rounded-full blur-[100px] -z-1"></div>
    <div class="absolute bottom-1/3 left-1/3 w-64 h-64 bg-primary-400/5 dark:bg-primary-400/10 rounded-full blur-[100px] -z-1"></div>
    
    <div class="container mx-auto px-4 relative z-10">
      <SectionHeader :title="headerTitle" :description="headerDescription" />
      
      <!-- Pipeline Workflow -->
      <div class="relative py-8">
        <!-- Background Pipeline Line -->
        <div class="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-gray-200 via-primary-500/30 to-gray-200 dark:from-gray-800 dark:via-primary-500/30 dark:to-gray-800 transform -translate-y-1/2 rounded-full"></div>
        
        <!-- Steps -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
          <div v-for="(step, index) in steps" :key="step.title" 
               class="group relative bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-md 
                      border border-gray-200 dark:border-gray-700 p-6 
                      transition-all duration-300 flex flex-col items-center text-center
                      hover:border-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800/90 
                      hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10">
            
            <!-- Step Number Node -->
            <div class="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full 
                        bg-white dark:bg-gray-900 border-2 border-primary-500 text-primary-600 dark:text-primary-500 
                        flex items-center justify-center font-bold text-lg z-20 transition-all duration-300 
                        group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-white dark:group-hover:text-white">
              {{ index + 1 }}
            </div>
            
            <!-- Connection Arrow (except for last item) -->
            <div v-if="index < steps.length - 1" 
                 class="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-8 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                   class="w-full h-full text-primary-500/50 dark:text-primary-500/70 group-hover:text-primary-500/80 dark:group-hover:text-primary-400 transition-colors duration-300">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            
            <!-- Step Content -->
            <div class="mt-6 flex flex-col h-full">
              <div v-html="step.icon" class="mb-4 w-12 h-12 text-primary-600 dark:text-primary-500 mx-auto transition-transform duration-300 group-hover:scale-110 group-hover:text-primary-500 dark:group-hover:text-primary-400"></div>
              <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 transition-colors duration-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ step.title }}</h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm flex-grow group-hover:text-gray-700 dark:group-hover:text-gray-300">{{ step.description }}</p>
            </div>
            
            <!-- Decorative shapes inside each card - subtle in light mode, more visible in dark mode -->
            <div class="absolute top-0 right-0 w-24 h-24 opacity-5 dark:opacity-10 -z-1">
              <img src="/images/shape/grid-01.svg" alt="grid" class="w-full h-full" />
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

const headerTitle = 'How PocketSync works';
const headerDescription = 'PocketSync makes data synchronization simple with a straightforward integration process that works across all your platforms.';

const steps = ref([
  {
    title: 'Integrate SDK',
    description: 'Add the PocketSync SDK to your application with just a few lines of code. Available for all major platforms and frameworks.',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /></svg>'
  },
  {
    title: 'Define data',
    description: 'Specify which data needs to be synchronized across devices and platforms using our simple schema definition.',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" /></svg>'
  },
  {
    title: 'Sync automatically',
    description: 'PocketSync handles all the complex synchronization logic, including conflict resolution and offline capabilities.',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>'
  },
  {
    title: 'Access anywhere',
    description: 'Your users enjoy consistent, up-to-date data across all their devices, online or offline.',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>'
  }
]);
</script>

<style scoped>
/* Additional styling if needed */
</style>
