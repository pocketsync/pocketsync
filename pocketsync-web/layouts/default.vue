<script setup>
import Footer from '~/components/layout/default/Footer.vue';
import NavBar from '~/components/layout/default/NavBar.vue';

const route = useRoute();

const useContentWrapper = () => {
  return route.name !== 'index'
};

useHead({
  title: 'PocketSync - Effortless local-First Sync Solution',
  meta: [
    { name: 'description', content: 'PocketSync is a powerful local-first synchronization solution that helps you keep your data in sync across all your devices while maintaining privacy and security.' },
    { name: 'keywords', content: 'local-first, sync, synchronization, offline-first, data sync, privacy' },

    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'PocketSync - Effortless local-First Sync Solution' },
    { property: 'og:description', content: 'PocketSync is a powerful local-first synchronization solution that helps you keep your data in sync across all your devices while maintaining privacy and security.' },
    { property: 'og:site_name', content: 'PocketSync' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'PocketSync - Effortless local-First Sync Solution' },
    { name: 'twitter:description', content: 'PocketSync is a powerful local-first synchronization solution that helps you keep your data in sync across all your devices while maintaining privacy and security.' },
  ],
  link: [
    { rel: 'canonical', href: `https://pocketsync.io${route.path}` },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
  ]
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navbar -->
    <NavBar />

    <!-- Main Content -->
    <main class="flex-grow mt-16">

      <slot />

    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>
