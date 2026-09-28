import { defineNuxtPlugin } from '#app'
import { getExtensionAssetBaseURL } from '../utils/extension-asset-base'

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
