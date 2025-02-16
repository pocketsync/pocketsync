<template>
    <div class="construction-banner">
        <div class="banner-content">
            <h1>🚧 Under Construction 🚧</h1>
            <p>Documentation is currently being built. Please check back later.</p>
        </div>
    </div>
</template>

<style scoped>
.construction-banner {
    width: 100%;
    min-height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 2rem;
}

.banner-content {
    max-width: 600px;
}

.banner-content h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.banner-content p {
    font-size: 1.2rem;
    color: #666;
}
</style>

<script setup>
definePageMeta({
    layout: 'default'
})
</script>
