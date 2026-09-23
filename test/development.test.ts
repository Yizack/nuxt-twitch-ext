import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

await setup({
  rootDir: fileURLToPath(new URL('./fixtures/minimal', import.meta.url)),
  nuxtConfig: {
    envName: 'development',
  },
  build: true,
  dev: true,
})

const helperScript = '<script src="https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"></script>'

describe('development', () => {
  describe('panel.html', () => {
    it('renders the panel page', async () => {
      const html = await $fetch('/panel.html')
      expect(html).toContain('Panel Page')
    })

    it('includes the Twitch extension helper script', async () => {
      const html = await $fetch('/panel.html')
      expect(html).toContain(helperScript)
    })

    it('returns the same HTML as /ext/panel', async () => {
      const html = await $fetch('/panel.html')
      const extensionHtml = await $fetch('/ext/panel')
      expect(html).toBe(extensionHtml)
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

    it('returns the same HTML as /ext/config', async () => {
      const html = await $fetch('/config.html')
      const extensionHtml = await $fetch('/ext/config')
      expect(html).toBe(extensionHtml)
    })
  })

  describe('ebs', () => {
    it('returns 401 for unauthorized requests', async () => {
      await expect(
        $fetch('/api/ebs/data', {
          onResponse({ response }) {
            expect(response.status).toBe(401) // unauthorized missing extension token in test
          },
        }),
      ).rejects.toThrow()
    })
  })
})
