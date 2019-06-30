<script>
  import { fade } from "svelte/transition";
  import StudyImporter from "../components/StudyImporter.svelte";
  import StudyCard from "../components/StudyCard.svelte";
  import { studyStore } from "../modules/store.js";
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
    cursor: pointer;
  }
</style>

<div class="container" in:fade={{ duration: 300 }}>
  {#each $studyStore as study}
    <div class="study">
      <StudyCard {...study} />
    </div>
  {/each}
  <div class="study">
    <StudyImporter />
  </div>
</div>
