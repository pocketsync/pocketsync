<template>
    <div class="min-h-screen flex flex-col">
        <!-- Navbar -->
       <Navbar />

        <!-- Main Content -->
        <main class="flex-grow mt-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <slot />
            </div>
        </main>

        <!-- Footer -->
        <Footer />
    </div>
</template>

<style scoped>
.get-started-btn {
    position: relative;
    overflow: hidden;
}

.get-started-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: 0.5s;
}

.get-started-btn:hover::after {
    left: 100%;
}
</style>