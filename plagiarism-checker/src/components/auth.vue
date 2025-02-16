<template>
  <div class="body">
    <div class="container" :class="{ active: isActive }">
      <!-- Form Login -->
      <div class="form-box login">
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
          <div class="error-message" v-if="errorMessage">
            {{ errorMessage }}
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
        </form>
      </div>

      <!-- Form Register -->
      <div class="form-box register">
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
          <div class="error-message" v-if="errorMessage">
            {{ errorMessage }}
          </div>
          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? 'Processing...' : 'Register' }}
          </button>
          <button type="button" class="btn-login" @click="loginWithGoogle">
            <span>Login with Google</span>
            <i class="bx bxl-google"></i>
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
  </div>
</template>

<script>
import axios from '../axios.js'; // Pastikan path-nya benar
import { auth, googleProvider } from '../firebase.js';
import { signInWithPopup } from 'firebase/auth';

export default {
  data() {
    return {
      isActive: false, // Untuk toggle form login/register
      loading: false,
      errorMessage: '',
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
    toggleForm() {
      this.isActive = !this.isActive;
      this.errorMessage = '';
    },

    // LOGIN
    async login() {
      if (!this.loginForm.email || !this.loginForm.password) {
        this.errorMessage = 'Please fill in all fields';
        return;
      }
      try {
        this.loading = true;
        const response = await axios.post('/login', this.loginForm);
        localStorage.setItem('token', response.data.token);
        alert('Login berhasil!');
        this.$router.push('/');
      } catch (error) {
        this.handleAuthError(error);
      } finally {
        this.loading = false;
      }
    },

    // REGISTER
    async register() {
      if (!this.registerForm.username || !this.registerForm.email || !this.registerForm.password) {
        this.errorMessage = 'Please fill in all fields';
        return;
      }
      try {
        this.loading = true;
        const response = await axios.post('/register', this.registerForm);
        alert(response.data.message);
        this.toggleForm();
      } catch (error) {
        this.errorMessage = error.response?.data?.message || 'Registrasi gagal.';
      } finally {
        this.loading = false;
      }
    },

    // LOGIN DENGAN GOOGLE (dengan pengecualian duplicate entry)
    async loginWithGoogle() {
      try {
        // Otentikasi ke Firebase dengan Google
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Data user untuk dikirim ke backend
        const userData = {
          username: user.displayName,
          email: user.email,
          // Gunakan password dummy untuk proses backend
          password: 'google_auth'
        };

        // Coba registrasi user ke backend
        try {
          await axios.post('/register', userData);
          console.log('User baru berhasil didaftarkan.');
        } catch (registerError) {
          // Jika error karena user sudah ada (status 409 atau error duplicate entry)
          if (
            (registerError.response && registerError.response.status === 409) ||
            (registerError.response && registerError.response.data && registerError.response.data.error && registerError.response.data.error.code === 'ER_DUP_ENTRY')
          ) {
            console.log('User sudah ada di database, lanjut login.');
          } else {
            console.error('Error saat registrasi user:', registerError);
            alert('Gagal memproses data user Google.');
            return;
          }
        }

        // Lakukan login ke backend
        const loginResponse = await axios.post('/login', {
          email: user.email,
          password: 'google_auth'
        });

        localStorage.setItem('token', loginResponse.data.token);
        alert('Login dengan Google berhasil!');
        this.$router.push('/');
      } catch (error) {
        console.error(error);
        alert('Login dengan Google gagal.');
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

.form-box.register { 
  visibility: hidden; 
}

.container.active .form-box.register { 
  visibility: visible; 
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

@media screen and (max-width: 650px) { 
  .container { 
      width: 90%;
      height: auto;
      padding: 20px;
  }

  .form-box { 
      position: relative;
      width: 100%;
      height: auto;
      padding: 20px;
  }

  .container.active .form-box { 
      right: 0; 
  }

  .toggle-box::before { 
      display: none; 
  }

  .toggle-panel { 
      position: relative;
      width: 100%;
      height: auto;
      margin-top: 20px;
  }

  .toggle-panel.toggle-left, 
  .toggle-panel.toggle-right { 
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
  }

  .container.active .toggle-panel.toggle-left, 
  .container.active .toggle-panel.toggle-right { 
      left: 0;
      right: 0;
  }
}
</style>