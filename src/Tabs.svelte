<script>
  import Tabitem from "./Tab.svelte";
  import { fly, fade } from "svelte/transition";

  let currentTabs = ["Overview", "User Details"];
  export let activeTab = 0;
  function activate(tab) {
    console.log("activate");
    activeTab = tab;
  }
  let toggleTab = false;
  function toggle() {
    toggleTab = !toggleTab;
  }
  function addTab() {
    const el = document.getElementById("newTab");
    const text = el.value.trim();
    if (text !== "") {
      currentTabs.push(el.value);
      currentTabs = currentTabs;
      activeTab = currentTabs.length - 1;
    }
    toggle();
  }

  function showEditMenu(tab) {
    console.log(tab);
  }

  function titleChanged(event) {
    console.log("titlechanged");
    currentTabs[activeTab] = event.detail;
  }
</script>

<style>
  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }
  li {
    color: rgba(51, 51, 51, 0.6);
    background: #fafafa;
    font-size: 0.9rem;
    display: inline-block;
  }

  li div {
    cursor: pointer;
    display: inline-block;
    padding: 0.8em 1em;
  }

  /* Change the link color to #111 (black) on hover */
  li:hover {
    color: inherit;
    border-top: 1px solid rgb(255, 175, 160);
  }
  .active {
    color: inherit;
    background: white;
    font-weight: 400;
    border-top: 1px solid tomato !important;
  }
</style>

<ul>
  {#each currentTabs as title, i}
    {#if i !== activeTab}
      <li on:click={() => activate(i)}>
        <Tabitem {title} />
      </li>
    {:else}
      <li class="active">
        <Tabitem {title} on:notify={titleChanged} />
      </li>
    {/if}
  {/each}
  <li>
    {#if toggleTab}
      <input
        in:fade={{ duration: 100 }}
        id="newTab"
        type="text"
        on:blur={addTab}
        on:keydown={e => (e.code === 'Enter' ? addTab() : null)}
        autofocus />
    {:else}
      <div on:click={toggle}>+</div>
    {/if}
  </li>
</ul>
