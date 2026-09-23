import myModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [myModule],
  runtimeConfig: {
    public: {
      twitchExt: {
        ebs: {
          baseURL: 'https://example.com',
        },
      },
    },
  },
  compatibilityDate: '2026-09-23',
  twitchExt: {
    ebs: {
      baseURL: 'https://example.com',
    },
  },
})
