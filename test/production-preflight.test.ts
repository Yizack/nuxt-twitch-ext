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
    twitchExt: {
      ebs: {
        preflight: {
          allowMethods: ['GET', 'POST'],
          allowHeaders: ['Content-Type', 'Authorization', 'Client-Id'],
        },
      },
    },
    envName: 'production',
  },
  build: true,
})

describe('production preflight', () => {
  it('uses configured methods and headers without appending defaults', async () => {
    await $fetch('/api/ebs/data', {
      method: 'OPTIONS',
      onResponse({ response }) {
        expect(response.status).toBe(204)
        expect(response.headers.get('access-control-allow-methods')).toBe('GET, POST')
        expect(response.headers.get('access-control-allow-headers')).toBe('Content-Type, Authorization, Client-Id')
      },
    })
  })
})
