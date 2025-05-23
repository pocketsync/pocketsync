import { useState } from '#app'
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
    const isAuthenticated = useState<boolean>('isAuthenticated', () => false)
    const isSessionValidated = useState<boolean>('isSessionValidated', () => false)
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
                    message: data.message || 'Access denied. Please check your permissions.',
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
            isSessionValidated.value = true
        } catch (err: any) {
            isAuthenticated.value = false
            isSessionValidated.value = false
            user.value = null
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
            const accessTokenCookie = useCookie(ACCESS_TOKEN_COOKIE_NAME, cookieOptions)
            const refreshTokenCookie = useCookie(REFRESH_TOKEN_COOKIE_NAME, cookieOptions)
            accessTokenCookie.value = null
            refreshTokenCookie.value = null

            user.value = null
            isAuthenticated.value = false
            isSessionValidated.value = false
            await navigateTo('/auth/login') 
        } catch (err: any) {
            user.value = null
            isAuthenticated.value = false
            isSessionValidated.value = false
            error.value = {
                message: 'Error during sign out. Please try again.',
                code: 'UNKNOWN_ERROR'
            }
            throw error.value
        }
    }

    const getCurrentUser = async () => {
        if (isSessionValidated.value && user.value) {
            if (!isAuthenticated.value) isAuthenticated.value = true;
            return user.value; 
        }

        const accessTokenCookie = useCookie(ACCESS_TOKEN_COOKIE_NAME)
        if (!accessTokenCookie.value) {
            user.value = null
            isAuthenticated.value = false
            isSessionValidated.value = false
            return null; 
        }

        error.value = null
        try {
            const response = await authApi.getCurrentUser()
            user.value = response.data
            isAuthenticated.value = true
            isSessionValidated.value = true
            return response.data
        } catch (err: any) {
            user.value = null
            isAuthenticated.value = false
            isSessionValidated.value = false
            throw handleAuthError(err); 
        } finally {
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

    const signUp = async (data: { email: string; password: string; firstName: string; lastName: string }) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await authApi.registerUser(data)
            const { accessToken, refreshToken } = response.data
            const accessTokenCookie = useCookie(ACCESS_TOKEN_COOKIE_NAME, cookieOptions)
            const refreshTokenCookie = useCookie(REFRESH_TOKEN_COOKIE_NAME, cookieOptions)

            accessTokenCookie.value = accessToken
            refreshTokenCookie.value = refreshToken
            user.value = response.data.user
            isAuthenticated.value = true
            isSessionValidated.value = true
            return response.data
        } catch (err: any) {
            isAuthenticated.value = false
            isSessionValidated.value = false
            user.value = null
            error.value = handleAuthError(err)
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
            error.value = handleAuthError(err)
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
            error.value = handleAuthError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const handleSocialCallback = async (accessToken: string, refreshToken: string) => {
        error.value = null
        try {
            isLoading.value = true
            const accessTokenCookie = useCookie(ACCESS_TOKEN_COOKIE_NAME, cookieOptions)
            const refreshTokenCookie = useCookie(REFRESH_TOKEN_COOKIE_NAME, cookieOptions)
            accessTokenCookie.value = accessToken
            refreshTokenCookie.value = refreshToken
            
            const userData = await authApi.getCurrentUser()
            
            user.value = userData.data
            isAuthenticated.value = true
            isSessionValidated.value = true
            return userData.data
        } catch (err: any) {
            user.value = null
            isAuthenticated.value = false
            isSessionValidated.value = false
            error.value = handleAuthError(err)
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
            await getCurrentUser()
        } catch (err: any) {
            error.value = handleAuthError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const sendEmailVerification = async () => {
        error.value = null
        try {
            isLoading.value = true
            await authApi.resendEmailVerification()
        } catch (err: any) {
            error.value = handleAuthError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const deleteAccount = async (password: string) => {
        error.value = null
        try {
            isLoading.value = true
            await authApi.deleteAccount({ password })
            
            // Clear user data and tokens after successful deletion
            const accessTokenCookie = useCookie(ACCESS_TOKEN_COOKIE_NAME, cookieOptions)
            const refreshTokenCookie = useCookie(REFRESH_TOKEN_COOKIE_NAME, cookieOptions)
            accessTokenCookie.value = null
            refreshTokenCookie.value = null

            user.value = null
            isAuthenticated.value = false
            isSessionValidated.value = false
            
            return true
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
        isSessionValidated,
        isLoading,
        error,
        signIn,
        signInWithProvider,
        signOut,
        requestPasswordReset,
        resetPassword,
        changePassword,
        getCurrentUser,
        updateProfile,
        handleSocialCallback,
        sendEmailVerification,
        verifyEmail,
        signUp,
        deleteAccount,
    }
}