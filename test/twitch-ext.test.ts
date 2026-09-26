import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup, useTestContext } from '@nuxt/test-utils/e2e'

await setup({
  rootDir: fileURLToPath(new URL('./fixtures/minimal', import.meta.url)),
  nuxtConfig: {
    envName: 'twitchExt',
    twitchExt: {
      pages: {
        prerender: ['config', 'panel', 'test'],
      },
    },
    vite: {
      build: {
        assetsInlineLimit: 0,
      },
    },
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

    it('loads Nuxt state from panel-nuxt-state.js', async () => {
      const html = await $fetch('/panel.html')
      expect(html).not.toContain('window.__NUXT__')
      expect(html).toContain('<script src="./panel-nuxt-state.js"></script>')
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

    it('loads Nuxt state from config-nuxt-state.js', async () => {
      const html = await $fetch('/config.html')
      expect(html).not.toContain('window.__NUXT__')
      expect(html).toContain('<script src="./config-nuxt-state.js"></script>')
    })
  })

  it('renders a custom page selected for prerendering', async () => {
    const html = await $fetch('/test.html')
    expect(html).toContain('Test Page')
  })

  it('does not prerender a page linked from the panel', async () => {
    const panelHtml = await $fetch('/panel.html')
    expect(panelHtml).toContain('href="/unlisted"')
    expect(panelHtml).toContain('Unlisted Page')
    await expect($fetch('/unlisted.html')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('includes referenced app assets and project public files', async () => {
    const outputDir = join(testContext.nuxt!.options.buildDir, 'output')
    const publicDir = join(outputDir, 'public')
    const html = await $fetch<string>('/panel.html')

    expect(html).not.toContain('<img src="./_nuxt/unrelated-asset.')
    expect(html).toContain('<img src="./_nuxt/extension-asset.')

    const [_, extensionAssetUrl] = html.match(/src="([^"]*extension-asset[^"]+\.svg)"/)!
    const extensionAssetPath = extensionAssetUrl!.replace(/^\.?\//, '')

    await expect(readFile(join(publicDir, extensionAssetPath), 'utf8')).resolves.toContain('extension asset')
    await expect(readFile(join(publicDir, 'public-asset.txt'), 'utf8')).resolves.toContain('public asset')
  })
})
