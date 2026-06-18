<template>
  <img
    :src="`${baseURL}site-logo.png`"
    alt=""
    class="h-6 w-6 rounded-full object-cover"
  />
</template>

<script setup lang="ts">
const baseURL = useRuntimeConfig().app.baseURL;
</script>
