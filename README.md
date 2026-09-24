# nuxt-twitch-ext

<!-- prettier-ignore-start -->
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
<!-- prettier-ignore-end -->

Build your Twitch Extension and Extension Backend Service (EBS) in a single Nuxt project.

- [✨ Release Notes](CHANGELOG.md)

## Features

- Manage only one project for the extension and its backend
- Preview extension pages in Local Test with `.html`
- Include the Twitch Extension Helper and type definitions
- EBS API endpoints with CORS support
- Client-side utility for EBS calls
- Server utilities for Twitch JWT verification
- Package extension environment assets as a ZIP
- Only extension pages are pre-rendered in the extension build
- Extension pages and assets are excluded from the app build

## Quick Setup

1. Add `nuxt-twitch-ext` dependency to your project

```sh
pnpm add nuxt-twitch-ext
```

1. Add the module in your `nuxt.config.ts`

```js
export default defineNuxtConfig({
  modules: ["nuxt-twitch-ext"],
});
```

## Project Structure

A project structure with default directories might look like this:

```txt
app/
├── app.vue                         # Application root
├── pages/
│   ├── index.vue                   # Main page
│   ├── extension/                  # Twitch extension pages
│   │   ├── config.vue
│   │   ├── mobile.vue
│   │   ├── panel.vue
│   │   └── video-overlay.vue
│   └── ...
public/
├── extension/                      # Twitch static extension assets
│   └── ...
server/
└── api/
    └── ebs/                        # EBS API endpoints
        └── ...
```

## Configuration

| Option                       | Default                             | Description                                             |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------- |
| `helperScript`               | Twitch's Extension Helper URL       | Script included in extension pages                      |
| `filename`                   | `'twitch-ext.zip'`                  | Name of the generated archive                           |
| `pages.dirname`              | `'extension'`                       | Directory containing extension pages under `app/pages/` |
| `ebs.enabled`                | `true`                              | Enable the EBS utilities and CORS handling              |
| `ebs.dirname`                | `'ebs'`                             | API directory for EBS routes, such as `server/api/ebs/` |
| `ebs.baseURL`                |                                     | Production URL used by `extFetch`                       |
| `ebs.preflight.allowMethods` | `['GET']`                           | Methods allowed for EBS CORS preflight requests         |
| `ebs.preflight.allowHeaders` | `['Content-Type', 'Authorization']` | Headers allowed for EBS CORS preflight requests         |

For example, customize the archive name and CORS settings:

```ts
export default defineNuxtConfig({
  modules: ["nuxt-twitch-ext"],
  twitchExt: {
    filename: "my-extension.zip",
    ebs: {
      baseURL: "https://your-app.example.com",
      preflight: {
        allowMethods: ["GET", "POST"],
        allowHeaders: ["Content-Type", "Authorization", "X-Custom-Header"],
      },
    },
  },
});
```

<!-- markdownlint-disable -->
<!-- prettier-ignore  -->
> [!TIP]
> When the EBS is enabled, `twitchExt.ebs.baseURL` must be set to the production URL of the Nuxt
server, so that `extFetch` can correctly target the production EBS endpoints.

## Environment Variables

Provide the Twitch Extension Client ID and Extension Secret Key as server-only runtime configuration
values.

```sh
NUXT_TWITCH_EXT_CLIENT_ID=your-extension-client-id
NUXT_TWITCH_EXT_SECRET_KEY=your-extension-secret-key
```

## Extension Pages and Assets

The default directory for extension pages is `app/pages/extension/` and for extension assets is
`public/extension/`.

The directory name for extension pages and assets can be changed with `twitchExt.pages.dirname`.

### Development Environment

In development, extension pages are accessible at root level with `.html` for easy preview during
Twitch Extension Local Test status.

For example, `app/pages/extension/<page>.vue` can be accessed as `/<page>.html`

### Twitch Extension Build

The extension CLI runs Nuxt in `twitchExt` mode (`nuxt-twitch-ext`). In this mode, the build only
includes pages from `app/pages/extension/` (or the directory configured by
`twitchExt.pages.dirname`).

For each extension page:

1. The `extension/` directory segment is removed from the route
2. The page is pre-rendered as a root-level HTML file
3. Nuxt's inline state is extracted into a sibling JavaScript file

For example:

```text
app/pages/extension/panel.vue
```

is generated as:

```text
panel.html
panel-nuxt-config.js
```

Regular application pages, such as `app/pages/index.vue`, are not included in the extension build.

Put extension static assets in your project's `public/extension/` directory. During the `twitchExt`
build, its contents are copied to the generated public root without the `extension/` prefix. Files
elsewhere in `public/` are excluded from the build and ZIP, regardless of whether an extension page
references them.

The build also:

- Includes the Twitch Extension Helper
- Uses relative URLs for generated assets
- Ignores Nuxt's default `200.html` and `404.html` pages
- Uses `twitchExt.ebs.baseURL` as the base URL for the `extFetch` utility

### Production App Environment

When Nuxt runs in production (`nuxt build`), pages under `twitchExt.pages.dirname` are excluded from
the application routes. Unlike development or the `twitchExt` build, this does not generate
extension pages or package an extension ZIP; regular application pages and endpoints remain
available.

When EBS is enabled, the module register a middleware for routes under
`/api/<twitchExt.ebs.dirname>/**` that:

- Adds `https://<client-id>.ext-twitch.tv` as the allowed origin in CORS responses.
- Answers `OPTIONS` preflight requests with the configured allowed methods and headers.

Call `verifyTwitchExtension` or `verifyTwitchTransaction` server utilities in EBS route handlers as
appropriate.

## Auto Imports

Twitch Extension Client:

- `extFetch(url, options)` - Fetches data from the EBS endpoints, uses the current origin in
  development and `twitchExt.ebs.baseURL` in the generated Twitch extension as the base URL for EBS
  requests.

Server:

- `verifyTwitchExtension(event)` verifies the Twitch JWT token for your extension, returning the
  verified payload or `null` if the verification fails.
- `verifyTwitchTransaction(event, receipt)` verifies a Bits transaction receipt for your extension,
  returning the verified payload or `null` if the verification fails.

## Working with the EBS

Use the token supplied by Twitch when calling an EBS endpoint as a `Bearer` token in the
`Authorization` header; `extFetch` does not add it automatically:

```vue
<script setup lang="ts">
onMounted(() => {
  Twitch.ext.onAuthorized(async (auth) => {
    const data = await extFetch("/api/ebs/data", {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
  });
});
</script>
```

Verify the token in the server route before processing the request:

```ts
export default defineEventHandler(async (event) => {
  const payload = await verifyTwitchExtension(event);

  if (!payload) {
    throw createError({
      status: 401,
      message: "Invalid authorization",
    });
  }

  return { channelId: payload.channel_id };
});
```

<!-- markdownlint-disable -->
<!-- prettier-ignore  -->
> [!NOTE]
> You can set `twitchExt.ebs` to `false` to disable the EBS entirely.

## Build the Extension

Add the following script to your `package.json` to build the Twitch extension:

```json
"scripts": {
  "build:twitch-ext": "nuxt-twitch-ext"
}
```

This runs `nuxt generate --envName twitchExt` and writes `.output/twitch-ext.zip` by default. Upload
that ZIP in your Twitch Extension files tab in the Twitch developer console.

<!-- Badges -->
<!-- prettier-ignore-start -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-twitch-ext/latest.svg?style=flat&labelColor=020420&color=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-twitch-ext

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-twitch-ext.svg?style=flat&labelColor=020420&color=00DC82
[npm-downloads-href]: https://npmjs.com/package/nuxt-twitch-ext

[license-src]: https://img.shields.io/npm/l/nuxt-twitch-ext.svg?style=flat&labelColor=020420&color=00DC82
[license-href]: LICENSE
<!-- prettier-ignore-end -->
