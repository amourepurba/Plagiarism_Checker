<template>
  <div class="container">
    <h1>SEO & Readability Checker</h1>

    <label for="inputType">Choose Input Type:</label>
    <select v-model="inputType">
      <option value="text">Text</option>
      <option value="url">URL</option>
    </select>

    <div v-if="inputType === 'text'">
      <textarea v-model="text" placeholder="Enter your text here"></textarea>
    </div>

    <div v-if="inputType === 'url'">
      <input v-model="url" type="url" placeholder="Enter a URL">
    </div>

    <button @click="analyzeContent">Analyze</button>

    <div v-if="results">
      <h2>Results</h2>
      <p><strong>Readability Score:</strong> {{ results.readability_score }}%</p>

      <h3>Top Keywords</h3>
      <ul>
        <li v-for="(density, keyword) in results.top_keywords" :key="keyword">
          {{ keyword }}: {{ density.toFixed(2) }}%
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      inputType: 'text',
      text: '',
      url: '',
      results: null,
    };
  },
  methods: {
    async analyzeContent() {
      const payload = {
        input_type: this.inputType,
        text: this.text,
        url: this.url,
      };

      try {
        const response = await axios.post('http://127.0.0.1:5000/analyze', payload);
        this.results = response.data;
      } catch (error) {
        console.error("Error analyzing content:", error);
      }
    },
  },
};
</script>

<style>
.container {
  max-width: 600px;
  margin: auto;
  padding: 20px;
  text-align: center;
}
textarea {
  width: 100%;
  height: 100px;
}
button {
  margin-top: 10px;
  padding: 10px;
}
</style>
