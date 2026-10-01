import type { Nuxt } from '@nuxt/schema'

const unsupportedModules = [
  '@nuxtjs/color-mode',
  '@nuxthub/core',
  '@nuxtjs/sitemap',
]

export const disableModules = async (nuxt: Nuxt) => {
  if (nuxt.options.envName === 'twitchExt') {
    // @ts-expect-error Nuxt Color Mode options
    nuxt.options.colorMode = false

    // @ts-expect-error Nuxt UI options
    nuxt.options.ui ||= {}
    // @ts-expect-error Nuxt UI Color Mode
    nuxt.options.ui.colorMode = false

    // @ts-expect-error Nuxt Hub options
    nuxt.options.hub = false

    // @ts-expect-error Nuxt Sitemap options
    nuxt.options.sitemap = false

    // Remove module options functions for unsupported modules
    const moduleOptionsFunctions = nuxt._moduleOptionsFunctions
    if (moduleOptionsFunctions) {
      for (const module of moduleOptionsFunctions.keys()) {
        if (typeof module === 'string' && unsupportedModules.includes(module)) {
          moduleOptionsFunctions.delete(module)
        }
      }
    }
  }
  return {}
}
