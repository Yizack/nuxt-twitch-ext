<script setup lang="ts">
import { onMounted, ref } from '#imports'

const showImage = ref(true)
const publicAssetPath = ref('/public-asset.svg')

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
  <img v-if="showImage" :src="publicAssetPath" alt="Dynamic public asset">
  <NuxtLink to="/unlisted">Unlisted Page</NuxtLink>
</template>
