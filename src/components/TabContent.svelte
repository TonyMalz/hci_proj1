<script>
  import Userview from "../pages/Userview.svelte";
  import Overview from "../pages/Overview.svelte";
  import StudyList from "../pages/StudyList.svelte";
  import Descriptives from "../pages/Descriptives.svelte";
  import { tabStore, activeTabIdx } from "../modules/store.js";
</script>

{#if $activeTabIdx === 0}
  <StudyList />
{:else}
  {#each $tabStore as tab, idx}
    {#if idx === $activeTabIdx}
      {#if tab.type === 'overview'}
        <Overview />
      {:else if tab.type === 'userview'}
        <Userview />
      {:else if tab.type === 'descriptives'}
        <Descriptives studyId={tab.studyId} />
      {/if}
    {/if}
  {/each}
{/if}
