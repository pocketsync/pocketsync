import { OpenPanel } from '@openpanel/web'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const op = new OpenPanel({
    clientId: config.public.OPENPANEL_CLIENT_ID,
    clientSecret: config.public.OPENPANEL_CLIENT_SECRET,
    trackScreenViews: true,
    trackOutgoingLinks: true,
    trackAttributes: true,
  })

  return {
    provide: {
      track: (name: string, properties = {}) => {
        console.log('Tracking event:', name, properties)
        return op.track(name, properties)
      }
    }
  }
})