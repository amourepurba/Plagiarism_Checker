<template>
  <div
    class="container-use text-center"
    id="how-to-use"
    :class="{ visible: isVisible, hidden: !isVisible }"
  >
    <h1 class="title">How to Use Plagiarism Checker</h1>
    <div class="row-use align-items-start">
      <div class="col">
        <h3>1</h3>
        <p>
          <strong>Get a subscription</strong><br />
          Login to enjoy all CMLABS tools and features, including unlimited
          access to the Plagiarism Checker.
        </p>
      </div>
      <div class="col">
        <h3>2</h3>
        <p>
          <strong>Provide details</strong><br />
          Paste your text, URL, or upload a file in PDF format.
        </p>
      </div>
      <div class="col">
        <h3>3</h3>
        <p>
          <strong>View the report</strong><br />
          Receive an extensive report in just minutes to view any potential
          plagiarism and relevant source links.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HowToUse",
  props: {
    isVisible: Boolean,
  },
};
</script>
