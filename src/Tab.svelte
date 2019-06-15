<script>
  export let title = "";
  let toggle = false;
  function toggleEdit() {
    toggle = !toggle;
  }

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  function update() {
    console.log("blur");
    toggleEdit();
    dispatch("notify", title);
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
  <input type="text" bind:value={title} autofocus on:blur={update} />
{:else}
  <div on:click={toggleEdit}>{title}</div>
{/if}
