import { Configuration } from 'deltasync-web-client'

export const useApi = () => {
    // Initialize API client configuration
    const config = new Configuration({
        basePath: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
    })

    return {
        config
    }
}