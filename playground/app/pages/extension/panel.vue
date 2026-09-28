<script setup lang="ts">
const showPublicAsset = ref(false)

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
  <button @click="showPublicAsset = !showPublicAsset">Toggle Public Asset</button>
  <img v-if="showPublicAsset" :src="extAsset('/public-asset.svg')" alt="Dynamic public asset">
</template>
