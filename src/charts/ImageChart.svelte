<script>
  import { formatDate } from "../modules/utils";
  const items = [];
  for (let index = 0; index < 5; index++) {
    items.push(~~(Math.random() * 9));
  }
  items = items;
</script>

<style>
  table {
    position: relative;
    width: 100%;
    border-collapse: collapse;
    font-size: 0.7rem;
  }
  td {
    border-bottom: 1px solid #ddd;
  }
  tr:hover {
    background-color: #f5f5f5;
  }
  th {
    padding-top: 1rem;
    text-align: left;
    font-weight: 600;
  }
  img {
    box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.25);
  }
  thead {
    position: sticky;
    top: -15px;
    background-color: white;
  }
</style>

Uploaded Images:
<table>
  <thead>
    <tr>
      <th>Image</th>
      <th>Date</th>
      <th>Availability</th>
    </tr>
  </thead>
  {#each items as val}
    <tr>
      <td style="width:250px;">
        <img src="https://unsplash.it/15{val}/15{val}" alt={val} />
      </td>
      <td>{formatDate(new Date(), true, false)}</td>
      <td>{val}</td>
    </tr>
  {/each}
</table>
