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
    createEventDispatcher("notify", title);
  }
</script>

<style>
  span {
    cursor: pointer;
    display: inline-block;
    color: black;
    text-align: center;
    padding: 0.8rem 1rem;
    text-decoration: none;
  }
  input {
    margin: 0;
    padding: 0.8rem;
  }
</style>

{#if toggle}
  <input type="text" bind:value={title} autofocus on:blur={update} />
{:else}
  <span on:click={toggleEdit}>{title}</span>
{/if}
