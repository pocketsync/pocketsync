import type { UserResponseDto } from "~/api-client"
import { format } from 'date-fns'

export function useUtils() {
    const getUserInitials = (user: UserResponseDto | null): string => {
        if (!user?.firstName) return ''
        return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
    }

    const formatDuration = (durationMs: number | undefined): string => {
        if (!durationMs) return 'N/A'

        const seconds = Math.floor(durationMs / 1000)
        if (seconds < 60) return `${seconds}s`

        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60

        if (minutes < 60) return `${minutes}m ${remainingSeconds}s`

        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60

        return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    // Format date with full details
    const formatDateFull = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return format(date, 'MMM d, yyyy h:mm:ss a')
        } catch (e) {
            return dateString
        }
    }

    const truncateId = (id: string): string => {
        if (!id) return ''
        return id.length > 8 ? `${id.slice(0, 8)}...` : id
    }

    return {
        getUserInitials,
        formatDuration,
        formatDate,
        formatDateFull,
        truncateId
    }
}
