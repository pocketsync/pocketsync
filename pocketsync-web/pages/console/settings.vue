<template>
    <div>
        <div class="space-y-6">
            <NotificationSettings />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import NotificationSettings from '~/components/profile/notification-settings.vue'

definePageMeta({
    layout: 'dashboard'
})

// Settings data
const settings = ref({
    language: 'en',
    timezone: 'UTC',
    twoFactorEnabled: false
})
</script>