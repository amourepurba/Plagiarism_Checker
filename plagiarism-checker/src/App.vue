<script setup>
import tes1 from './components/tes1.vue'; 
import SEOChecker from './components/SEOChecker.vue';
</script>

<template>

  <div id="app">
    <tes1 />
  </div>
  <div id="">
    <SEOChecker />
  </div>
</template>

<script>

  export default {
    components: {
      SEOChecker
    }
  };
</script>

<style scoped>

</style>


