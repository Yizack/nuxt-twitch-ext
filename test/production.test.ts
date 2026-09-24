import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
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
    it('expects /extension/panel to not exist', async () => {
      await expect($fetch('/extension/panel')).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('config', () => {
    it('expects /extension/config to not exist', async () => {
      await expect($fetch('/extension/config')).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('ebs', () => {
    it('returns 401 for unauthorized requests', async () => {
      // unauthorized missing extension token in test
      await expect($fetch('/api/ebs/data')).rejects.toMatchObject({ statusCode: 401 })
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
      ).rejects.toMatchObject({ statusCode: 401 })
    })
  })
})
