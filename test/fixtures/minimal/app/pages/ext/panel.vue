<script setup lang="ts">
import { onMounted, extFetch } from '#imports'

onMounted(() => {
  Twitch.ext.onAuthorized(async (auth) => {
    const data = await extFetch('/api/ebs/data', {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })

    console.log('Fetched data:', data)
  })
})
</script>

<template>
  <p>Panel Page</p>
</template>
