import { ref } from 'vue'
import { useCookie } from 'nuxt/app'

import type { LoginDto, RegisterDto, UserResponseDto } from 'web-client'
import { useApi } from './useApi'
import { AuthenticationApi } from 'web-client'

export const useAuth = () => {
    const user = ref<UserResponseDto | null>(null)
    const isAuthenticated = ref(false)
    const isLoading = ref(false)

    // Initialize API client using the shared configuration
    const { config } = useApi()
    const authApi = new AuthenticationApi(config)

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

    // Authentication methods
    const login = async (email: string, password: string) => {
        try {
            isLoading.value = true
            const loginData: LoginDto = { email, password }
            const response = await authApi.loginUser(loginData)

            if (response.data) {
                setTokens(response.data.accessToken, response.data.refreshToken)
                user.value = response.data.user
                isAuthenticated.value = true
            }

            return response.data
        } catch (error) {
            throw error
        } finally {
            isLoading.value = false
        }
    }

    const register = async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
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
        } catch (error) {
            throw error
        } finally {
            isLoading.value = false
        }
    }

    const logout = () => {
        user.value = null
        isAuthenticated.value = false
        clearTokens()
    }

    const refreshToken = async () => {
        try {
            const currentRefreshToken = refreshTokenCookie.value
            if (!currentRefreshToken) {
                throw new Error('No refresh token available')
            }

            const response = await authApi.refreshToken({ refreshToken: currentRefreshToken })

            if (response.data) {
                setTokens(response.data.accessToken, response.data.refreshToken)
                return response.data
            }
        } catch (error) {
            logout()
            throw error
        }
    }

    // Social authentication methods
    const loginWithGithub = async () => {
        try {
            await authApi.initiateGithubAuth()
        } catch (error) {
            throw error
        }
    }

    const loginWithGoogle = async () => {
        try {
            await authApi.initiateGoogleAuth()
        } catch (error) {
            throw error
        }
    }

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
        loginWithGithub,
        loginWithGoogle
    }
}