<script>
  import Userview from "../views/Userview.svelte";
  import Overview from "../views/Overview.svelte";
  import StudyList from "../views/StudyList.svelte";
  import Descriptives from "../views/Descriptives.svelte";
  import Customview from "../views/Customview.svelte";
  import { tabStore, activeTabIdx } from "../modules/store.js";
</script>

{#if $activeTabIdx === 0}
  <StudyList />
{:else}
  {#each $tabStore as tab, idx}
    {#if idx === $activeTabIdx}
      {#if tab.type === 'overview'}
        <Overview studyId={tab.studyId} />
      {:else if tab.type === 'userview'}
        <Userview studyId={tab.studyId} />
      {:else if tab.type === 'descriptives'}
        <Descriptives studyId={tab.studyId} />
      {:else if tab.type === 'customview'}
        <Customview />
      {/if}
    {/if}
  {/each}
{/if}
