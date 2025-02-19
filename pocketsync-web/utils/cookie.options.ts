import type { CookieOptions } from "#app"

export const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    secure: true,
    sameSite: "strict",
    httpOnly: import.meta.server,
} as CookieOptions

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token'
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'