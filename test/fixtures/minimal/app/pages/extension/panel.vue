<script setup lang="ts">
import { onMounted } from '#imports'
import { extAsset } from '../../../../../../src/runtime/app/utils/ext-asset'

onMounted(() => {
  Twitch.ext.onAuthorized(async (auth) => {
    const data = await extFetch('/api/ebs/data')

    console.log('Channel ID:', auth.channelId)
    console.log('Fetched data:', data)
  })
})
</script>

<template>
  <p>Panel Page</p>
  <img src="~/assets/extension-asset.svg" alt="Extension asset">
  <img :src="extAsset('/public-asset.svg')" alt="Dynamic public asset">
  <NuxtLink to="/unlisted">Unlisted Page</NuxtLink>
</template>
