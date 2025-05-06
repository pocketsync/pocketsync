import { ref } from 'vue'
import type { ProjectResponseDto, CreateProjectDto, UpdateProjectDto, CreateAuthTokenDto } from '~/api-client'
import { ProjectsApi } from '~/api-client'
import { useApi } from './useApi'
import { useToast } from './useToast'

interface ProjectError {
    message: string
    code: ProjectErrorCode
    details?: Record<string, string[]>
}

type ProjectErrorCode =
    | 'NETWORK_ERROR'
    | 'ACCESS_DENIED'
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'UNKNOWN_ERROR'

export const useProjects = () => {
    const { success, error: errorToast } = useToast()
    const projects = ref<ProjectResponseDto[]>([])
    const currentProject = ref<ProjectResponseDto | null>(null)
    const isLoading = ref(false)
    const error = ref<ProjectError | null>(null)
    const paginationState = ref({
        page: 1,
        limit: 10,
        total: 0,
        hasMore: false
    })

    const { config, axiosInstance } = useApi()
    const projectsApi = new ProjectsApi(config, undefined, axiosInstance)

    const handleProjectError = (err: any): ProjectError => {
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
                    message: 'Access denied. You do not have permission to perform this action.',
                    code: 'ACCESS_DENIED'
                }
            case 404:
                projects.value = []
                currentProject.value = null
                navigateTo('/console')
                return {
                    message: 'Project not found.',
                    code: 'NOT_FOUND'
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

    const fetchProjects = async (page = 1, limit = 10) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await projectsApi.getAllProjects(page, limit)
            if (response.data && response.data.data) {
                const projectsResponse = response.data;
                const projectsData = projectsResponse.data as ProjectResponseDto[];

                if (page === 1) {
                    projects.value = projectsData;
                } else {
                    projects.value = [...projects.value, ...projectsData];
                }

                paginationState.value = {
                    page,
                    limit,
                    total: projectsResponse.totalPages || 0,
                    hasMore: projectsData.length === limit
                };
            }
            return response.data
        } catch (err: any) {
            error.value = handleProjectError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const loadMoreProjects = async () => {
        if (paginationState.value.hasMore) {
            return fetchProjects(paginationState.value.page + 1, paginationState.value.limit)
        }
    }

    const fetchProjectById = async (projectId: string) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await projectsApi.getProjectById(projectId)
            if (response.data) {
                currentProject.value = response.data
            }
            return response.data
        } catch (err: any) {
            error.value = handleProjectError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const createProject = async (projectData: CreateProjectDto) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await projectsApi.createProject(projectData)
            if (response.data) {
                projects.value = [...projects.value, response.data]
                currentProject.value = response.data
            }
            return response.data
        } catch (err: any) {
            error.value = handleProjectError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const updateProject = async (projectId: string, projectData: UpdateProjectDto) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await projectsApi.updateProject(projectId, projectData)
            if (response.data) {
                projects.value = projects.value.map(p =>
                    p.id === projectId ? response.data : p
                )
                if (currentProject.value?.id === projectId) {
                    currentProject.value = response.data
                }
            }
            return response.data
        } catch (err: any) {
            error.value = handleProjectError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const deleteProject = async (projectId: string) => {
        error.value = null
        try {
            isLoading.value = true
            await projectsApi.deleteProject(projectId)
            projects.value = projects.value.filter(p => p.id !== projectId)
            if (currentProject.value?.id === projectId) {
                currentProject.value = null
            }
        } catch (err: any) {
            error.value = handleProjectError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const generateAuthToken = async (projectId: string, body: CreateAuthTokenDto) => {
        try {
            const response = await projectsApi.generateAuthToken(projectId, body)
            return response.data
        } catch (error: any) {
            errorToast(error.response?.data?.message || 'Failed to generate token')
            return null
        }
    }

    const revokeToken = async (tokenId: string) => {
        try {
            await projectsApi.revokeAuthToken(tokenId)
            return true
        } catch (error: any) {
            errorToast(error.response?.data?.message || 'Failed to revoke token')
            return false
        }
    }

    const getSyncActivity = async (projectId: string) => {
        try {
            const response = await projectsApi.getSyncActivity(projectId)
            return response.data
        } catch (error: any) {
            errorToast(error.response?.data?.message || 'Failed to get sync activity')
            return null
        }
    }

    return {
        projects,
        currentProject,
        isLoading,
        error,
        paginationState,
        fetchProjects,
        fetchProjectById,
        createProject,
        updateProject,
        deleteProject,
        loadMoreProjects,
        generateAuthToken,
        revokeToken,
        getSyncActivity
    }
}