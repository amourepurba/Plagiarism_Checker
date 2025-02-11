<template>
  <div class="auth-container">
    <div class="auth-card card shadow-lg">
      <div class="card-header text-center">
        <h3>{{ isRegister ? "Register" : "Login" }}</h3>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" v-model="email" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" v-model="password" required />
          </div>

          <!-- Form untuk Register -->
          <div v-if="isRegister" class="mb-3">
            <label class="form-label">Nama Lengkap</label>
            <input type="text" class="form-control" v-model="name" required />
          </div>

          <!-- Pesan Error -->
          <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

          <button type="submit" class="btn btn-primary w-100">
            {{ isRegister ? "Register" : "Login" }}
          </button>
        </form>

        <hr />

        <button class="btn btn-outline-danger w-100" @click="googleLogin">
          <i class="bi bi-google"></i> Login dengan Google
        </button>

        <p class="text-center mt-3">
          {{ isRegister ? "Sudah punya akun?" : "Belum punya akun?" }}
          <a href="#" @click="toggleAuth">{{ isRegister ? "Login" : "Register" }}</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../store/authStore";
import { signInWithGoogle } from "../firebaseAuth";

const store = useAuthStore();
const email = ref("");
const password = ref("");
const name = ref("");
const isRegister = ref(false);
const errorMessage = ref("");

const handleSubmit = async () => {
  try {
    if (isRegister.value) {
      await store.register(name.value, email.value, password.value);
    } else {
      await store.login(email.value, password.value);
    }
  } catch (error) {
    errorMessage.value = "Terjadi kesalahan, silakan coba lagi.";
  }
};

const googleLogin = async () => {
  await store.loginWithGoogle();
};

const toggleAuth = () => {
  isRegister.value = !isRegister.value;
  errorMessage.value = "";
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(to right, #6a11cb, #2575fc);
}

.auth-card {
  width: 400px;
  background: white;
  border-radius: 10px;
}

.card-header {
  background: #2575fc;
  color: white;
  font-weight: bold;
}

.card-body {
  padding: 20px;
}

.btn-primary {
  background-color: #2575fc;
  border: none;
}

.btn-outline-danger {
  margin-top: 10px;
}

a {
  color: #2575fc;
  font-weight: bold;
}
</style>
