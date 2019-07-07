<script>
  import { db } from "../modules/indexeddb.js";
  import { formatDate } from "../modules/utils.js";

  export let studyId = 0;
  export let studyName = "";
  let responses = [];
  if (studyId) {
    const res = db
      .transaction("StudyResponses")
      .objectStore("StudyResponses")
      .index("studyId")
      .getAll(studyId);
    res.onsuccess = e => {
      const userResponses = e.target.result;
      for (const response of userResponses) {
        responses = [...responses, response];
      }
    };
  }
</script>

<style>
  .container {
    position: relative;
    padding: 1em;
    padding-bottom: 2em;
  }
  table {
    border-collapse: collapse;
    font-size: 0.7rem;
  }
  th,
  td {
    text-align: left;
    padding: 0.8em 0.6em;
    border-bottom: 1px solid #ddd;
  }
  th {
    font-weight: 600;
  }
  tr:hover {
    background-color: #f5f5f5;
  }
</style>

<div class="container">
  <p>
    Responses of
    <strong>{studyName}</strong>
  </p>
  <table>
    <tr>
      <th>User Id</th>
      <th>Task</th>
      <th>Date</th>
      <th>Results</th>
    </tr>
    {#each responses as response}
      <tr>
        <td> {response.userId} </td>
        <td> {response.taskName} </td>
        <td>
           {formatDate(new Date(response.startDate))} - {formatDate(new Date(response.endDate))}

        </td>
        <td>
          {#each response.stepResults as steps}
            {#each steps.stepItemResults as item}
              {item.variableName}: {item.value}
              <br />
            {/each}
          {/each}
        </td>
      </tr>
    {/each}
  </table>
</div>
