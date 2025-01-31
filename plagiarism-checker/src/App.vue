<script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
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

