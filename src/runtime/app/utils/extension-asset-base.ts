export function getExtensionAssetBaseURL(currentOrigin: string, navigationURL?: string) {
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
