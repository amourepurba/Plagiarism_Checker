<template>
  <div
    class="contact-us-container"
    id="contact-us"
    :class="{ visible: isVisible }"
  >
    <div class="contact-text">
      <h1 :class="['contact-title', { 'typing-text': showTyping }]">
        Contact Us
      </h1>
      <p class="contact-description">
        Have questions or need help? Reach out to us!
      </p>
    </div>
    <div
      v-if="notification.message"
      :class="['notification', notification.type]"
    >
      {{ notification.message }}
    </div>
    <form class="contact-form" @submit.prevent="validateForm">
      <input
        type="text"
        class="contact-input"
        v-model="name"
        placeholder="Your Name"
        :class="{ 'error-border': showError.name }"
      />
      <input
        type="email"
        class="contact-input"
        v-model="email"
        placeholder="Your Email"
        :class="{ 'error-border': showError.email }"
      />
      <textarea
        class="contact-textarea"
        v-model="message"
        placeholder="Your Message"
        :class="{ 'error-border': showError.message }"
      ></textarea>
      <div class="button-container">
        <button type="submit" class="contact-button">Send Message</button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: "ContactUs",

  data() {
    return {
      name: "",
      email: "",
      message: "",
      notification: { message: "", type: "" },
      showError: { name: false, email: false, message: false },
      showTyping: false,
      typingInterval: null,
      _observer: null,
    };
  },

  methods: {
    triggerTyping() {
      this.showTyping = false;
      this.$nextTick(() => {
        this.showTyping = true;
      });
    },

    startTypingLoop() {
      this.stopTypingLoop(); // clear interval lama
      this.triggerTyping(); // trigger animasi langsung

      this.typingInterval = setInterval(() => {
        this.triggerTyping();
      }, 6000);
    },

    stopTypingLoop() {
      if (this.typingInterval) {
        clearInterval(this.typingInterval);
        this.typingInterval = null;
      }
    },

    validateForm() {
      let hasError = false;
      this.showError = { name: false, email: false, message: false };

      if (!this.name.trim()) {
        this.showError.name = true;
        hasError = true;
      }
      if (!this.email.trim()) {
        this.showError.email = true;
        hasError = true;
      }
      if (!this.message.trim()) {
        this.showError.message = true;
        hasError = true;
      }

      if (hasError) {
        this.notification = {
          message: "Please fill out all fields correctly.",
          type: "error",
        };
        setTimeout(() => {
          this.notification = { message: "", type: "" };
        }, 2000);
        return;
      }

      this.notification = {
        message: "Message sent successfully!",
        type: "success",
      };
      setTimeout(() => {
        this.notification = { message: "", type: "" };
      }, 2000);
      this.resetForm();
    },

    resetForm() {
      this.name = "";
      this.email = "";
      this.message = "";
    },
  },

  mounted() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.startTypingLoop();
        } else {
          this.stopTypingLoop();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(this.$el);
    this._observer = observer;
  },

  beforeUnmount() {
    this.stopTypingLoop();
    if (this._observer) {
      this._observer.disconnect();
    }
  },
};
</script>
