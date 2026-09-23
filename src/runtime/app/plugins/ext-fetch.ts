import { defineNuxtPlugin, useRuntimeConfig } from '#app'

export default defineNuxtPlugin({
  name: 'twitch-ext',
  parallel: true,
  setup() {
    const config = useRuntimeConfig()
    globalThis.extFetch = $fetch.create({
      baseURL: import.meta.dev ? '' : config.public.twitchExt.ebs.baseURL,
    })
  },
})
