<template>
  <div class="container">
    <!-- Header Section -->
    <header class="header">
      <img src="./assets/logo-white.png" alt="cmlabs logo" class="logo" />
      <nav>
        <ul class="nav-links">
          <li><a href="#">About Us</a></li>
          <li><a href="#">Plagiarism Checker</a></li>
          <li><a href="#">Contact Us</a></li>
        </ul>
      </nav>
      <button class="login-btn">Login</button>
    </header>

    <!-- Input Section -->
    <main class="main-content">
      <div class="input-section">
        <div class="tab-buttons">
          <button class="tab active">Text</button>
          <button class="tab">URL</button>
          <button class="tab">File</button>
          <select class="language-dropdown">
            <option value="indonesia">Indonesia</option>
            <option value="english">English</option>
            <option value="turkish">Turkish</option>
            <option value="spanish">Spanish</option>
          </select>
        </div>
        <textarea class="text-area" placeholder="Enter your text here..."></textarea>
        <button class="check-btn">Check</button>
      </div>
    </main>

    <!-- Footer Section -->
    <footer class="footer">
      <div class="footer-links">
        <button class="language-btn">English</button>
        <button class="language-btn">Indonesian</button>
        <button class="language-btn">Turkish</button>
        <button class="language-btn">Singapore</button>
        <button class="language-btn">Thailand</button>
        <button class="language-btn">Espanol</button>
      </div>
      <div class="footer-info">
        <p>About Us</p>
        <p>
          The PlagiCheck.com team comprises of experts in different fields, all
          with the same primary focus: helping our clients generate greater
          business by use of online services.
        </p>
      </div>
      <div class="contact-info">
        <p>Contact Us</p>
        <p>studenttelkom@gmail.com</p>
        <p>+6282299566211</p>
        <div class="social-icons">
          <i class="icon-linkedin"></i>
          <i class="icon-facebook"></i>
          <i class="icon-x"></i>
          <i class="icon-youtube"></i>
        </div>
      </div>
    </footer>
  </div>
</template>


<script>
export default {
  name: "InputLayout",
};
</script>

<style scoped>
.container {
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
}

.logo {
  height: 50px; 
  width: auto; 
}


.nav-links {
  list-style: none;
  display: flex;
  gap: 15px;
}

.nav-links li a {
  text-decoration: none;
  color: white;
}

.login-btn {
  padding: 5px 10px;
  background-color: white;
  color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f4f4f4;
}

.input-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 50%;
}

.tab-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.tab {
  padding: 10px 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
}

.tab.active {
  background-color: #007bff;
  color: white;
}

.language-dropdown {
  margin-left: auto;
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.text-area {
  width: 100%;
  height: 150px;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 15px;
}

.check-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
}

/* Footer */
.footer {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background-color: #007bff;
  color: white;
}

.footer-links,
.footer-info,
.contact-info {
  flex: 1;
}

.footer-links {
  display: flex;
  gap: 10px;
}

.language-btn {
  padding: 5px 10px;
  background: white;
  color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.social-icons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.icon-linkedin,
.icon-facebook,
.icon-x,
.icon-youtube {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
}
</style>
