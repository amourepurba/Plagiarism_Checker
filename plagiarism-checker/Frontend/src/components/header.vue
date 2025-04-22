<template>
  <header class="header">
    <nav class="navbar navbar-expand-lg bg-body-tertiary">
      <div class="container-fluid">
        <button
          class="navbar-toggler"
          type="button"
          @click="$emit('toggle-navbar')"
          aria-controls="navbarSupportedContent"
          :aria-expanded="isNavbarOpen"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <router-link to="/" @click="$emit('close-navbar')" class="navbar-brand">
          <img src="../assets/logo-blue.png" alt="cmlabs logo" class="logo" />
        </router-link>

        <div class="user d-flex align-items-center ms-auto">
          <div
            v-if="isAuthenticated"
            class="user-profile d-flex align-items-center"
            :class="{ active: showDropdown }"
            @click="toggleDropdown"
          >
            <img
              :src="user.avatar"
              alt="User Avatar"
              class="rounded-circle me-2"
              style="width: 40px; height: 40px"
            />
            <span class="me-2">{{ user.username }}</span>
            <div v-if="showDropdown" class="dropdown-menu">
              <button class="btn btn-outline-danger" @click.stop="logout">
                Logout
              </button>
            </div>
          </div>
          <router-link
            v-else
            to="/auth"
            class="btn btn-outline-success ms-2"
            @click="$emit('close-navbar')"
          >
            Login
            <i
              class="fa-solid fa-arrow-right-to-bracket"
              style="padding-left: 5px"
            ></i>
          </router-link>
        </div>

        <div
          :class="['collapse navbar-collapse', { show: isNavbarOpen }]"
          id="navbarSupportedContent"
        >
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a
                class="nav-link"
                href="#plagiarism-checker"
                @click="$emit('close-navbar')"
              >
                Plagiarism Checker
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                href="#how-to-use"
                @click="$emit('close-navbar')"
              >
                How To Use
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                href="#contact-us"
                @click="$emit('close-navbar')"
              >
                Contact Us
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
</template>

<script>
export default {
  name: "Header",
  props: {
    isNavbarOpen: Boolean,
    isAuthenticated: Boolean,
    user: Object,
  },

  data() {
    return {
      showDropdown: false,
    };
  },

  methods: {
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    logout() {
      this.$emit("logout");
    },
  },
};
</script>
