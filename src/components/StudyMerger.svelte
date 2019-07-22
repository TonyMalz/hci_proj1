<script>
  import { studyStore, variableStore } from "../modules/store.js";
  export let selectedStudies = [];
  let newName = "";
  let mergedVariableNames = new Set();
  let selectedVariables = [];
  if (selectedStudies.length) {
    const studyId = selectedStudies[0].studyId;
    // get variables of 1st study
    const variables = $variableStore.filter(v => v.studyId === studyId);
    mergedVariableNames = new Set(variables.map(v => v.variableName));
    for (const study of selectedStudies) {
      const variables = $variableStore.filter(v => v.studyId === study.studyId);
      const varNames = new Set(variables.map(v => v.variableName));

      // intersect with set of other variables
      mergedVariableNames = new Set(
        [...mergedVariableNames].filter(v => varNames.has(v))
      );
    }
    console.log(mergedVariableNames);
    selectedVariables = [...mergedVariableNames];
  }
  $: disabled = newName.trim().length ? false : true;
</script>

<style>
  .container {
    position: relative;
    padding: 0.5rem 2rem;
    height: 87vh;
    overflow-y: auto;
  }
  input::placeholder {
    color: rgb(192, 192, 192);
  }
  label {
    display: inline-block;
    padding-left: 0.25em;
    cursor: pointer;
  }

  .create {
    cursor: pointer;
    font-weight: 600;
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    background: tomato;
    color: white;
    width: 100%;
    text-align: center;
    box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.25);
  }
  .create:hover {
    background: #722040;
  }
  .disabled {
    background: rgba(255, 99, 71, 0.2);
    cursor: initial;
  }
  .varList {
    list-style-type: none;
    padding-left: 24px;
    color: rgb(202, 202, 202);
    font-style: italic;
  }
  :checked + label {
    color: #333;
    font-style: initial;
  }
</style>

<div class="container">
  <p>
    Create New
    <strong>Study</strong>
  </p>
  Combine the following studies
  <ul>
    {#each selectedStudies as study}
      <li>{study.studyName}</li>
    {/each}
  </ul>
  into new study:
  <input
    type="text"
    placeholder="New Study Name"
    bind:value={newName}
    autofocus
    spellcheck="false" />

  <p>Include variables (that appear in all selected studies):</p>
  <ul class="varList">
    {#each [...mergedVariableNames] as name}
      <li>
        <input
          id={name}
          type="checkbox"
          bind:group={selectedVariables}
          value={name} />
        <label for={name}>{name}</label>
      </li>
    {/each}
  </ul>
  <div class="create" class:disabled>Create Study</div>
</div>
