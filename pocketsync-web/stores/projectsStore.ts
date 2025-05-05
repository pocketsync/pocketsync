
import { defineStore } from 'pinia'
import type {
    ProjectResponseDto,
    CreateProjectDto,
    UpdateProjectDto,
    CreateAuthTokenDto,
    SyncActivityDto
} from '~/api-client/model'
import { useProjects } from '~/composables/useProjects'

interface ProjectError {
    message: string
    code: string
    details?: Record<string, string[]>
}

interface PaginationState {
    page: number
    limit: number
    total: number
    hasMore: boolean
}

export const useProjectsStore = defineStore('projects', {
    state: () => ({
        projects: [] as ProjectResponseDto[],
        currentProject: null as ProjectResponseDto | null,
        isLoading: false,
        error: null as ProjectError | null,
        paginationState: {
            page: 1,
            limit: 10,
            total: 0,
            hasMore: false
        } as PaginationState,
        syncActivity: null as SyncActivityDto | null,
    }),
    actions: {
        async fetchProjects(page = 1, limit = 10) {
            const projectsComposable = useProjects()

            try {
                this.isLoading = true
                const result = await projectsComposable.fetchProjects(page, limit)

                this.projects = projectsComposable.projects.value
                this.error = projectsComposable.error.value

                if (result && result.data) {
                    const projectsData = result.data as ProjectResponseDto[]
                    this.paginationState = {
                        page,
                        limit,
                        total: result.totalPages || 0,
                        hasMore: projectsData.length === limit
                    }
                }

                return result
            } catch (err) {
                this.error = projectsComposable.error.value
                throw err
            } finally {
                this.isLoading = false
            }
        },

        async loadMoreProjects() {
            if (this.paginationState.hasMore) {
                const nextPage = this.paginationState.page + 1;
                const projectsComposable = useProjects()

                try {
                    this.isLoading = true
                    const result = await projectsComposable.fetchProjects(nextPage, this.paginationState.limit)

                    this.projects = projectsComposable.projects.value
                    this.error = projectsComposable.error.value

                    if (result && result.data) {
                        const projectsData = result.data as ProjectResponseDto[]

                        this.paginationState = {
                            page: nextPage,
                            limit: this.paginationState.limit,
                            total: result.totalPages || 0,
                            hasMore: projectsData.length === this.paginationState.limit
                        }
                    }

                    return result
                } catch (err) {
                    this.error = projectsComposable.error.value
                    throw err
                } finally {
                    this.isLoading = false
                }
            }
        },

        async fetchProjectById(projectId: string) {
            const projectsComposable = useProjects()

            try {
                this.isLoading = true
                const result = await projectsComposable.fetchProjectById(projectId)
                this.currentProject = projectsComposable.currentProject.value
                this.error = projectsComposable.error.value
                return result
            } catch (err) {
                this.error = projectsComposable.error.value
                throw err
            } finally {
                this.isLoading = false
            }
        },

        async createProject(projectData: CreateProjectDto) {
            const projectsComposable = useProjects()

            try {
                this.isLoading = true
                const result = await projectsComposable.createProject(projectData)
                this.projects = projectsComposable.projects.value
                this.currentProject = projectsComposable.currentProject.value
                this.error = projectsComposable.error.value
                return result
            } catch (err) {
                this.error = projectsComposable.error.value
                throw err
            } finally {
                this.isLoading = false
            }
        },

        async updateProject(projectId: string, projectData: UpdateProjectDto) {
            const projectsComposable = useProjects()

            try {
                this.isLoading = true
                const result = await projectsComposable.updateProject(projectId, projectData)
                this.projects = projectsComposable.projects.value
                this.currentProject = projectsComposable.currentProject.value
                this.error = projectsComposable.error.value
                return result
            } catch (err) {
                this.error = projectsComposable.error.value
                throw err
            } finally {
                this.isLoading = false
            }
        },

        async deleteProject(projectId: string) {
            const projectsComposable = useProjects()

            try {
                this.isLoading = true
                await projectsComposable.deleteProject(projectId)
                this.projects = projectsComposable.projects.value
                this.currentProject = projectsComposable.currentProject.value
                this.error = projectsComposable.error.value
            } catch (err) {
                this.error = projectsComposable.error.value
                throw err
            } finally {
                this.isLoading = false
            }
        },

        async getSyncActivity(projectId: string) {
            const projectsComposable = useProjects()
            this.syncActivity = await projectsComposable.getSyncActivity(projectId)
        },

        async generateAuthToken(projectId: string, body: CreateAuthTokenDto) {
            const projectsComposable = useProjects()
            return await projectsComposable.generateAuthToken(projectId, body)
        },

        async revokeToken(tokenId: string) {
            const projectsComposable = useProjects()
            return await projectsComposable.revokeToken(tokenId)
        }
    },
})