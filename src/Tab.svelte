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
  span {
    cursor: pointer;
    display: inline-block;
    padding: 0.8em 1em;
  }
  input {
    margin: 0;
    padding: 0.8em;
  }
</style>

{#if toggle}
  <input type="text" bind:value={title} autofocus on:blur={update} />
{:else}
  <span on:click={toggleEdit}>{title}</span>
{/if}
