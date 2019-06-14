<script>
  import Tabs from "./Tabs.svelte";
  import StudyInfo from "./StudyInfo.svelte";
  import MainChart from "./MainChart.svelte";
  import { fly } from "svelte/transition";

  let activeTab = 0;
  function toggle() {
    activeTab = activeTab == 0 ? 1 : 0;
  }
</script>

<style>
  :root {
    --color-header: rgb(233, 232, 232);
    --color-nav: rgb(212, 205, 219);
    --color-content: rgb(240, 240, 240);
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
    grid-gap: 3px;
  }

  header {
    padding: 1em;
    padding-left: 1rem;
    font-size: 0.7em;
    color: rgba(51, 51, 51, 0.6);
    grid-area: head;
    background: var(--color-header);
  }

  nav {
    grid-area: nav;
    background: var(--color-nav);
    display: flex;
  }

  section {
    padding: 1em;
    grid-area: content;
    display: grid;
    grid-template: "main-chart ai-charts";
    grid-template-columns: 4fr 1fr;
    grid-gap: 1em;
    background: var(--color-content);
  }

  #mainChart {
    grid-area: main-chart;
  }
  aside {
    border: 1px dashed gray;
    grid-area: ai-charts;
    padding: 1em;
  }
</style>

<main>
  <header>
    <StudyInfo />
  </header>
  <nav>
    <Tabs {activeTab} />
  </nav>
  <section>
    <div id="mainChart">
      <button on:click={toggle}>change tabs</button>
      <MainChart />
    </div>
    <aside>AI Charts</aside>
  </section>
</main>
