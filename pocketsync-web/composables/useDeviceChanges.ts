import { ref } from 'vue'
import type { DeviceChangeDto, DeviceChangeResponseDto, DeviceChangeTimelineDto, TableChangesSummaryResponseDto  } from '~/api-client'
import { DeviceChangesApi } from '~/api-client'
import { useApi } from './useApi'
import { useToast } from './useToast'

interface DeviceChangesError {
    message: string
    code: DeviceChangesErrorCode
    details?: Record<string, string[]>
}

type DeviceChangesErrorCode =
    | 'NETWORK_ERROR'
    | 'ACCESS_DENIED'
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'UNKNOWN_ERROR'

export const useDeviceChanges = () => {
    const { success, error: errorToast } = useToast()
    const deviceChanges = ref<DeviceChangeDto[]>([])
    const tableNames = ref<string[]>([])
    const changesByTable = ref<TableChangesSummaryResponseDto>({
        tables: []
    })
    const recordTimeline = ref<DeviceChangeTimelineDto | null>(null)
    const currentDeviceChange = ref<DeviceChangeResponseDto | null>(null)
    const isLoading = ref(false)
    const error = ref<DeviceChangesError | null>(null)
    const paginationState = ref({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        hasMore: false
    })

    const { config, axiosInstance } = useApi()
    const deviceChangesApi = new DeviceChangesApi(config, undefined, axiosInstance)

    const handleDeviceChangesError = (err: any): DeviceChangesError => {
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
                return {
                    message: 'Resource not found.',
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

    const fetchDeviceChanges = async (
        projectId: string,
        {
            tableName,
            recordId,
            changeType,
            deviceId,
            userIdentifier,
            startDate,
            endDate,
            page = 1,
            limit = 10
        }: {
            tableName?: string
            recordId?: string
            changeType?: string
            deviceId?: string
            userIdentifier?: string
            startDate?: string
            endDate?: string
            page?: number
            limit?: number
        } = {}
    ) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await deviceChangesApi.getDeviceChanges(
                projectId,
                tableName,
                recordId,
                changeType,
                deviceId,
                userIdentifier,
                startDate,
                endDate,
                page,
                limit
            )
            
            if (response.data) {
                const deviceChangesResponse = response.data as DeviceChangeResponseDto
                const deviceChangesData = deviceChangesResponse.items

                if (page === 1) {
                    deviceChanges.value = deviceChangesData
                } else {
                    deviceChanges.value = [...deviceChanges.value, ...deviceChangesData]
                }

                paginationState.value = {
                    page,
                    limit,
                    total: deviceChangesResponse.total || 0,
                    pages: deviceChangesResponse.pages || 0,
                    hasMore: page < (deviceChangesResponse.pages || 0)
                }
            }
            
            return response.data
        } catch (err: any) {
            error.value = handleDeviceChangesError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const loadMoreDeviceChanges = async (
        projectId: string,
        filters: {
            tableName?: string
            recordId?: string
            changeType?: string
            deviceId?: string
            userIdentifier?: string
            startDate?: string
            endDate?: string
        } = {}
    ) => {
        if (paginationState.value.hasMore) {
            return fetchDeviceChanges(
                projectId,
                {
                    ...filters,
                    page: paginationState.value.page + 1,
                    limit: paginationState.value.limit
                }
            )
        }
    }

    const fetchDeviceChangeById = async (projectId: string, changeId: string) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await deviceChangesApi.getDeviceChangeById(projectId, changeId)
            if (response.data) {
                currentDeviceChange.value = response.data as DeviceChangeResponseDto
            }
            return response.data
        } catch (err: any) {
            error.value = handleDeviceChangesError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const fetchChangesByTable = async (projectId: string) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await deviceChangesApi.getTableChangesSummary(projectId)
            if (response.data) {
                changesByTable.value = response.data
            }
            return response.data
        } catch (err: any) {
            error.value = handleDeviceChangesError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    const fetchRecordTimeline = async (projectId: string, tableName: string, recordId: string) => {
        error.value = null
        try {
            isLoading.value = true
            const response = await deviceChangesApi.getRecordTimeline(
                projectId,
                tableName,
                recordId
            )
            if (response.data) {
                recordTimeline.value = response.data as DeviceChangeTimelineDto
            }
            return response.data
        } catch (err: any) {
            error.value = handleDeviceChangesError(err)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    return {
        deviceChanges,
        tableNames,
        changesByTable,
        recordTimeline,
        currentDeviceChange,
        isLoading,
        error,
        paginationState,
        fetchDeviceChanges,
        loadMoreDeviceChanges,
        fetchDeviceChangeById,
        fetchChangesByTable,
        fetchRecordTimeline
    }
}
