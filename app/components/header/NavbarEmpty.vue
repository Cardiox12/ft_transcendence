<template>
  <nav class="navbar">
    <div></div>
    <h1 class="navbar-title"> PIP PONG </h1>
    <div class="navbar-right">
      <headerButtonChangeTheme class="navbar-sub" />
      <headerButtonDisconnect v-if="disconnectButton" class="navbar-sub" />
    </div>
  </nav>
</template>

<script setup lang="ts">
const disconnectButton = ref(false);
try {
  const user = await getRefreshedUserAuthenticate();
  if (user.value)
    disconnectButton.value = true;
} catch { }
</script>

<style scoped>

h1 {
  font-size: 42px;
}
</style>
