import { defineStore } from 'pinia'
import type {
    DeviceChangeDto,
    DeviceChangeResponseDto,
    DeviceChangeTimelineDto,
    TableChangesSummaryResponseDto
} from '~/api-client/model'
import { useDeviceChanges } from '~/composables/useDeviceChanges'

interface DeviceChangesError {
    message: string
    code: string
    details?: Record<string, string[]>
}

interface PaginationState {
    page: number
    limit: number
    total: number
    pages: number
    hasMore: boolean
}

export const useDeviceChangesStore = defineStore('deviceChanges', {
    state: () => ({
        deviceChanges: [] as DeviceChangeDto[],
        changesByTable: {} as TableChangesSummaryResponseDto,
        recordTimeline: null as DeviceChangeTimelineDto | null,
        currentDeviceChange: null as DeviceChangeResponseDto | null,
        isLoading: false,
        error: null as DeviceChangesError | null,
        paginationState: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
            hasMore: false
        } as PaginationState,
        filters: {
            tableName: undefined as string | undefined,
            recordId: undefined as string | undefined,
            changeType: undefined as string | undefined,
            deviceId: undefined as string | undefined,
            userIdentifier: undefined as string | undefined,
            startDate: undefined as string | undefined,
            endDate: undefined as string | undefined
        }
    }),
    actions: {
        async fetchDeviceChanges(projectId: string, page = 1, limit = 10) {
            const deviceChangesComposable = useDeviceChanges()

            try {
                this.isLoading = true
                const result = await deviceChangesComposable.fetchDeviceChanges(
                    projectId,
                    {
                        ...this.filters,
                        page,
                        limit
                    }
                )

                this.deviceChanges = deviceChangesComposable.deviceChanges.value
                this.error = deviceChangesComposable.error.value

                if (result) {
                    const deviceChangesResponse = result as DeviceChangeResponseDto
                    this.paginationState = {
                        page,
                        limit,
                        total: deviceChangesResponse.total || 0,
                        pages: deviceChangesResponse.pages || 0,
                        hasMore: page < (deviceChangesResponse.pages || 0)
                    }
                }

                return result
            } catch (err) {
                this.error = deviceChangesComposable.error.value
                throw err
            } finally {
                this.isLoading = false
            }
        },

        async loadMoreDeviceChanges(projectId: string) {
            if (this.paginationState.hasMore) {
                const nextPage = this.paginationState.page + 1
                const deviceChangesComposable = useDeviceChanges()

                try {
                    this.isLoading = true
                    const result = await deviceChangesComposable.fetchDeviceChanges(
                        projectId,
                        {
                            ...this.filters,
                            page: nextPage,
                            limit: this.paginationState.limit
                        }
                    )

                    this.deviceChanges = deviceChangesComposable.deviceChanges.value
                    this.error = deviceChangesComposable.error.value

                    if (result) {
                        const deviceChangesResponse = result as DeviceChangeResponseDto
                        this.paginationState = {
                            page: nextPage,
                            limit: this.paginationState.limit,
                            total: deviceChangesResponse.total || 0,
                            pages: deviceChangesResponse.pages || 0,
                            hasMore: nextPage < (deviceChangesResponse.pages || 0)
                        }
                    }

                    return result
                } catch (err) {
                    this.error = deviceChangesComposable.error.value
                    throw err
                } finally {
                    this.isLoading = false
                }
            }
        },

        async fetchDeviceChangeById(projectId: string, changeId: string) {
            const deviceChangesComposable = useDeviceChanges()

            try {
                this.isLoading = true
                const result = await deviceChangesComposable.fetchDeviceChangeById(projectId, changeId)
                this.currentDeviceChange = deviceChangesComposable.currentDeviceChange.value
                this.error = deviceChangesComposable.error.value
                return result
            } catch (err) {
                this.error = deviceChangesComposable.error.value
                throw err
            } finally {
                this.isLoading = false
            }
        },

        async fetchChangesByTable(projectId: string) {
            const deviceChangesComposable = useDeviceChanges()

            try {
                this.isLoading = true
                const result = await deviceChangesComposable.fetchChangesByTable(projectId)
                this.changesByTable = deviceChangesComposable.changesByTable.value
                this.error = deviceChangesComposable.error.value
                return result
            } catch (err) {
                this.error = deviceChangesComposable.error.value
                throw err
            } finally {
                this.isLoading = false
            }
        },

        async fetchRecordTimeline(projectId: string, tableName: string, recordId: string) {
            const deviceChangesComposable = useDeviceChanges()

            try {
                this.isLoading = true
                const result = await deviceChangesComposable.fetchRecordTimeline(projectId, tableName, recordId)
                this.recordTimeline = deviceChangesComposable.recordTimeline.value
                this.error = deviceChangesComposable.error.value
                return result
            } catch (err) {
                this.error = deviceChangesComposable.error.value
                throw err
            } finally {
                this.isLoading = false
            }
        },

        setFilters(filters: {
            tableName?: string
            recordId?: string
            changeType?: string
            deviceId?: string
            userIdentifier?: string
            startDate?: string
            endDate?: string
        }) {
            this.filters = {
                ...this.filters,
                ...filters
            }
        },

        clearFilters() {
            this.filters = {
                tableName: undefined,
                recordId: undefined,
                changeType: undefined,
                deviceId: undefined,
                userIdentifier: undefined,
                startDate: undefined,
                endDate: undefined
            }
        }
    }
})
