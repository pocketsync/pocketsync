import type { UserResponseDto } from "~/api-client"

export function useUtils() {
    const getUserInitials = (user: UserResponseDto | null): string => {
        if (!user?.firstName) return ''
        return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
    }

    return {
        getUserInitials,
    }
}
