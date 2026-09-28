import { ref } from 'vue'

export const extAsset = (path: string) => {
  const assetPath = ref(path)
  if (import.meta.dev) return assetPath.value

  if (import.meta.client) {
    const basePath = new URL('..', import.meta.url)
    assetPath.value = basePath.pathname + path.replace(/^\//, '')
  }
  else {
    assetPath.value = path.replace(/^\//, './')
  }

  return assetPath.value
}
