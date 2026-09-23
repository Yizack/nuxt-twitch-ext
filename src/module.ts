import { createWriteStream } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defu } from 'defu'
import { addServerHandler, createResolver, defineNuxtModule, hasNuxtModule, addTypeTemplate, useNitro, addServerImportsDir, addImportsDir } from '@nuxt/kit'
import { ZipArchive } from 'archiver'
import type {} from '@nuxt/nitro-server/augments'
import type { ModuleOptions, NuxtTwitchExtOptions } from './types'

export type { ModuleOptions, NuxtTwitchExtOptions }

export default defineNuxtModule<NuxtTwitchExtOptions>({
  meta: {
    name: 'twitch-ext',
    configKey: 'twitchExt',
  },
  defaults: {
    helperScript: 'https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js',
    filename: 'twitch-ext.zip',
    pages: {
      dirname: 'extension',
    },
    ebs: {
      enabled: true,
      dirname: 'ebs',
      baseURL: undefined,
      preflight: {
        allowMethods: ['GET'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    },
  },
  moduleDependencies(nuxt): Record<string, never> {
    if (nuxt.options.envName === 'twitchExt') {
      if (hasNuxtModule('@nuxt/ui')) {
        // @ts-expect-error Nuxt UI options
        nuxt.options.ui ||= {}
        // @ts-expect-error Nuxt UI Color Mode
        nuxt.options.ui.colorMode = false
      }

      if (hasNuxtModule('@nuxthub/core')) {
        // @ts-expect-error Nuxt Hub options
        nuxt.options.hub = false
      }
    }
    return {}
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    addTypeTemplate({
      filename: 'twitch-ext.d.ts',
      src: resolver.resolve('./runtime/types/twitch-ext.d.ts'),
    }, {
      nuxt: true,
      nitro: true,
    })

    addTypeTemplate({
      filename: 'twitch-jwt.d.ts',
      src: resolver.resolve('./runtime/types/twitch-jwt.d.ts'),
    }, {
      nitro: true,
    })

    if (options.ebs && options.ebs.enabled) {
      addImportsDir(resolver.resolve('./runtime/app/utils'))
      addServerImportsDir(resolver.resolve('./runtime/server/utils'))

      const runtimeConfig = nuxt.options.runtimeConfig
      runtimeConfig.twitchExt = defu(runtimeConfig.twitchExt, {
        ebs: options.ebs,
        clientId: '',
        secretKey: '',
      })

      runtimeConfig.public.twitchExt = defu(runtimeConfig.public.twitchExt, {
        ebs: {
          baseURL: options.ebs.baseURL,
        },
      })
    }

    const extensionBuildPaths: string[] = []
    const extensionPages: string[] = []

    // Collect all extension build paths and pages
    nuxt.hooks.hookOnce('pages:extend', (pages) => {
      extensionBuildPaths.push(
        ...pages.filter(page => page.path.startsWith(`/${options.pages.dirname}/`)).map(page => page.path),
      )
      extensionPages.push(
        ...extensionBuildPaths
          .map(path => path.split(`/${options.pages.dirname}/`)[1])
          .filter((page): page is string => page !== undefined),
      )
    })

    // Twitch ext options
    if (nuxt.options.envName === 'twitchExt') {
      if (options.ebs && options.ebs.enabled && !options.ebs.baseURL) {
        throw new Error(
          'Missing `twitchExt.ebs.baseURL` config. Set it to the production URL of your hosted Nuxt application so the Twitch Extension can send requests to its backend service.',
        )
      }

      nuxt.options.app.cdnURL = nuxt.options.runtimeConfig.app.cdnURL = './'
      nuxt.options.app.head.script ||= []
      nuxt.options.app.head.script.push({ src: options.helperScript })

      nuxt.options.features.inlineStyles = false
      nuxt.options.experimental.entryImportMap = false
      nuxt.options.experimental.payloadExtraction = false
      nuxt.options.experimental.renderJsonPayloads = false

      nuxt.options.nitro.prerender ||= {}
      nuxt.options.nitro.prerender.crawlLinks = false
      nuxt.options.nitro.prerender.autoSubfolderIndex = false
      nuxt.options.nitro.prerender.ignore ||= []
      nuxt.options.nitro.prerender.ignore.push('/200.html', '/404.html')

      nuxt.options.vite ||= {}
      nuxt.options.vite.build ||= {}
      nuxt.options.vite.build.rolldownOptions ||= {}
      nuxt.options.vite.build.rolldownOptions.output = {
        codeSplitting: {
          groups: [{ name: 'vendor', test: /node_modules[\\/]/ }],
        },
      }

      // Add an empty error component to remove the default Nuxt error page
      nuxt.hook('app:resolve', (app) => {
        app.errorComponent = resolver.resolve('./runtime/app/components/empty-error.vue')
      })

      // Remove all non-extension pages from the Nuxt pages array
      nuxt.hooks.hookOnce('pages:extend', (pages) => {
        const extensionBuildPages = pages.filter(page => extensionBuildPaths.includes(page.path))
        for (const page of extensionBuildPages) {
          page.path = page.path.replace(`/${options.pages.dirname}/`, '/')
        }

        pages.splice(0, pages.length,
          ...extensionBuildPages,
        )
      })

      // Prerender extension pages
      nuxt.hook('prerender:routes', ({ routes }) => {
        for (const page of extensionPages) {
          routes.add(`/${page}`)
        }
      })

      nuxt.hook('nitro:build:public-assets', async (nitro) => {
        const files = extensionPages.map(page => page + '.html')

        // Modify the built HTML files to extract the inline Nuxt config into separate files
        for (const file of files) {
          const htmlPath = resolve(nitro.options.output.publicDir, file)
          let html = await readFile(htmlPath, 'utf8')
          const match = html.match(/<script>window\.__NUXT__=.*?<\/script>/s)
          if (!match) continue

          const inlineScript = match[0]
          const scriptContent = inlineScript
            .replace(/^<script>/, '')
            .replace(/<\/script>$/, '')

          const configFile = file.replace('.html', '-nuxt-config.js')
          const configPath = resolve(nitro.options.output.publicDir, configFile)

          await writeFile(configPath, scriptContent, 'utf8')

          html = html.replace(
            inlineScript,
            `<script src="./${configFile}"></script>`,
          )

          await writeFile(htmlPath, html, 'utf8')
        }

        // Create a ZIP archive of the built public assets for the Twitch extension
        const archive = new ZipArchive()
        const archivePath = resolve(nitro.options.output.dir, options.filename)
        const archiveOutput = createWriteStream(archivePath)

        await new Promise<void>((finish, fail) => {
          archiveOutput.once('close', finish)
          archiveOutput.once('error', fail)
          archive.once('error', fail)
          archive.pipe(archiveOutput)
          archive.directory(nitro.options.output.publicDir, false)
          void archive.finalize()
        })
      })
    }

    // Development options
    if (nuxt.options.envName === 'development') {
      nuxt.options.app.head.script ||= []
      nuxt.options.app.head.script.push({ src: options.helperScript })

      // Set up .html route rules for the Twitch extension local testing
      nuxt.hooks.hookOnce('pages:extend', () => {
        const routeRules = useNitro().options.routeRules
        for (const page of extensionPages) {
          routeRules[`/${page}.html`] = { proxy: { to: `/${options.pages.dirname}/${page}` } }
        }
      })
    }

    // Production options
    if (nuxt.options.envName === 'production' && !nuxt.options._prepare) {
      addServerHandler({
        middleware: true,
        method: 'options',
        handler: resolver.resolve('./runtime/server/middleware/ebs-control-access'),
      })

      // In production, extend the pages to exclude the ones that are part of the Twitch extension.
      nuxt.hook('pages:extend', (pages) => {
        pages.splice(0, pages.length,
          ...pages.filter(page => !extensionPages.map(page => `/${options.pages.dirname}/${page}`).includes(page.path)),
        )
      })
    }
  },
})
