<script>
  import Tabitem from "./TabItem.svelte";
  import { fade, fly, slide } from "svelte/transition";
  import { flip } from "svelte/animate";
  import { tabStore, msgStore, activeTabIdx } from "../modules/store.js";
  import { db } from "../modules/indexeddb.js";
  import { tick } from "svelte";
  import { trunc } from "../modules/utils";

  $: handleMsgs($msgStore.filter(v => v.type === "navigation"));

  function handleMsgs(messages) {
    for (const { action, data: study } of messages) {
      console.log(action, study);
      switch (action) {
        case "openStudyTabs":
          //check if tabs for this study already exist
          let studyTabs = $tabStore.filter(v => v.studyId === study._id);
          const studyName = trunc(study.studyName, 25);
          if (studyTabs.length < 1) {
            console.log("create new tabs", studyTabs);
            // tabs don't exist yet create new ones
            const newTabs = [];
            // add home
            newTabs.push($tabStore[0]);
            // show and activate 1st study tab, since it's not already shown
            newTabs.push({
              title: "Descriptives " + studyName,
              type: "descriptives",
              studyId: study._id,
              id: 1
            });
            newTabs.push({
              title: "Overview " + studyName,
              type: "overview",
              studyId: study._id,
              id: 2
            });
            newTabs.push({
              title: "User view " + studyName,
              type: "userview",
              studyId: study._id,
              id: 3
            });

            let id = 4;
            //add the rest of the tabs
            for (const tab of $tabStore.slice(1)) {
              tab.id = id++;
              newTabs.push(tab);
            }
            $tabStore = newTabs;
            updateTabStore(newTabs);
            // activate newly created second tab
            $activeTabIdx = 1;
          } else if (studyTabs.length == 3) {
            // activate 1st tab of this study
            for (const tab of studyTabs) {
              if (tab.type === "descriptives") {
                $activeTabIdx = tab.id;
                return;
              }
            }
          } else {
            //some tabs of this study are open, add missing ones
            const addTabs = [];
            const types = ["descriptives", "overview", "userview"];
            const currentTypes = studyTabs.map(v => v.type);
            const missingTypes = types.filter(
              type => !currentTypes.includes(type)
            );

            const newTabs = [];
            let id = 0;
            // add current tabs
            for (const currentTab of $tabStore) {
              currentTab.id = id++;
              newTabs.push(currentTab);
            }
            // add missing types
            for (const missingType of missingTypes) {
              switch (missingType) {
                case "descriptives":
                  newTabs.push({
                    title: "Descriptives " + studyName,
                    type: "descriptives",
                    studyId: study._id,
                    id: id++
                  });
                  break;
                case "overview":
                  newTabs.push({
                    title: "Overview " + studyName,
                    type: "overview",
                    studyId: study._id,
                    id: id++
                  });
                  break;
                case "userview":
                  newTabs.push({
                    title: "User view " + studyName,
                    type: "userview",
                    studyId: study._id,
                    id: id++
                  });
                  break;
              }
            }
            $tabStore = newTabs;
            updateTabStore(newTabs);
          }

          break;

        default:
          break;
      }
    }
  }

  async function updateTabStore(newTabs) {
    await tick();
    const store = db.transaction("UITabs", "readwrite").objectStore("UITabs");
    store.clear();
    for (const tab of newTabs) {
      store.put(tab);
    }
  }

  function activateTab(tabIdx) {
    // console.log("activate ", tabIdx);
    $activeTabIdx = tabIdx;
  }

  function titleChanged(event) {
    console.log("titlechanged");
    const tab = event.detail;
    db.transaction("UITabs", "readwrite")
      .objectStore("UITabs")
      .put(tab);
  }

  function close(idx, tab) {
    console.log("close", idx, tab);
    if (idx > 0) {
      const reducedTabs = $tabStore.filter(v => v.id !== tab.id);
      let id = 0;
      for (const tab of reducedTabs) {
        tab.id = id++;
      }

      if ($activeTabIdx > reducedTabs.length - 1) {
        $activeTabIdx = reducedTabs.length - 1;
      }
      $tabStore = reducedTabs;
      updateTabStore(reducedTabs);
    }
  }

  function addCustomTab() {
    let id = 0;
    // get last id
    for (const tab of $tabStore) {
      id = tab.id;
    }
    const tab = {
      title: "Custom view ",
      type: "customview",
      studyId: null,
      id: ++id
    };
    console.log("custom tab", tab);
    $tabStore.push(tab);
    $tabStore = $tabStore;
    $activeTabIdx = id;
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
    background: #f5f5f5;
    font-size: 0.9rem;
    display: inline-block;
    box-shadow: inset 0px 2px 0px 1px white;
  }

  li div {
    cursor: pointer;
    display: inline-block;
    padding: 0.8em 1em;
  }

  /* Change the link color to #111 (black) on hover */
  li:hover {
    color: inherit;
    /* border-top: 1px solid rgb(255, 175, 160); */
    box-shadow: inset 0px 2px 0px 0px rgb(255, 175, 160);
  }
  .active {
    position: relative;
    color: inherit;
    background: white;
    font-weight: 400;
    /* border-top: 1px solid tomato !important; */
    box-shadow: inset 0px 2px 0px 0px tomato,
      0px 0px 1px 0px rgba(0, 0, 0, 0.25);
  }
  .active::before {
    content: " ";
    position: absolute;
    width: 100%;
    height: 2px;
    bottom: -3px;
    border: 4px solid white;
    z-index: 1;
  }
  .close:hover {
    background-color: rgba(212, 212, 212, 0.6);
    /* box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.25); */
  }
</style>

<ul>
  {#each $tabStore as tab, idx}
    {#if idx !== $activeTabIdx}
      <li on:click={() => activateTab(idx)}>
        <Tabitem {tab} />
        {#if idx !== 0}
          <div
            class="close"
            on:click|stopPropagation|preventDefault={() => close(idx, tab)}>
            x
          </div>
        {/if}
      </li>
    {:else}
      <li class="active">
        <Tabitem {tab} on:notify={titleChanged} />
        {#if idx !== 0}
          <div
            class="close"
            on:click|stopPropagation|preventDefault={() => close(idx, tab)}>
            x
          </div>
        {/if}
      </li>
    {/if}
  {/each}
  <li>
    <div on:click={addCustomTab}>+</div>
  </li>
</ul>
