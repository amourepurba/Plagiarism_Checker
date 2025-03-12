<template>
  <div class="body">
    <!-- close button -->
    <button type="button" class="btn-close" aria-label="Close" @click="goToPlagiarismChecker"></button>
    
    <div class="container" :class="{ active: isActive }">
      <!-- Form Login -->
      <div class="form-box login" v-if="!isActive">
        <form @submit.prevent="login">
          <h1>Login</h1>
          <div class="input-box">
            <input
              type="text"
              placeholder="Email"
              required
              v-model="loginForm.email"
            />
            <i class="bx bxs-user"></i>
          </div>
          <div class="input-box">
            <input
              type="password"
              placeholder="Password"
              required
              v-model="loginForm.password"
            />
            <i class="bx bxs-lock-alt"></i>
          </div>
          <div class="forgot-link">
            <a href="#">Forgot Password?</a>
          </div>
          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? 'Processing...' : 'Login' }}
          </button>
          <button type="button" class="btn-login" @click="loginWithGoogle">
            <span>Login with Google</span>
            <i class="bx bxl-google"></i>
          </button>
          <!-- Tombol Navigasi untuk Layar Kecil -->
          <button type="button" class="btn-switch" @click="toggleForm">
            Don't have an account? Register
          </button>
        </form>
      </div>

      <!-- Form Register -->
      <div class="form-box register" v-if="isActive">
        <form @submit.prevent="register">
          <h1>Registration</h1>
          <div class="input-box">
            <input
              type="text"
              placeholder="Username"
              required
              v-model="registerForm.username"
            />
            <i class="bx bxs-user"></i>
          </div>
          <div class="input-box">
            <input
              type="email"
              placeholder="Email"
              required
              v-model="registerForm.email"
            />
            <i class="bx bxs-envelope"></i>
          </div>
          <div class="input-box">
            <input
              type="password"
              placeholder="Password"
              required
              v-model="registerForm.password"
            />
            <i class="bx bxs-lock-alt"></i>
          </div>
          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? 'Processing...' : 'Register' }}
          </button>
          <button type="button" class="btn-login" @click="loginWithGoogle">
            <span>Login with Google</span>
            <i class="bx bxl-google"></i>
          </button>
          <!-- Tombol Navigasi untuk Layar Kecil -->
          <button type="button" class="btn-switch" @click="toggleForm">
            Already have an account? Login
          </button>
        </form>
      </div>

      <!-- Toggle Panel -->
      <div class="toggle-box">
        <div class="toggle-panel toggle-left">
          <h1><strong>Hello, Welcome!</strong></h1>
          <p>Don't have an account?</p>
          <button class="btn register-btn" @click="toggleForm">Register</button>
        </div>
        <div class="toggle-panel toggle-right">
          <h1><strong>Welcome Back!</strong></h1>
          <p>Already have an account?</p>
          <button class="btn login-btn" @click="toggleForm">Login</button>
        </div>
      </div>
    </div>
    <div v-if="showNotification" class="notification" :class="{'success': successMessage, 'error': errorMessage}">
      {{ successMessage || errorMessage }}
    </div>

  </div>
</template>

<script>
import axios from '../axios.js'; // Pastikan path-nya benar
import { auth, googleProvider } from '../firebase.js';
import { signInWithPopup } from 'firebase/auth';

export default {
  data() {
    return {
      isAuthenticated: !!localStorage.getItem('token'),
      user: JSON.parse(localStorage.getItem('user')) || { username: '', avatar: '' },
      isActive: false,
      loading: false,
      errorMessage: '',
      successMessage: '', 
      errorMessage: '',
      showNotification: false, // Kontrol visibilitas notifikasi
      loginForm: {
        email: '',
        password: ''
      },
      registerForm: {
        username: '',
        email: '',
        password: ''
      },
    };
  },
  methods: {
    goToPlagiarismChecker() {
    this.$router.push('/plagiarism-checker');
  },

    showNotificationMessage(message, isSuccess) {
      if (isSuccess) {
        this.successMessage = message;
        this.errorMessage = ''; // Hapus pesan error
      } else {
        this.errorMessage = message;
        this.successMessage = ''; // Hapus pesan sukses
      }
      this.showNotification = true;

      setTimeout(() => {
        this.showNotification = false;
      }, 3000);

    // Otomatis sembunyikan setelah 3 detik
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  },

    toggleForm() {
      this.isActive = !this.isActive;
      this.errorMessage = '';
    },


    async login() {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.showNotificationMessage('Please fill in all fields', false);
      return;
    }
    try {
      this.loading = true;
      const response = await axios.post('/login', this.loginForm);
      this.$store.commit('setAuth', {
        token: response.data.token,
        user: response.data.user
      });
      this.showNotificationMessage('Login berhasil!', true);
      this.$router.push('/');
    } catch (error) {
      this.showNotificationMessage('Login gagal! Periksa email dan password Anda.', false);
    } finally {
      this.loading = false;
    }
  },



  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userData = {
        username: user.displayName,
        email: user.email,
        avatar: user.photoURL,
        password: 'google_auth'
      };

      try {
        await axios.post('/register', userData);
        this.showNotificationMessage('Registrasi berhasil!', true);
      } catch (registerError) {
        if (
          (registerError.response && registerError.response.status === 409) ||
          (registerError.response.data?.error?.code === 'ER_DUP_ENTRY')
        ) {
          this.showNotificationMessage('Pengguna sudah terdaftar, lanjut login!', true);
        } else {
          this.showNotificationMessage('Gagal memproses data.', false);
          return;
        }
      }

      const loginResponse = await axios.post('/login', {
        email: user.email,
        password: 'google_auth'
      });

      localStorage.setItem('token', loginResponse.data.token);
      localStorage.setItem('user', JSON.stringify({
        username: user.displayName,
        avatar: user.photoURL
      }));
      this.showNotificationMessage('Login dengan Google berhasil!', true);
      this.$router.push('/');
    } catch (error) {
      console.error(error);
      this.showNotificationMessage('Login dengan Google gagal.', false);
    }
  },


    // REGISTER
    async register() {
      if (!this.registerForm.username || !this.registerForm.email || !this.registerForm.password) {
        this.showNotificationMessage('Please fill in all fields', false);
        return;
      }
      try {
        this.loading = true;
        const response = await axios.post('/register', this.registerForm);
        this.showNotificationMessage(response.data.message, true);
        this.toggleForm();
      } catch (error) {
        this.showNotificationMessage(error.response?.data?.message || 'Registrasi gagal.', false);
      } finally {
        this.loading = false;
      }
    },



    // Menangani error autentikasi
    handleAuthError(error) {
      if (error.response?.data?.message) {
        this.errorMessage = error.response.data.message;
      } else {
        this.errorMessage = 'Authentication failed. Please try again.';
      }
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Poppins", sans-serif;
  text-decoration: none;
  list-style: none;
}

.body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(90deg, #ffffff, #abdeff);
}

.btn-close {
  position: absolute;
  top: 0;
  left: 5px;
  margin: 10px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
}

.container {
  position: relative;
  width: 850px;
  height: 550px;
  background: #ffff;
  margin: 20px;
  border-radius: 30px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.container h1 {
  font-size: 36px;
  margin: 10px 0;
}

.container p {
  font-size: 14.5px;
  margin: 15px 0;
}

form {
  width: 100%;
}

.form-box {
  position: absolute;
  right: 0;
  width: 50%;
  height: 100%;
  background: #ffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #333;
  text-align: center;
  padding: 40px;
  z-index: 1;
  transition: .6s ease-in-out;
}

.container.active .form-box { 
  right: 50%; 
}

.input-box { 
  position: relative; 
  margin: 20px 0; 
  width: 100%;
}

.input-box input { 
  width: 100%; 
  padding: 13px 50px 13px 20px; 
  background: #eeee; 
  border-radius: 8px; 
  border: none; 
  outline: none; 
  font-size: 16px; 
  color: #000000; 
  font-weight: 500; 
}

.input-box input::placeholder { 
  color: #8888; 
  font-weight: 400; 
}

.input-box i { 
  position: absolute; 
  right: 20px; 
  top: 50%; 
  transform: translateY(-50%); 
  font-size: 20px; 
}

.forgot-link { 
  margin: -10px 0 15px; 
  width: 100%;
  text-align: right;
}

.forgot-link a { 
  font-size: 14.5px; 
  color: #3333; 
}

.btn { 
  width: 100%; 
  height: 48px; 
  background: #18A0FB; 
  border-radius: 8px; 
  box-shadow: 0 0 10px rgba(0, 0, 0, .1); 
  border: none; 
  cursor: pointer; 
  font-size: 16px; 
  color: #fff; 
  font-weight: 600; 
  transition: background 0.3s;
}

.btn:hover {
  background: #18A0FB;
}

.btn-login { 
  margin-top: 10px;
  width: 100%; 
  height: 48px; 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #333;
  padding: 10px; 
  border: 2px solid #ccc; 
  border-radius: 8px; 
  font-size: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-login i {
  font-size: 20px;
  margin-left: 5px;
}

.btn-login:hover {
  background: #18A0FB;
  color: #ffffff;
  border-color: #18A0FB;
}

.btn-switch {
    color: #18A0FB;
    background: transparent;
    border: none;
    font-size: 14px;
}

.btn-switch:hover {
    color: #a2a5a8;
    background: transparent;
    border: none;
    font-size: 14px;
}

  .toggle-box { 
    position: absolute; 
    width: 100%; 
    height: 100%; 
  }

  .toggle-box::before { 
    content: ''; 
    position: absolute; 
    left: -250%; 
    width: 300%; 
    height: 100%; 
    background: #18A0FB; 
    border-radius: 150px; 
    z-index: 2; 
    transition: 1.8s ease-in-out; 
  }

  .container.active .toggle-box::before { 
    left: 50%; 
  }

  .toggle-panel { 
    position: absolute; 
    width: 50%; 
    height: 100%; 
    color: #fff; 
    display: flex; 
    flex-direction: column; 
    justify-content: center; 
    align-items: center; 
    z-index: 2; 
    transition: .6s ease-in-out; 
  }

  .toggle-panel.toggle-left { 
    left: 0; 
    transition-delay: 1.2s; 
  }

  .container.active .toggle-panel.toggle-left { 
    left: -50%; 
    transition-delay: .6s; 
  }

  .toggle-panel.toggle-right { 
    right: -50%; 
    transition-delay: .6s; 
  }

  .container.active .toggle-panel.toggle-right { 
    right: 0; 
    transition-delay: 1.2s; 
  }

  .toggle-panel p { 
    margin-bottom: 20px; 
  }

  .toggle-panel .btn { 
    width: 160px; 
    height: 46px; 
    background: transparent; 
    border: 2px solid #fff; 
    box-shadow: none; 
    transition: background 0.3s, color 0.3s;
  }

  .toggle-panel .btn:hover {
    background: #fff;
    color: #18A0FB;
  }

  .notification {
  position: fixed;
  top: 20px; /* Ubah dari 50% ke 20px */
  left: 50%;
  transform: translateX(-50%); /* Hanya geser secara horizontal */
  background-color: #4caf50;
  color: white;
  padding: 15px 30px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-size: 18px;
  opacity: 0.9;
  transition: opacity 0.3s ease;
  z-index: 1000;
}


.notification.success {
  background-color: #4caf50; /* Hijau untuk sukses */
}

.notification.error {
  background-color: #f44336; /* Warna merah untuk gagal */
}



  /* Responsive Design untuk Layar Kecil */
  @media screen and (max-width: 768px) {
    .container {
      width: 90%; /* Lebar container 90% dari layar */
      max-width: 400px; /* Maksimum lebar container */
      height: auto; /* Tinggi menyesuaikan konten */
      padding: 15px; /* Padding yang lebih kecil */
      border-radius: 15px; /* Border radius yang lebih kecil */
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.1); /* Shadow yang lebih halus */
      margin: 20px auto; /* Pusatkan container */
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .form-box {
      position: relative;
      width: 100%; 
      height: auto;
      max-height: 400px;
      padding: 10px; 
    }

    .container.active .form-box {
      right: 0 !important; /* Nonaktifkan animasi slide pada layar kecil */
    }

    .toggle-box {
      display: none; /* Sembunyikan toggle panel pada layar kecil */
    }

    .form-box .input-box {
      width: 100%; 
      margin: 8px 0;
    }

    .form-box .input-box input {
      width: 100%; /* Lebar input 100% dari input-box */
      padding: 8px 30px 8px 10px; /* Padding yang lebih kecil */
      font-size: 14px; /* Ukuran font yang lebih kecil */
    }

    .form-box .input-box i {
      right: 10px; 
      font-size: 16px; 
    }

    .btn, .btn-login {
      width: 100%; /* Lebar tombol 100% dari form-box */
      padding: 8px; /* Padding yang lebih kecil */
      font-size: 14px; /* Ukuran font yang lebih kecil */
      margin-top: 8px; /* Margin atas yang lebih kecil */
    }

    .btn-login {
      gap: 5px; /* Jarak antara teks dan ikon yang lebih kecil */
    }

    .forgot-link {
      margin: 8px 0; /* Margin yang lebih kecil */
      text-align: center; /* Pusatkan teks "Forgot Password" */
    }

    .forgot-link a {
      font-size: 12px; /* Ukuran font yang lebih kecil */
    }

    h1 {
      font-size: 22px; /* Ukuran judul yang lebih kecil */
      margin: 8px 0; /* Margin yang lebih kecil */
    }

    p {
      font-size: 12px; /* Ukuran teks yang lebih kecil */
    }
  }
</style>