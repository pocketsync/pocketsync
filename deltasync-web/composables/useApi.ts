import { Configuration } from "~/api-client"
import { useCookie } from "nuxt/app"

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

    // Initialize API client configuration
    const config = new Configuration({
        basePath: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
        baseOptions: {
            onBeforeRequest: async (config: any) => {
                const accessToken = useCookie('access_token').value
                if (accessToken) {
                    config.headers = config.headers || {}
                    config.headers['Authorization'] = `Bearer ${accessToken}`
                }
                return config
            },
            onError: async (error: any) => {
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

                    const refreshApi = new Configuration({
                        basePath: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
                    })

                    const response = await fetch(`${refreshApi.basePath}/auth/token/refresh`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ refreshToken: refreshTokenValue })
                    })

                    if (!response.ok) {
                        throw new Error('Failed to refresh token')
                    }

                    const data = await response.json()
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
        }
    })

    return {
        config
    }
}