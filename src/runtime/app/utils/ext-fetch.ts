import { useRuntimeConfig } from '#app'

const ebsURL = import.meta.dev ? '' : useRuntimeConfig().public.twitchExt.ebs.baseURL

export const extFetch = $fetch.create({
  baseURL: ebsURL,
})
