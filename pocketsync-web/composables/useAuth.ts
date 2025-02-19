import { ref } from 'vue'
import { AuthenticationApi } from '~/api-client'
import type { LoginDto, UserResponseDto } from '~/api-client'
import { cookieOptions, ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '~/utils/cookie.options'

interface AuthError {
    message: string
    code: AuthErrorCode
    details?: Record<string, string[]>
}

type AuthErrorCode =
    | 'NETWORK_ERROR'
    | 'INVALID_CREDENTIALS'
    | 'SOCIAL_AUTH_ERROR'
    | 'ACCESS_DENIED'
    | 'VALIDATION_ERROR'
    | 'UNKNOWN_ERROR'

export const useAuth = () => {
    const user = useState<UserResponseDto | null>('user', () => null)
    const isAuthenticated = ref(false)
    const isLoading = ref(false)
    const error = ref<AuthError | null>(null)

    const { config, axiosInstance } = useApi()
    const authApi = new AuthenticationApi(config, undefined, axiosInstance)

    const handleAuthError = (err: any): AuthError => {
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
            case 401:
                return {
                    message: data.message || 'Invalid credentials. Please check your email and password.',
                    code: 'INVALID_CREDENTIALS'
                }
            case 403:
                return {
                    message: 'Access denied. Please check your permissions.',
                    code: 'ACCESS_DENIED'
                }
            default:
                return {
                    message: data.message || 'An unexpected error occurred. Please try again.',
                    code: 'UNKNOWN_ERROR'
                }
        }
    }

    const signIn = async (credentials: LoginDto) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await authApi.loginUser(credentials)
            const { accessToken, refreshToken } = response.data
            const accessTokenCookie = useCookie(ACCESS_TOKEN_COOKIE_NAME, cookieOptions)
            const refreshTokenCookie = useCookie(REFRESH_TOKEN_COOKIE_NAME, cookieOptions)

            accessTokenCookie.value = accessToken
            refreshTokenCookie.value = refreshToken
            user.value = response.data.user
            isAuthenticated.value = true
        } catch (err: any) {
            error.value = handleAuthError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const signInWithProvider = async (provider: 'github' | 'google') => {
        error.value = null
        try {
            const config = useRuntimeConfig()
            const backendUrl = config.public.apiBaseUrl
            isLoading.value = true
            if (provider === 'github') {
                window.location.href = `${backendUrl}/auth/github`
            } else if (provider === 'google') {
                window.location.href = `${backendUrl}/auth/google`
            }
        } catch (err: any) {
            error.value = {
                message: err.message || 'An error occurred during social sign in',
                code: 'SOCIAL_AUTH_ERROR'
            }
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const signOut = async () => {
        error.value = null
        try {
            user.value = null
            isAuthenticated.value = false
            navigateTo('/auth/login')
        } catch (err: any) {
            error.value = {
                message: 'Error during sign out. Please try again.',
                code: 'UNKNOWN_ERROR'
            }
            throw error.value
        }
    }

    const getCurrentUser = async () => {
        error.value = null
        try {
            const response = await authApi.getCurrentUser()
            user.value = response.data
            isAuthenticated.value = true
            return response.data
        } catch (err: any) {
            user.value = null
            isAuthenticated.value = false
            error.value = handleAuthError(err)
            throw error.value
        }
    }

    const updateProfile = async ({ data }: { data: { firstName: string; lastName: string } }) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await authApi.updateProfile(data)
            user.value = response.data
            return response.data
        } catch (err: any) {
            error.value = handleAuthError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const changePassword = async ({ data }: { data: { currentPassword: string; newPassword: string } }) => {
        error.value = null
        try {
            isLoading.value = true
            await authApi.changePassword(data)
        } catch (err: any) {
            error.value = handleAuthError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        signIn,
        signInWithProvider,
        signOut,
        getCurrentUser,
        updateProfile,
        changePassword
    }
}