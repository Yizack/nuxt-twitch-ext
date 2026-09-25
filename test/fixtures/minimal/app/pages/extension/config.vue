<script setup lang="ts">
import { onMounted } from '#imports'

onMounted(() => {
  Twitch.ext.onAuthorized(async (auth) => {
    const data = await extFetch('/api/ebs/data')

    console.log('Channel ID:', auth.channelId)
    console.log('Fetched data:', data)
  })
})
</script>

<template>
  <p>Config Page</p>
</template>
