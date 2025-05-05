<template>
    <app-header :show-menu-toggle="false" :show-project-select="false" />
    <div class="p-4 px-6 md:px-24 mx-auto max-w-(--breakpoint-2xl) md:p-6">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import AppHeader from '~/components/layout/dashboard/app-header.vue'
</script>