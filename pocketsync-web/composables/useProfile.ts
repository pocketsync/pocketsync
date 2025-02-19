import { ref } from 'vue'
import type { UserResponseDto, ChangePasswordDto } from "~/api-client"
import { useApi } from './useApi'
import { AuthenticationApi } from "~/api-client"

interface ProfileError {
    message: string
    code: ProfileErrorCode
    details?: Record<string, string[]>
}

type ProfileErrorCode =
    | 'NETWORK_ERROR'
    | 'ACCESS_DENIED'
    | 'VALIDATION_ERROR'
    | 'USER_NOT_FOUND'
    | 'UNKNOWN_ERROR'

export const useProfile = () => {
    const user = useState<UserResponseDto | null>('authenticated_user', () => null)
    const isLoading = ref(false)
    const error = ref<ProfileError | null>(null)

    const { config, axiosInstance } = useApi()
    const authApi = new AuthenticationApi(config, undefined, axiosInstance)

    const handleProfileError = (err: any): ProfileError => {
        if (!err.response || err.code === 'ECONNABORTED') {
            return {
                message: 'Network error. Please check your connection and try again.',
                code: 'NETWORK_ERROR'
            }
        }

        const status = err.response.status
        const data = err.response.data

        switch (status) {
            case 400:
                return {
                    message: data.message || 'Invalid request. Please check your input.',
                    code: 'VALIDATION_ERROR',
                    details: data.errors
                }
            case 403:
                return {
                    message: 'Access denied. Please check your permissions.',
                    code: 'ACCESS_DENIED'
                }
            case 404:
                return {
                    message: 'User not found.',
                    code: 'USER_NOT_FOUND'
                }
            case 422:
                return {
                    message: data.message || 'Invalid input. Please check your information.',
                    code: 'VALIDATION_ERROR',
                    details: data.errors
                }
            default:
                return {
                    message: data.message || 'An unexpected error occurred. Please try again.',
                    code: 'UNKNOWN_ERROR'
                }
        }
    }

    const fetchUserProfile = async () => {
        try {
            isLoading.value = true
            const response = await authApi.getCurrentUser()
            if (response.data) {
                user.value = response.data
            }
        } catch (err: any) {
            error.value = handleProfileError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const updateProfile = async (userData: { firstName: string; lastName: string }) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await authApi.updateProfile(userData)
            if (response.data) {
                user.value = response.data
            }
            return response.data
        } catch (err: any) {
            error.value = handleProfileError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const changePassword = async (currentPassword: string | null, newPassword: string) => {
        error.value = null
        try {
            isLoading.value = true
            const changePasswordData: ChangePasswordDto = { currentPassword, newPassword }
            await authApi.changePassword(changePasswordData)
        } catch (err: any) {
            error.value = handleProfileError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const verifyEmail = async (token: string) => {
        error.value = null
        try {
            isLoading.value = true
            await authApi.verifyEmail({ token })
        } catch (err: any) {
            error.value = handleProfileError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const resendEmailVerification = async () => {
        error.value = null
        try {
            isLoading.value = true
            await authApi.resendEmailVerification()
        } catch (err: any) {
            error.value = handleProfileError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const requestPasswordReset = async (email: string) => {
        error.value = null
        try {
            isLoading.value = true
            await authApi.requestPasswordReset({ email })
        } catch (err: any) {
            error.value = handleProfileError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const resetPassword = async (token: string, newPassword: string) => {
        error.value = null
        try {
            isLoading.value = true
            await authApi.resetPassword({ token, newPassword })
        } catch (err: any) {
            error.value = handleProfileError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    return {
        user,
        isLoading,
        error,
        fetchUserProfile,
        updateProfile,
        changePassword,
        verifyEmail,
        resendEmailVerification,
        requestPasswordReset,
        resetPassword
    }
}