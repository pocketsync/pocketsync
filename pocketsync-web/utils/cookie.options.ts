export const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: true,
    httpOnly: import.meta.server,
}
