<script setup lang="ts">
import Footer from '~/components/layout/default/Footer.vue';
import NavBar from '~/components/layout/default/NavBar.vue';

const route = useRoute();

const useContentWrapper = () => {
    return route.name !== 'index'
};
</script>

<template>
    <div class="min-h-screen flex flex-col">
        <!-- Navbar -->
        <NavBar />

        <!-- Main Content -->
        <main class="flex-grow mt-16">
            <div v-if="useContentWrapper()" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <slot />
            </div>
            <slot v-else />
        </main>

        <!-- Footer -->
        <Footer />
    </div>
</template>
