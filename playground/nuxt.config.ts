export default defineNuxtConfig({
  modules: [
    '../src/module',
  ],
  imports: {
    autoImport: true,
  },
  devtools: { enabled: false },
  compatibilityDate: '2026-09-23',
  twitchExt: {
    ebs: {
      baseURL: 'https://example.com',
    },
  },
})
