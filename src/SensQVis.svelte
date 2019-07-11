<script>
  import Tabs from "./components/Tabs.svelte";
  import StudyInfo from "./components/StudyInfo.svelte";
  import UndoRedo from "./components/UndoRedo.svelte";
  import Userview from "./pages/Userview.svelte";
  import Overview from "./pages/Overview.svelte";
  import Studies from "./pages/StudyList.svelte";
  import Descriptives from "./pages/Descriptives.svelte";

  import { fly } from "svelte/transition";
  import { activeUITab } from "./modules/store.js";
</script>

<style>
  :root {
    --color-header: rgb(255, 255, 255);
    --color-nav: rgb(255, 255, 255);
    --color-content: rgb(255, 255, 255);
    --color-bar: #96bcdb;
  }

  main {
    overflow-y: auto;
    overflow-x: hidden;
    display: grid;
    width: 100%;
    height: 100%;
    grid-template-areas:
      "head"
      "nav"
      "content";
    grid-template-rows: auto auto 6fr;
  }

  header {
    padding: 1em;
    padding-left: 1rem;
    font-size: 0.7em;
    font-weight: 300;
    color: rgba(51, 51, 51, 0.6);
    grid-area: head;
    background: var(--color-header);
  }

  nav {
    border-top: 1px solid rgba(255, 62, 0, 0.1);
    font-weight: 300;
    grid-area: nav;
    background: var(--color-nav);
    display: grid;
    grid-template-areas: "tabs undoRedo";
    grid-template-columns: auto 100px;
  }

  section {
    position: relative;
    padding: 1em;
    grid-area: content;
    background: var(--color-content);
  }

  .tabs {
    grid-area: tabs;
  }
  .undoRedo {
    grid-area: undoRedo;
  }
</style>

<main>
  <header>
    <StudyInfo />
  </header>
  <nav>
    <div class="tabs">
      <Tabs />
    </div>
    <div class="undoRedo">
      <UndoRedo />
    </div>
  </nav>
  <section>
    {#if $activeUITab === 0}
      <Studies />
    {:else if $activeUITab === 1}
      <Overview />
    {:else if $activeUITab === 2}
      <Userview />
    {:else if $activeUITab === 3}
      <Descriptives />
    {/if}
  </section>
</main>
