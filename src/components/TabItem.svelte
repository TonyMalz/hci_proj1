<script>
  import { createEventDispatcher } from "svelte";

  export let tab;
  let toggle = false;
  function toggleEdit() {
    if (tab.type === "home") return;
    toggle = !toggle;
  }

  const dispatch = createEventDispatcher();
  function update() {
    toggleEdit();
    dispatch("notify", tab);
  }
</script>

<style>
  div {
    cursor: pointer;
    display: inline-block;
    padding: 0.8em 1em;
  }
</style>

{#if toggle}
  <input type="text" bind:value={tab.title} autofocus on:blur={update} />
{:else}
  <div on:click={toggleEdit}>{tab.title}</div>
{/if}
