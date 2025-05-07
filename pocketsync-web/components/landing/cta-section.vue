<template>
  <section class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-16 md:py-24 overflow-hidden">
    <!-- Background Shapes -->
    <div class="absolute inset-0 pointer-events-none">
      <svg class="absolute top-0 left-0 w-1/2 h-1/2 opacity-20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 100C0 44.77 44.77 0 100 0S200 44.77 200 100" fill="url(#gradient1)" />
        <defs>
          <linearGradient id="gradient1" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#1e40af;stop-opacity:0.1" />
          </linearGradient>
        </defs>
      </svg>
      <svg class="absolute bottom-0 right-0 w-1/3 h-1/3 opacity-15" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75" cy="75" r="75" fill="url(#gradient2)" />
        <defs>
          <linearGradient id="gradient2" x1="0" y1="0" x2="150" y2="150">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.2" />
            <stop offset="100%" style="stop-color:#1e3a8a;stop-opacity:0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div class="container mx-auto px-6 max-w-5xl text-center relative z-10">
      <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight tracking-tight">
        Build offline-first apps with ease
      </h2>
      <p class="text-lg md:text-xl text-gray-100 opacity-95 mb-8 max-w-3xl mx-auto leading-relaxed">
        Say goodbye to sync headaches. PocketSync simplifies data synchronization, letting you focus on crafting exceptional app experiences. Start now and delight your users.
      </p>
      <div class="flex justify-center gap-2">
        <NuxtLink to="/auth/register"
          class="inline-block bg-white text-primary-700 font-semibold px-8 py-2 rounded-md shadow-lg hover:bg-gray-50 hover:text-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-200 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105">
          Start building free
        </NuxtLink>
        <NuxtLink to="https://docs.pocketsync.dev"
          class="inline-block bg-transparent border-2 border-gray-100 text-gray-100 font-semibold px-6 py-2 rounded-md hover:bg-gray-100 hover:text-primary-700 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 transition-all duration-300">
          Explore docs
        </NuxtLink>
      </div>
      <p class="mt-6 text-sm text-gray-200 opacity-85">
        Free to try, no credit card needed. Scale effortlessly as your app grows.
      </p>
    </div>
  </section>
</template>

<script setup>
// No script logic needed for this simple CTA section
</script>

<style scoped>
/* Ensure gradient background is smooth and accessible */
section {
  background: linear-gradient(135deg, #1e40af, #1e3a8a, #1e2f6f);
}

/* Improve focus states for accessibility */
a:focus {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
}

/* Add subtle hover animation for secondary CTA */
a:not(:first-child):hover {
  transform: translateY(-2px);
}
</style>