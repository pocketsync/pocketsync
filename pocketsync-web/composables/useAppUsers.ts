import { ref } from 'vue'
import type { AppUserResponseList, AppUserResponseDto } from '~/api-client'
import { AppUsersApi } from '~/api-client/api/app-users-api'

export const useAppUsers = () => {
    const users = ref<AppUserResponseDto[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const totalUsers = ref(0)
    const currentPage = ref(1)

    const { config, axiosInstance } = useApi()
    const appUsersApi = new AppUsersApi(config, undefined, axiosInstance)

    const fetchProjectUsers = async (projectId: string, page: number = 1, limit: number = 10) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await appUsersApi.projectUsers(projectId, page, limit)
            const usersResponse = response.data as AppUserResponseList
            if (page === 1) {
                users.value = usersResponse.data!
            } else {
                users.value = [...users.value, ...usersResponse.data!]
            }
            totalUsers.value = response.data.total!
            currentPage.value = page
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch users'
            console.error('Error fetching project users:', err)
        } finally {
            isLoading.value = false
        }
    }

    const deleteUser = async (userId: string) => {
        error.value = null

        try {
            await appUsersApi.deleteAppUser(userId)
            // Remove the deleted user from the local state
            users.value = users.value.filter(user => user.userIdentifier !== userId)
            totalUsers.value--
        } catch (err: any) {
            error.value = err.message || 'Failed to delete user'
            console.error('Error deleting user:', err)
            throw err
        }
    }

    return {
        users,
        isLoading,
        error,
        totalUsers,
        currentPage,
        fetchProjectUsers,
        deleteUser
    }
}