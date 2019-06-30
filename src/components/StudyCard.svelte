<script>
  import { formatDate } from "../modules/utils.js";
  import { fade } from "svelte/transition";
  export let _id, studyName, description, tasks, __created;
  let countTasks = tasks.length;
</script>

<style>
  .card {
    border-radius: 0.25rem;
    box-shadow: 0 0 6px 0 rgb(214, 214, 214);
    text-align: center;
    position: absolute;
    width: 100%;
    height: 100%;
  }
  .created {
    margin-top: 1em;
    font-size: 0.7rem;
    font-style: italic;
  }
</style>

<div class="card" in:fade={{ duration: 400 }}>
  <h4>{studyName}</h4>
  <div class="tasks">Tasks: {countTasks} </div>
  <div class="created">imported: {formatDate(__created)} </div>
</div>
