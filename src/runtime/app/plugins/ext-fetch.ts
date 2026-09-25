import { defineNuxtPlugin, useRuntimeConfig } from '#app'

export default defineNuxtPlugin({
  name: 'nuxt-twitch-ext:ext-fetch',
  parallel: true,
  setup() {
    const config = useRuntimeConfig()
    let token: string | undefined
    let authorizationReady: Promise<void> | undefined

    if (import.meta.client && typeof Twitch !== 'undefined') {
      authorizationReady = new Promise((resolve) => {
        Twitch.ext.onAuthorized((auth) => {
          token = auth.token
          resolve()
        })
      })
    }

    globalThis.extFetch = $fetch.create({
      baseURL: import.meta.dev ? '' : config.public.twitchExt.ebs.baseURL,
      async onRequest({ request, options }) {
        if (!token && authorizationReady) {
          await authorizationReady
        }
        if (!token) return

        const ebsBaseURL = import.meta.dev ? window.location.origin : config.public.twitchExt.ebs.baseURL || window.location.origin
        const requestURL = new URL(String(request), ebsBaseURL)
        if (requestURL.origin !== new URL(ebsBaseURL).origin) return

        const headers = new Headers(options.headers)
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`)
        }
        options.headers = headers
      },
    })
  },
})
