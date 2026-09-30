import type { Nuxt } from '@nuxt/schema'
import { hasNuxtModule } from '@nuxt/kit'

export const disableDependencies = (nuxt: Nuxt) => {
  if (nuxt.options.envName === 'twitchExt') {
    if (hasNuxtModule('@nuxtjs/color-mode')) {
      // @ts-expect-error Nuxt Color Mode options
      nuxt.options.colorMode = false
    }

    if (hasNuxtModule('@nuxt/ui')) {
      // @ts-expect-error Nuxt UI options
      nuxt.options.ui ||= {}
      // @ts-expect-error Nuxt UI Color Mode
      nuxt.options.ui.colorMode = false
    }

    if (hasNuxtModule('@nuxthub/core')) {
      // @ts-expect-error Nuxt Hub options
      nuxt.options.hub = false
    }

    if (hasNuxtModule('@nuxtjs/sitemap')) {
      // @ts-expect-error Nuxt Sitemap options
      nuxt.options.sitemap = false
    }
  }
  return {}
}
