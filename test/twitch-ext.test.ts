import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { $fetch, setup, useTestContext } from '@nuxt/test-utils/e2e'

await setup({
  rootDir: fileURLToPath(new URL('./fixtures/minimal', import.meta.url)),
  nuxtConfig: {
    envName: 'twitchExt',
  },
  build: true,
  dev: false,
})

const helperScript = '<script src="https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"></script>'

describe('twitch-ext', () => {
  const testContext = useTestContext()

  describe('panel.html', () => {
    it('renders the panel page', async () => {
      const html = await $fetch('/panel.html')
      expect(html).toContain('Panel Page')
    })

    it('includes the Twitch extension helper script', async () => {
      const html = await $fetch('/panel.html')
      expect(html).toContain(helperScript)
    })

    it('rejects requests for non-extension pages', async () => {
      await expect($fetch('/index.html')).rejects.toMatchObject({ statusCode: 404 })
    })

    it('loads Nuxt state from panel-nuxt-config.js', async () => {
      const html = await $fetch('/panel.html')
      expect(html).not.toContain('window.__NUXT__')
      expect(html).toContain('<script src="./panel-nuxt-config.js"></script>')
    })
  })

  describe('config.html', () => {
    it('renders the config page', async () => {
      const html = await $fetch('/config.html')
      expect(html).toContain('Config Page')
    })

    it('includes the Twitch extension helper script', async () => {
      const html = await $fetch('/config.html')
      expect(html).toContain(helperScript)
    })

    it('rejects requests for non-extension pages', async () => {
      await expect($fetch('/index.html')).rejects.toMatchObject({ statusCode: 404 })
    })

    it('loads Nuxt state from config-nuxt-config.js', async () => {
      const html = await $fetch('/config.html')
      expect(html).not.toContain('window.__NUXT__')
      expect(html).toContain('<script src="./config-nuxt-config.js"></script>')
    })
  })

  it('copies extension public assets to the build root and excludes other public files', async () => {
    const outputDir = join(testContext.nuxt!.options.buildDir, 'output')
    const publicDir = join(outputDir, 'public')
    const extensionAssetPath = join(publicDir, 'extension-asset.txt')

    await expect(readFile(extensionAssetPath, 'utf8')).resolves.toBe('extension asset')
    await expect(access(join(publicDir, 'extension', 'extension-asset.txt'))).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(access(join(publicDir, 'unrelated-asset.txt'))).rejects.toMatchObject({ code: 'ENOENT' })
  })
})
