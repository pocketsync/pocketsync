<template>
    <PageBreadcrumb :pageTitle="'Settings'" />
    <div>
        <div class="space-y-6">
            <NotificationSettings />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import NotificationSettings from '~/components/profile/notification-settings.vue'
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue'

definePageMeta({
    layout: 'dashboard'
})
</script>