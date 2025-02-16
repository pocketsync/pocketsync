import { ref } from 'vue'
import { useCookie } from 'nuxt/app'

import type { LoginDto, RegisterDto, UserResponseDto, ChangePasswordDto } from "~/api-client"
import { useApi } from './useApi'
import { AuthenticationApi } from "~/api-client"

interface AuthError {
    message: string
    code: AuthErrorCode
    details?: Record<string, string[]>
}

type AuthErrorCode =
    | 'NETWORK_ERROR'
    | 'INVALID_CREDENTIALS'
    | 'ACCESS_DENIED'
    | 'EMAIL_EXISTS'
    | 'VALIDATION_ERROR'
    | 'INVALID_TOKEN'
    | 'TOKEN_EXPIRED'
    | 'SOCIAL_AUTH_ERROR'
    | 'USER_NOT_FOUND'
    | 'UNKNOWN_ERROR'

export const useAuth = () => {
    const user = ref<UserResponseDto | null>(null)
    const isAuthenticated = ref(false)
    const isLoading = ref(false)
    const error = ref<AuthError | null>(null)

    // Initialize API client using the shared configuration
    const { config, axiosInstance } = useApi()
    const authApi = new AuthenticationApi(config, undefined, axiosInstance)

    // Cookie options
    const cookieOptions = {
        maxAge: 7 * 24 * 60 * 60, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: true
    }

    // Token management
    const accessTokenCookie = useCookie('access_token', cookieOptions)
    const refreshTokenCookie = useCookie('refresh_token', cookieOptions)

    const setTokens = (accessToken: string, refreshToken: string) => {
        accessTokenCookie.value = accessToken
        refreshTokenCookie.value = refreshToken
    }

    const clearTokens = () => {
        accessTokenCookie.value = null
        refreshTokenCookie.value = null
    }

    const handleAuthError = (err: any): AuthError => {
        // Network or connection errors
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
                if (data.code === 'TOKEN_EXPIRED') {
                    return {
                        message: 'Your session has expired. Please log in again.',
                        code: 'TOKEN_EXPIRED'
                    }
                }
                if (data.code === 'USER_NOT_FOUND') {
                    return {
                        message: 'Account not found. Please check your email or register a new account.',
                        code: 'USER_NOT_FOUND'
                    }
                }
                return {
                    message: 'Invalid credentials. Please check your email and password.',
                    code: 'INVALID_CREDENTIALS'
                }
            case 403:
                return {
                    message: 'Access denied. Please log in again.',
                    code: 'ACCESS_DENIED'
                }
            case 409:
                return {
                    message: 'This email is already registered.',
                    code: 'EMAIL_EXISTS'
                }
            case 422:
                return {
                    message: data.message || 'Invalid input. Please check your information.',
                    code: 'VALIDATION_ERROR',
                    details: data.errors
                }
            case 500:
                return {
                    message: 'An internal server error occurred. Please try again later.',
                    code: 'UNKNOWN_ERROR'
                }
            default:
                return {
                    message: data.message || 'An unexpected error occurred. Please try again.',
                    code: 'UNKNOWN_ERROR'
                }
        }
    }

    // User profile management
    const fetchUserProfile = async () => {
        if (!isAuthenticated.value) return

        try {
            isLoading.value = true
            const response = await authApi.getCurrentUser()
            if (response.data) {
                user.value = response.data
            }
        } catch (err: any) {
            const authError = handleAuthError(err)
            error.value = authError
            if (authError.code === 'TOKEN_EXPIRED' || authError.code === 'INVALID_CREDENTIALS') {
                logout()
            }
            throw authError
        } finally {
            isLoading.value = false
        }
    }

    // Authentication methods
    const login = async (email: string, password: string) => {
        error.value = null
        try {
            isLoading.value = true
            const loginData: LoginDto = { email, password }
            const response = await authApi.loginUser(loginData)

            if (response.data) {
                setTokens(response.data.accessToken, response.data.refreshToken)
                isAuthenticated.value = true
                user.value = response.data.user
                await fetchUserProfile()
            }

            return response.data
        } catch (err: any) {
            error.value = handleAuthError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const register = async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
        error.value = null
        try {
            isLoading.value = true
            const registerData: RegisterDto = userData
            const response = await authApi.registerUser(registerData)

            if (response.data) {
                setTokens(response.data.accessToken, response.data.refreshToken)
                user.value = response.data.user
                isAuthenticated.value = true
            }

            return response.data
        } catch (err: any) {
            error.value = handleAuthError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const logout = () => {
        user.value = null
        isAuthenticated.value = false
        clearTokens()
        error.value = null
    }

    // Social authentication methods
    const loginWithGithub = async () => {
        error.value = null
        try {
            window.location.href = `${config.basePath}/auth/github`
        } catch (err: any) {
            error.value = handleAuthError(err)
            throw error.value
        }
    }

    const loginWithGoogle = async () => {
        error.value = null
        try {
            window.location.href = `${config.basePath}/auth/google`
        } catch (err: any) {
            error.value = handleAuthError(err)
            throw error.value
        }
    }

    // Initialize authentication state
    const initAuth = async () => {
        const token = useCookie('access_token').value
        if (token) {
            isAuthenticated.value = true
        }
    }

    // Initialize auth state but don't fetch profile yet
    initAuth()

    // Lazy profile loading
    const ensureUserProfile = async () => {
        if (isAuthenticated.value && !user.value) {
            await fetchUserProfile()
        }
    }

    const changePassword = async (currentPassword: string | null, newPassword: string) => {
        error.value = null
        try {
            isLoading.value = true
            const changePasswordData: ChangePasswordDto = { currentPassword, newPassword }
            await authApi.changePassword(changePasswordData)
        } catch (err: any) {
            error.value = handleAuthError(err)
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

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        loginWithGithub,
        loginWithGoogle,
        fetchUserProfile,
        ensureUserProfile,
        setTokens,
        changePassword,
        updateProfile,
        requestPasswordReset,
        resetPassword,
    }
}