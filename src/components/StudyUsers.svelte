<script>
  import { db } from "../modules/indexeddb.js";

  export let studyId = 0;
  export let studyName = "";
  let users = [];
  const userMap = new Map();
  if (studyId) {
    const tx = db.transaction(["Users", "Demographics"]);
    const res = tx
      .objectStore("Users")
      .index("studyId")
      .getAll(studyId);
    res.onsuccess = e => {
      const studyUsers = e.target.result;
      for (const userData of studyUsers) {
        const userId = userData.userId;

        const res = tx
          .objectStore("Demographics")
          .index("userId")
          .getAll(userId);
        res.onsuccess = e => {
          const demographics = e.target.result;
          userMap.set(userId, { demographics });
          users = [...userMap];
        };
      }
    };
  }
</script>

<style>
  .container {
    position: relative;
    padding: 1em;
    padding-bottom: 2em;
    height: 85vh;
    overflow-y: auto;
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
    Users of
    <strong>{studyName}</strong>
  </p>
  <table>
    <tr>
      <th>User Id</th>
      <th>Demographics</th>
    </tr>
    {#each users as data}
      <tr>
        <td> {data[0]} </td>
        <td>
          <table>
            {#each data[1].demographics as demo}
              <tr>
                <td>{demo.variableName}:</td>
                <td> {demo.value}</td>
              </tr>
            {/each}
          </table>
        </td>
      </tr>
    {/each}
  </table>
</div>
