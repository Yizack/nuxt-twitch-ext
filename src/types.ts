import type { HTTPHeaderName, HTTPMethod } from 'h3'

export interface NuxtTwitchExtOptions {
  /**
   * @default "https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"
   */
  helperScript: string
  /**
   * Twitch Extension Client ID
   */
  clientId: string
  /**
   * Name of the ZIP file containing the built extension
   * @default "twitch-ext.zip"
   */
  filename: string
  /**
   * Configuration options for the extension pages.
   */
  pages: {
    /**
     * Name of the page directory containing the extension pages
     * @default "ext"
     */
    dirname: string
  }
  /**
   * Configuration options for the Extension Backend Service (EBS). Set to `false` to disable the EBS.
   */
  ebs: false | {
    /**
     * Enable or disable the Extension Backend Service (EBS)
     * @default true
     */
    enabled?: boolean
    /**
     * Production URL of your hosted Nuxt application.
     *
     * This value is used for client-side requests to the EBS endpoints using the `extFetch` utility,
     * a `$fetch` instance for making requests to the extension backend service (EBS).
     *
     * In development, no base URL is applied, so relative URLs resolve against the current origin.
     *
     * @example "https://my-website.com"
     */
    baseURL?: string
    /**
     * Name of the API server directory containing the EBS files
     * @default "ebs"
     */
    dirname?: string
    preflight?: {
      /**
       * CORS preflight allowed methods
       *
       * Setting this option will override the default allowed methods
       *
       * @default ["GET", "POST"]
       */
      allowMethods?: HTTPMethod[]
      /**
       * CORS preflight allowed headers
       *
       * Setting this option will override the default allowed headers
       *
       * @default ["Content-Type", "Authorization"]
       */
      allowHeaders?: HTTPHeaderName[]
    }
  }
}

export type ModuleOptions = NuxtTwitchExtOptions
