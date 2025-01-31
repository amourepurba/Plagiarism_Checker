<script setup>
import tes1 from './components/tes1.vue'; 
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div id="app">
    <tes1 />
  </div>
  <div>
    <SEOChecker />
  </div>
</template>

<script>
import SEOChecker from './components/SEOChecker.vue';

export default {
  components: {
    SEOChecker
  }
};
</script>

<style scoped>

</style>
