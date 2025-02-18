export const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    secure: true,
    sameSite: true,
    httpOnly: import.meta.server,
}
