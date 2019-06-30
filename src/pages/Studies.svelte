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
    position: relative;
    height: 15ch;
    /* border: 1px solid #ccc; */
    border-radius: 0.25rem;
    box-shadow: 0 0 6px 0 rgb(214, 214, 214);
    cursor: pointer;
    text-align: center;
    overflow: hidden;
  }
</style>

<div class="container" in:fade={{ duration: 300 }}>
  <div class="study">Study 1</div>
  <div class="study">Study 2</div>
  <div class="study">
    <StudyImporter />
  </div>

</div>
