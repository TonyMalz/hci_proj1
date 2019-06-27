<script>
  import { fade } from "svelte/transition";
  import StudyImporter from "../components/StudyImporter.svelte";
</script>

<style>
  .container {
    display: grid;
    grid-template-columns: repeat(auto-fit, 25ch);
    grid-gap: 1rem;
  }
  .study {
    min-height: 15ch;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    text-align: center;
  }
</style>

<div class="container" in:fade={{ duration: 300 }}>
  <div class="study">Study 1</div>
  <div class="study">Study 2</div>
  <div class="study">
    <StudyImporter />
  </div>

</div>
