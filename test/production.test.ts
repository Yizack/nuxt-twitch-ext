import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

await setup({
  rootDir: fileURLToPath(new URL('./fixtures/minimal', import.meta.url)),
  nuxtConfig: {
    runtimeConfig: {
      twitchExt: {
        clientId: 'test',
      },
    },
    envName: 'production',
  },
  build: true,
})

describe('production', () => {
  describe('panel', () => {
    it('expects /ext/panel to not exist', async () => {
      await expect($fetch('/ext/panel')).rejects.toThrow()
    })
  })

  describe('config', () => {
    it('expects /ext/config to not exist', async () => {
      await expect($fetch('/ext/config')).rejects.toThrow()
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

    it('contains default headers for OPTIONS requests', async () => {
      await $fetch('/api/ebs/data', {
        method: 'OPTIONS',
        onResponse({ response }) {
          expect(response.status).toBe(204) // empty response
          const headers = response.headers
          expect(headers.get('access-control-allow-methods')).toBe('GET')
          expect(headers.get('access-control-allow-headers')).toBe('Content-Type, Authorization')
          expect(headers.get('access-control-allow-origin')).toBe('https://test.ext-twitch.tv')
        },
      })
    })

    it('contains allow origin header for ebs requests', async () => {
      await expect(
        $fetch('/api/ebs/data', {
          onResponse({ response }) {
            expect(response.status).toBe(401)
            const headers = response.headers
            expect(headers.get('access-control-allow-origin')).toBe('https://test.ext-twitch.tv')
          },
        }),
      ).rejects.toThrow()
    })
  })
})
