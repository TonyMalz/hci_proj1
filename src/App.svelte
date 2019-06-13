<script>
  import Tabs from "./Tabs.svelte";
  import { fly } from "svelte/transition";

  let activeTab = 0;
  function toggle() {
    activeTab = activeTab == 0 ? 1 : 0;
  }
</script>

<style>
  :root {
    --color-header: rgb(185, 255, 79);
    --color-nav: rgb(211, 201, 221);
    --color-content: blanchedalmond;
    --color-footer: darkcyan;
  }
  main {
    display: grid;
    width: 100%;
    height: 100vh;
    grid-template-areas:
      "head"
      "nav"
      "content"
      "footer";
    grid-template-rows: 6% 6% auto 5%;
  }

  header {
    padding: 1rem;
    grid-area: head;
    background: var(--color-header);
  }

  nav {
    grid-area: nav;
    background: var(--color-nav);
    position: relative;
  }

  article {
    padding: 1rem;
    grid-area: content;
    display: grid;
    grid-template: "main-chart ai-charts";
    grid-template-columns: 3fr 1fr;
    grid-gap: 1em;
    background: var(--color-content);
  }

  #chart {
    grid-area: main-chart;
  }
  aside {
    border: 1px dashed gray;
    grid-area: ai-charts;
    padding: 1em;
  }
  footer {
    padding: 1rem;
    grid-area: footer;
    background: var(--color-footer);
  }
</style>

<main>
  <header>SensQVis</header>
  <nav>
    <Tabs {activeTab} />
  </nav>
  <article>
    <div id="chart">
      <button on:click={toggle}>change tabs</button>
    </div>
    <aside>AI Charts</aside>

  </article>
  <footer>Footer</footer>
</main>
