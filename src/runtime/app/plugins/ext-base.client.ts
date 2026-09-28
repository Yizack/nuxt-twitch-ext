import { defineNuxtPlugin } from '#app'

const getExtensionAssetBaseURL = (currentOrigin: string, navigationURL?: string) => {
  if (!navigationURL) return

  try {
    const pageURL = new URL(navigationURL)
    if (pageURL.origin !== currentOrigin) return

    return new URL('.', pageURL).href
  }
  catch {
    return
  }
}

export default defineNuxtPlugin({
  name: 'nuxt-twitch-ext:ext-base',
  parallel: true,
  setup: () => {
    const navigationURL = performance.getEntriesByType('navigation')[0]?.name
    const extensionAssetBaseURL = getExtensionAssetBaseURL(location.origin, navigationURL)
    if (!extensionAssetBaseURL) return

    let base = document.querySelector('base')
    if (base) {
      base.href = extensionAssetBaseURL
    }
    else {
      base = document.createElement('base')
      base.href = extensionAssetBaseURL
      document.head.prepend(base)
    }
  },
})
