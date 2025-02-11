<template>
  <div id="app">
    <!-- Router View untuk menampilkan halaman Home atau Login -->
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style scoped>
div {
  background-color: #f0f0f0;
}
</style>