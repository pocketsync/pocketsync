import { Configuration } from "~/api-client"
import { useCookie } from "nuxt/app"
import axios from 'axios'
import type { AxiosInstance } from 'axios'

export const useApi = () => {
    let isRefreshing = false
    let failedQueue: Array<{
        resolve: (token: string) => void
        reject: (error: any) => void
    }> = []

    const processQueue = (error: any, token: string | null = null) => {
        failedQueue.forEach((prom) => {
            if (error) {
                prom.reject(error)
            } else {
                prom.resolve(token!)
            }
        })
        failedQueue = []
    }

    // Create axios instance
    const axiosInstance: AxiosInstance = axios.create({
        baseURL: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json'
        }
    })

    // Request interceptor for token injection
    axiosInstance.interceptors.request.use(
        (config) => {
            const accessToken = useCookie('access_token').value
            if (accessToken) {
                config.headers['Authorization'] = `Bearer ${accessToken}`
            }
            return config
        },
        (error) => {
            return Promise.reject(error)
        }
    )

    // Response interceptor for token refresh
    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config

            // If error is not 401 or request already retried, reject
            if (error.response?.status !== 401 || originalRequest._retry) {
                return Promise.reject(error)
            }

            if (isRefreshing) {
                try {
                    const token = await new Promise<string>((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    })
                    originalRequest.headers['Authorization'] = `Bearer ${token}`
                    return originalRequest
                } catch (err) {
                    return Promise.reject(err)
                }
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const refreshTokenValue = useCookie('refresh_token').value
                if (!refreshTokenValue) {
                    throw new Error('No refresh token available')
                }

                const response = await axios.post(
                    '/auth/token/refresh',
                    { refreshToken: refreshTokenValue },
                    {
                        baseURL: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
                        headers: { 'Content-Type': 'application/json' }
                    }
                )

                const { data } = response
                const newToken = data.accessToken

                if (newToken) {
                    // Update the access token cookie
                    useCookie('access_token').value = newToken
                    if (data.refreshToken) {
                        useCookie('refresh_token').value = data.refreshToken
                    }

                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`
                    processQueue(null, newToken)
                    return originalRequest
                }
            } catch (refreshError) {
                processQueue(refreshError, null)
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }
    )

    // Initialize API client configuration
    const config = new Configuration({
        basePath: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
    })

    return {
        config,
        axiosInstance
    }
}