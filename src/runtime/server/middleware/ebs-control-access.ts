import { defineEventHandler, sendNoContent, setHeaders } from 'h3'
import { createError, useRuntimeConfig } from '#imports'

export default defineEventHandler((event) => {
  const { twitchExt } = useRuntimeConfig(event)

  if (!event.path.startsWith(`/api/${twitchExt.ebs.dirname}/`)) return

  if (!twitchExt.clientId) {
    throw createError({
      status: 500,
      message: 'Missing `NUXT_TWITCH_EXT_CLIENT_ID` environment variable.',
    })
  }

  setHeaders(event, {
    'Access-Control-Allow-Origin': `https://${twitchExt.clientId}.ext-twitch.tv`,
  })

  if (event.method === 'OPTIONS') {
    setHeaders(event, {
      'Access-Control-Allow-Methods': twitchExt.ebs.preflight.allowMethods.join(', '),
      'Access-Control-Allow-Headers': twitchExt.ebs.preflight.allowHeaders.join(', '),
    })

    return sendNoContent(event)
  }
})
