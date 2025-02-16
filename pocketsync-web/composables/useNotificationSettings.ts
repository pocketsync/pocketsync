import { ref } from 'vue'
import { NotificationSettingsApi, type NotificationSettingsDto } from '~/api-client'
import { useApi } from './useApi'
import { useToast } from './useToast'

interface NotificationError {
    message: string
    code: 'NETWORK_ERROR' | 'ACCESS_DENIED' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNKNOWN_ERROR'
    details?: Record<string, string[]>
}

export const useNotificationSettings = () => {
    const settings = ref<NotificationSettingsDto | null>(null)
    const isLoading = ref(false)
    const error = ref<NotificationError | null>(null)

    const { config, axiosInstance } = useApi()
    const notificationApi = new NotificationSettingsApi(config, undefined, axiosInstance)
    const { success, error: errorToast } = useToast()

    const handleError = (err: any): NotificationError => {
        if (!err.response) {
            return {
                message: 'Network error. Please check your connection.',
                code: 'NETWORK_ERROR'
            }
        }

        const status = err.response.status
        const data = err.response.data

        switch (status) {
            case 403:
                return {
                    message: 'Access denied.',
                    code: 'ACCESS_DENIED'
                }
            case 404:
                return {
                    message: 'Settings not found.',
                    code: 'NOT_FOUND'
                }
            case 422:
                return {
                    message: data.message || 'Invalid settings.',
                    code: 'VALIDATION_ERROR',
                    details: data.errors
                }
            default:
                return {
                    message: data.message || 'An unexpected error occurred.',
                    code: 'UNKNOWN_ERROR'
                }
        }
    }

    const fetchSettings = async () => {
        error.value = null
        try {
            isLoading.value = true
            const response = await notificationApi.getNotificationSettings()
            settings.value = response.data
            return response.data
        } catch (err: any) {
            error.value = handleError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const updateSettings = async (settingsData: any) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await notificationApi.updateNotificationSettings(settingsData)
            settings.value = response.data
            success('Notification settings updated successfully')
            return response.data
        } catch (err: any) {
            error.value = handleError(err)
            errorToast(error.value.message)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    return {
        settings,
        isLoading,
        error,
        fetchSettings,
        updateSettings
    }
}