<template>
    <div>
      <h2>Profil Saya</h2>
      <div v-if="user">
        <p>Username: {{ user.username }}</p>
        <p>Email: {{ user.email }}</p>
      </div>
      <div v-else>
        <p>Loading...</p>
      </div>
    </div>
  </template>
  
  <script>
  import axios from '@/axios';
  
  export default {
    name: 'Profile',
    data() {
      return {
        user: null,
      };
    },
    created() {
      axios.get('/profile')
        .then(response => {
          this.user = response.data.user;
        })
        .catch(error => {
          console.error(error);
        });
    }
  };
  </script>
  