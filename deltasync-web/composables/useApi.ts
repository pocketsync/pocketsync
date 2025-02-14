import { Configuration } from "~/api-client"
import { useCookie } from "nuxt/app"

export const useApi = () => {
    // Initialize API client configuration
    const config = new Configuration({
        basePath: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
        baseOptions: {
            onBeforeRequest: async (config) => {
                const accessToken = useCookie('access_token').value
                if (accessToken) {
                    config.headers = config.headers || {}
                    config.headers['Authorization'] = `Bearer ${accessToken}`
                }
                return config
            }
        }
    })

    return {
        config
    }
}