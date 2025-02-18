export default defineEventHandler((event) => {
  // Skip API routes and static files
  if (event.path.startsWith('/api/') || event.path.match(/\.(ico|png|jpg|jpeg|svg|css|js|json)$/)) {
    return
  }

  // Set header to inform that this is an SPA
  setHeader(event, 'Cache-Control', 'no-cache')
})