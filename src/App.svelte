<script>
  import Tabs from "./Tabs.svelte";
  import StudyInfo from "./StudyInfo.svelte";
  import UndoRedo from "./UndoRedo.svelte";
  import MainChart from "./MainChart.svelte";
  import { fly } from "svelte/transition";

  let activeTab = 0;
  function toggle() {
    activeTab = activeTab == 0 ? 1 : 0;
  }
</script>

<style>
  :root {
    --color-header: rgb(255, 255, 255);
    --color-nav: rgb(255, 255, 255);
    --color-content: rgb(255, 255, 255);
  }
  main {
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
    border: 1px solid rgba(255, 62, 0, 0.1);
    font-weight: 300;
    grid-area: nav;
    background: var(--color-nav);
    display: grid;
    grid-template-areas: "tabs undoRedo";
    grid-template-columns: auto 100px;
  }

  section {
    padding: 1em;
    grid-area: content;
    display: grid;
    grid-template:
      "main-chart ai-charts"
      "anova anova";
    grid-template-columns: 3fr 1fr;
    grid-template-rows: 2fr 1fr;
    grid-gap: 1em;
    background: var(--color-content);
  }

  #mainChart {
    grid-area: main-chart;
  }
  #anova {
    grid-area: anova;
    border: 1px dashed gray;
    width: 100%;
    padding: 1em;
  }
  aside {
    border: 1px dashed gray;
    grid-area: ai-charts;
    padding: 1em;
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
      <Tabs {activeTab} />
    </div>
    <div class="undoRedo">
      <UndoRedo />
    </div>
  </nav>
  <section>
    <div id="mainChart">
      <button on:click={toggle}>change tabs</button>
      <MainChart />
    </div>
    <aside>AI Charts</aside>
    <div id="anova">Anova</div>
  </section>
</main>
