<script setup lang="ts">
import { ref } from 'vue'
import { useNotificationSettings } from '~/composables/useNotificationSettings'
import ErrorAlert from '~/components/common/error-alert.vue'

const { settings, isLoading, error, fetchSettings, updateSettings } = useNotificationSettings()

onMounted(() => {
  initializeSettings()
})

const initializeSettings = async () => {
  try {
    await fetchSettings()
  } catch (err) {
  }
}

// Handle settings update
const handleSettingsUpdate = async (field: string, value: boolean) => {
  if (isLoading.value || !settings.value) return

  const updatedSettings = {
    emailEnabled: field === 'emailEnabled' ? value : settings.value.emailEnabled,
    marketingEnabled: field === 'marketingEnabled' ? value : settings.value.marketingEnabled
  }

  try {
    await updateSettings(updatedSettings)
  } catch (err) {
    // Error is already handled by the composable
    console.error('Failed to update notification settings:', err)
  }
}
</script>

<template>
  <div class="bg-white shadow-sm rounded-lg border border-gray-200">
    <div class="px-4 py-5 sm:p-6">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium text-gray-900">Notification Settings</h2>
      </div>

      <ErrorAlert v-if="error" :error="error" title="Error loading notification settings" />

      <div class="divide-y divide-gray-200">
        <div v-if="isLoading" class="flex justify-center py-4">
          <svg class="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </div>

        <div v-else-if="settings" class="space-y-4 py-4">
          <!-- Marketing notifications -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Marketing notifications</h3>
              <p class="text-sm text-gray-500">Receive emails about new features, updates, and company news.</p>
            </div>
            <button type="button"
              :class="[settings.marketingEnabled ? 'bg-indigo-600' : 'bg-gray-200', 'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2']"
              role="switch" :aria-checked="settings.marketingEnabled"
              @click="handleSettingsUpdate('marketingEnabled', !settings.marketingEnabled)">
              <span
                :class="[settings.marketingEnabled ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out']">
                <span
                  :class="[settings.marketingEnabled ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in', 'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity']"
                  aria-hidden="true">
                  <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                    <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span
                  :class="[settings.marketingEnabled ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out', 'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity']"
                  aria-hidden="true">
                  <svg class="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                    <path
                      d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                  </svg>
                </span>
              </span>
            </button>
          </div>

          <!-- Email notifications -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Email notifications</h3>
              <p class="text-sm text-gray-500">Receive email notifications about your account activity.</p>
            </div>
            <button type="button"
              :class="[settings.emailEnabled ? 'bg-indigo-600' : 'bg-gray-200', 'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2']"
              role="switch" :aria-checked="settings.emailEnabled"
              @click="handleSettingsUpdate('emailEnabled', !settings.emailEnabled)">
              <span
                :class="[settings.emailEnabled ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out']">
                <span
                  :class="[settings.emailEnabled ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in', 'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity']"
                  aria-hidden="true">
                  <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                    <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span
                  :class="[settings.emailEnabled ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out', 'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity']"
                  aria-hidden="true">
                  <svg class="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                    <path
                      d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                  </svg>
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>